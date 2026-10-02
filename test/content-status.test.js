jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn().mockReturnValue({
      info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn(),
    }),
  },
}))

jest.mock('node-fetch', () => jest.fn())
const fetch = require('node-fetch')

const _store = {}
jest.mock('@adobe/aio-lib-state', () => ({
  init: jest.fn().mockResolvedValue({
    get: jest.fn().mockImplementation(async (key) => {
      if (_store[key] === undefined) return undefined
      return { value: _store[key] }
    }),
    put: jest.fn().mockImplementation(async (key, value) => { _store[key] = value }),
    delete: jest.fn().mockImplementation(async (key) => { delete _store[key] }),
  }),
}))

jest.mock('../actions/utils', () => {
  const actual = jest.requireActual('../actions/utils')
  return {
    ...actual,
    getInstallationToken: jest.fn().mockResolvedValue('mock-git-token'),
  }
})

const { main } = require('../actions/content-status/index')

const BASE_PARAMS = {
  __ow_headers: { authorization: 'Bearer imstoken' },
  LOG_LEVEL: 'error',
  GITHUB_APP_ID: 'x',
  GITHUB_APP_PRIVATE_KEY: 'x',
  GITHUB_APP_INSTALLATION_ID: 'x',
  GITHUB_OWNER: 'aramark-destinations',
  GITHUB_REPO: 'aramark-mb',
}

function adminOk (preview = {}, live = {}, edit = {}) {
  return { ok: true, status: 200, json: async () => ({ preview, live, edit }) }
}

beforeEach(() => {
  Object.keys(_store).forEach((k) => delete _store[k])
  fetch.mockReset()
})

describe('content-status: validation', () => {
  test('returns 400 when site is missing', async () => {
    const res = await main({ ...BASE_PARAMS, path: '/' })
    expect(res.error.statusCode).toBe(400)
  })

  test('returns 400 when path is missing', async () => {
    const res = await main({ ...BASE_PARAMS, site: 'gcln' })
    expect(res.error.statusCode).toBe(400)
  })

  test('returns 400 for unknown site', async () => {
    const res = await main({ ...BASE_PARAMS, site: 'unknown-site', path: '/' })
    expect(res.error.statusCode).toBe(400)
    expect(res.error.body.error).toMatch(/Unknown site/)
  })
})

