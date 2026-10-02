/* 
* <license header>
*/

/* This file exposes some common utilities for your actions */

/**
 * Returns a log-ready string of the action input parameters.
 * Redacts Authorization headers and known secret input fields.
 *
 * @param {object} params action input parameters.
 * @returns {string}
 */
function stringParameters (params) {
  const SENSITIVE_KEYS = new Set([
    'GITHUB_APP_PRIVATE_KEY',
    'GITHUB_TOKEN',
    'AEM_BEARER_TOKEN',
    'AEM_ADMIN_TOKEN',
    'SERVICE_API_KEY',
    'apiKey',
    'AIO_runtime_auth'
  ])

  let headers = params.__ow_headers || {}
  if (headers.authorization) {
    headers = { ...headers, authorization: '<hidden>' }
  }

  const safe = { ...params, __ow_headers: headers }
  for (const key of Object.keys(safe)) {
    if (SENSITIVE_KEYS.has(key) && safe[key] !== undefined && safe[key] !== '') {
      safe[key] = '<hidden>'
    }
  }
  return JSON.stringify(safe)
}

/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} obj object to check.
 * @param {array} required list of required keys.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'
 *
 * @returns {array}
 * @private
 */
function getMissingKeys (obj, required) {
  return required.filter(r => {
    const splits = r.split('.')
    const last = splits[splits.length - 1]
    const traverse = splits.slice(0, -1).reduce((tObj, split) => { tObj = (tObj[split] || {}); return tObj }, obj)
    return traverse[last] === undefined || traverse[last] === '' // missing default params are empty string
  })
}

/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} params action input parameters.
 * @param {array} requiredHeaders list of required input headers.
 * @param {array} requiredParams list of required input parameters.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'.
 *
 * @returns {string} if the return value is not null, then it holds an error message describing the missing inputs.
 *
 */
function checkMissingRequestInputs (params, requiredParams = [], requiredHeaders = []) {
  let errorMessage = null

  // input headers are always lowercase
  requiredHeaders = requiredHeaders.map(h => h.toLowerCase())
  // check for missing headers
  const missingHeaders = getMissingKeys(params.__ow_headers || {}, requiredHeaders)
  if (missingHeaders.length > 0) {
    errorMessage = `missing header(s) '${missingHeaders}'`
  }

  // check for missing parameters
  const missingParams = getMissingKeys(params, requiredParams)
  if (missingParams.length > 0) {
    if (errorMessage) {
      errorMessage += ' and '
    } else {
      errorMessage = ''
    }
    errorMessage += `missing parameter(s) '${missingParams}'`
  }

  return errorMessage
}

/**
 *
 * Extracts the bearer token string from the Authorization header in the request parameters.
 *
 * @param {object} params action input parameters.
 *
 * @returns {string|undefined} the token string or undefined if not set in request headers.
 *
 */
function getBearerToken (params) {
  if (params.__ow_headers &&
      params.__ow_headers.authorization &&
      params.__ow_headers.authorization.startsWith('Bearer ')) {
    return params.__ow_headers.authorization.substring('Bearer '.length)
  }
  return undefined
}

/** Default I/O State TTL (~365 days — platform max; no infinite TTL). */
const STATE_TTL = 31536000

/**
 * Normalise a brand/site name to lowercase kebab-case for state keys and paths.
 * @param {string} name
 * @returns {string}
 */
function sanitiseBrandName (name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'brand'
}

/**
 * Short EDS site slug from a brand folder name: first letter of each hyphen
 * word, lowercased, capped at 9 chars.
 * e.g. lake-tahoe-adventures → lta, lake-powell → lp
 *
 * **Default for new sites** (create-site). Operators can override in Trailhead.
 * Some legacy Helix sites used the full folder name (`lake-powell`) instead.
 *
 * @param {string} safeName - kebab brand folder slug
 * @returns {string}
 */
function buildSiteCode (safeName) {
  return sanitiseBrandName(safeName)
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 9)
}

/**
 * Resolve Helix `site` for CDN / preview URLs.
 * 1. `meta.siteCode` when set in Trailhead (authoritative — short or legacy full name)
 * 2. Else brand folder slug (safe for many original sites like `lake-powell`)
 *
 * @param {string} safeName
 * @param {{ siteCode?: string }|null|undefined} meta
 * @returns {string}
 */
