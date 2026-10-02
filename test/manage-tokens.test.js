jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn().mockReturnValue({
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    })
  }
}))

jest.mock('node-fetch', () => jest.fn().mockResolvedValue({ ok: false, status: 404 }))
const fetch = require('node-fetch')

jest.mock('../actions/utils', () => {
  const actual = jest.requireActual('../actions/utils')
  return {
    ...actual,
    getInstallationToken: jest.fn()
  }
})

const { getInstallationToken } = require('../actions/utils')

const _store = {}

jest.mock('@adobe/aio-lib-state', () => ({
  init: jest.fn().mockResolvedValue({
    get: jest.fn().mockImplementation(async (key) => {
      if (_store[key] === undefined) return undefined
      return { value: _store[key] }
    }),
    put: jest.fn().mockImplementation(async (key, value) => {
      _store[key] = value
    }),
    delete: jest.fn().mockImplementation(async (key) => {
      delete _store[key]
    })
  })
}))

const { main } = require('../actions/manage-tokens/index')

beforeEach(() => {
  Object.keys(_store).forEach((k) => delete _store[k])
  fetch.mockReset()
  fetch.mockResolvedValue({ ok: false, status: 404 })
  // Default: GitHub unavailable → list falls back to state index only
  getInstallationToken.mockRejectedValue(new Error('no github app creds'))
})

describe('manage-tokens: list', () => {
  test('returns empty array when no brands exist and GitHub is unavailable', async () => {
    const res = await main({ operation: 'list' })
    expect(res.statusCode).toBe(200)
    expect(res.body.brands).toEqual([])
  })

  test('returns GitHub brands when repo listing succeeds', async () => {
    getInstallationToken.mockResolvedValue('ghs_test')
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { type: 'dir', name: 'lake-powell' },
        { type: 'dir', name: 'unbranded' },
        { type: 'dir', name: 'lake-powell-staging' },
        { type: 'file', name: 'README.md' }
      ]
    })

    const res = await main({
      operation: 'list',
      GITHUB_OWNER: 'org',
      GITHUB_REPO: 'repo'
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.brands).toContain('lake-powell')
    expect(res.body.brands).toContain('unbranded')
    expect(res.body.brands).not.toContain('lake-powell-staging')
  })

  test('merges GitHub brands with state-only brands', async () => {
    getInstallationToken.mockResolvedValue('ghs_test')
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ type: 'dir', name: 'lake-powell' }]
    })
    _store['brand.__index__'] = JSON.stringify(['my-new-brand'])

    const res = await main({
      operation: 'list',
      GITHUB_OWNER: 'org',
      GITHUB_REPO: 'repo'
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.brands).toContain('lake-powell')
    expect(res.body.brands).toContain('my-new-brand')
  })

  test('does not duplicate when brand is in both GitHub and state', async () => {
    getInstallationToken.mockResolvedValue('ghs_test')
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ type: 'dir', name: 'lake-powell' }]
    })
    _store['brand.__index__'] = JSON.stringify(['lake-powell'])

    const res = await main({
      operation: 'list',
      GITHUB_OWNER: 'org',
      GITHUB_REPO: 'repo'
    })
    expect(res.body.brands.filter((b) => b === 'lake-powell').length).toBe(1)
  })

  test('returns state brands when GitHub is unavailable', async () => {
    _store['brand.__index__'] = JSON.stringify(['draft-only'])
    const res = await main({ operation: 'list' })
    expect(res.statusCode).toBe(200)
    expect(res.body.brands).toEqual(['draft-only'])
  })
})

