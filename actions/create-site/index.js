/*
 * create-site action
 *
 * Scaffolds the required files in GitHub for a new repoless EDS brand site.
 * Creates a PR against the target branch with all brand scaffolding.
 *
 * NOTE: Helix Admin API site registration (admin.hlx.page) requires a GitHub
 * org-owner personal token and cannot be automated here. The launch checklist
 * issue created by this action contains the exact curl commands to run manually.
 *
 * Required params:
 *   - siteName      : lowercase-hyphenated internal identifier
 *
 * Optional params:
 *   - group         : (removed — all sites are Parks & Destinations)
 *   - locale        : default locale (default: "en-US")
 *   - domain        : primary domain (e.g. archesresort.com)
 *   - aemRoot       : AEM content source path (e.g. /content/acme-park)
 *   - aemEnv        : AEM cloud env ID (e.g. p179307-e1885056) — used in cf-templates scaffold
 *   - brandPreset   : "inherit" | "base" | "custom" (default: "inherit")
 *   - templateSiteId: site to clone tokens from
 *   - redirectStrategy: "inherit" | "none" | "custom" (default: "inherit")
 *   - sitemapEnabled : boolean (default: true)
 *   - robotsIndexable: boolean (default: false)
 *   - launchChecklist: boolean — open a GitHub issue with pre-launch checklist
 *   - base_branch   : branch to scaffold from (default: "staging")
 */

const { Core } = require('@adobe/aio-sdk')
const stateLib = require('@adobe/aio-lib-state')
const tokenSchema = require('../../config/token-schema.json')
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
  getInstallationToken,
  buildGitHubHeaders,
  getBranchSHA,
  createBranch,
  createOrUpdateFile,
  createPullRequest,
  tokensToCSS,
  sanitiseBrandName,
  buildSiteCode,
  STATE_TTL,
  addToBrandIndex,
  resolveActor,
  recordBrandAudit
} = require('../utils')
const { authorize } = require('../authz')
const { SCAFFOLD_BRANCH } = require('../branches')

const GITHUB_API_BASE = 'https://api.github.com'

