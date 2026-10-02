/*
 * list-sites action
 *
 * Enumerates existing sites by reading the brands/ directory from the
 * target GitHub repository. Returns an array of site objects that the
 * wizard uses to populate the "Clone existing site" list.
 *
 * Required params (injected via app.config.yaml):
 *   - GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY / GITHUB_APP_INSTALLATION_ID
 *   - GITHUB_OWNER / GITHUB_REPO
 *
 * Optional params:
 *   - ref          : branch/tag/SHA to read from (default: staging)
 *
 * Response body:
 *   { sites: [{ id, name, group, domain, siteCode }] }
 *
 * group, domain, and siteCode are read from brands/{name}/site.json if it exists,
 * otherwise left as null so the UI can handle missing metadata gracefully.
 */

const { Core } = require('@adobe/aio-sdk')
const {
  errorResponse,
  stringParameters,
  getInstallationToken,
  buildGitHubHeaders
} = require('../utils')
const { INVENTORY_BRANCH } = require('../branches')

const GITHUB_API_BASE = 'https://api.github.com'

async function main (params) {
  const logger = Core.Logger('list-sites', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('list-sites action called')
    logger.debug(stringParameters(params))

    const { GITHUB_OWNER, GITHUB_REPO, ref = INVENTORY_BRANCH } = params
    const owner = GITHUB_OWNER
    const repo  = GITHUB_REPO

    if (!owner || !repo) {
      return errorResponse(500, 'GITHUB_OWNER and GITHUB_REPO must be set in action inputs', logger)
    }

    const GITHUB_TOKEN = await getInstallationToken(params)
    const headers = buildGitHubHeaders(GITHUB_TOKEN)
    const fetch = require('node-fetch')

    // Fetch brands/ directory listing
    const dirUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/brands?ref=${encodeURIComponent(ref)}`
    const dirRes = await fetch(dirUrl, { headers })

    if (dirRes.status === 404) {
      return { statusCode: 200, body: { sites: [] } }
    }

    if (!dirRes.ok) {
      const body = await dirRes.json().catch(() => ({}))
      return errorResponse(dirRes.status, `GitHub API error: ${body.message || dirRes.statusText}`, logger)
    }

    const entries = await dirRes.json()
    const brandDirs = entries.filter(e => e.type === 'dir' && !/-dev$|-staging$/.test(e.name))

    // For each brand directory, try to read site.json for metadata
    const sites = await Promise.all(brandDirs.map(async (dir) => {
      const name = dir.name
      const site = { id: name, name, group: null, domain: null, siteCode: null }

      try {
        const metaUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/brands/${name}/site.json?ref=${encodeURIComponent(ref)}`
        const metaRes = await fetch(metaUrl, { headers })
        if (metaRes.ok) {
          const metaFile = await metaRes.json()
          if (metaFile.content) {
            const meta = JSON.parse(Buffer.from(metaFile.content, 'base64').toString('utf8'))
            site.group = meta.group || null
            site.domain = meta.domain || null
            site.siteCode = meta.siteCode || null
            site.fullName = meta.name !== site.id ? (meta.name || null) : null
          }
        }
      } catch (_) {
        // site.json optional — fall through with nulls
      }

      return site
    }))

    logger.info(`Found ${sites.length} brand site(s)`)

    return {
      statusCode: 200,
      body: { sites }
    }
  } catch (error) {
    logger.error(error)
    return errorResponse(500, error.message || 'server error', logger)
  }
}

exports.main = main
