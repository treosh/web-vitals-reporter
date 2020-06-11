import { onHidden } from 'web-vitals/dist/lib/onHidden'
import { generateUniqueID } from 'web-vitals/dist/lib/generateUniqueID'

/** @typedef {Object<string,any>} Result */
/** @typedef {import('web-vitals').Metric | Object<string,any>} Metric */
/** @typedef {{ effectiveType: 'slow-2g' | '2g' | '3g' | '4g', rtt: number, downlink: number }} NetworkInformation */

/**
 * Create Web Vitals API reporter, that accepts `Metric` values and sends it to `url`
 * using `navigator.sendBeackon` when avaiable or fallbacks back to XMLHttpRequest.
 *
 * The function sends request only once.
 * Use `onSend` to implement a custom logic.
 *
 * @param {string} url
 * @param {{ initial?: object, mapMetric?: (metric: Metric, result: Result) => object, onSend?: (url: string, values: Result) => any }} [opts]
 * @return {(metric: Metric) => void}
 */

export function createApiReporter(url, opts = {}) {
  let isSent = false
  let isCalled = false
  let result = /** @type {Result} */ ({ id: generateUniqueID(), ...opts.initial })

  const sendValues = () => {
    if (isSent) return // data is already sent
    if (!isCalled) return // no data collected
    isSent = true
    if (opts.onSend) {
      opts.onSend(url, result)
    } else {
      if (typeof navigator === 'undefined') return
      if (navigator.sendBeacon) return navigator.sendBeacon(url, JSON.stringify(result))
      const client = new XMLHttpRequest()
      client.open('POST', url, false) // third parameter indicates sync xhr
      client.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8')
      client.send(JSON.stringify(result))
    }
  }

  const mapMetric =
    opts.mapMetric ||
    function (metric) {
      const isWebVital = ['FCP', 'TTFB', 'LCP', 'CLS', 'FID'].indexOf(metric.name) !== -1
      return { [metric.name]: isWebVital ? round(metric.value, metric.name === 'CLS' ? 4 : 0) : metric.value }
    }

  /** @param {Metric} metric */
  const report = (metric) => {
    if (!isCalled) isCalled = true
    result = { ...result, ...mapMetric(metric, result) }
  }

  // should be the last call to capture latest CLS
  setTimeout(() => {
    onHidden(({ isUnloading }) => {
      if (isUnloading) {
        report({ name: 'duration', value: now() })
        sendValues()
      }
    })
  })

  return report
}

/**
 * Get device information.
 * - Effective connection type: https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
 * - Device memory: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
 */

export function getDeviceInfo() {
  const nav = /** @type {null | (Navigator & { deviceMemory: number, connection: NetworkInformation })} */ (typeof navigator ===
  'undefined'
    ? null
    : navigator)
  const conn = nav && nav.connection ? nav.connection : null
  return {
    url: location ? location.href : null,
    referrer: document ? document.referrer : null,
    userAgent: nav ? nav.userAgent : null,
    memory: nav ? nav.deviceMemory : null,
    cpus: nav ? nav.hardwareConcurrency : null,
    connection: conn ? { effectiveType: conn.effectiveType, rtt: conn.rtt, downlink: conn.downlink } : {},
  }
}

/**
 * Get time since a session started.
 */

function now() {
  const perf = typeof performance === 'undefined' ? null : performance
  return perf && perf.now ? round(perf.now()) : null
}

/**
 * Round, source: https://stackoverflow.com/a/18358056
 *
 * @param {number} val
 * @param {number} [precision]
 * @return {number}
 */

function round(val, precision = 0) {
  // @ts-ignore
  return +(Math.round(`${val}e+${precision}`) + `e-${precision}`)
}
