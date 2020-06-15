import { create } from 'canvas-confetti'
import { getFCP, getTTFB, getLCP, getCLS, getFID } from 'web-vitals'
import { createApiReporter, getDeviceInfo } from '../../src'
import 'first-input-delay'

// confetti 🎊
const $canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('canvas'))
create($canvas, { resize: true })({ particleCount: 200, spread: 200 })

// Init report callback with information about the browser.
const sendToAnalytics = createApiReporter('/analytics', {
  initial: getDeviceInfo(),
  beforeSend(result) {
    console.log('beforeSend', JSON.stringify(result))
  },
})

// setup web-vitals
getTTFB(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getFID(sendToAnalytics)
getCLS(sendToAnalytics)
