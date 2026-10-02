import actions from '../config.json'
import actionWebInvoke from '../utils.js'
import { initHeader } from '../header.js'
import { getAuthHeaders, showToast, setLoading } from '../app.js'
import { ph } from '../icons.js'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STEPS = [
  { label: 'Basics' },
  { label: 'Review' },
]

// ---------------------------------------------------------------------------
// Wizard state (reset each mount)
// ---------------------------------------------------------------------------
let wiz = null

function resetWiz () {
  wiz = {
    step: 0,
    form: {
      siteName: '',
      fullName: '',
      domain: '',
      siteCode: ''
    },
    nameError: null,
    submitted: false,
    submitResult: null
  }
}

function getActionUrl (name) {
  if (actions && actions[name]) return actions[name]
  return `/api/v1/web/AramarkTrailhead/${name}`
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------
export function mount (container) {
  resetWiz()

  container.innerHTML = `
    <div class="wiz-view">
      <div class="wiz-rail-wrap">
        <span class="wiz-eyebrow">Trail Builder</span>
        <h1 class="wiz-page-title">Create a new trail</h1>
        <div class="wiz-steps" id="wiz-steps" role="list"></div>
      </div>
      <div class="wiz-body">
        <div class="wiz-body-inner" id="wiz-body"></div>
      </div>
      <div class="wiz-footer">
        <div class="wiz-footer-inner">
          <button id="wiz-btn-back" class="btn btn-outlined" disabled>Back</button>
          <button id="wiz-btn-next" class="btn btn-primary">
            Continue ${ph('arrow-right', 13)}
          </button>
        </div>
      </div>
    </div>
  `

  initHeader({ subtitle: 'Trail Builder &middot; <strong>New Trail</strong>' })

  container.querySelector('#wiz-btn-back').addEventListener('click', goBack)
  container.querySelector('#wiz-btn-next').addEventListener('click', goNext)

  renderStepRail()
  renderStep()
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
function canAdvance () {
  if (wiz.step === 0) return wiz.form.siteName.trim().length > 0 && !wiz.nameError
  return !wiz.submitted
}

function goNext () {
  if (!canAdvance()) return
  if (wiz.step === 0) {
    validateSiteNameThenAdvance()
    return
  }
  if (wiz.step < STEPS.length - 1) {
    wiz.step++
    renderStepRail()
    renderStep()
  } else {
    submitForm()
  }
}

async function validateSiteNameThenAdvance () {
  const nextBtn = document.getElementById('wiz-btn-next')
  if (nextBtn) { nextBtn.disabled = true; nextBtn.textContent = 'Checking…' }

  try {
    const res = await actionWebInvoke(
      getActionUrl('list-sites'),
      getAuthHeaders(),
      {}
    )
    const existing = (res.sites || []).map((s) => s.name || s)
    const name = wiz.form.siteName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    if (existing.includes(name)) {
      wiz.nameError = `A site named “${name}” already exists. Choose a different name.`
    } else {
      wiz.nameError = null
      wiz.step++
    }
  } catch (_err) {
    // If check fails, allow advance — the action itself will catch duplicates
    wiz.nameError = null
    wiz.step++
  }

  renderStepRail()
  renderStep()
}

function goBack () {
  if (wiz.step > 0) {
    wiz.step--
    renderStepRail()
    renderStep()
  }
}

function updateNavButtons () {
  const backBtn = document.getElementById('wiz-btn-back')
  const nextBtn = document.getElementById('wiz-btn-next')
  if (!backBtn) return

  backBtn.style.visibility = wiz.step === 0 ? 'hidden' : ''
  backBtn.disabled = wiz.step === 0

  const isLast = wiz.step === STEPS.length - 1
  nextBtn.innerHTML = isLast
    ? 'Create Site'
    : `Continue ${ph('arrow-right', 13)}`
  nextBtn.className = (isLast ? 'btn btn-secondary' : 'btn btn-primary') + (canAdvance() ? '' : ' btn-disabled')
  nextBtn.disabled  = !canAdvance()
}

// ---------------------------------------------------------------------------
// Step rail
// ---------------------------------------------------------------------------
function renderStepRail () {
  const rail = document.getElementById('wiz-steps')
  if (!rail) return
  rail.innerHTML = ''

  STEPS.forEach(({ label }, i) => {
    const stepEl = document.createElement('div')
    stepEl.className = 'wiz-step'
    stepEl.setAttribute('role', 'listitem')

    const dot = document.createElement('div')
    dot.className = 'wiz-step-dot'
    if (i < wiz.step) {
      dot.classList.add('wiz-step-dot--done')
      dot.innerHTML = checkSvg(12)
    } else if (i === wiz.step) {
      dot.classList.add('wiz-step-dot--current')
      dot.textContent = i + 1
    } else {
      dot.classList.add('wiz-step-dot--pending')
      dot.textContent = i + 1
    }

    const labelEl = document.createElement('span')
    labelEl.className = 'wiz-step-label' + (i === wiz.step ? ' wiz-step-label--current' : '')
    labelEl.textContent = label

    stepEl.appendChild(dot)
    stepEl.appendChild(labelEl)
    rail.appendChild(stepEl)

    if (i < STEPS.length - 1) {
      const connector = document.createElement('div')
      connector.className = 'wiz-step-connector'
      rail.appendChild(connector)
    }
  })

  updateNavButtons()
}

// ---------------------------------------------------------------------------
// Step renderers
// ---------------------------------------------------------------------------
function renderStep () {
  const body = document.getElementById('wiz-body')
  if (!body) return
  body.innerHTML = ''
  body.appendChild(renderStepContent(wiz.step))
}

function renderStepContent (step) {
  if (step === 0) return renderStepBasics()
  return renderStepReview()
}

function renderStepBasics () {
  const wrap = div('wiz-step-content')
  const grid = div('wiz-field-grid')
  grid.appendChild(field('Full site name', 'fullName', 'text', 'e.g. Lake Powell Resort & Marina', 'Human-readable display name shown in Basecamp and Trail Manager'))
  grid.appendChild(field('Brand slug', 'siteName', 'text', 'e.g. arches-resort', 'Lowercase, hyphenated — used for the brand folder, Trailhead state, and release branch', true))
  grid.appendChild(field(
    'EDS site code',
    'siteCode',
    'text',
    'e.g. ar or lake-powell',
    'Helix site ID in delivery URLs (…--{code}--org.aem.live). Defaults to initials from the brand slug; use the ID registered in EDS. Can be changed later in Basecamp.'
  ))
  grid.appendChild(field('Primary domain', 'domain', 'text', 'e.g. archesresort.com', 'Optional — used in PR title, checklist DNS step, and README'))
  wrap.appendChild(grid)

  if (wiz.nameError) {
    const err = div('wiz-field-error')
    err.textContent = wiz.nameError
    wrap.appendChild(err)
  }

  return wrap
}

function field (label, key, type, placeholder, hint, required) {
  const wrap = div('wiz-field')
  const lbl  = document.createElement('label')
  lbl.textContent = label
  const inp  = document.createElement('input')
  inp.type = type
  inp.value = wiz.form[key] || ''
  inp.placeholder = placeholder || ''
  if (required) inp.required = true
  inp.addEventListener('input', () => {
    wiz.form[key] = inp.value
    if (key === 'siteName') wiz.nameError = null
    updateNavButtons()
  })
  wrap.appendChild(lbl)
  wrap.appendChild(inp)
  if (hint) {
    const sm = document.createElement('small')
    sm.textContent = hint
    wrap.appendChild(sm)
  }
  return wrap
}


function renderStepReview () {
  const f = wiz.form
  const siteName = f.siteName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  const autoCode = siteName.split('-').map((w) => w.charAt(0)).join('').slice(0, 9)
  const siteCode = (f.siteCode || '').trim().toLowerCase() || autoCode
  const previewUrl = `https://main--${siteCode}--aramark-destinations.aem.page`

  const wrap = div('wiz-step-content')

  // --- Summary ---
  const summaryHead = document.createElement('h3')
  summaryHead.className = 'wiz-review-heading'
  summaryHead.textContent = 'What you’re creating'
  wrap.appendChild(summaryHead)

  const tableData = [
    ['Full site name', f.fullName || '—'],
    ['Brand slug', siteName],
    ['EDS site code', siteCode],
    ['Primary domain', f.domain || '—'],
    ['Preview URL (post-registration)', previewUrl + '/'],
  ]
  const table = div('wiz-review-table')
  tableData.forEach(([key, val]) => {
    const row = div('wiz-review-row')
    const k = div('wiz-review-key'); k.textContent = key
    const v = div('wiz-review-val'); v.textContent = val
    row.appendChild(k); row.appendChild(v); table.appendChild(row)
  })
  wrap.appendChild(table)

  // --- Files created ---
  const filesHead = document.createElement('h3')
  filesHead.className = 'wiz-review-heading'
  filesHead.textContent = 'Starter files added to the setup PR'
  wrap.appendChild(filesHead)

  const fileList = document.createElement('ul')
  fileList.className = 'wiz-artifact-list'
  ;[
    `brands/${siteName}/tokens.css`,
    `brands/${siteName}/overrides.js`,
    `brands/${siteName}/README.md`,
    `brands/${siteName}/site.json`,
    `brands/${siteName}/cf-overlay-paths.json`,
    `brands/${siteName}-dev/cf-overlay-paths.json`,
    `brands/${siteName}-staging/cf-overlay-paths.json`,
    `cf-templates/sites/${siteName}.json`,
    'scripts/dev-brand.js (updated)',
  ].forEach((f) => {
    const li = document.createElement('li'); li.textContent = f; fileList.appendChild(li)
  })
  wrap.appendChild(fileList)

  // --- What “Create Site” does ---
  const actionHead = document.createElement('h3')
  actionHead.className = 'wiz-review-heading'
  actionHead.textContent = 'What Trailhead creates'
  wrap.appendChild(actionHead)

  const actionDesc = document.createElement('p')
  actionDesc.className = 'wiz-review-desc'
  actionDesc.textContent = 'Trailhead opens a pull request against staging with the starter files above and creates a GitHub issue with a launch checklist. It does not register the EDS site, create AEM content, or provision the Content Fragment overlay.'
  wrap.appendChild(actionDesc)

  // --- What happens next ---
  const nextHead = document.createElement('h3')
  nextHead.className = 'wiz-review-heading'
  nextHead.textContent = 'Remaining setup (completed outside Trailhead)'
  wrap.appendChild(nextHead)

  const steps = [
    ['1. Review and merge the setup PR', 'A developer reviews the generated files and merges the PR into staging.'],
    ['2. Register the EDS site', 'A GitHub org owner completes the Admin API registration steps in the launch checklist. Trailhead does not perform this registration.'],
    ['3. Create and publish AEM content', `The site team creates and publishes content in AEM Author at /content/${siteName}. Trailhead does not create or publish AEM content.`],
    ['4. Provision the Content Fragment overlay (if needed)', `A developer completes cf-templates/sites/${siteName}.json and runs the repository provisioning script. Trailhead only adds the starter configuration files; it does not provision the overlay.`],
    ['5. Complete launch tasks', 'The site team handles applicable DNS, indexing, redirect, and QA work. Trailhead does not deploy or launch the site.'],
  ]

  const stepList = div('wiz-next-steps')
  steps.forEach(([title, desc]) => {
    const item = div('wiz-next-step')
    const t = document.createElement('strong'); t.textContent = title
    const d = document.createElement('p'); d.textContent = desc
    item.appendChild(t); item.appendChild(d)
    stepList.appendChild(item)
  })
  wrap.appendChild(stepList)

  return wrap
}

// ---------------------------------------------------------------------------
// Form submission
// ---------------------------------------------------------------------------
async function submitForm () {
  wiz.submitted = true
  updateNavButtons()
  setLoading(true, `Creating trail '${wiz.form.siteName}'…`)

  try {
    const res = await actionWebInvoke(
      getActionUrl('create-site'),
      getAuthHeaders(),
      {
        siteName:    wiz.form.siteName,
        fullName:    wiz.form.fullName,
        domain:      wiz.form.domain,
        siteCode:    (wiz.form.siteCode || '').trim() || undefined,
        brandPreset: 'base',
      }
    )
    wiz.submitResult = res
    renderSuccessState(res)
  } catch (err) {
    wiz.submitted = false
    updateNavButtons()
    showToast(`Site creation failed: ${err.message}`, 'error')
  } finally {
    setLoading(false)
  }
}

function renderSuccessState (res) {
  const body = document.getElementById('wiz-body')
  body.innerHTML = ''

  const wrap = div('wiz-success')

  const iconWrap = div('wiz-success-icon')
  iconWrap.innerHTML = checkCircleSvg(28)
  wrap.appendChild(iconWrap)

  const h2 = document.createElement('h2')
  h2.textContent = `${res.siteName || wiz.form.siteName} scaffolded`
  wrap.appendChild(h2)

  const desc = document.createElement('p')
  desc.textContent = 'Trailhead created the starter files and opened a setup PR. Complete the remaining setup tasks in the launch checklist before using the site.'
  wrap.appendChild(desc)

  const links = div('wiz-success-links')

  if (res.github && res.github.pr) {
    const prLink = document.createElement('a')
    prLink.href      = res.github.pr.html_url
    prLink.target    = '_blank'
    prLink.rel       = 'noopener'
    prLink.className = 'btn btn-primary'
    prLink.textContent = 'View PR'
    links.appendChild(prLink)
  }

  const basecampLink = document.createElement('a')
  basecampLink.href      = '#basecamp'
  basecampLink.className = 'btn btn-outlined'
  basecampLink.textContent = 'Back to Basecamp'
  links.appendChild(basecampLink)

  const tokenLink = document.createElement('a')
  tokenLink.href      = '#trail-manager'
  tokenLink.className = 'btn btn-outlined'
  tokenLink.textContent = 'Open Trail Manager'
  links.appendChild(tokenLink)

  wrap.appendChild(links)
  body.appendChild(wrap)

  const footer = document.querySelector('.wiz-footer')
  if (footer) footer.style.display = 'none'
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function div (className) {
  const el = document.createElement('div')
  if (className) el.className = className
  return el
}

const checkSvg       = s => ph('check', s)
const checkCircleSvg = s => ph('check-circle', s)
