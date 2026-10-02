import actionWebInvoke from '../utils.js'
import {
  tokensToCSS,
  loadSchema,
  buildDefaultTokens,
  buildEmptyTokens,
  resolveEdsSiteCode,
  edsCdnOrigin
} from '../utils.js'
import { initHeader } from '../header.js'
import {
  getAuthHeaders,
  getActionUrl,
  showToast,
  setLoading
} from '../app.js'
import { ph } from '../icons.js'
import { escapeHtml } from '../dom.js'
import { GREY_STEPS, generateBrandGreys, relativeLuminance } from '../greys.js'
import {
  loadStyleGuide,
  resolveTabFields,
  findTab
} from '../style-guide.js'

// ---------------------------------------------------------------------------
// View-local state
// ---------------------------------------------------------------------------
const tm = {
  schema: null,
  styleGuide: null,
  brands: [],
  metas: {},
  edsOrg: '',
  currentBrand: null,
  tokens: {},
  cdnBaseTokensCss: '',
  isDirty: false,
  imsProfile: null,
  previewMode: 'static',
  activeTabId: null
}

function currentEdsCdnBase () {
  if (!tm.currentBrand || !tm.edsOrg) return ''
  const meta = tm.metas[tm.currentBrand] || {}
  const siteCode = resolveEdsSiteCode(tm.currentBrand, meta)
  return edsCdnOrigin({ ref: 'staging', siteCode, org: tm.edsOrg })
}

