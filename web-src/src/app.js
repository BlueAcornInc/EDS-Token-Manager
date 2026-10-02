import 'regenerator-runtime/runtime'
import Runtime, { init } from '@adobe/exc-app'
import actions from './config.json'
import { updateAvatarChip } from './header.js'
import * as basecampView from './views/basecamp.js'
import * as contentExplorerView from './views/content-explorer.js'
import * as trailManagerView from './views/trail-manager.js'
import * as wizardView from './views/wizard.js'

// ---------------------------------------------------------------------------
// Auth constants
// ---------------------------------------------------------------------------
const LS_IMS_TOKEN = 'tokenManager.imsToken'
const LS_IMS_ORG   = 'tokenManager.imsOrgId'

// ---------------------------------------------------------------------------
// Shared state — imported by view modules
// ---------------------------------------------------------------------------
export const state = {
  imsProfile: null,
  actionUrls: {}
}

// ---------------------------------------------------------------------------
// Auth helpers — exported for view modules
// ---------------------------------------------------------------------------
export function getAuthHeaders () {
  const token = localStorage.getItem(LS_IMS_TOKEN) || ''
  const orgId = localStorage.getItem(LS_IMS_ORG) || ''
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (orgId) headers['x-gw-ims-org-id'] = orgId
  return headers
}

export function hasToken () {
  return !!(localStorage.getItem(LS_IMS_TOKEN))
}

export function getActionUrl (actionName) {
  if (state.actionUrls[actionName]) return state.actionUrls[actionName]
  return `/api/v1/web/AramarkTrailhead/${actionName}`
}

// ---------------------------------------------------------------------------
// Shared UI — exported for view modules
// ---------------------------------------------------------------------------
export function showToast (message, type = 'info') {
  const container = document.getElementById('toast-container')
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  container.appendChild(toast)
  requestAnimationFrame(() => toast.classList.add('visible'))
  setTimeout(() => {
    toast.classList.remove('visible')
    setTimeout(() => toast.remove(), 300)
  }, 3500)
}

export function setLoading (active, message = 'Loading…') {
  const overlay = document.getElementById('loading-overlay')
  const msg = document.getElementById('loading-message')
  if (overlay) overlay.classList.toggle('visible', active)
  if (msg) msg.textContent = message
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------
const VIEWS = {
  'basecamp':         basecampView,
  'content-explorer': contentExplorerView,
  'trail-manager':    trailManagerView,
  'wizard':           wizardView,
}

let currentUnmount = null

export function navigateTo (viewName) {
  location.hash = viewName
}

function resolveView () {
  const hash = location.hash.replace(/^#/, '')
  const [viewName, param] = hash.split('/')
  const view = VIEWS[viewName] ? viewName : 'basecamp'
  return { view, param: param || null }
}

function renderView ({ view, param }) {
  if (currentUnmount) { currentUnmount(); currentUnmount = null }

  const container = document.getElementById('app-view')
  container.className = `view-${view}`
  container.innerHTML = ''

  const result = VIEWS[view].mount(container, param)
  currentUnmount = typeof result === 'function' ? result : null
}

// ---------------------------------------------------------------------------
// Auth gate
// ---------------------------------------------------------------------------
function showSignIn () {
  document.getElementById('sign-in-screen').style.display = 'flex'
}

function hideSignIn () {
  document.getElementById('sign-in-screen').style.display = 'none'
}

// ---------------------------------------------------------------------------
// EC Shell runtime (fires once; injects IMS token + profile)
// ---------------------------------------------------------------------------
function initRuntime () {
  const runtime = Runtime()
  let booted = false

  runtime.on('ready', ({ imsOrg, imsToken, imsProfile }) => {
    if (imsToken) localStorage.setItem(LS_IMS_TOKEN, imsToken)
    if (imsOrg)   localStorage.setItem(LS_IMS_ORG, imsOrg)
    state.imsProfile = imsProfile
    hideSignIn()

    if (!booted) {
      booted = true
      runtime.done()
      renderView(resolveView())
    }

    // Avatar chip is created by initHeader inside mount() — update it after the view renders
    updateAvatarChip(imsProfile)
    // Subsequent ready events are token refreshes — token is already updated in localStorage
    // so the next action call will pick up the fresh token automatically
  })
  runtime.solution = { icon: 'AdobeExperienceCloud', title: 'AramarkTrailhead' }
  runtime.title = 'AramarkTrailhead'
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
window.onload = async () => {
  if (actions && Object.keys(actions).length > 0) {
    state.actionUrls = actions
  }

  try {
    // eslint-disable-next-line no-undef
    require('./exc-runtime')
  } catch (e) {
    // local dev polyfill only — not present in EC Shell
  }
  init(initRuntime)

  window.addEventListener('hashchange', () => {
    if (hasToken()) renderView(resolveView())
  })

  // Always wait for EC Shell ready before rendering — never trust a stale
  // localStorage token. The ready handler above renders the view once the
  // fresh token arrives and stores it.
  showSignIn()
}
