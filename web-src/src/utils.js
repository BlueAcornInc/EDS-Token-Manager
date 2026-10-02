/*
 * Client-side utilities for the Brand CSS Token Manager
 *
 * Includes:
 *   - CSS token helpers (flattenObject, toKebabCase, toCssVariables)
 *   - Schema loader (loadSchema)
 *   - Action invocation helper (actionWebInvoke)
 */

import tokenSchema from '../../config/token-schema.json';

// ---------------------------------------------------------------------------
// CSS Token Helpers  (mirrors actions/utils.js — no server round-trip needed)
// ---------------------------------------------------------------------------

/**
 * Recursively flatten a nested token object into kebab-joined keys.
 * CSS-like leaf values (hex colors, px/rem sizes, rgb()) are not recursed.
 *
 * @param {object} obj
 * @param {string} prefix
 * @returns {object} flat key → value map
 * import jsonData from './data.json' assert { type: 'json' };
 */

export function flattenObject (obj, prefix = '') {
  const out = {}
  for (const [key, value] of Object.entries(obj)) {
    const k = prefix ? `${prefix}-${key}` : key
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !isCssValue(value)
    ) {
      // Schema descriptor shape: { type, default, label } — extract the value
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
 * Returns true if a value should be treated as a CSS leaf (no recursion).
 * @param {*} v
 * @returns {boolean}
 */
export function isCssValue (v) {
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
 * Convert camelCase / PascalCase to kebab-case.
 * @param {string} str
 * @returns {string}
 */
export function toKebabCase (str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s._]+/g, '-')
    .toLowerCase()
}

/**
 * Build a CSS `:root {}` block using the cssVar names defined in the schema.
 * Each token entry in the schema must have a `cssVar` field (e.g. "--color-primary").
 * Only tokens present in the schema are emitted — no derived or prefixed names.
 *
 * @param {object} schema  - parsed token-schema.json
 * @param {object} tokens  - nested token values { category: { key: value } }
 * @returns {string} full CSS text
 */
export function tokensToCSS (schema, tokens) {
  const lines = []
  for (const [category, fields] of Object.entries(schema)) {
    for (const [key, def] of Object.entries(fields)) {
      const raw = tokens[category] && tokens[category][key] !== undefined ? tokens[category][key] : ''
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
// Schema — imported from config/token-schema.json
// ---------------------------------------------------------------------------

let _schemaCache = null

/**
 * Return the token schema from the imported config/token-schema.json.
 * Throws an error if the schema is not available.
 *
 * @returns {Promise<object>} the parsed schema object
 */
export async function loadSchema () {
  if (_schemaCache) return _schemaCache
  if (!tokenSchema) {
    throw new Error('token-schema.json is not available. Ensure config/token-schema.json exists and is properly imported.')
  }
  _schemaCache = tokenSchema
  return _schemaCache
}

/**
 * Build a default token object from the schema (all values set to schema defaults).
 * @param {object} schema - parsed token-schema.json
 * @returns {object} token object with default values
 */
export function buildDefaultTokens (schema) {
  const tokens = {}
  for (const [category, fields] of Object.entries(schema)) {
    tokens[category] = {}
    for (const [key, def] of Object.entries(fields)) {
      tokens[category][key] = def.default
    }
  }
  return tokens
}

export function buildEmptyTokens (schema) {
  const tokens = {}
  for (const [category, fields] of Object.entries(schema)) {
    tokens[category] = {}
    for (const [key] of Object.entries(fields)) {
      tokens[category][key] = ''
    }
  }
  return tokens
}

/**
 * Short EDS site slug from a brand folder name (first letter of each word).
 * e.g. lake-tahoe-adventures → lta. Default for new sites (create-site);
 * operators can override in Trailhead meta.
 * @param {string} brandFolder
 * @returns {string}
 */
export function buildSiteCode (brandFolder) {
  return String(brandFolder || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 9)
}

/**
 * Resolve Helix `site` for CDN / preview URLs.
 * 1. `meta.siteCode` when set in Trailhead (short or legacy full name)
 * 2. Else brand folder slug (legacy sites like `lake-powell`)
 * @param {string} brandFolder
 * @param {{ siteCode?: string }|null|undefined} meta
 * @returns {string}
 */
export function resolveEdsSiteCode (brandFolder, meta) {
  const fromMeta = meta && meta.siteCode && String(meta.siteCode).trim()
  if (fromMeta) return fromMeta.toLowerCase()
  return String(brandFolder || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Helix CDN origin: https://{ref}--{siteCode}--{org}.aem.live
 * siteCode from Trailhead meta (or folder fallback); org = GitHub org.
 * @param {{ ref?: string, siteCode: string, org: string }} opts
 * @returns {string}
 */
export function edsCdnOrigin ({ ref = 'staging', siteCode, org }) {
  const refLabel = String(ref || 'staging').toLowerCase().replace(/\//g, '-')
  const siteLabel = String(siteCode || '').toLowerCase()
  const orgLabel = String(org || '').toLowerCase()
  return `https://${refLabel}--${siteLabel}--${orgLabel}.aem.live`
}

// ---------------------------------------------------------------------------
// Action Invocation Helper
// ---------------------------------------------------------------------------

/**
 * Invoke an Adobe I/O Runtime web action.
 *
 * @param {string} actionUrl  - full action URL
 * @param {object} headers    - HTTP headers (e.g. Authorization)
 * @param {object} params     - query/body parameters
 * @param {string} [method]   - HTTP method (default: 'POST')
 * @returns {Promise<object>} parsed JSON response body
 */
export async function actionWebInvoke (actionUrl, headers = {}, params = {}, method = 'POST') {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }

  if (method === 'GET') {
    const qs = new URLSearchParams(params).toString()
    const url = qs ? `${actionUrl}?${qs}` : actionUrl
    const res = await fetch(url, opts)
    return _handleResponse(res)
  }

  opts.body = JSON.stringify(params)
  const res = await fetch(actionUrl, opts)
  return _handleResponse(res)
}

async function _handleResponse (res) {
  let data
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    data = await res.json()
  } else {
    data = await res.text()
  }
  if (!res.ok) {
    const msg = (data && data.error) ? data.error : `HTTP ${res.status}`
    throw new Error(msg)
  }
  return data
}

export default actionWebInvoke