function resolveEdsSiteCode (safeName, meta) {
  const fromMeta = meta && meta.siteCode && String(meta.siteCode).trim()
  if (fromMeta) return fromMeta.toLowerCase()
  return sanitiseBrandName(safeName)
}

/**
 * Helix / EDS CDN origin: https://{ref}--{site}--{org}.aem.live
 * `site` comes from Trailhead meta (or folder fallback) — never the GitHub repo.
 *
 * @param {{ ref?: string, siteCode: string, org: string, live?: boolean }} opts
 * @returns {string} origin without trailing slash
 */
function edsCdnOrigin ({ ref = 'staging', siteCode, org, live = true }) {
  const refLabel = String(ref || 'staging').toLowerCase().replace(/\//g, '-')
  const siteLabel = String(siteCode || '').toLowerCase()
  const orgLabel = String(org || '').toLowerCase()
  const host = live ? 'aem.live' : 'aem.page'
  return `https://${refLabel}--${siteLabel}--${orgLabel}.${host}`
}

/**
 * Validate a tokens object against token-schema.json.
 * Rejects unknown categories/keys and obviously invalid color values.
 *
 * @param {object} schema - parsed token-schema.json
 * @param {object} tokens - nested token values
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
function validateTokens (schema, tokens) {
  if (!tokens || typeof tokens !== 'object' || Array.isArray(tokens)) {
    return { ok: false, message: 'tokens must be a JSON object' }
  }

  for (const category of Object.keys(tokens)) {
    if (!schema[category]) {
      return { ok: false, message: `unknown token category '${category}'` }
    }
    const fields = tokens[category]
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
      return { ok: false, message: `tokens.${category} must be an object` }
    }
    for (const [key, value] of Object.entries(fields)) {
      const def = schema[category][key]
      if (!def) {
        return { ok: false, message: `unknown token '${category}.${key}'` }
      }
      if (value === undefined || value === null) {
        return { ok: false, message: `token '${category}.${key}' cannot be null` }
      }
      if (typeof value !== 'string' && typeof value !== 'number') {
        return { ok: false, message: `token '${category}.${key}' must be a string or number` }
      }
      if (def.type === 'color') {
        const str = String(value).trim()
        // Allow hex and common css color functions used by greys generator
        const okColor = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(str) ||
          /^(rgb|rgba|hsl|hsla|oklch)\(/i.test(str) ||
          str === 'transparent' ||
          str === 'currentColor'
        if (!okColor) {
          return {
            ok: false,
            message: `token '${category}.${key}' is not a valid color value`
          }
        }
      }
    }
  }
  return { ok: true }
}

/**
 * Delete all known I/O State keys for a brand slug.
 * @param {object} state - aio-lib-state client
 * @param {string} safeName - sanitised brand slug
 */
async function clearBrandState (state, safeName) {
  const keys = [
    `brand.${safeName}`,
    `brand.${safeName}.tokens`, // legacy key from earlier create-site bug
    `brand.${safeName}.status`,
    `brand.${safeName}.meta`,
    `brand.${safeName}.pr`,
    `brand.${safeName}.audit`,
    `branch.seq.${safeName}`
  ]
  await Promise.all(keys.map((k) => state.delete(k).catch(() => {})))
}

/**
 * Best-effort actor identity from the IMS Bearer JWT (already validated by gateway)
 * or a test override `__authz_actor`. Does not call IMS Profile API.
 *
 * @param {object} params
 * @returns {{ id: string|null, email: string|null, displayName: string|null }}
 */
function resolveActor (params) {
  if (params && params.__authz_actor && typeof params.__authz_actor === 'object') {
    return {
      id: params.__authz_actor.id || null,
      email: params.__authz_actor.email || null,
      displayName: params.__authz_actor.displayName || params.__authz_actor.email || null
    }
  }

  const token = getBearerToken(params || {})
  if (!token || !token.includes('.')) {
    return { id: null, email: null, displayName: null }
  }

  try {
    const payloadB64 = token.split('.')[1]
    const json = Buffer.from(payloadB64, 'base64url').toString('utf8')
    const payload = JSON.parse(json)
    const email = payload.email || payload.user_email || null
    const id = payload.user_id || payload.sub || payload.userId || null
    const displayName = payload.name || payload.displayName || email || id
    return { id, email, displayName }
  } catch (_) {
    return { id: null, email: null, displayName: null }
  }
}

/**
 * Merge and persist audit metadata on brand.{slug}.audit.
 *
 * @param {object} state
 * @param {string} safeName
 * @param {object} patch - fields to merge (e.g. lastSavedBy, lastPublishedAt, lastPr)
 * @param {number} [ttl=STATE_TTL]
 * @returns {Promise<object>} updated audit object
 */
async function recordBrandAudit (state, safeName, patch, ttl = STATE_TTL) {
  const key = `brand.${safeName}.audit`
  const entry = await state.get(key)
  let current = {}
  if (entry && entry.value !== undefined) {
    try {
      current = typeof entry.value === 'string' ? JSON.parse(entry.value) : entry.value
    } catch (_) {
      current = {}
    }
  }
  if (!current || typeof current !== 'object') current = {}
  const updated = { ...current, ...patch }
  await state.put(key, JSON.stringify(updated), { ttl })
  return updated
}

/**
 * Read brand audit metadata (or {}).
 * @param {object} state
 * @param {string} safeName
 * @returns {Promise<object>}
 */
async function readBrandAudit (state, safeName) {
  const entry = await state.get(`brand.${safeName}.audit`)
  if (!entry || entry.value === undefined) return {}
  try {
    return typeof entry.value === 'string' ? JSON.parse(entry.value) : entry.value
  } catch (_) {
    return {}
  }
}

/**
 * Add a brand slug to brand.__index__ (idempotent).
 * @param {object} state
 * @param {string} safeName
 * @param {number} [ttl=STATE_TTL]
 */
async function addToBrandIndex (state, safeName, ttl = STATE_TTL) {
  const entry = await state.get('brand.__index__')
  let index = []
  if (entry && entry.value !== undefined) {
    try {
      index = typeof entry.value === 'string' ? JSON.parse(entry.value) : entry.value
    } catch (_) {
      index = []
    }
  }
  if (!Array.isArray(index)) index = []
  if (!index.includes(safeName)) {
    index.push(safeName)
    await state.put('brand.__index__', JSON.stringify(index), { ttl })
  }
  return index
}

/**
 * Remove a brand slug from brand.__index__.
 * @param {object} state
 * @param {string} safeName
 * @param {number} [ttl=STATE_TTL]
 */
async function removeFromBrandIndex (state, safeName, ttl = STATE_TTL) {
  const entry = await state.get('brand.__index__')
  if (!entry || entry.value === undefined) return []
  let index = []
  try {
    index = typeof entry.value === 'string' ? JSON.parse(entry.value) : entry.value
  } catch (_) {
    return []
  }
  if (!Array.isArray(index)) return []
  const next = index.filter((b) => b !== safeName)
  await state.put('brand.__index__', JSON.stringify(next), { ttl })
  return next
}

/**
 *
 * Returns an error response object and attempts to log.info the status code and error message
 *
 * @param {number} statusCode the error status code.
 *        e.g. 400
 * @param {string} message the error message.
 *        e.g. 'missing xyz parameter'
 * @param {*} [logger] an optional logger instance object with an `info` method
 *        e.g. `new require('@adobe/aio-sdk').Core.Logger('name')`
 *
 * @returns {object} the error object, ready to be returned from the action main's function.
 *
 */
function errorResponse (statusCode, message, logger) {
  if (logger && typeof logger.info === 'function') {
    logger.info(`${statusCode}: ${message}`)
  }
  return {
    error: {
      statusCode,
      body: {
        error: message
      }
    }
  }
}

// ---------------------------------------------------------------------------
// CSS Token Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively flatten a nested object into dot-separated (kebab) keys.
 * Arrays and CSS-like values (colors, px, rem) are kept as leaf values.
 *
 * @param {object} obj  - source token object
 * @param {string} prefix - current key prefix
 * @returns {object} flat key → value map
 */
function flattenObject (obj, prefix = '') {
  const out = {}
  for (const [key, value] of Object.entries(obj)) {
    const k = prefix ? `${prefix}-${key}` : key
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !isCssValue(value)
    ) {
      // Token descriptor shape: { type, default, label } — extract the actual value
      if ('default' in value) {
        out[k] = value.default
      } else {
        Object.assign(out, flattenObject(value, k))
      }
    } else {
      out[k] = value
    }
  }
  return out
}