function updatePreviewEdsCdn () {
  const iframe = document.getElementById('preview-iframe')
  const base = currentEdsCdnBase()
  if (!iframe || !iframe.contentWindow || !base) return
  try {
    iframe.contentWindow.postMessage({ type: 'SET_EDS_CDN', base }, '*')
  } catch (e) { /* iframe not ready */ }
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------
export function mount (container, initialBrand = null) {
  if (!initialBrand) {
    try { initialBrand = localStorage.getItem('tm.lastBrand') || null } catch (_) { /* localStorage unavailable */ }
  }
  container.innerHTML = `
    <!-- Sign-in shown when token missing -->
    <div id="sign-in-screen" class="sign-in-screen" style="display:none" aria-live="polite">
      <div class="sign-in-card">
        <div class="sign-in-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E0A165" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 18l5-9 4 6 3-5 6 8"/></svg>
          <span>Trailhead</span>
        </div>
        <h1 class="sign-in-title">Brand Token Manager</h1>
        <p class="sign-in-desc">Sign in with your Adobe account to manage brand design tokens for Aramark Parks &amp; Destinations.</p>
        <a href="https://experience.adobe.com" class="sign-in-btn">
          ${ph('arrow-square-out', 18)}
          Open in Experience Cloud
        </a>
      </div>
    </div>

    <!-- Three-column layout -->
    <div class="app-layout">

      <!-- Column 1: Brand Selector -->
      <aside class="panel panel-brands">
        <div class="panel-header">
          <span class="panel-title">Brands</span>
        </div>
        <ul id="brand-list" class="brand-list" role="listbox" aria-label="Brand list"></ul>
      </aside>

      <!-- Column 2: Token Editor -->
      <section class="panel panel-editor">
        <div class="panel-header">
          <h2 id="brand-header" class="panel-title">Select or create a brand</h2>
        </div>
        <div id="editor-placeholder" class="editor-placeholder">
          <span class="placeholder-icon" aria-hidden="true">${ph('swatches', 48)}</span>
          <p>Select a brand from the left<br>or create a new one to begin.</p>
        </div>
        <div id="token-editor-content" class="token-editor-content" style="display:none">
          <div id="tab-bar" class="tab-bar" role="tablist"></div>
          <div id="tab-content" class="tab-content"></div>
        </div>
        <div id="action-bar" class="action-bar" style="display:none">
          <button id="btn-save" class="btn btn-primary" title="Save tokens">Save</button>
          <button id="btn-reset" class="btn btn-outlined" title="Discard draft and reset to live values">Reset to current</button>
          <button id="btn-export-css" class="btn btn-outlined" title="Download CSS file">Export CSS</button>
          <button id="btn-publish" class="btn btn-secondary" title="Request release to staging">Request release to staging</button>
        </div>
      </section>

      <!-- Column 3: Preview -->
      <aside class="panel panel-preview">
        <div class="panel-header">
          <span class="panel-title" id="preview-panel-title">Style guide</span>
          <div style="display:flex;gap:6px;align-items:center">
            <button id="btn-preview-dark" class="icon-btn" title="Toggle dark background" aria-label="Toggle dark mode" aria-pressed="false">
              ${ph('moon', 14)}
            </button>
            <button id="btn-show-css" class="icon-btn" title="Show CSS output" aria-label="Show CSS output" aria-pressed="false">
              ${ph('code', 14)}
            </button>
          </div>
        </div>
        <div id="preview-pane" class="preview-pane">
          <iframe id="preview-iframe" class="preview-iframe" src="preview.html" title="Component preview" sandbox="allow-scripts allow-same-origin"></iframe>
        </div>
        <pre id="css-preview-code" class="css-preview" style="display:none">/* No brand selected */</pre>
      </aside>

    </div>

    <!-- New Brand Modal -->
    <div id="modal-overlay" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal">
        <h3 id="modal-title" class="modal-title">Create new brand</h3>
        <form id="new-brand-form" novalidate>
          <div class="form-group">
            <label for="new-brand-name">Brand name</label>
            <input type="text" id="new-brand-name" placeholder="e.g. lake-powell, arches-resort" autocomplete="off" required>
            <small>Lowercase letters, numbers, hyphens. Becomes the folder name in <code>brands/</code>.</small>
          </div>
          <div class="form-group">
            <label>Starting point</label>
            <div class="start-mode-btns">
              <button type="button" id="start-blueprint" class="start-mode-btn active" data-mode="blueprint">
                <span class="start-mode-title">Start from blueprint</span>
                <span class="start-mode-desc">Pre-fill with the global root tokens as a starting point</span>
              </button>
              <button type="button" id="start-scratch" class="start-mode-btn" data-mode="scratch">
                <span class="start-mode-title">Start from scratch</span>
                <span class="start-mode-desc">Empty fields — author all token values manually</span>
              </button>
            </div>
            <input type="hidden" id="start-mode" value="blueprint">
          </div>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary">Create brand</button>
            <button type="button" id="modal-cancel" class="btn btn-outlined">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Release Request Panel -->
    <div id="publish-panel" class="publish-panel" role="dialog" aria-modal="true" aria-labelledby="publish-panel-title">
      <div class="publish-panel-inner">
        <div class="publish-panel-header">
          <div>
            <span class="publish-eyebrow">Trail Manager</span>
            <h3 id="publish-panel-title" class="modal-title" style="margin-bottom:0">Request release — <span id="publish-brand-name"></span></h3>
          </div>
          <button id="btn-publish-cancel" class="icon-btn-light" aria-label="Close">&#x2715;</button>
        </div>
        <div id="publish-preflight"></div>
        <div id="publish-result" class="publish-result"></div>
        <div class="modal-actions" id="publish-actions">
          <button id="btn-publish-confirm" class="btn btn-secondary">Submit release request</button>
        </div>
      </div>
    </div>

  `

  initHeader({ subtitle: 'Trail Manager' })

  setupModalHandlers()
  setupGitHubSettingsHandlers()
  setupActionBarHandlers()
  setupPreviewHandlers()

  Promise.all([
    tm.schema ? Promise.resolve(tm.schema) : loadSchema(),
    tm.styleGuide ? Promise.resolve(tm.styleGuide) : loadStyleGuide()
  ]).then(([schema, styleGuide]) => {
    tm.schema = schema
    tm.styleGuide = styleGuide
    loadBrands(initialBrand)
  }).catch((err) => {
    showToast(`Initialisation error: ${err.message}`, 'error')
    renderEmptyEditor()
  })
}

// ---------------------------------------------------------------------------
// Auth error helper
// ---------------------------------------------------------------------------
function handleAuthError (err) {
  const msg = err.message || ''
  if (msg.includes('401') || msg.includes('403') || msg.includes('405') || msg.includes('Unauthorized')) {
    showToast('Authentication error — reload the page to re-establish your session', 'error')
    return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Brand list
// ---------------------------------------------------------------------------
async function loadBrands (initialBrand = null) {
  setLoading(true, 'Loading brands…')
  try {
    const res = await actionWebInvoke(getActionUrl('manage-tokens'), getAuthHeaders(), { operation: 'list' })
    tm.brands = (res && res.brands) ? res.brands : []
    tm.metas  = (res && res.metas)  ? res.metas  : {}
    tm.edsOrg = (res && res.edsOrg) ? res.edsOrg : ''

    // Some brand folders predate the slug convention and don't match their
    // real Helix site id (e.g. bryce-canyon-lodge -> bcl). site.json on
    // GitHub is the source of truth for that id — backfill it here so CDN
    // preview links resolve correctly without renaming any folders.
    try {
      const sitesRes = await actionWebInvoke(getActionUrl('list-sites'), getAuthHeaders(), {})
      const sites = (sitesRes && sitesRes.sites) ? sitesRes.sites : []
      sites.forEach((site) => {
        if (!site.siteCode) return
        const meta = tm.metas[site.id]
        if (meta && !meta.siteCode) meta.siteCode = site.siteCode
        else if (!meta) tm.metas[site.id] = { siteCode: site.siteCode }
      })
    } catch (_) {
      // list-sites is best-effort here — folder-slug fallback still applies
    }

    tm.brands.sort((a, b) => {
      const nameA = ((tm.metas[a] && tm.metas[a].fullName) || a).toLowerCase()
      const nameB = ((tm.metas[b] && tm.metas[b].fullName) || b).toLowerCase()
      return nameA.localeCompare(nameB)
    })
    renderBrandList()
    if (tm.brands.length > 0) {
      const target = (initialBrand && tm.brands.includes(initialBrand))
        ? initialBrand
        : tm.brands[0]
      await selectBrand(target)
    } else {
      renderEmptyEditor()
    }
  } catch (err) {
    if (!handleAuthError(err)) showToast(`Failed to load brands: ${err.message}`, 'error')
    renderEmptyEditor()
  } finally {
    setLoading(false)
  }
}

function renderBrandList () {
  const list = document.getElementById('brand-list')
  if (!list) return
  list.innerHTML = ''
  if (tm.brands.length === 0) {
    list.innerHTML = '<li class="brand-empty">No brands yet.<br>Click + to create one.</li>'
    return
  }
  tm.brands.forEach(name => {
    const li = document.createElement('li')
    li.className = 'brand-item' + (name === tm.currentBrand ? ' active' : '')
    li.dataset.brand = name
    const fullName = tm.metas && tm.metas[name] && tm.metas[name].fullName
    li.innerHTML = `
      <span class="brand-name">
        ${escapeHtml(fullName || name)}
      </span>
    `
    li.querySelector('.brand-name').addEventListener('click', () => selectBrand(name))
    list.appendChild(li)
  })
}

async function selectBrand (name) {
  if (tm.isDirty) {
    const discard = confirm(`You have unsaved changes for "${tm.currentBrand}". Discard them?`)
    if (!discard) return
  }
  setLoading(true, `Loading tokens for "${name}"…`)
  try {
    const res = await actionWebInvoke(getActionUrl('manage-tokens'), getAuthHeaders(), { operation: 'get', brandName: name })
    tm.currentBrand = name
    try { localStorage.setItem('tm.lastBrand', name) } catch (_) { /* localStorage may be unavailable */ }
    tm.tokens = (res && res.tokens) ? JSON.parse(JSON.stringify(res.tokens)) : {}
    tm.isDirty = false
    renderBrandList()
    renderTokenEditor()
    renderCssPreview()
    updatePreviewEdsCdn()
    updateBrandHeader()
  } catch (err) {
    if (!handleAuthError(err)) showToast(`Failed to load tokens for "${name}": ${err.message}`, 'error')
  } finally {
    setLoading(false)
  }
}

function renderEmptyEditor () {
  const placeholder = document.getElementById('editor-placeholder')
  const content     = document.getElementById('token-editor-content')
  const actionBar   = document.getElementById('action-bar')
  const brandHeader = document.getElementById('brand-header')
  const cssPreview  = document.getElementById('css-preview-code')
  if (!placeholder) return
  placeholder.style.display = 'flex'
  content.style.display     = 'none'
  actionBar.style.display   = 'none'
  brandHeader.textContent   = 'Select or create a brand'
  cssPreview.textContent    = '/* No brand selected */'
}

function updateBrandHeader () {
  const brandHeader = document.getElementById('brand-header')
  const placeholder = document.getElementById('editor-placeholder')
  const content     = document.getElementById('token-editor-content')
  const actionBar   = document.getElementById('action-bar')
  if (!brandHeader) return
  const fullName = tm.metas && tm.metas[tm.currentBrand] && tm.metas[tm.currentBrand].fullName
  brandHeader.textContent   = fullName || tm.currentBrand || ''
  placeholder.style.display = 'none'
  content.style.display     = 'block'
  actionBar.style.display   = 'flex'
}

// ---------------------------------------------------------------------------
// New Brand Modal
// ---------------------------------------------------------------------------
function setupModalHandlers () {
  document.getElementById('btn-new-brand')?.addEventListener('click', openNewBrandModal)
  document.getElementById('modal-cancel')?.addEventListener('click', closeNewBrandModal)
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeNewBrandModal()
  })
  document.getElementById('new-brand-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    await handleNewBrand()
  })
  document.querySelectorAll('.start-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.start-mode-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      document.getElementById('start-mode').value = btn.dataset.mode
    })
  })
}

