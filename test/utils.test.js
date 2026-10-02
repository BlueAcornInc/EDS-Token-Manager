/* 
* <license header>
*/

const utils = require('./../actions/utils.js')

test('interface', () => {
  expect(typeof utils.errorResponse).toBe('function')
  expect(typeof utils.stringParameters).toBe('function')
  expect(typeof utils.checkMissingRequestInputs).toBe('function')
  expect(typeof utils.getBearerToken).toBe('function')
})

describe('errorResponse', () => {
  test('(400, errorMessage)', () => {
    const res = utils.errorResponse(400, 'errorMessage')
    expect(res).toEqual({
      error: {
        statusCode: 400,
        body: { error: 'errorMessage' }
      }
    })
  })

  test('(400, errorMessage, logger)', () => {
    const logger = {
      info: jest.fn()
    }
    const res = utils.errorResponse(400, 'errorMessage', logger)
    expect(logger.info).toHaveBeenCalledWith('400: errorMessage')
    expect(res).toEqual({
      error: {
        statusCode: 400,
        body: { error: 'errorMessage' }
      }
    })
  })
})

describe('stringParameters', () => {
  test('no auth header', () => {
    const params = {
      a: 1, b: 2, __ow_headers: { 'x-api-key': 'fake-api-key' }
    }
    expect(utils.stringParameters(params)).toEqual(JSON.stringify(params))
  })
  test('with auth header', () => {
    const params = {
      a: 1, b: 2, __ow_headers: { 'x-api-key': 'fake-api-key', authorization: 'secret' }
    }
    expect(utils.stringParameters(params)).toEqual(expect.stringContaining('"authorization":"<hidden>"'))
    expect(utils.stringParameters(params)).not.toEqual(expect.stringContaining('secret'))
  })
  test('redacts GitHub App private key and related secrets', () => {
    const params = {
      brandName: 'TODO',
      GITHUB_APP_PRIVATE_KEY: '-----BEGIN RSA PRIVATE KEY-----\nfake\n-----END RSA PRIVATE KEY-----',
      GITHUB_TOKEN: 'ghp_secret',
      AEM_BEARER_TOKEN: 'aem-secret',
      apiKey: 'service-secret'
    }
    const logged = utils.stringParameters(params)
    expect(logged).toContain('"GITHUB_APP_PRIVATE_KEY":"<hidden>"')
    expect(logged).toContain('"GITHUB_TOKEN":"<hidden>"')
    expect(logged).toContain('"AEM_BEARER_TOKEN":"<hidden>"')
    expect(logged).toContain('"apiKey":"<hidden>"')
    expect(logged).toContain('"brandName":"TODO"')
    expect(logged).not.toContain('BEGIN RSA')
    expect(logged).not.toContain('ghp_secret')
    expect(logged).not.toContain('aem-secret')
    expect(logged).not.toContain('service-secret')
  })
})

describe('resolveActor', () => {
  test('reads __authz_actor override', () => {
    const actor = utils.resolveActor({
      __authz_actor: { id: 'u1', email: 'a@b.com', displayName: 'Ada' }
    })
    expect(actor).toEqual({ id: 'u1', email: 'a@b.com', displayName: 'Ada' })
  })

  test('decodes IMS-like JWT payload without verifying signature', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')
    const payload = Buffer.from(JSON.stringify({
      email: 'jane@TODO.com',
      user_id: 'jane',
      name: 'Jane'
    })).toString('base64url')
    const token = `${header}.${payload}.sig`
    const actor = utils.resolveActor({
      __ow_headers: { authorization: `Bearer ${token}` }
    })
    expect(actor.email).toBe('jane@TODO.com')
    expect(actor.id).toBe('jane')
    expect(actor.displayName).toBe('Jane')
  })

  test('returns nulls when no token', () => {
    expect(utils.resolveActor({})).toEqual({ id: null, email: null, displayName: null })
  })
})

describe('validateTokens', () => {
  const schema = {
    colors: {
      primary: { type: 'color', cssVar: '--c', default: '#000000', label: 'P' }
    }
  }

  test('accepts known color values', () => {
    expect(utils.validateTokens(schema, { colors: { primary: '#eb002a' } })).toEqual({ ok: true })
  })

  test('rejects unknown category', () => {
    const r = utils.validateTokens(schema, { typography: { x: '1' } })
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/unknown token category/)
  })

  test('rejects unknown key', () => {
    const r = utils.validateTokens(schema, { colors: { neon: '#fff' } })
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/unknown token/)
  })

  test('rejects invalid color', () => {
    const r = utils.validateTokens(schema, { colors: { primary: 'not-a-color' } })
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/valid color/)
  })
})

