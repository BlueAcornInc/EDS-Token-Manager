/**
 * Contract test: client and server tokensToCSS must stay in lockstep.
 * (FE cannot import CJS actions/ in the browser; this guards against drift.)
 */

const schema = require('../config/token-schema.json')
const { tokensToCSS: serverTokensToCSS } = require('../actions/utils')

/** Mirror of web-src/src/utils.js#tokensToCSS — keep identical */
function clientTokensToCSS (schemaObj, tokens) {
  const lines = []
  for (const [category, fields] of Object.entries(schemaObj)) {
    for (const [key, def] of Object.entries(fields)) {
      const raw = tokens[category] && tokens[category][key] !== undefined
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

describe('tokensToCSS client/server parity', () => {
  const sample = {
    colors: {
      primary: '#eb002a',
      secondary: '#022035'
    },
    greys: {
      grey50: '#f7f7f7'
    }
  }

  test('produces identical CSS for the same schema + tokens', () => {
    expect(clientTokensToCSS(schema, sample)).toBe(serverTokensToCSS(schema, sample))
  })

  test('emits commented placeholders for missing values', () => {
    const css = serverTokensToCSS(schema, { colors: { primary: '#eb002a' } })
    expect(css).toContain(`${schema.colors.primary.cssVar}: #eb002a`)
    expect(css).toMatch(/\/\* --/)
  })
})
