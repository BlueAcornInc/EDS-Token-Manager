import actionWebInvoke from '../utils.js'
import { initHeader } from '../header.js'
import { getAuthHeaders, getActionUrl, showToast } from '../app.js'
import { ph } from '../icons.js'
import { escapeHtml } from '../dom.js'

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------
export function mount (container) {
  container.innerHTML = `
    <main class="bc-main">

      <section class="bc-tools">
        <a href="#wizard" class="bc-tool-card">
          <div class="bc-tool-icon">
            ${ph('plus', 24)}
          </div>
          <div class="bc-tool-body">
            <div class="bc-tool-name">Trail Builder</div>
            <div class="bc-tool-desc">Scaffold site files and open a setup PR</div>
          </div>
          ${ph('arrow-right', 16)}
        </a>

        <a href="#trail-manager" class="bc-tool-card">
          <div class="bc-tool-icon">
            ${ph('sliders-horizontal', 24)}
          </div>
          <div class="bc-tool-body">
            <div class="bc-tool-name">Trail Manager</div>
            <div class="bc-tool-desc">Edit tokens and publish brand styles</div>
          </div>
          ${ph('arrow-right', 16)}
        </a>
      </section>

      <section class="bc-brands">
        <div class="bc-brands-header">
          <h2 class="bc-brands-title">Trails</h2>
          <button id="btn-refresh" class="btn btn-outlined" style="font-size:12px;padding:5px 12px" title="Refresh brand status">
            ${ph('arrows-clockwise', 13)}
            Refresh
          </button>
        </div>

        <div id="bc-brands-loading" class="bc-brands-loading" style="display:none">
          <span class="spinner"></span> Loading trails…
        </div>

        <div id="bc-brands-empty" class="bc-brands-empty" style="display:none">
          <p>No trails found. <a href="#wizard">Create the first one &rarr;</a></p>
        </div>

        <table id="bc-brands-table" class="bc-table" style="display:none">
          <thead>
            <tr>
              <th>Full name</th>
              <th>Trail (Slug)</th>
              <th>Domain</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="bc-brands-tbody"></tbody>
        </table>
      </section>

      <section class="bc-tools">
        <div class="bc-tools-header">
          <h2 class="bc-tools-title">Tools in progress (for testing purposes)</h2>
        </div>
        <a href="#content-explorer" class="bc-tool-card">
          <div class="bc-tool-icon">
            ${ph('tree-structure', 24)}
          </div>
          <div class="bc-tool-body">
            <div class="bc-tool-name">Content Explorer</div>
            <div class="bc-tool-desc">Browse EDS content bus state and AEM publish status</div>
          </div>
          ${ph('arrow-right', 16)}
        </a>
      </section>

    </main>
  `

  initHeader({ subtitle: 'Basecamp' })

  container.querySelector('#btn-refresh').addEventListener('click', loadTrails)

  loadTrails()
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------
async function loadTrails () {
  setLoadingState(true)
  try {
    const [tokensRes, sitesRes] = await Promise.allSettled([
      actionWebInvoke(getActionUrl('manage-tokens'), getAuthHeaders(), { operation: 'list' }),
      actionWebInvoke(getActionUrl('list-sites'), getAuthHeaders(), {})
    ])

    const brands   = (tokensRes.status === 'fulfilled' && tokensRes.value && tokensRes.value.brands)
      ? tokensRes.value.brands : []
    const statuses = (tokensRes.status === 'fulfilled' && tokensRes.value && tokensRes.value.statuses)
      ? tokensRes.value.statuses : {}
    const metas    = (tokensRes.status === 'fulfilled' && tokensRes.value && tokensRes.value.metas)
      ? tokensRes.value.metas : {}
    const sites    = (sitesRes.status === 'fulfilled' && sitesRes.value && sitesRes.value.sites)
      ? sitesRes.value.sites : []

    const siteMap = {}
    sites.forEach(s => { siteMap[s.id] = s })

    const allIds = [...new Set([...brands, ...sites.map(s => s.id)])]
    const trails = allIds.map(id => ({
      id,
      fullName: (metas[id] && metas[id].fullName) || (siteMap[id] && siteMap[id].fullName) || '',
      domain: siteMap[id] ? siteMap[id].domain : null,
      status: statuses[id] || 'new'
    })).sort((a, b) => {
      const nameA = (a.fullName || a.id).toLowerCase()
      const nameB = (b.fullName || b.id).toLowerCase()
      return nameA.localeCompare(nameB)
    })

    renderTable(trails)
  } catch (err) {
    showToast(`Failed to load trails: ${err.message}`, 'error')
    setLoadingState(false)
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function setLoadingState (loading) {
  const loadEl  = document.getElementById('bc-brands-loading')
  const tableEl = document.getElementById('bc-brands-table')
  const emptyEl = document.getElementById('bc-brands-empty')
  if (!loadEl) return
  loadEl.style.display  = loading ? 'flex' : 'none'
  tableEl.style.display = 'none'
  emptyEl.style.display = 'none'
}

function renderTable (trails) {
  const loadEl  = document.getElementById('bc-brands-loading')
  const tableEl = document.getElementById('bc-brands-table')
  const emptyEl = document.getElementById('bc-brands-empty')
  if (!loadEl) return

  loadEl.style.display = 'none'

  if (trails.length === 0) {
    emptyEl.style.display = 'block'
    tableEl.style.display = 'none'
    return
  }

  const tbody = document.getElementById('bc-brands-tbody')
  tbody.innerHTML = ''

  trails.forEach(trail => {
    const tr = document.createElement('tr')

    const tdFullName = document.createElement('td')
    tdFullName.className = 'bc-td-fullname'
    const nameText = document.createElement('span')
    nameText.textContent = trail.fullName || ''
    if (!trail.fullName) nameText.className = 'bc-td-null'
    if (!trail.fullName) nameText.textContent = '—'
    const fullNameEditBtn = document.createElement('button')
    fullNameEditBtn.className = 'bc-inline-edit'
    fullNameEditBtn.title = 'Edit site info (name and domain)'
    fullNameEditBtn.setAttribute('aria-label', 'Edit site info')
    fullNameEditBtn.innerHTML = ph('gear', 15) + ' Config'
    fullNameEditBtn.addEventListener('click', () => openMetaModal(trail))
    tdFullName.appendChild(nameText)
    tdFullName.appendChild(fullNameEditBtn)

    const tdName = document.createElement('td')
    tdName.className = 'bc-td-name'
    const nameWrap = document.createElement('span')
    nameWrap.className = 'bc-td-name-wrap'
    nameWrap.textContent = trail.id
    tdName.appendChild(nameWrap)

    const tdDomain = document.createElement('td')
    tdDomain.className = 'bc-td-domain'
    if (trail.domain) {
      const a = document.createElement('a')
      a.href = `https://${trail.domain}`
      a.target = '_blank'
      a.rel = 'noopener'
      a.textContent = trail.domain
      tdDomain.appendChild(a)
    } else {
      tdDomain.innerHTML = '<span class="bc-td-null">—</span>'
    }

    const tdStatus = document.createElement('td')
    const badge = document.createElement('span')
    badge.className = `bc-status-badge bc-status-badge--${trail.status}`
    badge.textContent = trail.status
    tdStatus.appendChild(badge)

    const tdActions = document.createElement('td')
    tdActions.className = 'bc-td-actions'
    const editLink = document.createElement('a')
    editLink.href = `#trail-manager/${encodeURIComponent(trail.id)}`
    editLink.className = 'bc-action-link'
    editLink.title = `Edit tokens for ${trail.id}`
    editLink.innerHTML = `${ph('pencil-simple', 13)} Edit Tokens`
    tdActions.appendChild(editLink)

    tr.appendChild(tdFullName)
    tr.appendChild(tdName)
    tr.appendChild(tdDomain)
    tr.appendChild(tdStatus)
    tr.appendChild(tdActions)
    tbody.appendChild(tr)
  })

  tableEl.style.display = 'table'
}

// ---------------------------------------------------------------------------
// Edit meta modal
// ---------------------------------------------------------------------------
function openMetaModal (trail) {
  const existing = document.getElementById('bc-meta-modal')
  if (existing) existing.remove()

  const overlay = document.createElement('div')
  overlay.id = 'bc-meta-modal'
  overlay.className = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:420px">
      <div id="meta-edit-view">
        <h3 class="modal-title">Edit site info — ${escapeHtml(trail.id)}</h3>
        <div class="wiz-field" style="margin-top:16px">
          <label for="meta-fullname">Full site name</label>
          <input type="text" id="meta-fullname" value="${escapeHtml(trail.fullName || '')}" placeholder="e.g. Lake Powell Resort &amp; Marina" autocomplete="off">
        </div>
        <div class="wiz-field" style="margin-top:12px">
          <label for="meta-domain">Primary domain</label>
          <input type="text" id="meta-domain" value="${escapeHtml(trail.domain || '')}" placeholder="e.g. lakepowellresort.com" autocomplete="off">
        </div>
        <div class="wiz-field" style="margin-top:12px">
          <label for="meta-slug">Trail slug <span style="font-weight:400;color:var(--color-text-muted,#888);font-size:11px">(repo directory name)</span></label>
          <input type="text" id="meta-slug" value="${escapeHtml(trail.id)}" placeholder="e.g. amlt" autocomplete="off" spellcheck="false">
        </div>
        <div id="meta-error" class="wiz-field-error" style="display:none"></div>
        <div class="modal-actions" style="margin-top:20px;display:flex;gap:8px;justify-content:flex-end">
          <button id="meta-delete-open" class="btn btn-outlined" style="margin-right:auto;color:var(--color-danger,#c0392b)">Delete site</button>
          <button id="meta-cancel" class="btn btn-outlined">Cancel</button>
          <button id="meta-save" class="btn btn-primary">Save</button>
        </div>
      </div>
      <div id="meta-delete-view" style="display:none">
        <h3 class="modal-title">Delete site — ${escapeHtml(trail.id)}</h3>
        <div class="remove-warning">
          <p>This will remove <strong>${escapeHtml(trail.id)}</strong> from Trailhead and the brand index. It will no longer appear in this tool and will not repopulate automatically.</p>
          <p class="remove-warning-note">This does <strong>not</strong> remove any code, AEM content, or live site.</p>
        </div>
        <div class="form-group" style="margin-top:16px">
          <label class="remove-check-label">
            <input type="checkbox" id="meta-delete-acknowledge">
            I understand this removes the site from Trailhead only
          </label>
        </div>
        <div class="form-group">
          <label for="meta-delete-confirm-name">Type <strong>${escapeHtml(trail.id)}</strong> to confirm</label>
          <input type="text" id="meta-delete-confirm-name" autocomplete="off" spellcheck="false">
        </div>
        <div id="meta-delete-result" class="publish-result"></div>
        <div class="modal-actions" style="margin-top:20px;display:flex;gap:8px;justify-content:flex-end">
          <button id="meta-delete-back" class="btn btn-outlined">Back</button>
          <button id="meta-delete-confirm" class="btn btn-danger" disabled>Delete site</button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('visible'))

  const editView   = overlay.querySelector('#meta-edit-view')
  const deleteView = overlay.querySelector('#meta-delete-view')

  overlay.querySelector('#meta-cancel').addEventListener('click', () => overlay.remove())
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })

  overlay.querySelector('#meta-delete-open').addEventListener('click', () => {
    editView.style.display = 'none'
    deleteView.style.display = 'block'
  })

  overlay.querySelector('#meta-delete-back').addEventListener('click', () => {
    deleteView.style.display = 'none'
    editView.style.display = 'block'
  })

  const deleteAck        = overlay.querySelector('#meta-delete-acknowledge')
  const deleteNameInput  = overlay.querySelector('#meta-delete-confirm-name')
  const deleteConfirmBtn = overlay.querySelector('#meta-delete-confirm')

  function updateDeleteConfirmState () {
    deleteConfirmBtn.disabled = !(deleteNameInput.value.trim() === trail.id && deleteAck.checked)
  }
  deleteAck.addEventListener('change', updateDeleteConfirmState)
  deleteNameInput.addEventListener('input', updateDeleteConfirmState)

  deleteConfirmBtn.addEventListener('click', async () => {
    const resultEl = overlay.querySelector('#meta-delete-result')
    deleteConfirmBtn.disabled = true
    resultEl.innerHTML = '<span class="spinner"></span> Deleting…'
    try {
      await actionWebInvoke(getActionUrl('remove-brand'), getAuthHeaders(), { brandName: trail.id })
      overlay.remove()
      showToast(`Deleted site ${trail.id}`, 'success')
      loadTrails()
    } catch (err) {
      resultEl.innerHTML = `<span class="publish-error">${escapeHtml(err.message)}</span>`
      updateDeleteConfirmState()
    }
  })

  overlay.querySelector('#meta-save').addEventListener('click', async () => {
    const fullName = overlay.querySelector('#meta-fullname').value.trim()
    const domain = overlay.querySelector('#meta-domain').value.trim()
    const newSlug = overlay.querySelector('#meta-slug').value.trim().toLowerCase()
      .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const errEl = overlay.querySelector('#meta-error')
    const saveBtn = overlay.querySelector('#meta-save')

    if (!newSlug) {
      errEl.textContent = 'Trail slug cannot be empty'
      errEl.style.display = 'block'
      return
    }
    errEl.style.display = 'none'
    saveBtn.disabled = true
    saveBtn.textContent = 'Saving…'

    try {
      const slugChanged = newSlug !== trail.id
      if (slugChanged) {
        await actionWebInvoke(getActionUrl('manage-tokens'), getAuthHeaders(), {
          operation: 'rename',
          brandName: trail.id,
          newBrandName: newSlug
        })
      }
      await actionWebInvoke(getActionUrl('manage-tokens'), getAuthHeaders(), {
        operation: 'update-meta',
        brandName: slugChanged ? newSlug : trail.id,
        fullName,
        domain
      })
      overlay.remove()
      showToast(slugChanged ? `Renamed ${trail.id} → ${newSlug}` : `Updated info for ${trail.id}`, 'success')
      loadTrails()
    } catch (err) {
      errEl.textContent = err.message
      errEl.style.display = 'block'
      saveBtn.disabled = false
      saveBtn.textContent = 'Save'
    }
  })
}