describe('checkMissingRequestInputs', () => {
  test('({ a: 1, b: 2 }, [a])', () => {
    expect(utils.checkMissingRequestInputs({ a: 1, b: 2 }, ['a'])).toEqual(null)
  })
  test('({ a: 1 }, [a, b])', () => {
    expect(utils.checkMissingRequestInputs({ a: 1 }, ['a', 'b'])).toEqual('missing parameter(s) \'b\'')
  })
  test('({ a: { b: { c: 1 } }, f: { g: 2 } }, [a.b.c, f.g.h.i])', () => {
    expect(utils.checkMissingRequestInputs({ a: { b: { c: 1 } }, f: { g: 2 } }, ['a.b.c', 'f.g.h.i'])).toEqual('missing parameter(s) \'f.g.h.i\'')
  })
  test('({ a: { b: { c: 1 } }, f: { g: 2 } }, [a.b.c, f.g.h])', () => {
    expect(utils.checkMissingRequestInputs({ a: { b: { c: 1 } }, f: { g: 2 } }, ['a.b.c', 'f'])).toEqual(null)
  })
  test('({ a: 1, __ow_headers: { h: 1, i: 2 } }, undefined, [h])', () => {
    expect(utils.checkMissingRequestInputs({ a: 1, __ow_headers: { h: 1, i: 2 } }, undefined, ['h'])).toEqual(null)
  })
  test('({ a: 1, __ow_headers: { f: 2 } }, [a], [h, i])', () => {
    expect(utils.checkMissingRequestInputs({ a: 1, __ow_headers: { f: 2 } }, ['a'], ['h', 'i'])).toEqual('missing header(s) \'h,i\'')
  })
  test('({ c: 1, __ow_headers: { f: 2 } }, [a, b], [h, i])', () => {
    expect(utils.checkMissingRequestInputs({ c: 1 }, ['a', 'b'], ['h', 'i'])).toEqual('missing header(s) \'h,i\' and missing parameter(s) \'a,b\'')
  })
  test('({ a: 0 }, [a])', () => {
    expect(utils.checkMissingRequestInputs({ a: 0 }, ['a'])).toEqual(null)
  })
  test('({ a: null }, [a])', () => {
    expect(utils.checkMissingRequestInputs({ a: null }, ['a'])).toEqual(null)
  })
  test('({ a: \'\' }, [a])', () => {
    expect(utils.checkMissingRequestInputs({ a: '' }, ['a'])).toEqual('missing parameter(s) \'a\'')
  })
  test('({ a: undefined }, [a])', () => {
    expect(utils.checkMissingRequestInputs({ a: undefined }, ['a'])).toEqual('missing parameter(s) \'a\'')
  })
})

describe('getBearerToken', () => {
  test('({})', () => {
    expect(utils.getBearerToken({})).toEqual(undefined)
  })
  test('({ authorization: Bearer fake, __ow_headers: {} })', () => {
    expect(utils.getBearerToken({ authorization: 'Bearer fake', __ow_headers: {} })).toEqual(undefined)
  })
  test('({ authorization: Bearer fake, __ow_headers: { authorization: fake } })', () => {
    expect(utils.getBearerToken({ authorization: 'Bearer fake', __ow_headers: { authorization: 'fake' } })).toEqual(undefined)
  })
  test('({ __ow_headers: { authorization: Bearerfake} })', () => {
    expect(utils.getBearerToken({ __ow_headers: { authorization: 'Bearerfake' } })).toEqual(undefined)
  })
  test('({ __ow_headers: { authorization: Bearer fake} })', () => {
    expect(utils.getBearerToken({ __ow_headers: { authorization: 'Bearer fake' } })).toEqual('fake')
  })
  test('({ __ow_headers: { authorization: Bearer fake Bearer fake} })', () => {
    expect(utils.getBearerToken({ __ow_headers: { authorization: 'Bearer fake Bearer fake' } })).toEqual('fake Bearer fake')
  })
})

describe('buildSiteCode / resolveEdsSiteCode / edsCdnOrigin', () => {
  test('buildSiteCode uses first letters of kebab words', () => {
    expect(utils.buildSiteCode('lake-tahoe-adventures')).toBe('lta')
    expect(utils.buildSiteCode('lake-powell')).toBe('lp')
    expect(utils.buildSiteCode('amlt')).toBe('a')
  })

  test('resolveEdsSiteCode prefers Trailhead meta.siteCode', () => {
    expect(utils.resolveEdsSiteCode('lake-powell', { siteCode: 'lp' })).toBe('lp')
    expect(utils.resolveEdsSiteCode('lake-powell', { siteCode: 'Lake-Powell' }))
      .toBe('lake-powell')
  })

  test('resolveEdsSiteCode falls back to folder slug when meta unset', () => {
    expect(utils.resolveEdsSiteCode('lake-powell', {})).toBe('lake-powell')
    expect(utils.resolveEdsSiteCode('lake-powell', null)).toBe('lake-powell')
    expect(utils.resolveEdsSiteCode('lake-tahoe-adventures')).toBe('lake-tahoe-adventures')
  })

  test('edsCdnOrigin builds ref--siteCode--org without repo name', () => {
    expect(utils.edsCdnOrigin({
      ref: 'staging',
      siteCode: 'lta',
      org: 'TODO'
    })).toBe('TODO')
    expect(utils.edsCdnOrigin({
      ref: 'staging',
      siteCode: 'lta',
      org: 'TODO'
    })).not.toContain('TODO')
  })
})
