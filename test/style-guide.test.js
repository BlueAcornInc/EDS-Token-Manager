/**
 * Unit tests for style-guide registry helpers.
 * Mirrors the modular tab model used by Trail Manager.
 */

const styleGuide = require('../config/style-guide.json')
const tokenSchema = require('../config/token-schema.json')

function resolveTabFields (tab, schema) {
  if (!tab) return {}
  if (tab.editable && tab.schemaCategory && schema && schema[tab.schemaCategory]) {
    return schema[tab.schemaCategory]
  }
  return tab.tokens || {}
}

function findTab (guide, tabId) {
  if (!guide || !guide.tabs) return undefined
  return guide.tabs.find((t) => t.id === tabId)
}

describe('style-guide registry', () => {
  test('defines tabs with preview section ids', () => {
    expect(Array.isArray(styleGuide.tabs)).toBe(true)
    expect(styleGuide.tabs.length).toBeGreaterThan(3)
    styleGuide.tabs.forEach((tab) => {
      expect(tab.id).toBeTruthy()
      expect(tab.label).toBeTruthy()
      expect(typeof tab.editable).toBe('boolean')
      expect(tab.preview).toBeTruthy()
    })
  })

  test('editable tabs map to token-schema categories', () => {
    const editable = styleGuide.tabs.filter((t) => t.editable)
    expect(editable.map((t) => t.id).sort()).toEqual(['colors', 'greys', 'logo'])
    editable.forEach((tab) => {
      expect(tokenSchema[tab.schemaCategory]).toBeDefined()
      const fields = resolveTabFields(tab, tokenSchema)
      expect(Object.keys(fields).length).toBeGreaterThan(0)
      Object.values(fields).forEach((def) => {
        expect(def.cssVar).toMatch(/^--/)
      })
    })
  })

  test('typography is read-only with static token catalog', () => {
    const typography = findTab(styleGuide, 'typography')
    expect(typography).toBeDefined()
    expect(typography.editable).toBe(false)
    expect(typography.preview).toBe('typography')
    const fields = resolveTabFields(typography, tokenSchema)
    expect(fields.bodyFontFamily.cssVar).toBe('--body-font-family')
    expect(fields.headingFontFamily.default).toContain('petrona')
  })

  test('expanded read-only tabs cover spacing, radius, alerts, and blocks', () => {
    const expected = [
      'spacing', 'radius', 'alerts', 'surfaces', 'accordion', 'quote'
    ]
    expected.forEach((id) => {
      const tab = findTab(styleGuide, id)
      expect(tab).toBeDefined()
      expect(tab.editable).toBe(false)
      expect(tab.preview).toBe(id)
      const fields = resolveTabFields(tab, tokenSchema)
      expect(Object.keys(fields).length).toBeGreaterThan(0)
      Object.values(fields).forEach((def) => {
        expect(def.cssVar).toMatch(/^--/)
        expect(def.label).toBeTruthy()
      })
    })
  })

  test('all read-only tabs stay non-publishable', () => {
    const readonly = styleGuide.tabs.filter((t) => !t.editable)
    expect(readonly.length).toBeGreaterThanOrEqual(8)
    readonly.forEach((tab) => {
      expect(tab.schemaCategory).toBeUndefined()
    })
  })

  test('overview shows full guide and has no editable fields', () => {
    const overview = findTab(styleGuide, 'overview')
    expect(overview.editable).toBe(false)
    expect(overview.preview).toBe('overview')
    expect(Object.keys(resolveTabFields(overview, tokenSchema))).toHaveLength(0)
  })

  test('publishable schema categories are unchanged by style-guide', () => {
    expect(Object.keys(tokenSchema).sort()).toEqual(['colors', 'greys', 'logo'])
  })
})
