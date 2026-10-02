const { Core } = require('@adobe/aio-sdk')
const stateLib = require('@adobe/aio-lib-state')
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
  getInstallationToken,
  createOrUpdateFile,
  sanitiseBrandName,
  clearBrandState,
  removeFromBrandIndex,
  STATE_TTL
} = require('../utils')
const { authorize } = require('../authz')
const { REMOVE_BRANCH } = require('../branches')

const BRANCH = REMOVE_BRANCH
const INDEX_PATH = 'brands/index.json'

async function main (params) {
  const logger = Core.Logger('remove-brand', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('remove-brand action called')
    logger.debug(stringParameters(params))

    const missing = checkMissingRequestInputs(params, ['brandName'], [])
    if (missing) return errorResponse(400, missing, logger)

    const access = await authorize(params, { operation: 'remove', brandName: params.brandName })
    if (!access.allowed) {
      return errorResponse(access.statusCode || 403, access.message || 'Forbidden', logger)
    }

    const { brandName, GITHUB_OWNER, GITHUB_REPO } = params
    if (!GITHUB_OWNER || !GITHUB_REPO) {
      return errorResponse(500, 'GITHUB_OWNER and GITHUB_REPO must be set in action inputs', logger)
    }
    const owner = GITHUB_OWNER
    const repo = GITHUB_REPO
    const safeName = sanitiseBrandName(brandName)

    const GITHUB_TOKEN = await getInstallationToken(params)
    const fetch = require('node-fetch')

    // Best-effort: update brands/index.json on dev if the legacy index file exists
    const indexUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${INDEX_PATH}?ref=${BRANCH}`
    const indexRes = await fetch(indexUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Trailhead/1.0'
      }
    })

    if (indexRes.ok) {
      const indexData = await indexRes.json()
      const currentIndex = JSON.parse(Buffer.from(indexData.content, 'base64').toString('utf8'))
      if (Array.isArray(currentIndex) && currentIndex.includes(safeName)) {
        const updatedIndex = currentIndex.filter((b) => b !== safeName)
        await createOrUpdateFile({
          owner,
          repo,
          branch: BRANCH,
          path: INDEX_PATH,
          content: JSON.stringify(updatedIndex, null, 2) + '\n',
          message: `chore(brands): remove ${safeName} from brand index`,
          token: GITHUB_TOKEN
        })
        logger.info(`Removed '${safeName}' from brands/index.json on ${BRANCH}`)
      } else {
        logger.info(`Brand '${safeName}' is not in index.json — skipping index update`)
      }
    } else if (indexRes.status === 404) {
      logger.info('brands/index.json not found — skipping GitHub index update')
    } else {
      const err = await indexRes.json().catch(() => ({}))
      logger.warn(`Could not read brands/index.json: ${err.message || indexRes.status}`)
    }

    const state = await stateLib.init()
    await clearBrandState(state, safeName)
    await removeFromBrandIndex(state, safeName, STATE_TTL)
    logger.info(`Cleared state for '${safeName}'`)

    return {
      statusCode: 200,
      body: { message: `Brand '${safeName}' removed from Trailhead state`, brandName: safeName }
    }
  } catch (error) {
    logger.error(error)
    return errorResponse(500, error.message || 'server error', logger)
  }
}

exports.main = main
