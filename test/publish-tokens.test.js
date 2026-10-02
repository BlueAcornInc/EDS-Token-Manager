/*
 * Unit tests for actions/publish-tokens/index.js
 *
 * Mocks GitHub App auth + GitHub REST calls for the current App-based flow.
 */

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

jest.mock('../actions/utils', () => {
  const actual = jest.requireActual('../actions/utils')
  return {
    ...actual,
    getInstallationToken: jest.fn().mockResolvedValue('ghs_test_token')
  }
})

const mockFetch = jest.fn()
jest.mock('node-fetch', () => mockFetch)

function mockResponse (body, ok = true, status = 200) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body))
  }
}

const { main } = require('../actions/publish-tokens/index')
const tokenSchema = require('../config/token-schema.json')

const SAMPLE_TOKENS = {
  colors: {
    primary: '#e87722',
    secondary: '#003865',
    background: '#ffffff'
  }
}

const BASE_PARAMS = {
  brandName: 'aramark',
  GITHUB_OWNER: 'aramark-org',
  GITHUB_REPO: 'aramark-eds',
  GITHUB_APP_ID: '1',
  GITHUB_APP_PRIVATE_KEY: 'unused-mocked',
  GITHUB_APP_INSTALLATION_ID: '1',
  base_branch: 'staging'
}

const MOCK_SHA_RESPONSE = {
  object: { sha: 'abc123def456abc123def456abc123def456abc1' }
}

const MOCK_BRANCH_RESPONSE = {
  ref: 'refs/heads/TB-ARAMARK-1',
  object: { sha: 'abc123def456abc123def456abc123def456abc1' }
}

const MOCK_FILE_PUT_RESPONSE = {
  content: {
    html_url: 'https://github.com/aramark-org/aramark-eds/blob/TB-ARAMARK-1/brands/aramark/tokens.css'
  }
}

const MOCK_PR_RESPONSE = {
  number: 42,
  title: 'Brand tokens: aramark → staging',
  html_url: 'https://github.com/aramark-org/aramark-eds/pull/42',
  state: 'open',
  head: { ref: 'TB-ARAMARK-1' },
  base: { ref: 'staging' }
}

const SCHEMA_VAR_COUNT = Object.values(tokenSchema).reduce(
  (n, cat) => n + Object.keys(cat).length,
  0
)

function setupHappyPathFetch () {
  mockFetch
    .mockResolvedValueOnce(mockResponse(MOCK_SHA_RESPONSE, true, 200))
    .mockResolvedValueOnce(mockResponse(MOCK_BRANCH_RESPONSE, true, 201))
    .mockResolvedValueOnce(mockResponse(null, false, 404))
    .mockResolvedValueOnce(mockResponse(MOCK_FILE_PUT_RESPONSE, true, 201))
    .mockResolvedValueOnce(mockResponse(MOCK_PR_RESPONSE, true, 201))
}

beforeEach(() => {
  Object.keys(_store).forEach((k) => delete _store[k])
  mockFetch.mockReset()
})

describe('publish-tokens: happy path', () => {
  beforeEach(() => {
    _store['brand.aramark'] = JSON.stringify(SAMPLE_TOKENS)
  })

  test('returns 200 with PR details and CSS file info', async () => {
    setupHappyPathFetch()
    const res = await main(BASE_PARAMS)

    expect(res.statusCode).toBe(200)
    expect(res.body.brand).toBe('aramark')
    expect(res.body.css_file).toBeDefined()
    expect(res.body.css_file.path).toBe('brands/aramark/tokens.css')
    expect(res.body.css_file.variables).toBe(SCHEMA_VAR_COUNT)
    expect(res.body.pull_request).toBeDefined()
    expect(res.body.pull_request.number).toBe(42)
    expect(res.body.pull_request.url).toContain('github.com')
    expect(_store['brand.aramark.status']).toBe('pending')
    expect(JSON.parse(_store['brand.aramark.audit']).lastPr.number).toBe(42)
  })

  test('uses the brand site code in the preview URL and PR description', async () => {
    _store['brand.onp'] = JSON.stringify(SAMPLE_TOKENS)
    _store['brand.onp.meta'] = JSON.stringify({ siteCode: 'onp' })
    const params = { ...BASE_PARAMS, brandName: 'onp' }
    const previewUrl = 'https://tb-onp-1--onp--aramark-org.aem.page/'
    let prBody
    let branchRef

    mockFetch
      .mockResolvedValueOnce(mockResponse(MOCK_SHA_RESPONSE))
      .mockImplementationOnce(async (_url, options) => {
        branchRef = JSON.parse(options.body).ref
        return mockResponse({
          ...MOCK_BRANCH_RESPONSE,
          ref: 'refs/heads/TB-ONP-1'
        }, true, 201)
      })
      .mockResolvedValueOnce(mockResponse(null, false, 404))
      .mockResolvedValueOnce(mockResponse(MOCK_FILE_PUT_RESPONSE, true, 201))
      .mockImplementationOnce(async (_url, options) => {
        prBody = JSON.parse(options.body).body
        return mockResponse({
          ...MOCK_PR_RESPONSE,
          head: { ref: 'TB-ONP-1' }
        }, true, 201)
      })

    const res = await main(params)

    expect(branchRef).toBe('refs/heads/TB-ONP-1')
    expect(res.body.preview_url).toBe(previewUrl)
    expect(prBody).toContain(previewUrl)
  })

  test('calls GitHub API 5 times (SHA + branch + check file + put file + PR)', async () => {
    setupHappyPathFetch()
    await main(BASE_PARAMS)
    expect(mockFetch).toHaveBeenCalledTimes(5)
  })

  test('includes the correct file path in the commit', async () => {
    mockFetch.mockReset()
    let capturedPutUrl = null
    mockFetch
      .mockResolvedValueOnce(mockResponse(MOCK_SHA_RESPONSE))
      .mockResolvedValueOnce(mockResponse(MOCK_BRANCH_RESPONSE))
      .mockResolvedValueOnce(mockResponse(null, false, 404))
      .mockImplementationOnce(async (url) => {
        capturedPutUrl = url
        return mockResponse(MOCK_FILE_PUT_RESPONSE)
      })
      .mockResolvedValueOnce(mockResponse(MOCK_PR_RESPONSE))

    await main(BASE_PARAMS)
    expect(capturedPutUrl).toContain('brands/aramark/tokens.css')
  })

  test('updates an existing open create-site PR instead of opening a new one', async () => {
    _store['brand.aramark.pr'] = JSON.stringify({
      number: 7,
      branch: 'TB-ARAMARK-0',
      url: 'https://github.com/aramark-org/aramark-eds/pull/7'
    })
    _store['brand.aramark.meta'] = JSON.stringify({ siteCode: 'onp' })

    mockFetch
      .mockResolvedValueOnce(mockResponse({ number: 7, state: 'open' }))
      .mockResolvedValueOnce(mockResponse(null, false, 404))
      .mockResolvedValueOnce(mockResponse(MOCK_FILE_PUT_RESPONSE))

    const res = await main(BASE_PARAMS)
    expect(res.statusCode).toBe(200)
    expect(res.body.preview_url).toBe('https://tb-aramark-0--onp--aramark-org.aem.page/')
    expect(res.body.pull_request.number).toBe(7)
    expect(res.body.pull_request.updated).toBe(true)
    expect(_store['brand.aramark.status']).toBe('pending')
  })
})

