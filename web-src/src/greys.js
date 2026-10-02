/**
 * Brand-tinted grey scale generation (OKLCH, no external deps).
 * Ported from tools/generate-brand-greys.mjs.
 */

export const GREY_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']
const GREY_TARGET_CHROMA = 0.02
const GREY_CONTRAST_TOLERANCE = 0.1

function normalizeHex (hex) {
  const n = hex.replace('#', '')
  return n.length === 3 ? n.split('').map((c) => c + c).join('') : n
}

function hexToRgb (hex) {
  const full = normalizeHex(hex)
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16)
  ]
}

function rgbToHex ([r, g, b]) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`
}

function srgbToLinear (c) {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

function linearToSrgb (v) {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055
  return c * 255
}

function linearRgbToOklab ([r, g, b]) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
  const lR = Math.cbrt(l); const mR = Math.cbrt(m); const sR = Math.cbrt(s)
  return [
    0.2104542553 * lR + 0.7936177850 * mR - 0.0040720468 * sR,
    1.9779984951 * lR - 2.4285922050 * mR + 0.4505937099 * sR,
    0.0259040371 * lR + 0.7827717662 * mR - 0.8086757660 * sR
  ]
}

function oklabToLinearRgb ([L, a, b]) {
  const lR = L + 0.3963377774 * a + 0.2158037573 * b
  const mR = L - 0.1055613458 * a - 0.0638541728 * b
  const sR = L - 0.0894841775 * a - 1.2914855480 * b
  const lv = lR ** 3; const mv = mR ** 3; const sv = sR ** 3
  return [
    4.0767416621 * lv - 3.3077115913 * mv + 0.2309699292 * sv,
    -1.2684380046 * lv + 2.6097574011 * mv - 0.3413193965 * sv,
    -0.0041960863 * lv - 0.7034186147 * mv + 1.7076147010 * sv
  ]
}

function hexToOklch (hex) {
  const rgb = hexToRgb(hex).map(srgbToLinear)
  const [L, a, b] = linearRgbToOklab(rgb)
  const C = Math.sqrt(a * a + b * b)
  const H = (Math.atan2(b, a) * 180) / Math.PI
  return { L, C, H: H < 0 ? H + 360 : H }
}

function oklchToLinearRgb ({ L, C, H }) {
  const hRad = (H * Math.PI) / 180
  return oklabToLinearRgb([L, C * Math.cos(hRad), C * Math.sin(hRad)])
}

function oklchToHex ({ L, C, H }) {
  let lo = 0; let hi = C; let best = [0, 0, 0]
  Array.from({ length: 24 }).forEach(() => {
    const mid = (lo + hi) / 2
    const rgb = oklchToLinearRgb({ L, C: mid, H })
    if (rgb.every((v) => v >= -0.0005 && v <= 1.0005)) { best = rgb; lo = mid } else { hi = mid }
  })
  return rgbToHex(best.map(linearToSrgb))
}

export function relativeLuminance (hex) {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio (hexA, hexB) {
  const lA = relativeLuminance(hexA); const lB = relativeLuminance(hexB)
  const hi = Math.max(lA, lB); const lo = Math.min(lA, lB)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Generate brand-tinted grey scale from a primary hex color.
 * @param {string} primaryHex
 * @param {object} neutralDefaults - map of grey50..grey900 defaults
 * @returns {object} { grey50, grey100, ... grey900 }
 */
export function generateBrandGreys (primaryHex, neutralDefaults) {
  const { H: hue } = hexToOklch(primaryHex)

  const referenceContrast = GREY_STEPS.reduce((acc, step) => {
    const key = `grey${step}`
    const hex = neutralDefaults[key]
    acc[step] = {
      vsWhite: contrastRatio(hex, '#ffffff'),
      vsBlack: contrastRatio(hex, '#000000')
    }
    return acc
  }, {})

  const result = {}
  GREY_STEPS.forEach((step) => {
    const key = `grey${step}`
    const { L } = hexToOklch(neutralDefaults[key])
    const floorVsWhite = referenceContrast[step].vsWhite - GREY_CONTRAST_TOLERANCE
    const floorVsBlack = referenceContrast[step].vsBlack - GREY_CONTRAST_TOLERANCE

    let chroma = GREY_TARGET_CHROMA
    let hex = oklchToHex({ L, C: chroma, H: hue })
    let lo = 0; let hi = chroma

    Array.from({ length: 20 }).forEach(() => {
      const ok = contrastRatio(hex, '#ffffff') >= floorVsWhite &&
        contrastRatio(hex, '#000000') >= floorVsBlack
      if (ok) { lo = chroma; chroma = (chroma + hi) / 2 } else { hi = chroma; chroma = (chroma + lo) / 2 }
      hex = oklchToHex({ L, C: chroma, H: hue })
    })

    if (contrastRatio(hex, '#ffffff') < floorVsWhite || contrastRatio(hex, '#000000') < floorVsBlack) {
      hex = oklchToHex({ L, C: lo, H: hue })
    }
    result[key] = hex
  })

  return result
}