describe('manage-tokens: save', () => {
  const sampleTokens = {
    colors: { primary: '#e87722', secondary: '#003865' }
  }

  test('saves tokens and creates index entry', async () => {
    const res = await main({ operation: 'save', brandName: 'TODO', tokens: sampleTokens })
    expect(res.statusCode).toBe(200)
    expect(res.body.brandName).toBe('TODO')
    expect(JSON.parse(_store['brand.TODO'])).toEqual(sampleTokens)
    expect(JSON.parse(_store['brand.__index__'])).toContain('TODO')
    expect(_store['brand.TODO.status']).toBe('drafted')
  })

  test('does not duplicate brand in index on second save', async () => {
    await main({ operation: 'save', brandName: 'TODO', tokens: sampleTokens })
    await main({
      operation: 'save',
      brandName: 'TODO',
      tokens: { ...sampleTokens, colors: { primary: '#ff0000' } }
    })
    expect(JSON.parse(_store['brand.__index__']).filter((b) => b === 'TODO').length).toBe(1)
  })

  test('sanitises brand name to kebab-case lowercase', async () => {
    const res = await main({ operation: 'save', brandName: 'My Brand!', tokens: sampleTokens })
    expect(res.statusCode).toBe(200)
    expect(res.body.brandName).toBe('my-brand')
    expect(JSON.parse(_store['brand.my-brand'])).toEqual(sampleTokens)
  })

  test('parses JSON string tokens', async () => {
    const res = await main({
      operation: 'save',
      brandName: 'test',
      tokens: JSON.stringify(sampleTokens)
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(_store['brand.test'])).toEqual(sampleTokens)
  })

  test('returns 400 for invalid JSON string tokens', async () => {
    const res = await main({ operation: 'save', brandName: 'test', tokens: 'not-json' })
    expect(res.error.statusCode).toBe(400)
  })

  test('returns 400 when brandName is missing', async () => {
    const res = await main({ operation: 'save', tokens: sampleTokens })
    expect(res.error.statusCode).toBe(400)
  })

  test('returns 400 when tokens is missing', async () => {
    const res = await main({ operation: 'save', brandName: 'TODO' })
    expect(res.error.statusCode).toBe(400)
  })

  test('records audit metadata on save', async () => {
    const res = await main({
      operation: 'save',
      brandName: 'TODO',
      tokens: sampleTokens,
      __authz_actor: { id: 'u1', email: 'editor@TODO.com', displayName: 'Editor' }
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.audit.lastSavedBy).toBe('editor@TODO.com')
    expect(res.body.audit.lastSavedAt).toBeDefined()
    expect(JSON.parse(_store['brand.TODO.audit']).lastSavedBy).toBe('editor@TODO.com')
  })
})

describe('manage-tokens: get', () => {
  const sampleTokens = { colors: { primary: '#e87722' } }

  beforeEach(() => {
    _store['brand.TODO'] = JSON.stringify(sampleTokens)
  })

  test('returns draft tokens from state', async () => {
    const res = await main({ operation: 'get', brandName: 'TODO' })
    expect(res.statusCode).toBe(200)
    expect(res.body.tokens).toEqual(sampleTokens)
    expect(res.body.source).toBe('draft')
  })

  test('returns schema defaults for indexed brand with no draft or CDN', async () => {
    delete _store['brand.TODO']
    _store['brand.__index__'] = JSON.stringify(['pending-brand'])
    const res = await main({ operation: 'get', brandName: 'pending-brand' })
    expect(res.statusCode).toBe(200)
    expect(res.body.source).toBe('defaults')
    expect(res.body.tokens.colors).toBeDefined()
  })

  test('returns 404 for unknown brand when CDN also 404s', async () => {
    const res = await main({ operation: 'get', brandName: 'unknown-brand' })
    expect(res.error.statusCode).toBe(404)
  })

  test('returns 400 when brandName is missing', async () => {
    const res = await main({ operation: 'get' })
    expect(res.error.statusCode).toBe(400)
  })
})

describe('manage-tokens: delete', () => {
  beforeEach(async () => {
    await main({
      operation: 'save',
      brandName: 'TODO',
      tokens: { colors: { primary: '#e87722' } }
    })
  })

  test('clears draft tokens but keeps the brand indexed', async () => {
    const res = await main({ operation: 'delete', brandName: 'TODO' })
    expect(res.statusCode).toBe(200)
    expect(_store['brand.TODO']).toBeUndefined()
    expect(JSON.parse(_store['brand.__index__'] || '[]')).toContain('TODO')
  })

  test('does not wipe brand meta (fullName/domain/siteCode survive a reset)', async () => {
    await main({
      operation: 'update-meta',
      brandName: 'TODO',
      fullName: 'TODO HQ',
      domain: 'TODO.com'
    })
    await main({ operation: 'delete', brandName: 'TODO' })
    const meta = JSON.parse(_store['brand.TODO.meta'] || '{}')
    expect(meta.fullName).toBe('TODO HQ')
    expect(meta.domain).toBe('TODO.com')
  })

  test('returns 400 when brandName is missing', async () => {
    const res = await main({ operation: 'delete' })
    expect(res.error.statusCode).toBe(400)
  })
})

describe('manage-tokens: repair', () => {
  test('adds missing brand to index', async () => {
    const res = await main({ operation: 'repair', brandName: 'TODO' })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(_store['brand.__index__'])).toContain('TODO')
  })

  test('is idempotent when brand already indexed', async () => {
    _store['brand.__index__'] = JSON.stringify(['TODO'])
    const res = await main({ operation: 'repair', brandName: 'TODO' })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(_store['brand.__index__']).filter((b) => b === 'TODO').length).toBe(1)
  })
})

describe('manage-tokens: update-meta siteCode', () => {
  test('stores EDS siteCode in brand meta', async () => {
    _store['brand.lake-powell.meta'] = JSON.stringify({ fullName: 'Lake Powell' })
    const res = await main({
      operation: 'update-meta',
      brandName: 'lake-powell',
      siteCode: 'lake-powell'
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.meta.siteCode).toBe('lake-powell')
    expect(res.body.meta.fullName).toBe('Lake Powell')
  })

  test('clears siteCode when blank', async () => {
    _store['brand.lake-powell.meta'] = JSON.stringify({ siteCode: 'lp' })
    const res = await main({
      operation: 'update-meta',
      brandName: 'lake-powell',
      siteCode: ''
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.meta.siteCode).toBeUndefined()
  })

  test('rejects invalid siteCode', async () => {
    const res = await main({
      operation: 'update-meta',
      brandName: 'lake-powell',
      siteCode: 'Bad Code!'
    })
    expect(res.error.statusCode).toBe(400)
  })

  test('list does not invent siteCode when meta omits it', async () => {
    _store['brand.__index__'] = JSON.stringify(['lake-powell'])
    _store['brand.lake-powell.meta'] = JSON.stringify({ fullName: 'Lake Powell' })
    const res = await main({ operation: 'list' })
    expect(res.statusCode).toBe(200)
    expect(res.body.metas['lake-powell'].siteCode).toBeUndefined()
  })
})

describe('manage-tokens: unknown operation', () => {
  test('returns 400 for unknown operation', async () => {
    const res = await main({ operation: 'explode' })
    expect(res.error.statusCode).toBe(400)
  })

  test('returns 400 when operation is missing', async () => {
    const res = await main({})
    expect(res.error.statusCode).toBe(400)
  })
})
