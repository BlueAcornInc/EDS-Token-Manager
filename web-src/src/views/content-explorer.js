import actionWebInvoke from '../utils.js'
import { initHeader } from '../header.js'
import { getAuthHeaders, getActionUrl, showToast } from '../app.js'
import { ph } from '../icons.js'
import { escapeHtml } from '../dom.js'

// ---------------------------------------------------------------------------
// View-local state
// ---------------------------------------------------------------------------
const ce = {
  site: null,
  branch: 'staging',
  sites: [],
  expandedPaths: new Set(),
  rowCache: {},
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------
export function mount (container) {
  ce.site = null
  ce.branch = 'staging'
  ce.expandedPaths = new Set()
  ce.rowCache = {}

  container.innerHTML = `
    <div class="ce-wrap">
      <div class="ce-controls">
        <label class="ce-label" for="ce-site-select">Site</label>
        <select id="ce-site-select" class="ce-select" disabled>
          <option value="">Loading sites…</option>
        </select>

        <label class="ce-label" for="ce-branch-select">Branch</label>
        <select id="ce-branch-select" class="ce-select">
          <option value="staging" selected>staging</option>
          <option value="main">main</option>
        </select>

        <button id="ce-refresh" class="btn btn-outlined" style="font-size:12px;padding:5px 12px" disabled>
          ${ph('arrows-clockwise', 13)}
          Refresh
        </button>

        <div class="ce-path-input-wrap">
          <input id="ce-path-input" class="ce-path-input" type="text" placeholder="Check a path e.g. /en/lodges" disabled />
          <button id="ce-path-go" class="btn btn-outlined" style="font-size:12px;padding:5px 10px" disabled>
            ${ph('arrow-right', 13)}
          </button>
        </div>
      </div>

      <div id="ce-empty" class="ce-empty" style="display:none">
        <p>Select a site above to explore its content tree.</p>
      </div>

      <div id="ce-table-wrap" style="display:none">
        <table class="bc-table ce-table">
          <thead>
            <tr>
              <th>Path</th>
              <th>EDS Preview</th>
              <th>EDS Live</th>
              <th>AEM State</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody id="ce-tbody"></tbody>
        </table>
      </div>
    </div>
  `

  initHeader({ subtitle: 'Content Explorer' })

  const siteSelect   = container.querySelector('#ce-site-select')
  const branchSelect = container.querySelector('#ce-branch-select')
  const refreshBtn   = container.querySelector('#ce-refresh')
  const pathInput    = container.querySelector('#ce-path-input')
  const pathGoBtn    = container.querySelector('#ce-path-go')

  siteSelect.addEventListener('change', () => {
    ce.site = siteSelect.value || null
    ce.expandedPaths = new Set()
    ce.rowCache = {}
    if (ce.site) loadRoot()
  })

  branchSelect.addEventListener('change', () => {
    ce.branch = branchSelect.value
    ce.expandedPaths = new Set()
    ce.rowCache = {}
    if (ce.site) loadRoot()
  })

  refreshBtn.addEventListener('click', () => {
    ce.expandedPaths = new Set()
    ce.rowCache = {}
    if (ce.site) loadRoot()
  })

  function goToPath () {
    const raw = (pathInput.value || '').trim()
    if (!raw || !ce.site) return
    const path = raw.startsWith('/') ? raw : `/${raw}`
    const tbody = document.getElementById('ce-tbody')
    const tableWrap = document.getElementById('ce-table-wrap')
    const empty = document.getElementById('ce-empty')
    if (tableWrap) tableWrap.style.display = 'block'
    if (empty) empty.style.display = 'none'
    // remove any existing row for this path before adding a fresh one
    tbody.querySelector(`tr[data-path="${CSS.escape(path)}"]`)?.remove()
    loadPath(path, 0, null, tbody)
  }

  pathGoBtn.addEventListener('click', goToPath)
  pathInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') goToPath() })

  loadSites(siteSelect, refreshBtn, pathInput, pathGoBtn)
}

// ---------------------------------------------------------------------------
// Sites loader
// ---------------------------------------------------------------------------
async function loadSites (siteSelect, refreshBtn, pathInput, pathGoBtn) {
  try {
    const res = await actionWebInvoke(getActionUrl('list-sites'), getAuthHeaders(), {}, 'GET')
    const sites = res?.sites || []
    ce.sites = sites
    siteSelect.innerHTML = '<option value="">— select a site —</option>' +
      sites.map((s) => {
        const id = escapeHtml(s.id)
        const label = escapeHtml(s.fullName || s.id)
        return `<option value="${id}">${label}</option>`
      }).join('')
    siteSelect.disabled = false
    refreshBtn.disabled = false
    pathInput.disabled = false
    pathGoBtn.disabled = false

    const empty = document.getElementById('ce-empty')
    if (empty) { empty.style.display = 'block' }
  } catch (e) {
    showToast('Failed to load sites', 'error')
  }
}

// ---------------------------------------------------------------------------
// Root load
// ---------------------------------------------------------------------------
function loadRoot () {
  const tbody = document.getElementById('ce-tbody')
  const tableWrap = document.getElementById('ce-table-wrap')
  const empty = document.getElementById('ce-empty')
  if (!tbody) return

  tbody.innerHTML = ''
  if (tableWrap) tableWrap.style.display = 'block'
  if (empty) empty.style.display = 'none'

  loadPath('/', 0, null, tbody)
}

// ---------------------------------------------------------------------------
// Load a single path and inject rows
// ---------------------------------------------------------------------------
async function loadPath (path, depth, insertAfterRow, tbody) {
  const cacheKey = `${ce.site}:${ce.branch}:${path}`

  if (ce.rowCache[cacheKey]) {
    renderRows(ce.rowCache[cacheKey], path, depth, insertAfterRow, tbody)
    return
  }

  const loadingRow = createLoadingRow(path, depth)
  if (insertAfterRow) {
    insertAfterRow.insertAdjacentElement('afterend', loadingRow)
  } else {
    tbody.appendChild(loadingRow)
  }

  try {
    const result = await actionWebInvoke(
      getActionUrl('content-status'),
      getAuthHeaders(),
      { site: ce.site, path, branch: ce.branch },
      'GET',
    )
    ce.rowCache[cacheKey] = result
    loadingRow.remove()
    renderRows(result, path, depth, insertAfterRow, tbody)
  } catch (_e) {
    loadingRow.remove()
    showToast(`Failed to load ${path}`, 'error')
  }
}

// ---------------------------------------------------------------------------
// Render rows for a result
// ---------------------------------------------------------------------------
function renderRows (result, path, depth, insertAfterRow, tbody) {
  const hasChildren = result.children && result.children.length > 0
  const aemUnavailable = result.aem?.state === 'unavailable'
  const row = createRow(result, path, depth, hasChildren, aemUnavailable)

  if (insertAfterRow) {
    insertAfterRow.insertAdjacentElement('afterend', row)
  } else {
    tbody.appendChild(row)
  }

  if (!hasChildren) return

  row.querySelector('.ce-expand-btn')?.addEventListener('click', () => {
    const isExpanded = ce.expandedPaths.has(path)
    if (isExpanded) {
      collapseChildren(path, tbody)
      ce.expandedPaths.delete(path)
      row.querySelector('.ce-expand-btn').innerHTML = ph('caret-right', 14)
    } else {
      ce.expandedPaths.add(path)
      row.querySelector('.ce-expand-btn').innerHTML = ph('caret-down', 14)
      // insert children after this row
      let lastInserted = row
      for (const child of result.children) {
        const childRow = document.createElement('tr')
        childRow.dataset.childOf = path
        childRow.dataset.path = child.path
        childRow.innerHTML = `<td colspan="5" style="padding-left:${(depth + 1) * 20 + 12}px;color:var(--color-text-soft);font-size:var(--text-small)">
          <span class="spinner" style="width:12px;height:12px;border-width:2px;margin-right:6px"></span> Loading…
        </td>`
        lastInserted.insertAdjacentElement('afterend', childRow)
        lastInserted = childRow
      }
      // now replace placeholders with real rows
      const children = [...result.children]
      let prevRow = row
      for (const child of children) {
        const placeholder = tbody.querySelector(`tr[data-child-of="${CSS.escape(path)}"][data-path="${CSS.escape(child.path)}"]`)
        if (placeholder) placeholder.remove()
        loadPath(child.path, depth + 1, prevRow, tbody)
        // prevRow will be updated as rows are inserted
      }
    }
  })
}

function collapseChildren (path, tbody) {
  tbody.querySelectorAll(`tr[data-child-of]`).forEach((row) => {
    if (row.dataset.childOf === path || isDescendantOf(row, path, tbody)) {
      row.remove()
    }
  })
}

function isDescendantOf (row, ancestorPath, tbody) {
  let parent = row.dataset.childOf
  while (parent) {
    if (parent === ancestorPath) return true
    const parentRow = tbody.querySelector(`tr[data-path="${CSS.escape(parent)}"]`)
    parent = parentRow?.dataset?.childOf || null
  }
  return false
}

// ---------------------------------------------------------------------------
// Row builders
// ---------------------------------------------------------------------------
function createLoadingRow (path, depth) {
  const tr = document.createElement('tr')
  tr.dataset.path = path
  tr.innerHTML = `
    <td style="padding-left:${depth * 20 + 12}px">
      <span class="spinner" style="width:12px;height:12px;border-width:2px;margin-right:6px;display:inline-block;vertical-align:middle"></span>
      <span style="color:var(--color-text-soft);font-size:var(--text-small)">${escapeHtml(path)}</span>
    </td>
    <td></td><td></td><td></td><td></td>
  `
  return tr
}

function createRow (result, path, depth, hasChildren, aemUnavailable = false) {
  const tr = document.createElement('tr')
  tr.dataset.path = path

  const label = path === '/' ? '/' : path.split('/').pop()
  const safePath = escapeHtml(path)
  const safeLabel = escapeHtml(label)
  // show expand chevron only when children are known; show hint icon when AEM token is absent
  const expandBtn = hasChildren
    ? `<button class="ce-expand-btn icon-btn" title="Expand ${safePath}" style="margin-right:4px;padding:0 3px">${ph('caret-right', 14)}</button>`
    : aemUnavailable
      ? `<span title="Tree navigation requires AEM_BEARER_TOKEN" style="display:inline-block;width:20px;color:var(--color-text-soft);opacity:.4;cursor:help">${ph('tree-structure', 12)}</span>`
      : `<span style="display:inline-block;width:20px"></span>`

  tr.innerHTML = `
    <td style="padding-left:${depth * 20 + 4}px;white-space:nowrap">
      ${expandBtn}
      <span class="ce-path-label" title="${safePath}">${safeLabel}</span>
    </td>
    <td>${renderEdgeState(result.preview)}</td>
    <td>${renderEdgeState(result.live)}</td>
    <td>${renderAemState(result.aem)}</td>
    <td>${renderFlags(result.mismatches || [])}</td>
  `
  return tr
}

// ---------------------------------------------------------------------------
// Cell renderers
// ---------------------------------------------------------------------------
function renderEdgeState (obj) {
  if (!obj) return '<span style="color:var(--color-text-soft)">—</span>'
  const ok = obj.status === 200
  const icon = ok ? '✅' : '❌'
  const ts = obj.lastModified ? `<br><small style="color:var(--color-text-soft)">${relativeTime(obj.lastModified)}</small>` : ''
  return `<span>${icon} ${obj.status}${ts}</span>`
}

function renderAemState (aem) {
  if (!aem || aem.state === 'unavailable') {
    return '<span style="color:var(--color-text-soft)" title="AEM_BEARER_TOKEN not configured">—</span>'
  }
  const labels = { published: 'Published', modified: 'Modified', 'never-published': 'Never published', unknown: 'Unknown' }
  const colors = { published: 'var(--color-status-ok)', modified: 'var(--color-warning, #e5a000)', 'never-published': 'var(--color-text-soft)', unknown: 'var(--color-text-soft)' }
  const label = labels[aem.state] || aem.state
  const color = colors[aem.state] || 'inherit'
  return `<span style="color:${color}">${label}</span>`
}

function renderFlags (flags) {
  if (!flags.length) return ''
  const colors = {
    OUT_OF_SYNC: '#dc3545',
    STALE_PREVIEW: '#e5a000',
    NOT_PUBLISHED_TO_LIVE: '#6c757d',
  }
  return flags.map((f) => {
    const color = colors[f] || 'inherit'
    return `<span class="ce-badge" style="background:${color}">${f.replace(/_/g, ' ')}</span>`
  }).join(' ')
}

function relativeTime (iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