function openNewBrandModal () {
  document.getElementById('new-brand-name').value = ''
  document.getElementById('start-mode').value = 'blueprint'
  document.querySelectorAll('.start-mode-btn').forEach(b => b.classList.remove('active'))
  document.getElementById('start-blueprint').classList.add('active')
  document.getElementById('modal-overlay').classList.add('visible')
  document.getElementById('new-brand-name').focus()
}

function closeNewBrandModal () {
  document.getElementById('modal-overlay').classList.remove('visible')
}

async function handleNewBrand () {
  const nameInput = document.getElementById('new-brand-name')
  const startMode = document.getElementById('start-mode').value
  const rawName   = nameInput.value.trim()

  if (!rawName) { showToast('Brand name cannot be empty', 'error'); return }

  const safeName = rawName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  if (tm.brands.includes(safeName)) { showToast(`Brand "${safeName}" already exists`, 'error'); return }

  if (!tm.schema) {
    try { tm.schema = await loadSchema() } catch (e) {
      showToast(`Token schema unavailable: ${e.message}`, 'error'); return
    }
  }

  const tokens = startMode === 'scratch' ? buildEmptyTokens(tm.schema) : buildDefaultTokens(tm.schema)

  closeNewBrandModal()
  setLoading(true, `Creating brand "${safeName}"…`)
  try {
    await actionWebInvoke(getActionUrl('manage-tokens'), getAuthHeaders(), { operation: 'save', brandName: safeName, tokens })
    tm.brands.push(safeName)
    tm.brands.sort()
    tm.currentBrand = safeName
    tm.tokens = tokens
    tm.isDirty = false
    renderBrandList()
    renderTokenEditor()
    renderCssPreview()
    updateBrandHeader()
    showToast(`Brand "${safeName}" created`, 'success')
  } catch (err) {
    if (!handleAuthError(err)) showToast(`Failed to create brand: ${err.message}`, 'error')
  } finally {
    setLoading(false)
  }
}