/**
 * Returns true if the value should be treated as a CSS leaf value (not recursed into).
 * @param {*} v
 * @returns {boolean}
 */
function isCssValue (v) {
  if (Array.isArray(v)) return true
  if (
    typeof v === 'string' &&
    (v.startsWith('rgb') ||
      v.startsWith('#') ||
      v.includes('px') ||
      v.includes('rem'))
  ) {
    return true
  }
  return false
}

/**
 * Convert camelCase / PascalCase string to kebab-case.
 * @param {string} str
 * @returns {string}
 */
function toKebabCase (str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s._]+/g, '-')
    .toLowerCase()
}

/**
 * Build a CSS `:root {}` block using the cssVar names defined in the schema.
 * Matches the output of web-src/src/utils.js#tokensToCSS exactly.
 *
 * @param {object} schema  - parsed token-schema.json
 * @param {object} tokens  - nested token values { category: { key: value } }
 * @returns {string} CSS text
 */
function tokensToCSS (schema, tokens) {
  const lines = []
  for (const [category, fields] of Object.entries(schema)) {
    for (const [key, def] of Object.entries(fields)) {
      const raw = (tokens[category] && tokens[category][key] !== undefined)
        ? tokens[category][key]
        : ''
      if (raw !== '') {
        lines.push(`  ${def.cssVar}: ${raw};`)
      } else {
        lines.push(`  /* ${def.cssVar}: */`)
      }
    }
  }
  return `:root {\n${lines.join('\n')}\n}\n`
}