/** Include the full brand slug so different brands cannot collide on initials. */
function buildBranchName (safeName, counter) {
  return `TB-${safeName.toUpperCase()}-${counter}`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main (params) {
  const logger = Core.Logger('create-site', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('create-site action called')
    logger.debug(stringParameters(params))

    const requiredParams = ['siteName']
    const errorMessage = checkMissingRequestInputs(params, requiredParams, [])
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger)
    }

    const access = await authorize(params, { operation: 'create', brandName: params.siteName })
    if (!access.allowed) {
      return errorResponse(access.statusCode || 403, access.message || 'Forbidden', logger)
    }

    const {
      GITHUB_OWNER,
      GITHUB_REPO,
      siteName: rawName,
      domain = '',
      locale = 'en-US',
      aemRoot = '',
      aemEnv = '',
      brandPreset = 'inherit',
      templateSiteId,
      redirectStrategy = 'inherit',
      sitemapEnabled = true,
      robotsIndexable = false,
      launchChecklist = true,
      base_branch: baseBranch = SCAFFOLD_BRANCH
    } = params

    const owner = GITHUB_OWNER
    const repo  = GITHUB_REPO

    if (!owner || !repo) {
      return errorResponse(500, 'GITHUB_OWNER and GITHUB_REPO must be set in action inputs', logger)
    }

    const safeName = sanitiseBrandName(rawName)
    let siteCode = buildSiteCode(safeName)
    if (params.siteCode !== undefined && params.siteCode !== null && String(params.siteCode).trim()) {
      const raw = String(params.siteCode).trim().toLowerCase()
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(raw)) {
        return errorResponse(
          400,
          'siteCode must be lowercase letters, numbers, and hyphens (Helix site id)',
          logger
        )
      }
      siteCode = raw
    }
    const fetch = require('node-fetch')
    const GITHUB_TOKEN = await getInstallationToken(params)
    const githubHeaders = buildGitHubHeaders(GITHUB_TOKEN)

    const previewUrl = `https://main--${siteCode}--${owner}.aem.page`

    // Init state early — needed for branch counter and duplicate check
    const state = await stateLib.init()

    // Guard: reject if a site with this name already exists
    const existingIndex = JSON.parse((await state.get('brand.__index__'))?.value || '[]')
    if (existingIndex.includes(safeName)) {
      return errorResponse(409, `A site named '${safeName}' already exists. Choose a different name.`, logger)
    }

    const counterKey = `branch.seq.${safeName}`
    const counter = parseInt((await state.get(counterKey))?.value || '0', 10) + 1
    await state.put(counterKey, String(counter), { ttl: STATE_TTL })
    const workBranch = buildBranchName(safeName, counter)

    const results = {
      siteName: safeName,
      domain,
      previewUrl,
      branch: workBranch,
      github: {},
      issue: null
    }

    // ------------------------------------------------------------------
    // Step 1: GitHub — create branch and scaffold brand files
    // ------------------------------------------------------------------
    logger.info('Step 1: Scaffolding GitHub files')

    const sha = await getBranchSHA(owner, repo, baseBranch, GITHUB_TOKEN)
    await createBranch(owner, repo, workBranch, sha, GITHUB_TOKEN)
    logger.info(`Created branch ${workBranch}`)

    // 2a. Determine starting tokens
    let startingTokens = buildDefaultTokens(tokenSchema)

    // Seed token state early — brand is immediately editable in the Trailhead
    // token manager without waiting for the GitHub PR to merge and CDN to populate.
    // Must happen after startingTokens is resolved (clone path below may override CSS
    // on disk but token object stays as defaults for state — close enough for editing).
    // Canonical draft key is brand.{slug} (same key manage-tokens / publish-tokens read)
    await state.put(`brand.${safeName}`, JSON.stringify(startingTokens), { ttl: STATE_TTL })

    if (templateSiteId) {
      // Clone tokens from source brand's tokens.css via GitHub
      try {
        const srcPath = `brands/${sanitiseBrandName(templateSiteId)}/tokens.css`
        const srcUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${srcPath}?ref=${encodeURIComponent(baseBranch)}`
        const srcRes = await fetch(srcUrl, { headers: githubHeaders })
        if (srcRes.ok) {
          const srcFile = await srcRes.json()
          // We commit the raw CSS directly; no need to parse back to tokens object
          const rawCss = Buffer.from(srcFile.content, 'base64').toString('utf8')
          results.github.tokensFile = await createOrUpdateFile({
            owner, repo, branch: workBranch,
            path: `brands/${safeName}/tokens.css`,
            content: rawCss,
            message: `chore(brand): init ${safeName} from ${templateSiteId} tokens`,
            token: GITHUB_TOKEN
          })
          logger.info(`Cloned tokens from ${templateSiteId}`)
        }
      } catch (cloneErr) {
        logger.warn(`Could not clone tokens from ${templateSiteId}: ${cloneErr.message} — falling back to defaults`)
      }
    }

    // 2b. If no clone (or clone failed), write default tokens
    if (!results.github.tokensFile) {
      const css = tokensToCSS(tokenSchema, startingTokens)
      results.github.tokensFile = await createOrUpdateFile({
        owner, repo, branch: workBranch,
        path: `brands/${safeName}/tokens.css`,
        content: css,
        message: `chore(brand): init ${safeName} brand tokens`,
        token: GITHUB_TOKEN
      })
      logger.info('Default tokens.css created')
    }

    // 2c. Write site.json metadata (used by list-sites)
    const siteJson = JSON.stringify({
      name: safeName,
      siteCode,
      domain,
      locale,
      aemRoot,
      aemEnv,
      previewUrl,
      redirectStrategy,
      sitemapEnabled,
      robotsIndexable,
      createdAt: new Date().toISOString()
    }, null, 2)

    results.github.siteJson = await createOrUpdateFile({
      owner, repo, branch: workBranch,
      path: `brands/${safeName}/site.json`,
      content: siteJson,
      message: `chore(brand): init ${safeName} site metadata`,
      token: GITHUB_TOKEN
    })
    logger.info('site.json created')

    // 2d. overrides.js — declares brand-specific block overrides (empty initially)
    const overridesJs = [
      `// Block names listed here load from brands/${safeName}/blocks/{name}/{name}.js`,
      `// instead of the shared /blocks/{name}/{name}.js`,
      '// Add a block name to `css` to also load the brand override CSS',
      '// e.g. brands/{name}/blocks/{name}/{name}.css',
      'export default {',
      '  js: [],',
      '  css: [],',
      '};',
      ''
    ].join('\n')

    results.github.overridesFile = await createOrUpdateFile({
      owner, repo, branch: workBranch,
      path: `brands/${safeName}/overrides.js`,
      content: overridesJs,
      message: `chore(brand): init ${safeName} block overrides`,
      token: GITHUB_TOKEN
    })
    logger.info('overrides.js created')

    // 2e. cf-overlay-paths.json — AEM content fragment path → URL route mappings
    const emptyCfPaths = JSON.stringify({
      detail: {},
      card: {},
      'carousel-card': {},
      comparison: {},
      'map-item': {}
    }, null, 2) + '\n'

    results.github.cfPaths = await createOrUpdateFile({
      owner, repo, branch: workBranch,
      path: `brands/${safeName}/cf-overlay-paths.json`,
      content: emptyCfPaths,
      message: `chore(brand): init ${safeName} CF overlay paths`,
      token: GITHUB_TOKEN
    })
    logger.info('cf-overlay-paths.json created')

    results.github.cfPathsDev = await createOrUpdateFile({
      owner, repo, branch: workBranch,
      path: `brands/${safeName}-dev/cf-overlay-paths.json`,
      content: emptyCfPaths,
      message: `chore(brand): init ${safeName}-dev CF overlay paths`,
      token: GITHUB_TOKEN
    })
    logger.info('cf-overlay-paths.json (dev) created')

    results.github.cfPathsStaging = await createOrUpdateFile({
      owner, repo, branch: workBranch,
      path: `brands/${safeName}-staging/cf-overlay-paths.json`,
      content: emptyCfPaths,
      message: `chore(brand): init ${safeName}-staging CF overlay paths`,
      token: GITHUB_TOKEN
    })
    logger.info('cf-overlay-paths.json (staging) created')

    // 2f. brands/{safeName}/README.md — preview URL, Lighthouse link, next steps
    const readmeContent = [
      `# ${safeName}`,
      '',
      `Brand directory for the **${safeName}** site.`,
      '',
      '## Preview & Testing',
      '',
      `| Environment | URL |`,
      `|-------------|-----|`,
      `| Preview (post-registration) | ${previewUrl}/ |`,
      `| Lighthouse test page | ${previewUrl}/ |`,
      domain ? `| Production | https://${domain}/ |` : null,
      '',
      '> **Note:** The preview URL is available only after Helix Admin site registration',
      '> (manual step — see launch checklist issue).',
      '',
      '## Structure',
      '',
      '```',
      `brands/${safeName}/`,
      '├── README.md              # This file',
      '├── tokens.css             # Brand design tokens',
      '├── overrides.js           # Brand block overrides (empty initially)',
      '└── cf-overlay-paths.json  # AEM CF path → URL route mappings',
      '```',
      '',
      '## Local Development',
      '',
      '```bash',
      `pnpm start:brand ${safeName}`,
      '```',
      '',
      `_Scaffolded by Trailhead — ${new Date().toISOString().slice(0, 10)}_`,
      ''
    ].filter((line) => line !== null).join('\n')

    results.github.readme = await createOrUpdateFile({
      owner, repo, branch: workBranch,
      path: `brands/${safeName}/README.md`,
      content: readmeContent,
      message: `chore(brand): init ${safeName} README`,
      token: GITHUB_TOKEN
    })
    logger.info('README.md created')

    // 2h. cf-templates/sites/{safeName}.json — scaffold for CF overlay provisioning
    // aemEnv and models are left as placeholders — filled in when CF overlay is wired
    const cfTemplateSite = JSON.stringify({
      $schema: '../sites.schema.json',
      site: safeName,
      org: owner,
      aemEnv: aemEnv || 'p{programId}-e{envId}',
      contentPath: aemRoot || `/content/${safeName}/`,
      models: {}
    }, null, 2) + '\n'

    results.github.cfTemplateSite = await createOrUpdateFile({
      owner, repo, branch: workBranch,
      path: `cf-templates/sites/${safeName}.json`,
      content: cfTemplateSite,
      message: `chore(brand): init ${safeName} CF overlay site config`,
      token: GITHUB_TOKEN
    })
    logger.info('cf-templates/sites/{site}.json created')

    // 2i. Update scripts/dev-brand.js — add BRAND_URLS entry for local dev
    try {
      const devBrandPath = 'scripts/dev-brand.js'
      const devBrandUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${devBrandPath}?ref=${encodeURIComponent(workBranch)}`
      const devBrandRes = await fetch(devBrandUrl, { headers: githubHeaders })
      if (devBrandRes.ok) {
        const devBrandFile = await devBrandRes.json()
        const currentContent = Buffer.from(devBrandFile.content, 'base64').toString('utf8')
        // Skip if key already exists (idempotent)
        if (currentContent.includes(`'${safeName}':`)) {
          logger.info(`dev-brand.js already has entry for ${safeName} — skipping`)
          results.github.devBrand = { skipped: true }
        } else {
        // Insert new entry before the 'unbranded:' line
        const updatedContent = currentContent.replace(
          /^(\s+)(unbranded:)/m,
          `$1'${safeName}': '${previewUrl}',\n$1$2`
        )
        results.github.devBrand = await createOrUpdateFile({
          owner, repo, branch: workBranch,
          path: devBrandPath,
          content: updatedContent,
          message: `chore(brand): register ${safeName} in dev-brand.js`,
          token: GITHUB_TOKEN
        })
        logger.info('dev-brand.js updated')
        } // end duplicate guard
      } else {
        logger.warn('scripts/dev-brand.js not found — skipping dev-brand update')
      }
    } catch (devBrandErr) {
      logger.warn(`Could not update dev-brand.js: ${devBrandErr.message}`)
    }

    // 2j. Open PR
    const prTitle = domain ? `Site setup: ${safeName} (${domain})` : `Site setup: ${safeName}`
    const prBody = [
      `## New site: \`${safeName}\``,
      '',
      domain ? `- **Domain:** ${domain}` : null,
      aemRoot ? `- **AEM content root:** ${aemRoot}` : null,
      aemEnv ? `- **AEM environment:** ${aemEnv}` : null,
      templateSiteId ? `- **Cloned from:** ${templateSiteId}` : `- **Starting tokens:** ${brandPreset === 'base' ? 'blueprint defaults' : 'schema defaults'}`,
      `- **Preview URL (post-registration):** ${previewUrl}/`,
      `- **Lighthouse test page:** ${previewUrl}/`,
      `- **Site code (EDS slug):** \`${siteCode}\``,
      '',
      '### Files created',
      `- \`brands/${safeName}/tokens.css\``,
      `- \`brands/${safeName}/overrides.js\``,
      `- \`brands/${safeName}/README.md\``,
      `- \`brands/${safeName}/site.json\``,
      `- \`brands/${safeName}/cf-overlay-paths.json\``,
      `- \`brands/${safeName}-dev/cf-overlay-paths.json\``,
      `- \`brands/${safeName}-staging/cf-overlay-paths.json\``,
      `- \`cf-templates/sites/${safeName}.json\``,
      results.github.devBrand ? `- \`scripts/dev-brand.js\` (updated)` : null,
      '',
      '### Manual steps required after merge',
      '',
      '> These require a GitHub org-owner personal token and cannot be automated.',
      `> EDS site slug: \`${siteCode}\` (brand folder: \`${safeName}\`)`,
      '',
      '**1. Register EDS site**',
      '```bash',
      `curl -X PUT \\`,
      `  'https://admin.hlx.page/config/${owner}/sites/${siteCode}.json' \\`,
      `  -H 'x-auth-token: YOUR_GITHUB_ORG_OWNER_TOKEN' \\`,
      `  -H 'Content-Type: application/json' \\`,
      `  -d '${JSON.stringify({ code: { owner, repo, source: { type: 'github', url: `https://github.com/${owner}/${repo}` } }, content: { source: { type: 'markup', url: 'https://author-p{programId}-e{envId}.adobeaemcloud.com' } } })}'`,
      '```',
      '',
      '**2. Configure content path mappings**',
      '```bash',
      `curl -X POST \\`,
      `  'https://admin.hlx.page/config/${owner}/sites/${siteCode}/public.json' \\`,
      `  -H 'x-auth-token: YOUR_GITHUB_ORG_OWNER_TOKEN' \\`,
      `  -H 'Content-Type: application/json' \\`,
      `  -d '${JSON.stringify({ paths: { mappings: [`${aemRoot || `/content/${safeName}`}:/`], includes: [aemRoot || `/content/${safeName}/`] } })}'`,
      '```',
      '',
      '**3. Trigger initial preview** (seeds content bus)',
      '```bash',
      `curl -X POST \\`,
      `  'https://admin.hlx.page/preview/${owner}/${siteCode}/main/' \\`,
      `  -H 'x-auth-token: YOUR_GITHUB_ORG_OWNER_TOKEN'`,
      '```',
      '',
      `**4. Provision CF overlay** (after filling in \`aemEnv\` and \`models\` in \`cf-templates/sites/${safeName}.json\`)`,
      '```bash',
      `node tools/provision-site-overlay.mjs --site ${siteCode} --branch staging`,
      '```',
      '',
      `**5. Run Lighthouse** — ${previewUrl}/`,
      '',
      '_Generated by Trailhead — Site Factory_'
    ].filter(Boolean).join('\n')

    results.github.pr = await createPullRequest(
      owner, repo, workBranch, baseBranch,
      prTitle, prBody, GITHUB_TOKEN
    )
    logger.info(`PR #${results.github.pr.number} created`)

    // Register in I/O State so the brand appears in Trailhead before the PR is merged
    await addToBrandIndex(state, safeName)
    await state.put(`brand.${safeName}.status`, 'pending', { ttl: STATE_TTL })
    await state.put(`brand.${safeName}.meta`, JSON.stringify({
      fullName: params.fullName || '',
      domain,
      siteCode,
      aemRoot,
      aemEnv,
      previewUrl,
      locale
    }), { ttl: STATE_TTL })
    await state.put(`brand.${safeName}.pr`, JSON.stringify({
      number: results.github.pr.number,
      branch: workBranch,
      url: results.github.pr.html_url
    }), { ttl: STATE_TTL })
    const actor = resolveActor(params)
    await recordBrandAudit(state, safeName, {
      createdAt: new Date().toISOString(),
      createdBy: actor.email || actor.displayName || actor.id || 'unknown',
      createdById: actor.id,
      lastPr: {
        number: results.github.pr.number,
        url: results.github.pr.html_url,
        branch: workBranch
      }
    })

    // ------------------------------------------------------------------
    // Step 3: Push per-site SEO config via AEM Admin API
    // Best-effort — failure does not fail the overall create-site action.
    // Requires AEM_ADMIN_TOKEN in action env; skipped silently if absent.
    // ------------------------------------------------------------------
    const adminToken = params.AEM_ADMIN_TOKEN
    if (adminToken) {
      logger.info('Step 3: Pushing SEO config via Admin API')
      logger.info('SEO config push skipped — configure-site-seo removed')
      results.seo = { skipped: true, reason: 'configure-site-seo action not available' }
    } else {
      logger.info('AEM_ADMIN_TOKEN not set — skipping Admin API SEO config push')
      results.seo = { skipped: true, reason: 'AEM_ADMIN_TOKEN not configured' }
    }

    // ------------------------------------------------------------------
    // Step 3: Launch checklist issue (optional)
    // ------------------------------------------------------------------
    if (launchChecklist) {
      logger.info('Step 3: Creating launch checklist issue')
      const issueUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues`
      const issueBody = {
        title: domain ? `Launch checklist — ${safeName} (${domain})` : `Launch checklist — ${safeName}`,
        body: [
          `## Pre-launch checklist for \`${safeName}\``,
          '',
          domain ? `**Domain:** ${domain}` : null,
          `**Preview URL:** ${previewUrl}/`,
          '',
          '### Step 1: Merge the scaffold PR',
          '',
          `- [ ] Review and merge the scaffold PR for \`${safeName}\``,
          '',
          '### Step 2: Register EDS site (requires GitHub org-owner token)',
          '',
          '- [ ] Run site registration:',
          '```bash',
          `curl -X PUT \\`,
          `  'https://admin.hlx.page/config/${owner}/sites/${siteCode}.json' \\`,
          `  -H 'x-auth-token: YOUR_GITHUB_ORG_OWNER_TOKEN' \\`,
          `  -H 'Content-Type: application/json' \\`,
          `  -d '${JSON.stringify({ code: { owner, repo, source: { type: 'github', url: `https://github.com/${owner}/${repo}` } }, content: { source: { type: 'markup', url: 'https://author-p{programId}-e{envId}.adobeaemcloud.com' } } })}'`,
          '```',
          '- [ ] Configure content path mappings:',
          '```bash',
          `curl -X POST \\`,
          `  'https://admin.hlx.page/config/${owner}/sites/${siteCode}/public.json' \\`,
          `  -H 'x-auth-token: YOUR_GITHUB_ORG_OWNER_TOKEN' \\`,
          `  -H 'Content-Type: application/json' \\`,
          `  -d '${JSON.stringify({ paths: { mappings: [`${aemRoot || `/content/${safeName}`}:/`], includes: [aemRoot || `/content/${safeName}/`] } })}'`,
          '```',
          '- [ ] Trigger initial preview:',
          '```bash',
          `curl -X POST \\`,
          `  'https://admin.hlx.page/preview/${owner}/${siteCode}/main/' \\`,
          `  -H 'x-auth-token: YOUR_GITHUB_ORG_OWNER_TOKEN'`,
          '```',
          '',
          '### Step 3: AEM content setup',
          '',
          `- [ ] Create content tree at \`${aemRoot || `/content/${safeName}`}\` in AEM Author`,
          '- [ ] Create metadata sheet with `brand` field set to `' + safeName + '`',
          '- [ ] Publish homepage to seed content bus',
          '',
          '### Step 4: CF overlay provisioning',
          '',
          `- [ ] Fill in \`aemEnv\` and \`models\` in \`cf-templates/sites/${safeName}.json\``,
          '- [ ] Run provisioning:',
          '```bash',
          `node tools/provision-site-overlay.mjs --site ${siteCode} --branch staging`,
          '```',
          '',
          '### Step 5: Brand & content QA',
          '',
          '- [ ] Brand tokens reviewed in Token Manager',
          '- [ ] Logo assets uploaded (`/brands/' + safeName + '/icons/logo.svg`)',
          '- [ ] Favicon set',
          '- [ ] Navigation structure confirmed',
          `- [ ] Run Lighthouse: ${previewUrl}/`,
          '',
          '### Step 6: Pre-launch',
          '',
          '- [ ] Enable indexing: set `robotsIndexable: true` in `site.json`',
          '- [ ] Sitemap verified',
          '- [ ] 301 redirects from old URLs configured',
          '- [ ] Analytics tracking confirmed',
          domain ? `- [ ] DNS: point \`${domain}\` to EDS CDN` : null,
          '',
          '_Opened automatically by Trailhead — Site Factory_'
        ].filter(Boolean).join('\n'),
        labels: ['launch-checklist', 'trailhead']
      }

      const issueRes = await fetch(issueUrl, {
        method: 'POST',
        headers: githubHeaders,
        body: JSON.stringify(issueBody)
      })

      if (issueRes.ok) {
        const issue = await issueRes.json()
        results.issue = { number: issue.number, url: issue.html_url }
        logger.info(`Launch checklist issue #${issue.number} created`)
      } else {
        logger.warn('Could not create launch checklist issue — labels may not exist yet')
      }
    }

    return {
      statusCode: 200,
      body: {
        message: `Site '${safeName}' created successfully`,
        ...results
      }
    }
  } catch (error) {
    logger.error(error)
    return errorResponse(500, error.message || 'server error', logger)
  }
}

function buildDefaultTokens (schema) {
  const tokens = {}
  for (const [category, fields] of Object.entries(schema)) {
    tokens[category] = {}
    for (const [key, def] of Object.entries(fields)) {
      tokens[category][key] = def.default
    }
  }
  return tokens
}

exports.main = main
