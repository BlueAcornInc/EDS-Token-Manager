import { state } from './app.js'

const SVG_LOGO = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E0A165" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 18l5-9 4 6 3-5 6 8"/></svg>`

function linkHtml (links) {
  return links.map(l => {
    const style = l.primary
      ? 'font-size:12px;padding:6px 12px;background:rgba(255,255,255,0.08);color:#F5F1E8;border:1.5px solid rgba(255,255,255,0.2);border-radius:4px;text-decoration:none'
      : 'font-size:12px;padding:6px 12px;color:#AFC4CC;border-color:rgba(255,255,255,0.2);text-decoration:none'
    const cls = l.primary ? 'btn' : 'btn btn-outlined'
    return `<a href="${l.href}" class="${cls}" style="${style}">${l.label}</a>`
  }).join('')
}

export function initHeader ({ subtitle = '', links = [] } = {}) {
  const header = document.getElementById('app-header')
  if (!header) return

  header.innerHTML = `
    <a href="#basecamp" class="app-header-logo" style="text-decoration:none;color:inherit">
      ${SVG_LOGO}
      Trailhead
    </a>
    <div class="app-header-subtitle">${subtitle}</div>
    <div style="flex:1"></div>
    <div class="app-header-right">
      ${linkHtml(links)}
      <div class="avatar-chip" id="avatar-chip" style="position:relative" title="Not signed in">
        <span id="avatar-initials"></span>
        <span id="avatar-status" style="position:absolute;bottom:1px;right:1px;width:9px;height:9px;border-radius:50%;background:#dc3545;border:2px solid #1a2332;display:block" title="Not authenticated"></span>
      </div>
    </div>
  `

  populateAvatarFromToken()
}

function populateAvatarFromToken () {
  // Prefer the live profile cached by the EC Shell ready event
  if (state.imsProfile) {
    updateAvatarChip(state.imsProfile)
    return
  }
  // Fallback: decode JWT from localStorage (covers page-reload before ready fires)
  try {
    const token = localStorage.getItem('tokenManager.imsToken') || ''
    if (!token) return
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(b64))
    const displayName = payload.name ||
      [payload.given_name, payload.family_name].filter(Boolean).join(' ') || ''
    updateAvatarChip({ displayName, email: payload.email || '' })
  } catch {
    // Ignore malformed or unavailable authentication tokens.
  }
}

export function updateAvatarChip (profile) {
  const chip = document.getElementById('avatar-chip')
  const initialsEl = document.getElementById('avatar-initials')
  const statusEl = document.getElementById('avatar-status')
  if (!chip) return

  if (profile && (profile.displayName || profile.email)) {
    const displayName = profile.displayName || ''
    const parts = displayName.trim().split(' ')
    const initials = displayName
      ? (parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase())
      : profile.email.slice(0, 2).toUpperCase()

    if (initialsEl) initialsEl.textContent = initials
    chip.title = displayName || profile.email

    if (statusEl) {
      statusEl.style.background = '#28a745'
      statusEl.title = 'Authenticated'
    }
  } else {
    if (initialsEl) initialsEl.textContent = ''
    chip.title = 'Not signed in'
    if (statusEl) {
      statusEl.style.background = '#dc3545'
      statusEl.title = 'Not authenticated'
    }
  }
}
