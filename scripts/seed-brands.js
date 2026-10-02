/**
 * seed-brands.js
 *
 * Runs during CI deploy to populate Adobe I/O State with brand data.
 * Reads brand list and tokens.css from the AEM CDN — no GitHub auth needed.
 *
 * Requires env vars:
 *   AIO_RUNTIME_NAMESPACE  — Runtime namespace for state init
 *   AIO_RUNTIME_AUTH       — Runtime auth for state init
 */

const fetch = require('node-fetch')
const stateLib = require('@adobe/aio-lib-state')
const tokenSchema = require('../config/token-schema.json')

const CDN_BASE = 'TODO'
const STATE_TTL = TODO

function parseCssTokens (css) {
  const reverseMap = {}
  for (const [category, fields] of Object.entries(tokenSchema)) {
    for (const [key, def] of Object.entries(fields)) {
      reverseMap[def.cssVar] = { category, key }
    }
  }
  const tokens = {}
  for (const [, varName, value] of css.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+)/g)) {
    const mapping = reverseMap[`--${varName}`]
    if (mapping) {
      const { category, key } = mapping
      if (!tokens[category]) tokens[category] = {}
      tokens[category][key] = value.trim()
    }
  }
  return tokens
}

async function main () {
  // Fetch brand list from publicly accessible CDN
  const indexRes = await fetch(`${CDN_BASE}/brands/index.json`)
  if (!indexRes.ok) throw new Error(`Failed to fetch brand index: ${indexRes.status}`)
  const brands = await indexRes.json()
  console.log(`Found ${brands.length} brand(s): ${brands.join(', ')}`)

  const state = await stateLib.init({
    ow: {
      namespace: process.env.AIO_RUNTIME_NAMESPACE,
      auth: process.env.AIO_RUNTIME_AUTH
    }
  })

  // Merge with existing state index to preserve brands created through the tool
  const indexEntry = await state.get('brand.__index__')
  const existingIndex = (indexEntry && indexEntry.value) ? JSON.parse(indexEntry.value) : []
  const fullIndex = [...new Set([...brands, ...existingIndex])]
  await state.put('brand.__index__', JSON.stringify(fullIndex), { ttl: STATE_TTL })
  console.log(`Brand index: [${fullIndex.join(', ')}]`)

  // Seed tokens from CDN for each brand (skip if unsaved draft exists)
  for (const name of brands) {
    const existingRaw = await state.get(`brand.${name}`)
    if (existingRaw && existingRaw.value !== undefined) {
      const statusEntry = await state.get(`brand.${name}.status`)
      if (statusEntry && statusEntry.value === 'drafted') {
        console.log(`  ${name}: skipped (has unsaved draft)`)
        continue
      }
    }

    const cssRes = await fetch(`${CDN_BASE}/brands/${name}/tokens.css`)
    if (!cssRes.ok) {
      console.log(`  ${name}: no tokens.css at CDN (${cssRes.status}), skipping`)
      continue
    }
    const css = await cssRes.text()
    const tokens = parseCssTokens(css)

    await state.put(`brand.${name}`, JSON.stringify(tokens), { ttl: STATE_TTL })
    await state.put(`brand.${name}.status`, 'synced', { ttl: STATE_TTL })
    console.log(`  ${name}: seeded ${Object.keys(tokens).length} token categories`)
  }

  console.log('Brand seed complete.')
}

main().catch(e => { console.error('seed-brands failed:', e.message); process.exit(1) })
