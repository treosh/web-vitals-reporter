# web-vitals-reporter

> A tiny (800 B) utility to simplify [web vitals](https://github.com/GoogleChrome/web-vitals) reporting.

The web-vitals library is small, flexible, and unopinated about reporting.
Avoid multiple requests and collect some extra dimensions aboud each session.

**Features**:

❶ Report [web vitals](https://github.com/GoogleChrome/web-vitals) with one request per session.
❷ Collect useful device information.
❹ Handles edge-cases for Web Vitals collection (like multiple CLS calls, and proper rounding).
❸ Simple abstraction to collect and report any front-end metric.

## Usage

Report [Core Web Vitals](https://web.dev/vitals/) to an API endpoint:

```js
import { getLCP, getFID, getCLS } from 'web-vitals'
import { createApiReporter } from 'web-vitals-reporter'

// Create a report function that sends a POST request at the end of the session.
// An example body: { id: '1591874424275-9122658877754', duration: 8357,
//                    LCP: 1721, FID: 3, CLS: 0.0319 }
const sendToAnalytics = createApiReporter('/analytics')

getLCP(sendToAnalytics)
getFID(sendToAnalytics)
getCLS(sendToAnalytics)
```

Report all [Web Vitals](https://web.dev/vitals/) with an extended device information:

```js
import { getFCP, getTTFB, getCLS, getFID, getLCP } from 'web-vitals'
import { createApiReporter, getDeviceInfo } from 'web-vitals-reporter'

// Init report callback and add information about a device.
// An example body: { id: '1591874402350-8969370227936', duration: 19185, url: 'https://treo.sh/', referrer: 'https://github.com/,
//                    userAgent: 'Mozilla/5.0 ...', cpus: 8, memory: 8, connection: {rtt: 100, downlink: 5, effectiveType: '4g'},
//                    TTFB: 253, FCP: 502, LCP: 1487, FID: 6, CLS: 1.5602 }
const sendToAnalytics = createApiReporter('/analytics', { initial: getDeviceInfo() })

getTTFB(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getFID(sendToAnalytics)
getCLS(sendToAnalytics)
```

## API

### createApiReporter(url, [options])

- CLS is final only on the tab close (tip on local debug)
- avoid Lighthouse
- values are raw, you better collect rounded values (mapMetric)
- report any metric

- **initial**

- **mapMetric(metric, result)**

- **onSend(url, result)**

```js
import { createApiReporter } from 'web-vitals-reporter'

// detect Lighthouse using an `userAgent`
const isLighthouse = Boolean(navigator.userAgent.match('Chrome-Lighthouse'))

// don't send results to API when a page tested with Lighthouse
const report = createApiReporter('/analytics', {
  onSend: isLighthouse ? (url, result) => console.log(result) : null,
})
```

### getDeviceInfo()

It is a helper that returns device information like a connection type, memory size, or the number of CPU cores.
Use these data to add dimensions to your analytics.

```js
import { getDeviceInfo } from 'web-vitals-reporter'
console.log(getDeviceInfo())

// printed in console:
{
  "url": "https://treo.sh/",
  "referrer": "https://github.com/",
  "userAgent": "Mozilla/5.0 ...",
  "cpus": 8,
  "memory": 8,
  "connection": { "rtt": 100, "downlink": 5, "effectiveType": "4g" }
}
```

Return types:

```ts
{
  // The page URL from `location.href`.
  url?: string,

  // The referrer value from `document.referrer`.
  // It's useful to detect unique visits, without cookies or fingerprinting
  // https://docs.simpleanalytics.com/uniques
  referrer?: string,

  // The value of `navigator.userAgent` for browser detection
  userAgent?: string,

  // An approximate amount of device memory in gigabytes:
  // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
  memory?: number,

  // The number of CPU cores:
  // https://developer.mozilla.org/en-US/docs/Web/API/NavigatorConcurrentHardware/hardwareConcurrency
  cpus?: number,

  // The network information:
  // https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
  connection?: {
    effectiveType: string,
    rtt: number,
    downlink: number,
  },
}
```

## Credits

Sponsored by [Treo.sh - Page speed monitoring made simple](https://treo.sh/).

[![](https://github.com/treosh/web-vitals-reporter/workflows/CI/badge.svg)](https://github.com/treosh/web-vitals-reporter/actions?workflow=CI)
[![](https://img.shields.io/npm/v/web-vitals-reporter.svg)](https://npmjs.org/package/web-vitals-reporter)
[![](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