// ---------------------------------------------------------------------------
// GitHub API Helpers
// ---------------------------------------------------------------------------

const GITHUB_API_BASE = 'https://api.github.com'

/**
 * Creates a signed JWT for GitHub App authentication (RS256, 10-minute validity).
 * Uses Node.js built-in crypto — no external deps required.
 * @param {string|number} appId
 * @param {string} privateKey - PEM-encoded RSA private key
 * @returns {string} signed JWT
 */
function createGitHubAppJWT (appId, privateKey) {
  const crypto = require('crypto')
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ iat: now - 60, exp: now + 600, iss: String(appId) })).toString('base64url')
  const sigInput = `${header}.${payload}`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(sigInput)
  return `${sigInput}.${sign.sign(privateKey).toString('base64url')}`
}

/**
 * Obtains a short-lived GitHub installation access token using GitHub App credentials.
 * Installation tokens expire after 1 hour — generate fresh for each action invocation.
 * Reads GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_APP_INSTALLATION_ID from params.
 * @param {object} params - action input params
 * @returns {Promise<string>} installation access token
 */
async function getInstallationToken (params) {
  const { GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_APP_INSTALLATION_ID } = params
  if (!GITHUB_APP_ID || !GITHUB_APP_PRIVATE_KEY || !GITHUB_APP_INSTALLATION_ID) {
    throw new Error('GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, and GITHUB_APP_INSTALLATION_ID must be set in action inputs')
  }
  const fetch = require('node-fetch')
  const jwt = createGitHubAppJWT(GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY)
  const res = await fetch(`${GITHUB_API_BASE}/app/installations/${GITHUB_APP_INSTALLATION_ID}/access_tokens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Trailhead/1.0',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(`GitHub App auth failed: ${body.message || res.status}`)
  }
  const data = await res.json()
  return data.token
}

/**
 * Builds standard GitHub API request headers.
 * @param {string} token - GitHub installation access token
 * @returns {object}
 */
function buildGitHubHeaders (token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
}

/**
 * Fetches the SHA of the tip commit of a branch.
 * @param {string} owner
 * @param {string} repo
 * @param {string} branch
 * @param {string} token
 * @returns {Promise<string>} the SHA string
 */
async function getBranchSHA (owner, repo, branch, token) {
  const fetch = require('node-fetch')
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/heads/${branch}`
  const res = await fetch(url, { headers: buildGitHubHeaders(token) })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      `Failed to get branch SHA for '${branch}': ${res.status} ${body.message || ''}`
    )
  }
  const data = await res.json()
  return data.object.sha
}