// ---------------------------------------------------------------------------
// Token Editor
// ---------------------------------------------------------------------------
function renderTokenEditor () {
  if (!tm.schema || !tm.styleGuide || !tm.currentBrand) return

  const tabBar     = document.getElementById('tab-bar')
  const tabContent = document.getElementById('tab-content')
  tabBar.innerHTML     = ''
  tabContent.innerHTML = ''

  const tabs = tm.styleGuide.tabs || []
  const preferredId = tm.activeTabId && findTab(tm.styleGuide, tm.activeTabId)
    ? tm.activeTabId
    : (tabs[0] && tabs[0].id)

  tabs.forEach((tabDef) => {
    const isActive = tabDef.id === preferredId

    const tab = document.createElement('button')
    tab.className = 'tab-btn'
      + (isActive ? ' active' : '')
      + (tabDef.editable ? ' is-editable' : ' is-readonly')
    tab.dataset.tabId = tabDef.id
    tab.setAttribute('role', 'tab')
    tab.setAttribute('aria-selected', String(isActive))
    tab.title = tabDef.editable ? tabDef.label : `${tabDef.label} (read-only)`

    const labelSpan = document.createElement('span')
    labelSpan.textContent = tabDef.label
    tab.appendChild(labelSpan)

    if (!tabDef.editable) {
      const badge = document.createElement('span')
      badge.className = 'tab-readonly-badge'
      badge.setAttribute('aria-hidden', 'true')
      badge.innerHTML = ph('lock-key', 11)
      tab.appendChild(badge)
    }

    tab.addEventListener('click', () => switchTab(tabDef.id))
    tabBar.appendChild(tab)

    const panel = document.createElement('div')
    panel.className = 'tab-panel' + (isActive ? ' active' : '')
    panel.id = `panel-${tabDef.id}`
    panel.setAttribute('role', 'tabpanel')
    panel.appendChild(buildTabPanel(tabDef))
    tabContent.appendChild(panel)
  })

  tm.activeTabId = preferredId
  updatePreviewSection(preferredId)
}

/**
 * Build the left-hand panel for a style-guide tab.
 * Editable tabs use token-schema values; read-only tabs show greyed inputs.
 * @param {object} tabDef
 * @returns {HTMLElement}
 */
function buildTabPanel (tabDef) {
  const wrap = document.createElement('div')
  wrap.className = 'style-guide-panel' + (tabDef.editable ? '' : ' is-readonly')

  if (tabDef.id === 'overview') {
    wrap.appendChild(buildOverviewPanel())
    return wrap
  }

  if (!tabDef.editable && tabDef.readonlyNote) {
    const note = document.createElement('div')
    note.className = 'readonly-banner'
    note.textContent = tabDef.readonlyNote
    wrap.appendChild(note)
  }

  if (tabDef.editable && tabDef.schemaCategory === 'greys') {
    wrap.appendChild(buildGreysPanel())
    return wrap
  }

  const fields = resolveTabFields(tabDef, tm.schema)
  const fieldKeys = Object.keys(fields)

  if (fieldKeys.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'readonly-empty'
    empty.textContent = tabDef.editable
      ? 'No tokens in this category.'
      : 'No token list for this section — use the preview on the right to review block styles. Brand colors from the Colors tab still apply.'
    wrap.appendChild(empty)
    return wrap
  }

  const categoryKey = tabDef.editable ? tabDef.schemaCategory : tabDef.id
  wrap.appendChild(buildCategoryForm(categoryKey, fields, { readOnly: !tabDef.editable }))
  return wrap
}

function buildOverviewPanel () {
  const overview = document.createElement('section')
  overview.className = 'overview-panel'

  const title = document.createElement('h2')
  title.className = 'overview-title'
  title.textContent = 'Style guide'

  const description = document.createElement('p')
  description.className = 'overview-description'
  description.textContent = 'Review the current brand palette and shared EDS styling.'

  const editable = document.createElement('div')
  editable.className = 'overview-group overview-group--editable'
  editable.innerHTML = '<h3>Brand tokens</h3><p>Colors, Greys, and Logo are editable for this trail.</p>'

  const reference = document.createElement('div')
  reference.className = 'overview-group'
  reference.innerHTML = '<h3>Shared reference</h3><p>Other tabs preview shared EDS tokens and are not published from Trailhead.</p>'

  overview.append(title, description, editable, reference)
  return overview
}

// ---------------------------------------------------------------------------
// Greys tab — custom panel with Default / Brand-specific toggle
// ---------------------------------------------------------------------------