describe('publish-tokens: parameter validation', () => {
  test('returns 400 when brandName is missing', async () => {
    const params = { ...BASE_PARAMS }
    delete params.brandName
    const res = await main(params)
    expect(res.error.statusCode).toBe(400)
  })

  test('returns 500 when GITHUB_OWNER/REPO are missing', async () => {
    const res = await main({ brandName: 'aramark' })
    expect(res.error.statusCode).toBe(500)
  })
})

describe('publish-tokens: brand not found', () => {
  test('returns 404 when brand does not exist in I/O State', async () => {
    const res = await main(BASE_PARAMS)
    expect(res.error.statusCode).toBe(404)
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

describe('publish-tokens: GitHub API error handling', () => {
  beforeEach(() => {
    _store['brand.aramark'] = JSON.stringify(SAMPLE_TOKENS)
  })

  test('returns 500 when getBranchSHA fails', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ message: 'Branch not found' }, false, 404)
    )
    const res = await main(BASE_PARAMS)
    expect(res.error.statusCode).toBe(500)
  })

  test('returns 500 when createBranch fails', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(MOCK_SHA_RESPONSE))
      .mockResolvedValueOnce(mockResponse({ message: 'Reference already exists' }, false, 422))
    const res = await main(BASE_PARAMS)
    expect(res.error.statusCode).toBe(500)
  })

  test('returns 500 when createPullRequest fails', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(MOCK_SHA_RESPONSE))
      .mockResolvedValueOnce(mockResponse(MOCK_BRANCH_RESPONSE))
      .mockResolvedValueOnce(mockResponse(null, false, 404))
      .mockResolvedValueOnce(mockResponse(MOCK_FILE_PUT_RESPONSE))
      .mockResolvedValueOnce(mockResponse({ message: 'Validation Failed' }, false, 422))
    const res = await main(BASE_PARAMS)
    expect(res.error.statusCode).toBe(500)
  })
})

describe('publish-tokens: CSS generation', () => {
  beforeEach(() => {
    _store['brand.aramark'] = JSON.stringify(SAMPLE_TOKENS)
  })

  test('generated CSS contains :root block and schema cssVars', async () => {
    let capturedCss = null
    mockFetch
      .mockResolvedValueOnce(mockResponse(MOCK_SHA_RESPONSE))
      .mockResolvedValueOnce(mockResponse(MOCK_BRANCH_RESPONSE))
      .mockResolvedValueOnce(mockResponse(null, false, 404))
      .mockImplementationOnce(async (_url, opts) => {
        const body = JSON.parse(opts.body)
        capturedCss = Buffer.from(body.content, 'base64').toString('utf8')
        return mockResponse(MOCK_FILE_PUT_RESPONSE)
      })
      .mockResolvedValueOnce(mockResponse(MOCK_PR_RESPONSE))

    await main(BASE_PARAMS)
    expect(capturedCss).toMatch(/^:root \{/)
    expect(capturedCss).toContain(`${tokenSchema.colors.primary.cssVar}: #e87722`)
    expect(capturedCss).toContain(`${tokenSchema.colors.secondary.cssVar}: #003865`)
  })
})
