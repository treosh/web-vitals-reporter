import { create } from 'canvas-confetti'
import { getFCP, getTTFB, getLCP, getCLS, getFID } from 'web-vitals'
import { createApiReporter, getDeviceInfo } from '../../src'
import 'first-input-delay'

// confetti 🎊
const $canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('canvas'))
create($canvas, { resize: true })({ particleCount: 200, spread: 200 })

// Init report callback with information about the browser.
const report = createApiReporter('/analytics', { initial: getDeviceInfo() })

// setup web-vitals
getTTFB(report)
getFCP(report)
getLCP(report)
getFID(report)
getCLS(report)
