/*
 * publish-tokens action
 *
 * Generates CSS from stored brand tokens and opens a release request (GitHub PR)
 * against the staging branch.
 *
 * Flow:
 *   1. Load stored tokens for params.brandName from Adobe I/O State
 *   2. Generate CSS using schema-defined cssVar names (brands/{name}/tokens.css format)
 *   3. Create a new branch from staging
 *   4. Commit brands/{name}/tokens.css to that branch
 *   5. Open a PR against staging
 *
 * Required params:
 *   - brandName     : name of the brand whose tokens to publish
 * Injected via app.config.yaml:
 *   - GITHUB_APP_* / GITHUB_OWNER / GITHUB_REPO
 *
 * Optional params:
 *   - base_branch   : branch to cut from (default: staging)
 */

const { Core } = require('@adobe/aio-sdk')
const stateLib = require('@adobe/aio-lib-state')
const tokenSchema = require('../../config/token-schema.json')
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
  getInstallationToken,
  tokensToCSS,
  getBranchSHA,
  createBranch,
  createOrUpdateFile,
  getPullRequest,
  createPullRequest,
  sanitiseBrandName,
  resolveEdsSiteCode,
  edsCdnOrigin,
  STATE_TTL,
  resolveActor,
  recordBrandAudit
} = require('../utils')
const { authorize } = require('../authz')
const { RELEASE_BRANCH } = require('../branches')

function buildBranchName (safeName, counter) {
  return `TB-${safeName.toUpperCase()}-${counter}`
}