/**
 * Creates a new branch in the repository.
 * @param {string} owner
 * @param {string} repo
 * @param {string} newBranch - name of the new branch
 * @param {string} sha       - SHA to base the new branch on
 * @param {string} token
 * @returns {Promise<object>} GitHub API response
 */
async function createBranch (owner, repo, newBranch, sha, token) {
  const fetch = require('node-fetch')
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs`
  const res = await fetch(url, {
    method: 'POST',
    headers: buildGitHubHeaders(token),
    body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha })
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      `Failed to create branch '${newBranch}': ${res.status} ${body.message || ''}`
    )
  }
  return res.json()
}

/**
 * Creates or updates a file on a branch using the GitHub Contents API.
 * If the file already exists on that branch its SHA must be supplied.
 *
 * @param {object} opts
 * @param {string} opts.owner
 * @param {string} opts.repo
 * @param {string} opts.branch  - branch where the file will be written
 * @param {string} opts.path    - file path within the repo e.g. "brand/aramark.css"
 * @param {string} opts.content - raw file content (will be base64-encoded)
 * @param {string} opts.message - commit message
 * @param {string} opts.token
 * @returns {Promise<object>} GitHub API response
 */
async function createOrUpdateFile (opts) {
  const fetch = require('node-fetch')
  const { owner, repo, branch, path, content, message, token } = opts
  const headers = buildGitHubHeaders(token)

  // Check whether the file already exists on the branch (so we can pass its SHA)
  const checkUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`
  const checkRes = await fetch(checkUrl, { headers })
  const existingFile = checkRes.ok ? await checkRes.json().catch(() => null) : null
  const existingSha = existingFile && existingFile.sha ? existingFile.sha : undefined

  const putUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`
  const putBody = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch
  }
  if (existingSha) putBody.sha = existingSha

  const putRes = await fetch(putUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(putBody)
  })

  if (!putRes.ok) {
    const errBody = await putRes.json().catch(() => ({}))
    throw new Error(
      `Failed to create/update file '${path}': ${putRes.status} ${errBody.message || ''}`
    )
  }
  return putRes.json()
}

/**
 * Fetches an existing Pull Request.
 * Returns null if the PR does not exist or the request fails.
 * @param {string} owner
 * @param {string} repo
 * @param {number} prNumber
 * @param {string} token
 * @returns {Promise<object|null>}
 */
async function getPullRequest (owner, repo, prNumber, token) {
  const fetch = require('node-fetch')
  const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}`, {
    headers: buildGitHubHeaders(token)
  })
  if (!res.ok) return null
  return res.json().catch(() => null)
}

/**
 * Creates a Pull Request.
 * @param {string} owner
 * @param {string} repo
 * @param {string} head   - branch to merge from
 * @param {string} base   - branch to merge into
 * @param {string} title
 * @param {string} body
 * @param {string} token
 * @returns {Promise<object>} GitHub API response with PR details
 */
async function createPullRequest (owner, repo, head, base, title, body, token) {
  const fetch = require('node-fetch')
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls`
  const res = await fetch(url, {
    method: 'POST',
    headers: buildGitHubHeaders(token),
    body: JSON.stringify({ title, body: body || '', head, base })
  })
  if (!res.ok) {
    const respBody = await res.json().catch(() => ({}))
    throw new Error(`Failed to create PR: ${res.status} ${respBody.message || ''}`)
  }
  return res.json()
}

module.exports = {
  // Original utilities
  errorResponse,
  getBearerToken,
  stringParameters,
  checkMissingRequestInputs,
  // Brand / state helpers
  STATE_TTL,
  sanitiseBrandName,
  buildSiteCode,
  resolveEdsSiteCode,
  edsCdnOrigin,
  validateTokens,
  clearBrandState,
  addToBrandIndex,
  removeFromBrandIndex,
  resolveActor,
  recordBrandAudit,
  readBrandAudit,
  // CSS token helpers
  flattenObject,
  isCssValue,
  toKebabCase,
  tokensToCSS,
  getInstallationToken,
  buildGitHubHeaders,
  getBranchSHA,
  createBranch,
  createOrUpdateFile,
  getPullRequest,
  createPullRequest
}
