/**
 * Authorization helpers for Trailhead actions.
 *
 * Design matches documents/ENHANCEMENT_APPROACH.md (IMS Product Profiles).
 *
 * Enforcement is OFF by default (`AUTHZ_ENFORCE` not `true`) so this staging
 * repo and existing deploys keep working. When enabled, callers must present
 * a valid IMS Bearer token whose profile groups map to admin / brand-manager /
 * viewer roles.
 *
 * Group naming (Admin Console Product Profiles):
 *   - EDS Token Manager - Administrator
 *   - EDS Token Manager - Viewer
 *   - EDS Token Manager - Brand Manager - {Brand}
 */

const { getBearerToken, sanitiseBrandName } = require('./utils')

const ADMIN_GROUP = 'EDS Token Manager - Administrator'
const VIEWER_GROUP = 'EDS Token Manager - Viewer'
const BRAND_MANAGER_PREFIX = 'EDS Token Manager - Brand Manager - '

const IMS_PROFILE_URL = 'https://ims-na1.adobelogin.com/ims/profile/v1'

/** Operations that do not mutate brand data */
const READ_OPS = new Set(['read', 'list', 'get'])

/** Operations that mutate a specific brand (or create/remove brands) */
const WRITE_OPS = new Set([
  'write',
  'save',
  'delete',
  'update-meta',
  'rename',
  'repair',
  'publish',
  'create',
  'remove'
])

/**
 * @param {string[]} groups
 * @returns {{ role: 'admin'|'viewer'|'brand-manager'|'none', brands: string[]|null }}
 *   brands=null means all brands (admin); brands=[] means none.
 */
function resolveRoleFromGroups (groups = []) {
  const normalised = groups.map((g) => String(g))
  if (normalised.some((g) => g === ADMIN_GROUP || g.toLowerCase() === ADMIN_GROUP.toLowerCase())) {
    return { role: 'admin', brands: null }
  }

  const brands = []
  for (const g of normalised) {
    if (g.startsWith(BRAND_MANAGER_PREFIX)) {
      brands.push(sanitiseBrandName(g.slice(BRAND_MANAGER_PREFIX.length)))
    }
  }
  if (brands.length > 0) {
    return { role: 'brand-manager', brands: [...new Set(brands)] }
  }

  if (normalised.some((g) => g === VIEWER_GROUP || g.toLowerCase() === VIEWER_GROUP.toLowerCase())) {
    return { role: 'viewer', brands: null }
  }

  return { role: 'none', brands: [] }
}

/**
 * Fetch IMS profile groups for the request Bearer token.
 * Supports `__authz_groups` override for unit tests (never set from clients in prod).
 *
 * @param {object} params
 * @returns {Promise<string[]>}
 */
async function loadGroups (params) {
  if (Array.isArray(params.__authz_groups)) {
    return params.__authz_groups
  }

  const token = getBearerToken(params)
  if (!token) {
    throw Object.assign(new Error('Missing Authorization Bearer token'), { statusCode: 401 })
  }

  const fetch = require('node-fetch')
  const res = await fetch(IMS_PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  })
  if (!res.ok) {
    throw Object.assign(
      new Error(`IMS profile lookup failed: ${res.status}`),
      { statusCode: 401 }
    )
  }
  const profile = await res.json()
  if (Array.isArray(profile.groups)) return profile.groups
  if (Array.isArray(profile.roles)) return profile.roles.map((r) => r.name || r).filter(Boolean)
  return []
}

function isEnforceEnabled (params) {
  const raw = params.AUTHZ_ENFORCE
  return raw === true || raw === 'true' || raw === '1'
}

/**
 * Authorize an action.
 *
 * @param {object} params - action params (may include AUTHZ_ENFORCE, __authz_groups)
 * @param {object} options
 * @param {string} options.operation - logical op: read|write|list|get|save|...
 * @param {string} [options.brandName] - brand slug/name when brand-scoped
 * @returns {Promise<{ allowed: boolean, role: string, brands: string[]|null, enforced: boolean, statusCode?: number, message?: string }>}
 */
async function authorize (params, { operation, brandName } = {}) {
  if (!isEnforceEnabled(params)) {
    return { allowed: true, role: 'admin', brands: null, enforced: false }
  }

  let groups
  try {
    groups = await loadGroups(params)
  } catch (err) {
    return {
      allowed: false,
      role: 'none',
      brands: [],
      enforced: true,
      statusCode: err.statusCode || 401,
      message: err.message || 'Unauthorized'
    }
  }

  const { role, brands } = resolveRoleFromGroups(groups)
  const op = operation || 'read'
  const isWrite = WRITE_OPS.has(op)
  const isRead = READ_OPS.has(op) || !isWrite

  if (role === 'none') {
    return {
      allowed: false,
      role,
      brands,
      enforced: true,
      statusCode: 403,
      message: 'No Trailhead Product Profile assigned'
    }
  }

  if (role === 'viewer' && isWrite) {
    return {
      allowed: false,
      role,
      brands,
      enforced: true,
      statusCode: 403,
      message: 'Viewer role cannot modify brands'
    }
  }

  // create-site / remove-brand: admin only when enforced
  if ((op === 'create' || op === 'remove') && role !== 'admin') {
    return {
      allowed: false,
      role,
      brands,
      enforced: true,
      statusCode: 403,
      message: `Only administrators can ${op} brands`
    }
  }

  if (role === 'brand-manager' && brandName) {
    const safe = sanitiseBrandName(brandName)
    if (!brands.includes(safe)) {
      return {
        allowed: false,
        role,
        brands,
        enforced: true,
        statusCode: 403,
        message: `Access denied for brand '${safe}'`
      }
    }
  }

  // rename: must have access to both old and new? New slug is creating identity —
  // require access to the source brand; admin-only for rename is safer. Keep
  // brand-manager allowed on source brand only (already checked via brandName).

  if (isRead || isWrite) {
    return { allowed: true, role, brands, enforced: true }
  }

  return { allowed: true, role, brands, enforced: true }
}

/**
 * Filter a brand list for the caller's accessible brands.
 * When not enforced or admin/viewer with brands=null, returns input unchanged.
 *
 * @param {string[]} brandNames
 * @param {{ brands: string[]|null, role: string }} access
 * @returns {string[]}
 */
function filterBrandsForAccess (brandNames, access) {
  if (!access || access.brands === null) return brandNames
  const allowed = new Set(access.brands)
  return brandNames.filter((b) => allowed.has(b))
}

module.exports = {
  ADMIN_GROUP,
  VIEWER_GROUP,
  BRAND_MANAGER_PREFIX,
  resolveRoleFromGroups,
  authorize,
  filterBrandsForAccess,
  isEnforceEnabled
}