function buildGreysPanel () {
  const greyFields = tm.schema.greys
  const neutralDefaults = Object.fromEntries(
    Object.entries(greyFields).map(([k, def]) => [k, def.default])
  )

  const currentPrimary = (tm.tokens.colors && tm.tokens.colors.primary)
    || (tm.schema.colors && tm.schema.colors.primary && tm.schema.colors.primary.default)
    || '#eb002a'

  // Detect if brand currently has custom greys set (any grey token differs from default)
  const hasBrandGreys = GREY_STEPS.some((step) => {
    const key = `grey${step}`
    return tm.tokens.greys && tm.tokens.greys[key] && tm.tokens.greys[key] !== neutralDefaults[key]
  })

  const wrapper = document.createElement('div')
  wrapper.className = 'token-form greys-panel'

  wrapper.innerHTML = `
    <div class="greys-toggle-row">
      <span class="greys-toggle-label">Grey scale mode</span>
      <div class="greys-toggle" role="group" aria-label="Grey scale mode">
        <button class="greys-mode-btn${!hasBrandGreys ? ' active' : ''}" data-mode="default">Default</button>
        <button class="greys-mode-btn${hasBrandGreys ? ' active' : ''}" data-mode="brand">Brand-specific</button>
      </div>
    </div>
    <p class="greys-hint" id="greys-hint">
      ${hasBrandGreys
        ? 'Using brand-tinted greys derived from the primary color.'
        : 'Using the default neutral grey scale shared across all brands.'}
    </p>
    <div class="greys-swatches" id="greys-swatches" aria-label="Grey scale preview"></div>
  `

  const renderSwatches = (values) => {
    const container = wrapper.querySelector('#greys-swatches')
    container.innerHTML = GREY_STEPS.map((step) => {
      const hex = values[`grey${step}`]
      const lum = relativeLuminance(hex)
      const textColor = lum > 0.35 ? '#111' : '#eee'
      return `<div class="grey-swatch" title="${step}: ${hex}" style="background:${hex};color:${textColor}">
        <span class="grey-swatch-label">${step}</span>
        <span class="grey-swatch-hex">${hex}</span>
      </div>`
    }).join('')
  }

  const getActiveValues = (mode) => {
    if (mode === 'brand') {
      return generateBrandGreys(currentPrimary, neutralDefaults)
    }
    return neutralDefaults
  }

  const applyMode = (mode, { markDirty = true } = {}) => {
    const values = getActiveValues(mode)
    renderSwatches(values)

    wrapper.querySelector('#greys-hint').textContent = mode === 'brand'
      ? 'Using brand-tinted greys derived from the primary color.'
      : 'Using the default neutral grey scale shared across all brands.'

    if (mode === 'brand') {
      if (!tm.tokens.greys) tm.tokens.greys = {}
      Object.entries(values).forEach(([key, hex]) => {
        tm.tokens.greys[key] = hex
        // keep color pickers in sync if other views reference them
        const picker = document.getElementById(`token-greys-${key}`)
        if (picker) picker.value = hex
      })
    } else {
      // Clear all grey overrides — fall back to root defaults
      if (tm.tokens.greys) {
        GREY_STEPS.forEach((step) => { delete tm.tokens.greys[`grey${step}`] })
      }
    }

    if (markDirty) {
      tm.isDirty = true
      updateDirtyIndicator()
    }
    renderCssPreview()
  }

  const initialMode = hasBrandGreys ? 'brand' : 'default'
  renderSwatches(hasBrandGreys
    ? Object.fromEntries(
      GREY_STEPS.map((s) => [`grey${s}`, (tm.tokens.greys && tm.tokens.greys[`grey${s}`]) || neutralDefaults[`grey${s}`]])
    )
    : neutralDefaults
  )

  wrapper.querySelectorAll('.greys-mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      wrapper.querySelectorAll('.greys-mode-btn').forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')
      applyMode(btn.dataset.mode)
    })
  })

  // If already in brand mode, don't re-apply on load (preserve existing values)
  // Only auto-apply when switching tabs if in default mode to clear stale overrides
  if (!hasBrandGreys) applyMode(initialMode, { markDirty: false })

  return wrapper
}

/**
 * @param {string} category - schema category or read-only tab id (for element ids)
 * @param {object} fields - field definitions
 * @param {{ readOnly?: boolean }} [options]
 * @returns {HTMLElement}
 */
