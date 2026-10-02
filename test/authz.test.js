const {
  resolveRoleFromGroups,
  authorize,
  filterBrandsForAccess,
  ADMIN_GROUP,
  VIEWER_GROUP,
  BRAND_MANAGER_PREFIX
} = require('../actions/authz')

describe('resolveRoleFromGroups', () => {
  test('detects administrator', () => {
    const r = resolveRoleFromGroups([ADMIN_GROUP])
    expect(r.role).toBe('admin')
    expect(r.brands).toBeNull()
  })

  test('detects brand managers and sanitises brand names', () => {
    const r = resolveRoleFromGroups([
      `${BRAND_MANAGER_PREFIX}Lake Powell`,
      `${BRAND_MANAGER_PREFIX}arches-resort`
    ])
    expect(r.role).toBe('brand-manager')
    expect(r.brands).toEqual(expect.arrayContaining(['lake-powell', 'arches-resort']))
  })

  test('detects viewer', () => {
    const r = resolveRoleFromGroups([VIEWER_GROUP])
    expect(r.role).toBe('viewer')
    expect(r.brands).toBeNull()
  })

  test('returns none for unknown groups', () => {
    const r = resolveRoleFromGroups(['Some Other Group'])
    expect(r.role).toBe('none')
    expect(r.brands).toEqual([])
  })
})

describe('authorize (enforcement off by default)', () => {
  test('allows everything when AUTHZ_ENFORCE is unset', async () => {
    const access = await authorize({}, { operation: 'save', brandName: 'x' })
    expect(access.allowed).toBe(true)
    expect(access.enforced).toBe(false)
  })
})

describe('authorize (enforcement on)', () => {
  test('denies when no groups', async () => {
    const access = await authorize(
      { AUTHZ_ENFORCE: 'true', __authz_groups: [] },
      { operation: 'save', brandName: 'aramark' }
    )
    expect(access.allowed).toBe(false)
    expect(access.statusCode).toBe(403)
  })

  test('viewer cannot write', async () => {
    const access = await authorize(
      { AUTHZ_ENFORCE: true, __authz_groups: [VIEWER_GROUP] },
      { operation: 'save', brandName: 'aramark' }
    )
    expect(access.allowed).toBe(false)
    expect(access.role).toBe('viewer')
  })

  test('viewer can read', async () => {
    const access = await authorize(
      { AUTHZ_ENFORCE: true, __authz_groups: [VIEWER_GROUP] },
      { operation: 'get', brandName: 'aramark' }
    )
    expect(access.allowed).toBe(true)
  })

  test('brand manager can write own brand', async () => {
    const access = await authorize(
      {
        AUTHZ_ENFORCE: 'true',
        __authz_groups: [`${BRAND_MANAGER_PREFIX}aramark`]
      },
      { operation: 'publish', brandName: 'Aramark' }
    )
    expect(access.allowed).toBe(true)
    expect(access.role).toBe('brand-manager')
  })

  test('brand manager cannot write other brand', async () => {
    const access = await authorize(
      {
        AUTHZ_ENFORCE: 'true',
        __authz_groups: [`${BRAND_MANAGER_PREFIX}aramark`]
      },
      { operation: 'save', brandName: 'pepsi' }
    )
    expect(access.allowed).toBe(false)
    expect(access.statusCode).toBe(403)
  })

  test('only admin can create or remove', async () => {
    const bm = await authorize(
      {
        AUTHZ_ENFORCE: 'true',
        __authz_groups: [`${BRAND_MANAGER_PREFIX}aramark`]
      },
      { operation: 'create', brandName: 'new-site' }
    )
    expect(bm.allowed).toBe(false)

    const admin = await authorize(
      { AUTHZ_ENFORCE: 'true', __authz_groups: [ADMIN_GROUP] },
      { operation: 'remove', brandName: 'aramark' }
    )
    expect(admin.allowed).toBe(true)
  })
})

describe('filterBrandsForAccess', () => {
  test('passes through for admin (brands null)', () => {
    expect(filterBrandsForAccess(['a', 'b'], { brands: null, role: 'admin' })).toEqual(['a', 'b'])
  })

  test('filters for brand-manager', () => {
    expect(
      filterBrandsForAccess(['a', 'b', 'c'], { brands: ['b'], role: 'brand-manager' })
    ).toEqual(['b'])
  })
})
