const { Core } = require('@adobe/aio-sdk')
const stateLib = require('@adobe/aio-lib-state')
const fetch = require('node-fetch')
const {
  errorResponse,
  getBearerToken,
  stringParameters,
  checkMissingRequestInputs,
  getInstallationToken,
  buildGitHubHeaders,
} = require('../utils')
const { DEFAULT_GIT_BRANCH } = require('../branches')

const CACHE_TTL = 60

const SITE_CONFIG = {
  'bcl':         { aemContentPath: '/content/bryce-canyon-lodge',       aemEnv: 'p179307-e2052901' },
  'mvl':         { aemContentPath: '/content/mesa-verde-lodge',         aemEnv: 'p179307-e2052901' },
  'gcln':        { aemContentPath: '/content/grand-canyon-lodge-north', aemEnv: 'p179307-e2052901' },
  'lake-powell': { aemContentPath: '/content/lake-powell',              aemEnv: 'p179307-e2052901' },
}

function deriveAemState (jcr) {
  if (!jcr) return 'never-published'
  const action = jcr['cq:lastReplicationAction']
  if (!action) return 'never-published'
  return action === 'Activate' ? 'published' : 'modified'
}

function detectMismatches ({ preview, live, edit, aem }) {
  const flags = []
  if (aem.state === 'published' && preview?.status === 404) flags.push('OUT_OF_SYNC')
  if (edit?.lastModified && preview?.lastModified) {
    if (new Date(edit.lastModified) > new Date(preview.lastModified)) flags.push('STALE_PREVIEW')
  }
  if (preview?.status === 200 && live?.status !== 200) flags.push('NOT_PUBLISHED_TO_LIVE')
  return flags
}

async function main (params) {
  const logger = Core.Logger('content-status', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.debug(stringParameters(params))

    getBearerToken(params)

    const errorMessage = checkMissingRequestInputs(params, ['site', 'path'])
    if (errorMessage) return errorResponse(400, errorMessage, logger)

    const { site, path, branch = DEFAULT_GIT_BRANCH } = params

    if (!SITE_CONFIG[site]) {
      return errorResponse(400, `Unknown site '${site}'. Valid sites: ${Object.keys(SITE_CONFIG).join(', ')}`, logger)
    }

    const { aemContentPath, aemEnv } = SITE_CONFIG[site]
    // state keys only allow [a-zA-Z0-9-_.] — use dots as separators, encode path slashes
    const safePathKey = path.replace(/\//g, '_').replace(/^_/, '') || 'root'
    const cacheKey = `content-status.${site}.${branch}.${safePathKey}`

    const state = await stateLib.init()
    const cached = await state.get(cacheKey)
    if (cached?.value) {
      logger.debug(`cache hit: ${cacheKey}`)
      try { return { statusCode: 200, body: JSON.parse(cached.value) } } catch (_e) { /* cache parse failed — fall through to fresh fetch */ }
    }

    // Admin API status — uses GitHub App token as the hlx admin auth
    const gitToken = await getInstallationToken(params)
    const gitHeaders = buildGitHubHeaders(gitToken)
    const adminUrl = `https://admin.hlx.page/status/aramark-destinations/${site}/${branch}${path}`

    // AEM Author calls — only if bearer token is configured
    const aemToken = params.AEM_BEARER_TOKEN
    const aemBase = `https://author-${aemEnv}.adobeaemcloud.com`
    const aemPath = `${aemContentPath}${path === '/' ? '' : path}`

    const [adminRes, aemStatusRes, aemChildrenRes] = await Promise.all([
      fetch(adminUrl, { headers: { ...gitHeaders, 'Cache-Control': 'no-cache' } }),
      aemToken
        ? fetch(`${aemBase}${aemPath}.json`, { headers: { Authorization: `Bearer ${aemToken}` } })
        : Promise.resolve(null),
      aemToken
        ? fetch(`${aemBase}${aemPath}.1.json`, { headers: { Authorization: `Bearer ${aemToken}` } })
        : Promise.resolve(null),
    ])

    // Parse Admin API response
    let preview = null, live = null, edit = null
    if (adminRes.ok) {
      const adminData = await adminRes.json()
      preview = adminData.preview || null
      live    = adminData.live    || null
      edit    = adminData.edit    || null
    } else {
      logger.warn(`Admin API returned ${adminRes.status} for ${adminUrl}`)
    }

    // Parse AEM Author response
    let aem = { state: 'unavailable', reason: 'AEM_BEARER_TOKEN not configured' }
    let children = []

    if (aemToken) {
      if (aemStatusRes && aemStatusRes.ok) {
        const aemData = await aemStatusRes.json()
        const jcr = aemData['jcr:content'] || null
        aem = {
          state: deriveAemState(jcr),
          lastReplicationAction: jcr?.['cq:lastReplicationAction'] || null,
          lastReplicated: jcr?.['cq:lastReplicated'] || null,
        }
      } else {
        const status = aemStatusRes?.status
        aem = { state: 'unknown', reason: `AEM Author returned ${status}` }
      }

      if (aemChildrenRes && aemChildrenRes.ok) {
        const childData = await aemChildrenRes.json()
        children = Object.entries(childData)
          .filter(([, v]) => v && v['jcr:primaryType'] === 'cq:Page')
          .map(([name]) => ({
            name,
            path: path === '/' ? `/${name}` : `${path}/${name}`,
          }))
      }
    }

    const mismatches = aem.state !== 'unavailable' && aem.state !== 'unknown'
      ? detectMismatches({ preview, live, edit, aem })
      : (preview && live ? detectMismatches({ preview, live, edit, aem: { state: 'unknown' } }).filter(f => f !== 'OUT_OF_SYNC') : [])

    const result = { path, preview, live, edit, aem, mismatches, children }

    await state.put(cacheKey, JSON.stringify(result), { ttl: CACHE_TTL })

    return { statusCode: 200, body: result }
  } catch (e) {
    logger.error(e)
    return errorResponse(500, e.message || 'server error', logger)
  }
}

exports.main = main