function buildCategoryForm (category, fields, options = {}) {
  const readOnly = !!options.readOnly
  const form = document.createElement('div')
  form.className = 'token-form' + (readOnly ? ' token-form-readonly' : '')

  Object.entries(fields).forEach(([key, def]) => {
    const currentValue = (!readOnly && tm.tokens[category] && tm.tokens[category][key] !== undefined)
      ? tm.tokens[category][key]
      : (def.default || '')

    const row = document.createElement('div')
    row.className = 'token-row' + (readOnly ? ' token-row-readonly' : '')

    const meta = document.createElement('div')
    meta.className = 'token-row-meta'

    const labelEl = document.createElement('label')
    labelEl.className = 'token-label'
    labelEl.textContent = def.label
    labelEl.setAttribute('for', `token-${category}-${key}`)

    const varEl = document.createElement('div')
    varEl.className = 'token-var'
    varEl.textContent = def.cssVar

    meta.appendChild(labelEl)
    meta.appendChild(varEl)

    if (Array.isArray(def.affects) && def.affects.length) {
      const affectsEl = document.createElement('div')
      affectsEl.className = 'token-affects'
      affectsEl.textContent = `Affects: ${def.affects.join(', ')}`
      meta.appendChild(affectsEl)
    }

    if (def.hint) {
      const hintEl = document.createElement('div')
      hintEl.className = 'token-hint'
      hintEl.textContent = def.hint
      meta.appendChild(hintEl)
    }

    const inputArea = document.createElement('div')
    inputArea.className = 'token-input-area'

    let input

    if (def.type === 'color') {
      const wrapper = document.createElement('div')
      wrapper.className = 'color-input-wrapper'

      const colorPicker = document.createElement('input')
      colorPicker.type = 'color'
      colorPicker.className = 'color-picker'
      colorPicker.value = normalizeHex(currentValue)
      colorPicker.id = `token-${category}-${key}`
      if (readOnly) colorPicker.disabled = true

      const hexText = document.createElement('input')
      hexText.type = 'text'
      hexText.className = 'color-hex'
      hexText.value = currentValue
      hexText.maxLength = 40
      hexText.setAttribute('spellcheck', 'false')
      if (readOnly) {
        hexText.readOnly = true
        hexText.tabIndex = -1
      }

      if (!readOnly) {
        colorPicker.addEventListener('input', () => {
          hexText.value = colorPicker.value
          onTokenChange(category, key, colorPicker.value)
        })
        hexText.addEventListener('input', () => {
          const v = hexText.value.trim()
          onTokenChange(category, key, v)
          if (/^#[0-9a-fA-F]{3,6}$/.test(v)) colorPicker.value = v
        })
      }

      wrapper.appendChild(colorPicker)
      wrapper.appendChild(hexText)
      input = wrapper
    } else if (def.type === 'select' && Array.isArray(def.options)) {
      input = document.createElement('select')
      input.className = 'token-select'
      input.id = `token-${category}-${key}`
      input.disabled = readOnly
      def.options.forEach((opt) => {
        const o = document.createElement('option')
        o.value = opt
        o.textContent = opt
        if (opt === currentValue) o.selected = true
        input.appendChild(o)
      })
      if (!readOnly) {
        input.addEventListener('change', () => onTokenChange(category, key, input.value))
      }
    } else {
      input = document.createElement('input')
      input.type = 'text'
      input.className = 'token-text'
      input.id = `token-${category}-${key}`
      input.value = currentValue
      input.setAttribute('spellcheck', 'false')
      if (readOnly) {
        input.readOnly = true
        input.tabIndex = -1
      } else {
        input.addEventListener('input', () => onTokenChange(category, key, input.value))
      }
    }

    inputArea.appendChild(input)
    row.appendChild(meta)
    row.appendChild(inputArea)
    form.appendChild(row)
  })

  return form
}

function switchTab (tabId) {
  tm.activeTabId = tabId
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    const active = btn.dataset.tabId === tabId
    btn.classList.toggle('active', active)
    btn.setAttribute('aria-selected', String(active))
  })
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `panel-${tabId}`)
  })
  updatePreviewSection(tabId)
}

function onTokenChange (category, key, value) {
  if (!tm.tokens[category]) tm.tokens[category] = {}
  tm.tokens[category][key] = value
  tm.isDirty = true
  updateDirtyIndicator()
  renderCssPreview()
}

function updateDirtyIndicator () {
  const saveBtn = document.getElementById('btn-save')
  if (saveBtn) {
    saveBtn.classList.toggle('dirty', tm.isDirty)
    saveBtn.title = tm.isDirty ? 'Unsaved changes' : 'All changes saved'
  }
}

// ---------------------------------------------------------------------------
// CSS Preview
// ---------------------------------------------------------------------------
function renderCssPreview () {
  const pre = document.getElementById('css-preview-code')
  if (!pre) return
  if (!tm.currentBrand || !tm.schema) {
    pre.textContent = '/* No tokens loaded */'
    updatePreviewTokens()
    return
  }
  const css = tokensToCSS(tm.schema, tm.tokens)
  pre.textContent = css
  updatePreviewTokens()
}

// ---------------------------------------------------------------------------
// Component Preview
// ---------------------------------------------------------------------------
function setupPreviewHandlers () {
  document.getElementById('btn-preview-dark').addEventListener('click', togglePreviewDark)
  document.getElementById('btn-show-css').addEventListener('click', () => {
    setPreviewMode(tm.previewMode === 'css' ? 'static' : 'css')
  })
  const iframe = document.getElementById('preview-iframe')
  if (iframe) {
    iframe.addEventListener('load', () => {
      updatePreviewEdsCdn()
      updatePreviewTokens()
      updatePreviewSection(tm.activeTabId || 'overview')
      const isDark = document.getElementById('btn-preview-dark').getAttribute('aria-pressed') === 'true'
      if (isDark) iframe.contentWindow.postMessage({ type: 'SET_DARK', dark: true }, '*')
    })
  }
}

function togglePreviewDark () {
  const btn    = document.getElementById('btn-preview-dark')
  const isDark = btn.getAttribute('aria-pressed') !== 'true'
  btn.setAttribute('aria-pressed', String(isDark))
  const iframe = document.getElementById('preview-iframe')
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({ type: 'SET_DARK', dark: isDark }, '*')
  }
}

function setPreviewMode (mode) {
  tm.previewMode = mode
  const staticPane = document.getElementById('preview-pane')
  const cssPane    = document.getElementById('css-preview-code')
  const title      = document.getElementById('preview-panel-title')
  const darkBtn    = document.getElementById('btn-preview-dark')
  staticPane.style.display = mode === 'static' ? '' : 'none'
  cssPane.style.display    = mode === 'css' ? '' : 'none'
  document.getElementById('btn-show-css').setAttribute('aria-pressed', String(mode === 'css'))
  darkBtn.style.display  = mode === 'static' ? '' : 'none'
  title.textContent      = mode === 'css' ? 'CSS output' : 'Style guide'
}

/**
 * Tell the preview iframe which style-guide section to show for the active tab.
 * @param {string} tabId
 */