describe('content-status: caching', () => {
  test('returns cached result without calling fetch', async () => {
    const cached = { path: '/', preview: { status: 200 }, live: { status: 200 }, edit: {}, aem: { state: 'unavailable' }, mismatches: [], children: [] }
    _store['content-status.gcln.staging.root'] = JSON.stringify(cached)
    const res = await main({ ...BASE_PARAMS, site: 'gcln', path: '/' })
    expect(res.statusCode).toBe(200)
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('content-status: AEM unavailable', () => {
  test('returns aem.state unavailable when AEM_BEARER_TOKEN not set', async () => {
    fetch.mockResolvedValueOnce(adminOk({ status: 200 }, { status: 200 }, {}))
    const res = await main({ ...BASE_PARAMS, site: 'gcln', path: '/' })
    expect(res.statusCode).toBe(200)
    expect(res.body.aem.state).toBe('unavailable')
    expect(res.body.children).toEqual([])
  })

  test('calls Admin API exactly once when AEM token absent', async () => {
    fetch.mockResolvedValueOnce(adminOk({ status: 200 }, { status: 200 }, {}))
    await main({ ...BASE_PARAMS, site: 'gcln', path: '/' })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toContain('admin.hlx.page')
  })
})

describe('content-status: mismatch detection', () => {
  const WITH_AEM = { ...BASE_PARAMS, AEM_BEARER_TOKEN: 'aem-tok' }

  function aemOk (jcrContent = {}) {
    return { ok: true, status: 200, json: async () => ({ 'jcr:content': jcrContent }) }
  }
  const aemChildrenEmpty = { ok: true, status: 200, json: async () => ({}) }

  test('OUT_OF_SYNC when AEM says Activate and preview is 404', async () => {
    fetch
      .mockResolvedValueOnce(adminOk({ status: 404 }, { status: 404 }, {}))
      .mockResolvedValueOnce(aemOk({ 'cq:lastReplicationAction': 'Activate' }))
      .mockResolvedValueOnce(aemChildrenEmpty)
    const res = await main({ ...WITH_AEM, site: 'gcln', path: '/en' })
    expect(res.body.mismatches).toContain('OUT_OF_SYNC')
  })

  test('STALE_PREVIEW when edit is newer than preview', async () => {
    fetch
      .mockResolvedValueOnce(adminOk(
        { status: 200, lastModified: '2025-01-01T10:00:00Z' },
        { status: 200 },
        { lastModified: '2025-06-01T12:00:00Z' },
      ))
      .mockResolvedValueOnce(aemOk({}))
      .mockResolvedValueOnce(aemChildrenEmpty)
    const res = await main({ ...WITH_AEM, site: 'gcln', path: '/en' })
    expect(res.body.mismatches).toContain('STALE_PREVIEW')
  })

  test('NOT_PUBLISHED_TO_LIVE when preview 200 but live is not', async () => {
    fetch
      .mockResolvedValueOnce(adminOk({ status: 200 }, { status: 404 }, {}))
      .mockResolvedValueOnce(aemOk({}))
      .mockResolvedValueOnce(aemChildrenEmpty)
    const res = await main({ ...WITH_AEM, site: 'gcln', path: '/en' })
    expect(res.body.mismatches).toContain('NOT_PUBLISHED_TO_LIVE')
  })

  test('no mismatches when everything is in sync', async () => {
    fetch
      .mockResolvedValueOnce(adminOk(
        { status: 200, lastModified: '2025-06-01T12:00:00Z' },
        { status: 200 },
        { lastModified: '2025-01-01T10:00:00Z' },
      ))
      .mockResolvedValueOnce(aemOk({ 'cq:lastReplicationAction': 'Activate' }))
      .mockResolvedValueOnce(aemChildrenEmpty)
    const res = await main({ ...WITH_AEM, site: 'gcln', path: '/en' })
    expect(res.body.mismatches).toEqual([])
  })

  test('AEM 401 returns state unknown gracefully', async () => {
    fetch
      .mockResolvedValueOnce(adminOk({ status: 200 }, { status: 200 }, {}))
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: false, status: 401 })
    const res = await main({ ...WITH_AEM, site: 'gcln', path: '/en' })
    expect(res.statusCode).toBe(200)
    expect(res.body.aem.state).toBe('unknown')
  })
})

describe('content-status: children', () => {
  const WITH_AEM = { ...BASE_PARAMS, AEM_BEARER_TOKEN: 'aem-tok' }

  test('parses cq:Page children from AEM .1.json response', async () => {
    fetch
      .mockResolvedValueOnce(adminOk({ status: 200 }, { status: 200 }, {}))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ 'jcr:content': {} }) })
      .mockResolvedValueOnce({
        ok: true, status: 200, json: async () => ({
          'en':     { 'jcr:primaryType': 'cq:Page' },
          'assets': { 'jcr:primaryType': 'dam:Asset' },
          'dining': { 'jcr:primaryType': 'cq:Page' },
        }),
      })
    const res = await main({ ...WITH_AEM, site: 'gcln', path: '/' })
    expect(res.body.children.map((c) => c.name)).toEqual(['en', 'dining'])
  })

  test('Admin API and AEM called in parallel (all 3 fetches fired)', async () => {
    fetch
      .mockResolvedValueOnce(adminOk({ status: 200 }, { status: 200 }, {}))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ 'jcr:content': {} }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) })
    await main({ ...WITH_AEM, site: 'gcln', path: '/en' })
    expect(fetch).toHaveBeenCalledTimes(3)
  })
})
