const { Core } = require('@adobe/aio-sdk')
const stateLib = require('@adobe/aio-lib-state')
const fetch = require('node-fetch')
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
  getInstallationToken,
  buildGitHubHeaders,
  sanitiseBrandName,
  resolveEdsSiteCode,
  edsCdnOrigin,
  validateTokens,
  STATE_TTL,
  addToBrandIndex,
  clearBrandState,
  resolveActor,
  recordBrandAudit,
  readBrandAudit
} = require('../utils')
const { authorize, filterBrandsForAccess } = require('../authz')
const { INVENTORY_BRANCH } = require('../branches')
const tokenSchema = require('../../config/token-schema.json')

const GITHUB_API_BASE = 'https://api.github.com'
const BRANDS_REF = INVENTORY_BRANCH

function brandCdnBase (safeName, meta, org) {
  const siteCode = resolveEdsSiteCode(safeName, meta)
  return edsCdnOrigin({ ref: 'staging', siteCode, org })
}

// Legacy brands predate the slug convention (folder name != real Helix site
// id); site.json on GitHub is the source of truth for that id when Trailhead's
// own state never recorded a siteCode.
async function resolveGitHubSiteCode (params, safeName, logger) {
  try {
    const ghToken = await getInstallationToken(params)
    const ghHeaders = buildGitHubHeaders(ghToken)
    const url = `${GITHUB_API_BASE}/repos/${params.GITHUB_OWNER}/${params.GITHUB_REPO}/contents/brands/${safeName}/site.json?ref=${encodeURIComponent(BRANDS_REF)}`
    const res = await fetch(url, { headers: ghHeaders })
    if (!res.ok) return undefined
    const file = await res.json()
    if (!file.content) return undefined
    const site = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'))
    return site.siteCode || undefined
  } catch (err) {
    logger?.debug(`resolveGitHubSiteCode: could not read site.json for '${safeName}': ${err.message}`)
    return undefined
  }
}

function stateGet (entry) {
  if (!entry || entry.value === undefined) return undefined
  try { return JSON.parse(entry.value) } catch (_) { return entry.value }
}

function parseCssTokens (css) {
  const reverseMap = {}
  for (const [category, fields] of Object.entries(tokenSchema)) {
    for (const [key, def] of Object.entries(fields)) {
      reverseMap[def.cssVar] = { category, key }
    }
  }
  const tokens = {}
  for (const [, varName, value] of css.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+)/g)) {
    const mapping = reverseMap[`--${varName}`]
    if (mapping) {
      const { category, key } = mapping
      if (!tokens[category]) tokens[category] = {}
      tokens[category][key] = value.trim()
    }
  }
  return tokens
}

async function denyIfUnauthorized (params, operation, brandName, logger) {
  const access = await authorize(params, { operation, brandName })
  if (!access.allowed) {
    return errorResponse(access.statusCode || 403, access.message || 'Forbidden', logger)
  }
  return access
}