function updatePreviewSection (tabId) {
  const iframe = document.getElementById('preview-iframe')
  if (!iframe || !iframe.contentWindow) return
  const tab = findTab(tm.styleGuide, tabId)
  const section = (tab && tab.preview) || tabId || 'overview'
  try {
    iframe.contentWindow.postMessage({ type: 'SET_SECTION', section }, '*')
  } catch (e) { /* iframe not yet loaded */ }

  const title = document.getElementById('preview-panel-title')
  if (title && tm.previewMode === 'static') {
    title.textContent = tab ? `${tab.label} preview` : 'Style guide'
  }
}

function updatePreviewTokens () {
  const iframe = document.getElementById('preview-iframe')
  if (!iframe || !tm.schema) return
  const lines = []
  for (const [category, fields] of Object.entries(tm.schema)) {
    for (const [key, def] of Object.entries(fields)) {
      const raw = tm.tokens[category] && tm.tokens[category][key] !== undefined && tm.tokens[category][key] !== ''
        ? tm.tokens[category][key]
        : def.default
      if (raw) lines.push(`  ${def.cssVar}: ${raw};`)
    }
  }
  const css = `:root {\n${lines.join('\n')}\n}\n`
  try {
    if (iframe.contentWindow) iframe.contentWindow.postMessage({ type: 'UPDATE_TOKENS', css }, '*')
  } catch (e) { /* iframe not yet loaded */ }
}

// ---------------------------------------------------------------------------
// Action Bar
// ---------------------------------------------------------------------------
function setupActionBarHandlers () {
  document.getElementById('btn-save').addEventListener('click', saveTokens)
  document.getElementById('btn-reset').addEventListener('click', resetToCurrent)
  document.getElementById('btn-export-css').addEventListener('click', exportCss)
  document.getElementById('btn-publish').addEventListener('click', openPublishPanel)
  document.getElementById('btn-publish-confirm').addEventListener('click', publishTokens)
  document.getElementById('btn-publish-cancel').addEventListener('click', closePublishPanel)
}

async function saveTokens () {
  if (!tm.currentBrand) return
  setLoading(true, 'Saving tokens…')
  try {
    await actionWebInvoke(getActionUrl('manage-tokens'), getAuthHeaders(), { operation: 'save', brandName: tm.currentBrand, tokens: tm.tokens })
    tm.isDirty = false
    updateDirtyIndicator()
    showToast('Tokens saved successfully', 'success')
  } catch (err) {
    if (!handleAuthError(err)) showToast(`Failed to save tokens: ${err.message}`, 'error')
  } finally {
    setLoading(false)
  }
}

async function resetToCurrent () {
  if (!tm.currentBrand) return
  if (!confirm(`Discard all unsaved changes for "${tm.currentBrand}" and reset to the live values?`)) return
  setLoading(true, 'Resetting…')
  try {
    await actionWebInvoke(getActionUrl('manage-tokens'), getAuthHeaders(), { operation: 'delete', brandName: tm.currentBrand })
    await selectBrand(tm.currentBrand)
    showToast(`Reset to live values for "${tm.currentBrand}"`, 'success')
  } catch (err) {
    if (!handleAuthError(err)) showToast(`Reset failed: ${err.message}`, 'error')
  } finally {
    setLoading(false)
  }
}

