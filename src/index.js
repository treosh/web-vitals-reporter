import { onHidden } from 'web-vitals/dist/lib/onHidden'

/**
 * Create Web Vitals API reporter, that accepts `Metric` values and sends it to `url`
 * using `navigator.sendBeackon` when avaiable or fallbacks back to XMLHttpRequest.
 *
 * The function sends request only once.
 * Use `onSend` to implement a custom logic.
 *
 * @param {string} url
 * @param {{ initial?: object, mapMetric?: (metric: import('web-vitals').Metric) => object, beforeSend?: function, onSend?: (url: string, values: object) => any }} [opts]
 * @return {(metric: import('web-vitals').Metric) => void}
 */

export function createApiReporter(url, opts = {}) {
  let isSent = false
  let result = {
    ...(opts.initial || {}),
    ...getDeviceInfo(),
    metrics: /** @type object[] */ ([]),
  }

  const mapMetric =
    opts.mapMetric ||
    function (m) {
      return { name: m.name, value: m.value, id: m.id }
    }

  const sendValues = () => {
    if (isSent) return // data is already sent
    if (!result.metrics.length) return // no data collected
    isSent = true
    if (opts.beforeSend) opts.beforeSend()
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

  onHidden(sendValues, true)

  return function sendToAnalytics(metric) {
    result.metrics.push(mapMetric(metric))
  }
}

/**
 * Get device information.
 * - Effective connection type: https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
 * - Device memory: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
 */

function getDeviceInfo() {
  const loc = typeof location === 'undefined' ? null : location
  const doc = typeof document === 'undefined' ? null : document
  const nav = /** @type {null | (Navigator & { deviceMemory: number, connection: { effectiveType: 'slow-2g' | '2g' | '3g' | '4g', rtt: number, downlink: number } })} */ (typeof navigator ===
  'undefined'
    ? null
    : navigator)
  const conn = nav && nav.connection ? nav.connection : null

  return {
    url: loc ? loc.href : undefined,
    referrer: doc ? doc.referrer : undefined,
    userAgent: nav ? nav.userAgent : undefined,
    memory: nav ? nav.deviceMemory : undefined,
    cpus: nav ? nav.hardwareConcurrency : undefined,
    connection: conn ? { effectiveType: conn.effectiveType, rtt: conn.rtt, downlink: conn.downlink } : {},
  }
}