async function main (params) {
  const logger = Core.Logger('manage-tokens', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('manage-tokens action called')
    logger.debug(stringParameters(params))

    const operation = params.operation
    if (!operation) {
      return errorResponse(400, "missing parameter 'operation'. Valid values: list, get, save, delete, update-meta, rename, repair", logger)
    }

    const state = await stateLib.init()

    // -----------------------------------------------------------------------
    // LIST — GitHub brands/ on staging + state drafts; filtered when authz on
    // -----------------------------------------------------------------------
    if (operation === 'list') {
      const access = await denyIfUnauthorized(params, 'list', undefined, logger)
      if (access.error) return access

      let repoBrands = []
      try {
        const ghToken = await getInstallationToken(params)
        const ghHeaders = buildGitHubHeaders(ghToken)
        const owner = params.GITHUB_OWNER
        const repo = params.GITHUB_REPO
        const dirUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/brands?ref=${encodeURIComponent(BRANDS_REF)}`
        const dirRes = await fetch(dirUrl, { headers: ghHeaders })
        if (dirRes.ok) {
          const entries = await dirRes.json()
          repoBrands = entries
            .filter((e) => e.type === 'dir' && !/-dev$|-staging$/.test(e.name))
            .map((e) => e.name)
        }
      } catch (_e) { /* github unavailable — fall through to state only */ }

      const stateBrands = stateGet(await state.get('brand.__index__')) || []
      let brands = [...new Set([...repoBrands, ...stateBrands])]
      brands = filterBrandsForAccess(brands, access)

      const statuses = {}
      const metas = {}
      const audits = {}
      await Promise.all(brands.map(async (name) => {
        const [statusEntry, metaEntry, audit] = await Promise.all([
          state.get(`brand.${name}.status`),
          state.get(`brand.${name}.meta`),
          readBrandAudit(state, name)
        ])
        statuses[name] = (statusEntry && statusEntry.value) ? statusEntry.value : 'synced'
        const meta = metaEntry ? stateGet(metaEntry) : {}
        // Do not invent short initials for legacy brands — only surface stored siteCode
        metas[name] = meta
        audits[name] = audit || {}
      }))

      logger.info(`list: ${brands.length} brand(s) found`)
      return {
        statusCode: 200,
        body: {
          brands,
          statuses,
          metas,
          audits,
          edsOrg: params.GITHUB_OWNER || ''
        }
      }
    }

    // -----------------------------------------------------------------------
    // GET — draft from state, fall back to tokens.css from CDN
    // -----------------------------------------------------------------------
    if (operation === 'get') {
      const missingParams = checkMissingRequestInputs(params, ['brandName'], [])
      if (missingParams) return errorResponse(400, missingParams, logger)

      const access = await denyIfUnauthorized(params, 'get', params.brandName, logger)
      if (access.error) return access

      const safeName = sanitiseBrandName(params.brandName)
      const draft = stateGet(await state.get(`brand.${safeName}`))

      if (draft !== undefined) {
        logger.info(`get: returning draft for '${safeName}'`)
        const audit = await readBrandAudit(state, safeName)
        return {
          statusCode: 200,
          body: { brandName: safeName, tokens: draft, source: 'draft', audit }
        }
      }

      try {
        const meta = stateGet(await state.get(`brand.${safeName}.meta`)) || {}
        if (!meta.siteCode) {
          const ghSiteCode = await resolveGitHubSiteCode(params, safeName, logger)
          if (ghSiteCode) meta.siteCode = ghSiteCode
        }
        const cdnBase = brandCdnBase(safeName, meta, params.GITHUB_OWNER)
        const res = await fetch(`${cdnBase}/brands/${safeName}/tokens.css`)
        if (res.ok) {
          const tokens = parseCssTokens(await res.text())
          logger.info(`get: returning CDN tokens for '${safeName}' from ${cdnBase}`)
          return { statusCode: 200, body: { brandName: safeName, tokens, source: 'cdn' } }
        }
      } catch (_e) { /* cdn unavailable */ }

      const index = stateGet(await state.get('brand.__index__')) || []
      if (index.includes(safeName)) {
        const defaults = {}
        for (const [category, fields] of Object.entries(tokenSchema)) {
          defaults[category] = {}
          for (const [key, def] of Object.entries(fields)) {
            defaults[category][key] = def.default
          }
        }
        logger.info(`get: returning schema defaults for pending brand '${safeName}'`)
        return { statusCode: 200, body: { brandName: safeName, tokens: defaults, source: 'defaults' } }
      }

      return errorResponse(404, `Brand '${params.brandName}' not found`, logger)
    }

    // -----------------------------------------------------------------------
    // SAVE — upsert draft tokens in state
    // -----------------------------------------------------------------------
    if (operation === 'save') {
      const missingParams = checkMissingRequestInputs(params, ['brandName', 'tokens'], [])
      if (missingParams) return errorResponse(400, missingParams, logger)

      const access = await denyIfUnauthorized(params, 'save', params.brandName, logger)
      if (access.error) return access

      let tokens = params.tokens
      if (typeof tokens === 'string') {
        try { tokens = JSON.parse(tokens) } catch (e) {
          return errorResponse(400, 'tokens parameter is not valid JSON', logger)
        }
      }

      const validation = validateTokens(tokenSchema, tokens)
      if (!validation.ok) {
        return errorResponse(400, validation.message, logger)
      }

      const safeName = sanitiseBrandName(params.brandName)
      await state.put(`brand.${safeName}`, JSON.stringify(tokens), { ttl: STATE_TTL })
      await state.put(`brand.${safeName}.status`, 'drafted', { ttl: STATE_TTL })
      await addToBrandIndex(state, safeName)

      const actor = resolveActor(params)
      const audit = await recordBrandAudit(state, safeName, {
        lastSavedAt: new Date().toISOString(),
        lastSavedBy: actor.email || actor.displayName || actor.id || 'unknown',
        lastSavedById: actor.id
      })

      logger.info(`save: stored draft for '${safeName}'`)
      return {
        statusCode: 200,
        body: {
          message: `Tokens saved for brand '${safeName}'`,
          brandName: safeName,
          status: 'drafted',
          audit
        }
      }
    }

    // -----------------------------------------------------------------------
    // DELETE — remove draft from state
    // -----------------------------------------------------------------------
    if (operation === 'delete') {
      const missingParams = checkMissingRequestInputs(params, ['brandName'], [])
      if (missingParams) return errorResponse(400, missingParams, logger)

      const access = await denyIfUnauthorized(params, 'delete', params.brandName, logger)
      if (access.error) return access

      const safeName = sanitiseBrandName(params.brandName)
      // "delete" only discards the draft (revert to live/CDN tokens) — it must
      // never touch .meta/.pr/.audit or drop the brand from the index; that
      // full-removal behavior belongs to the separate remove-brand action.
      await state.delete(`brand.${safeName}`)
      await state.delete(`brand.${safeName}.tokens`)
      await state.delete(`brand.${safeName}.status`)

      logger.info(`delete: removed draft for '${safeName}'`)
      return { statusCode: 200, body: { message: `Brand '${safeName}' draft deleted`, brandName: safeName } }
    }

    // -----------------------------------------------------------------------
    // UPDATE-META — save fullName, domain, and/or EDS siteCode
    // -----------------------------------------------------------------------
    if (operation === 'update-meta') {
      const missingParams = checkMissingRequestInputs(params, ['brandName'], [])
      if (missingParams) return errorResponse(400, missingParams, logger)

      const access = await denyIfUnauthorized(params, 'update-meta', params.brandName, logger)
      if (access.error) return access

      const safeName = sanitiseBrandName(params.brandName)
      const existing = stateGet(await state.get(`brand.${safeName}.meta`)) || {}
      // Blank submissions (e.g. a form pre-filled with a missing display name)
      // must not erase a previously stored value — only non-empty values write.
      const nextFullName = params.fullName !== undefined ? String(params.fullName).trim() : ''
      const nextDomain = params.domain !== undefined ? String(params.domain).trim() : ''
      const updated = {
        ...existing,
        ...(nextFullName ? { fullName: nextFullName } : {}),
        ...(nextDomain ? { domain: nextDomain } : {})
      }
      if (params.siteCode !== undefined) {
        const raw = String(params.siteCode || '').trim().toLowerCase()
        if (!raw) {
          delete updated.siteCode
        } else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(raw)) {
          return errorResponse(
            400,
            'siteCode must be lowercase letters, numbers, and hyphens (Helix site id)',
            logger
          )
        } else {
          updated.siteCode = raw
        }
      }
      await state.put(`brand.${safeName}.meta`, JSON.stringify(updated), { ttl: STATE_TTL })
      logger.info(`update-meta: updated meta for '${safeName}'`)
      return { statusCode: 200, body: { brandName: safeName, meta: updated } }
    }

    // -----------------------------------------------------------------------
    // RENAME — migrate all state keys from one slug to another
    // -----------------------------------------------------------------------
    if (operation === 'rename') {
      const missingParams = checkMissingRequestInputs(params, ['brandName', 'newBrandName'], [])
      if (missingParams) return errorResponse(400, missingParams, logger)

      const access = await denyIfUnauthorized(params, 'rename', params.brandName, logger)
      if (access.error) return access

      const oldSlug = sanitiseBrandName(params.brandName)
      const newSlug = sanitiseBrandName(params.newBrandName)
      if (oldSlug === newSlug) return { statusCode: 200, body: { message: 'No change — slugs are identical', brandName: newSlug } }

      // rename only migrates Trailhead state keys — it cannot rename the GitHub
      // brands/{slug} folder. Renaming an already-provisioned brand would leave
      // a stale duplicate and break token/CDN paths still pointing at the old
      // folder, so only unprovisioned (state-only) brands may be renamed.
      try {
        const ghToken = await getInstallationToken(params)
        const ghHeaders = buildGitHubHeaders(ghToken)
        const dirUrl = `${GITHUB_API_BASE}/repos/${params.GITHUB_OWNER}/${params.GITHUB_REPO}/contents/brands/${oldSlug}?ref=${encodeURIComponent(BRANDS_REF)}`
        const dirRes = await fetch(dirUrl, { headers: ghHeaders })
        if (dirRes.ok) {
          return errorResponse(
            409,
            `brands/${oldSlug} on GitHub still holds this brand's real files (site.json, tokens.css, etc). Renaming here only updates Trailhead's own tracking, not those files — it would orphan them and break token/CDN paths. Use the real EDS site id (site.json's siteCode) for CDN links instead of renaming.`,
            logger
          )
        }
      } catch (_e) { /* GitHub check best-effort — fall through and allow rename */ }

      const [tokens, status, meta, pr] = await Promise.all([
        state.get(`brand.${oldSlug}`),
        state.get(`brand.${oldSlug}.status`),
        state.get(`brand.${oldSlug}.meta`),
        state.get(`brand.${oldSlug}.pr`)
      ])

      const writes = []
      if (tokens) writes.push(state.put(`brand.${newSlug}`, tokens.value, { ttl: STATE_TTL }))
      if (status) writes.push(state.put(`brand.${newSlug}.status`, status.value, { ttl: STATE_TTL }))
      if (meta) writes.push(state.put(`brand.${newSlug}.meta`, meta.value, { ttl: STATE_TTL }))
      if (pr) writes.push(state.put(`brand.${newSlug}.pr`, pr.value, { ttl: STATE_TTL }))
      await Promise.all(writes)

      const index = stateGet(await state.get('brand.__index__')) || []
      const deduped = [...new Set(index.map((b) => (b === oldSlug ? newSlug : b)))]
      if (!deduped.includes(newSlug)) deduped.push(newSlug)
      await state.put('brand.__index__', JSON.stringify(deduped), { ttl: STATE_TTL })

      await clearBrandState(state, oldSlug)

      logger.info(`rename: '${oldSlug}' → '${newSlug}'`)
      return { statusCode: 200, body: { message: `Renamed '${oldSlug}' to '${newSlug}'`, oldSlug, newSlug } }
    }

    // -----------------------------------------------------------------------
    // REPAIR — re-add a brand to brand.__index__ without touching tokens
    // -----------------------------------------------------------------------
    if (operation === 'repair') {
      const missingParams = checkMissingRequestInputs(params, ['brandName'], [])
      if (missingParams) return errorResponse(400, missingParams, logger)

      const access = await denyIfUnauthorized(params, 'repair', params.brandName, logger)
      if (access.error) return access

      const safeName = sanitiseBrandName(params.brandName)
      const index = await addToBrandIndex(state, safeName)
      logger.info(`repair: ensured '${safeName}' in state index`)
      return { statusCode: 200, body: { message: `Brand '${safeName}' repaired in state index`, brandName: safeName, index } }
    }

    return errorResponse(400, `Unknown operation '${operation}'. Valid values: list, get, save, delete, update-meta, rename, repair`, logger)
  } catch (error) {
    logger.error(error)
    return errorResponse(500, error.message || 'server error', logger)
  }
}

exports.main = main
