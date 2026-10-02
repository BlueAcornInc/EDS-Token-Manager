/*
 * Style-guide registry helpers for the Trail Manager preview.
 *
 * Editable tabs pull fields from token-schema.json (publishable brand tokens).
 * Read-only tabs declare static EDS token references in style-guide.json so
 * new block / category tabs can be added without touching publish logic.
 */

import styleGuideConfig from '../../config/style-guide.json'

let _guideCache = null

/**
 * @returns {Promise<{ tabs: Array }>}
 */
export async function loadStyleGuide () {
  if (_guideCache) return _guideCache
  if (!styleGuideConfig || !Array.isArray(styleGuideConfig.tabs)) {
    throw new Error('style-guide.json is missing or invalid')
  }
  _guideCache = styleGuideConfig
  return _guideCache
}

/**
 * Resolve the field map shown in the left-hand editor for a tab.
 * Editable tabs use the live token schema; read-only tabs use catalog tokens.
 *
 * @param {object} tab
 * @param {object} schema - token-schema.json
 * @returns {object} field definitions keyed by token key
 */
export function resolveTabFields (tab, schema) {
  if (!tab) return {}
  if (tab.editable && tab.schemaCategory && schema && schema[tab.schemaCategory]) {
    return schema[tab.schemaCategory]
  }
  return tab.tokens || {}
}

/**
 * @param {object} guide
 * @param {string} tabId
 * @returns {object|undefined}
 */
export function findTab (guide, tabId) {
  if (!guide || !guide.tabs) return undefined
  return guide.tabs.find((t) => t.id === tabId)
}