function exportCss () {
  if (!tm.currentBrand || !tm.schema) return
  const css  = tokensToCSS(tm.schema, tm.tokens)
  const blob = new Blob([css], { type: 'text/css' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${tm.currentBrand}-tokens.css`
  a.click()
  URL.revokeObjectURL(url)
  showToast(`CSS exported: ${tm.currentBrand}-tokens.css`, 'success')
}

// ---------------------------------------------------------------------------
// GitHub Settings
// ---------------------------------------------------------------------------
function setupGitHubSettingsHandlers () {
  // Owner and repo are now injected via action inputs (GITHUB_OWNER / GITHUB_REPO)
  // — no UI fields required.
}

function openPublishPanel () {
  if (!tm.currentBrand) return
  document.getElementById('publish-brand-name').textContent = tm.currentBrand
  document.getElementById('publish-result').innerHTML = ''
  document.getElementById('publish-actions').style.display = ''
  renderPublishPreflight()
  document.getElementById('publish-panel').classList.add('visible')
}

function closePublishPanel () {
  document.getElementById('publish-panel').classList.remove('visible')
  document.getElementById('publish-result').innerHTML = ''
  document.getElementById('publish-preflight').innerHTML = ''
}

function renderPublishPreflight () {
  const el = document.getElementById('publish-preflight')
  if (!el) return

  // Build color swatches for the colors category
  const colorSwatches = tm.schema && tm.schema.colors
    ? Object.entries(tm.schema.colors).map(([key, def]) => {
        const val = (tm.tokens.colors && tm.tokens.colors[key]) || def.default
        const isHex = /^#[0-9a-f]{3,8}$/i.test(val)
        return `<span class="pp-swatch-wrap" title="${escapeHtml(def.label)}: ${escapeHtml(val)}">
          <span class="pp-swatch" style="background:${isHex ? escapeHtml(val) : 'transparent'};${!isHex ? 'border:1px dashed #ccc' : ''}"></span>
          <span class="pp-swatch-label">${escapeHtml(def.label)}</span>
        </span>`
      }).join('')
    : ''

  // Changed tokens relative to schema defaults
  const changes = []
  if (tm.schema && tm.tokens) {
    for (const [cat, fields] of Object.entries(tm.schema)) {
      if (cat === 'colors' || cat === 'greys' || cat === 'alerts') continue
      for (const [key, def] of Object.entries(fields)) {
        const current = tm.tokens[cat] && tm.tokens[cat][key] !== undefined ? tm.tokens[cat][key] : def.default
        if (current !== def.default) changes.push({ label: def.label, value: current })
      }
    }
  }

  const changeRows = changes.length
    ? changes.map(c => `<div class="pp-change-row"><span class="pp-change-key">${escapeHtml(c.label)}</span><span class="pp-change-val">${escapeHtml(c.value)}</span></div>`).join('')
    : '<div class="pp-change-row pp-change-default">No non-color overrides — colors and greys are covered above</div>'

  el.innerHTML = `
    <div class="pp-section">
      <div class="pp-section-label">Token target</div>
      <div class="pp-target-badge">
        <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"><circle cx="5" cy="5" r="5"/></svg>
        Staging branch
      </div>
    </div>

    <div class="pp-section">
      <div class="pp-section-label">Brand colors being submitted</div>
      <div class="pp-swatches">${colorSwatches}</div>
    </div>

    <div class="pp-section">
      <div class="pp-section-label">Other token overrides</div>
      ${changeRows}
    </div>

    <div class="pp-section">
      <div class="pp-section-label">What submitting does</div>
      <p class="pp-desc">Opens a pull request on GitHub against the <strong>staging</strong> branch with your current token values as <code>brands/${escapeHtml(tm.currentBrand)}/tokens.css</code>. No live site is changed until the PR is reviewed, approved, and merged.</p>
    </div>

    <div class="pp-section">
      <div class="pp-section-label">What happens next</div>
      <ol class="pp-steps">
        <li><strong>PR review</strong> — A developer reviews and approves the PR on GitHub.</li>
        <li><strong>Merge → staging</strong> — Once merged, changes appear on staging within minutes. You can preview them at the Helix test URL shown after submitting.</li>
        <li><strong>Production release</strong> — Staging must be separately promoted to production. This is a manual step outside Trailhead.</li>
      </ol>
    </div>
  `
}

async function publishTokens () {
  if (tm.isDirty) {
    if (confirm('You have unsaved changes. Save them first?')) {
      await saveTokens()
      if (tm.isDirty) return
    }
  }

  const resultEl  = document.getElementById('publish-result')
  const actionsEl = document.getElementById('publish-actions')
  const preEl     = document.getElementById('publish-preflight')
  resultEl.innerHTML = '<span class="spinner"></span> Submitting release request…'

  try {
    const res = await actionWebInvoke(getActionUrl('publish-tokens'), getAuthHeaders(), { brandName: tm.currentBrand })
    const pr      = res && res.pull_request
    const cssFile = res && res.css_file
    const helixPreview = res && res.preview_url

    if (pr) {
      preEl.innerHTML = ''
      actionsEl.style.display = 'none'
      resultEl.innerHTML = `
        <div class="publish-success">
          <div class="pp-success-icon">${ph('check-circle', 28)}</div>
          <strong>Release request submitted</strong>
          <p class="pp-success-desc">A pull request is open and awaiting review. No staging change takes effect until it is merged.</p>

          <div class="pp-section" style="margin-top:20px">
            <div class="pp-section-label">Pull request</div>
            <a class="pp-link-row" href="${escapeHtml(pr.url)}" target="_blank" rel="noopener">
              ${ph('git-pull-request', 14)}
              PR #${pr.number} — ${escapeHtml(pr.title || `Brand tokens: ${tm.currentBrand}`)}
              ${ph('arrow-square-out', 13)}
            </a>
            <div class="pp-meta">${escapeHtml(cssFile ? cssFile.path : '')}${cssFile && cssFile.variables ? ` &middot; ${cssFile.variables} variables` : ''}</div>
          </div>

          ${helixPreview ? `
          <div class="pp-section" style="margin-top:16px">
            <div class="pp-section-label">Preview on Helix (once PR is merged)</div>
            <a class="pp-link-row" href="${escapeHtml(helixPreview)}" target="_blank" rel="noopener">
              ${ph('eye', 14)}
              ${escapeHtml(helixPreview)}
              ${ph('arrow-square-out', 13)}
            </a>
            <div class="pp-meta">This URL becomes active after the PR is merged to staging.</div>
          </div>` : ''}

          <div class="pp-section" style="margin-top:16px">
            <div class="pp-section-label">What to do now</div>
            <ol class="pp-steps">
              <li>Share the PR link with a developer for review.</li>
              <li>Once approved and merged, verify changes at the Helix staging URL above.</li>
              <li>Coordinate with the team to promote staging to production when ready.</li>
            </ol>
          </div>
        </div>
      `
      showToast('Release request submitted', 'success')
    } else {
      resultEl.innerHTML = '<span class="publish-error">Unexpected response from server</span>'
    }
  } catch (err) {
    if (handleAuthError(err)) {
      resultEl.innerHTML = '<span class="publish-error">Authentication required</span>'
    } else {
      resultEl.innerHTML = `<span class="publish-error">${escapeHtml(err.message)}</span>`
      showToast(`Request failed: ${err.message}`, 'error')
    }
  }
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------
function normalizeHex (value) {
  if (!value) return '#000000'
  const v = String(value).trim()
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v
  if (/^#[0-9a-fA-F]{3}$/.test(v)) return '#' + v.slice(1).split('').map((c) => c + c).join('')
  return '#000000'
}