function buildHelixPreviewUrl (branchName, siteCode, org) {
  const branchSlug = branchName.toLowerCase().replace(/\//g, '-')
  return `${edsCdnOrigin({ ref: branchSlug, siteCode, org, live: false })}/`
}

async function main (params) {
  const logger = Core.Logger('publish-tokens', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('publish-tokens action called')
    logger.debug(stringParameters(params))

    const requiredParams = ['brandName']
    const errorMessage = checkMissingRequestInputs(params, requiredParams, [])
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger)
    }

    const access = await authorize(params, { operation: 'publish', brandName: params.brandName })
    if (!access.allowed) {
      return errorResponse(access.statusCode || 403, access.message || 'Forbidden', logger)
    }

    const {
      brandName,
      GITHUB_OWNER,
      GITHUB_REPO,
      base_branch: baseBranch = RELEASE_BRANCH
    } = params

    const owner = GITHUB_OWNER
    const repo  = GITHUB_REPO

    if (!owner || !repo) {
      return errorResponse(500, 'GITHUB_OWNER and GITHUB_REPO must be set in action inputs', logger)
    }

    const GITHUB_TOKEN = await getInstallationToken(params)

    const safeName = sanitiseBrandName(brandName)

    // Step 1: Load tokens from I/O State
    logger.info(`Loading tokens for '${safeName}' from I/O State`)
    const state = await stateLib.init()
    const entry = await state.get(`brand.${safeName}`)

    if (!entry || entry.value === undefined) {
      return errorResponse(404, `Brand '${brandName}' not found in I/O State. Save tokens first.`, logger)
    }

    const tokens = typeof entry.value === 'string' ? JSON.parse(entry.value) : entry.value
    const metaEntry = await state.get(`brand.${safeName}.meta`)
    const meta = metaEntry && metaEntry.value
      ? (typeof metaEntry.value === 'string' ? JSON.parse(metaEntry.value) : metaEntry.value)
      : {}
    const siteCode = resolveEdsSiteCode(safeName, meta)

    // Step 2: Generate CSS using canonical cssVar names from schema
    logger.info('Generating CSS from token schema')
    const cssContent = tokensToCSS(tokenSchema, tokens)
    const variableCount = Object.values(tokenSchema).reduce((n, cat) => n + Object.keys(cat).length, 0)
    logger.debug(`CSS:\n${cssContent}`)

    // Step 3: Check for an existing open PR (from create-site) — update it instead of opening a new one
    const filePath = `brands/${safeName}/tokens.css`
    const prStateEntry = await state.get(`brand.${safeName}.pr`)
    const prState = prStateEntry && prStateEntry.value
      ? JSON.parse(prStateEntry.value)
      : null

    if (prState && prState.number) {
      const existingPR = await getPullRequest(owner, repo, prState.number, GITHUB_TOKEN)
      if (existingPR && existingPR.state === 'open') {
        logger.info(`Found open PR #${prState.number} — updating branch '${prState.branch}'`)
        await createOrUpdateFile({
          owner, repo,
          branch: prState.branch,
          path: filePath,
          content: cssContent,
          message: `chore(brand): update tokens for ${safeName}`,
          token: GITHUB_TOKEN
        })
        await state.put(`brand.${safeName}.status`, 'pending', { ttl: STATE_TTL })
        const actor = resolveActor(params)
        await recordBrandAudit(state, safeName, {
          lastPublishedAt: new Date().toISOString(),
          lastPublishedBy: actor.email || actor.displayName || actor.id || 'unknown',
          lastPublishedById: actor.id,
          lastPr: { number: prState.number, url: prState.url, updated: true }
        })
        const previewUrl = prState.branch
          ? buildHelixPreviewUrl(prState.branch, siteCode, owner)
          : null
        return {
          statusCode: 200,
          body: {
            message: 'Open PR updated with latest token values',
            brand: safeName,
            preview_url: previewUrl,
            pull_request: { number: prState.number, url: prState.url, updated: true }
          }
        }
      }
      // PR was merged or closed — clear stored PR info and fall through to create a new one
      await state.delete(`brand.${safeName}.pr`)
      logger.info(`PR #${prState.number} is no longer open — creating new release request`)
    }

    // Step 4: Get SHA of base branch
    logger.info(`Getting SHA for '${baseBranch}' in ${owner}/${repo}`)
    const sha = await getBranchSHA(owner, repo, baseBranch, GITHUB_TOKEN)

    // Step 5: Create working branch using the shared per-brand counter (same key as create-site)
    const counterKey = `branch.seq.${safeName}`
    const counter = parseInt((await state.get(counterKey))?.value || '0', 10) + 1
    await state.put(counterKey, String(counter), { ttl: STATE_TTL })
    const workBranch = buildBranchName(safeName, counter)
    logger.info(`Creating branch '${workBranch}'`)
    await createBranch(owner, repo, workBranch, sha, GITHUB_TOKEN)

    // Step 6: Commit brands/{name}/tokens.css
    logger.info(`Committing '${filePath}'`)
    const fileResult = await createOrUpdateFile({
      owner,
      repo,
      branch: workBranch,
      path: filePath,
      content: cssContent,
      message: `chore(brand): update tokens for ${safeName}`,
      token: GITHUB_TOKEN
    })
    const fileUrl =
      fileResult.content && fileResult.content.html_url
        ? fileResult.content.html_url
        : `https://github.com/${owner}/${repo}/blob/${workBranch}/${filePath}`

    // Step 7: Open PR against staging
    const helixPreview = buildHelixPreviewUrl(workBranch, siteCode, owner)

    const prTitle = `Brand tokens: ${safeName} → ${baseBranch}`
    const prBody = [
      `## Token release: \`${safeName}\``,
      '',
      `- **Branch:** \`${workBranch}\``,
      `- **Target:** \`${baseBranch}\``,
      `- **File updated:** \`${filePath}\``,
      `- **Helix preview URL:** ${helixPreview}`,
      '',
      '### What this PR does',
      '',
      `Applies the latest brand token values saved in Trailhead to \`${filePath}\`. When merged into \`${baseBranch}\`, the new CSS custom property values will be live for the **${safeName}** site.`,
      '',
      '### How to review',
      '',
      `1. Check the [Helix preview](${helixPreview}) — brand tokens load from the branch, so visual changes should be visible immediately after the branch is created.`,
      `2. Review \`${filePath}\` in the Files Changed tab — verify the custom property values look correct.`,
      '3. If anything looks wrong, do not merge — ask the brand manager to adjust tokens in Trailhead and re-submit.',
      '',
      '### What happens after merge',
      '',
      `- \`${filePath}\` is live on \`${baseBranch}\``,
      '- The Trailhead brand status updates to **staged**',
      '- A developer can promote to production by cherry-picking or opening a follow-up PR against `main`',
      '',
      '_Generated by Trailhead — Trail Manager_'
    ].join('\n')

    logger.info(`Opening release request from '${workBranch}' into '${baseBranch}'`)
    const pr = await createPullRequest(
      owner,
      repo,
      workBranch,
      baseBranch,
      prTitle,
      prBody,
      GITHUB_TOKEN
    )
    logger.info(`Release request #${pr.number} created: ${pr.html_url}`)

    // Mark brand status as pending while the release request is open
    await state.put(`brand.${safeName}.status`, 'pending', { ttl: STATE_TTL })
    const actor = resolveActor(params)
    await recordBrandAudit(state, safeName, {
      lastPublishedAt: new Date().toISOString(),
      lastPublishedBy: actor.email || actor.displayName || actor.id || 'unknown',
      lastPublishedById: actor.id,
      lastPr: { number: pr.number, url: pr.html_url, title: pr.title }
    })
    logger.info(`Status set to 'pending' for brand '${safeName}'`)

    return {
      statusCode: 200,
      body: {
        message: 'Release request submitted',
        brand: safeName,
        preview_url: helixPreview,
        css_file: {
          path: filePath,
          variables: variableCount,
          url: fileUrl
        },
        pull_request: {
          number: pr.number,
          title: pr.title,
          url: pr.html_url,
          state: pr.state,
          head: pr.head.ref,
          base: pr.base.ref
        }
      }
    }
  } catch (error) {
    logger.error(error)
    return errorResponse(500, error.message || 'server error', logger)
  }
}

exports.main = main
