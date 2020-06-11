# web-vitals-reporter

> A tiny (800 B) utility to simplify [web vitals](https://github.com/GoogleChrome/web-vitals) reporting.

The [web-vitals](https://github.com/GoogleChrome/web-vitals) is a small and powerful library to accurately measure [Web Vitals](https://web.dev/vitals/) (essential metrics for a healthy site). It has no opinion on how to report data from the field to analytics. The `web-vitals-reporter` makes collecting Web Vitals as simple, as sending one `POST` request.

**Features**:

- Collect [web vitals](https://github.com/GoogleChrome/web-vitals) with one request per session.
- Gather useful device information (dimensions).
- Handle edge-cases for Web Vitals collection (multiple CLS calls, round values).
- Report custom front-end metrics.
- Tiny (800 B), functional, and modular.

## Usage

Report [Core Web Vitals](https://web.dev/vitals/) to an API endpoint:

```js
import { getLCP, getFID, getCLS } from 'web-vitals'
import { createApiReporter } from 'web-vitals-reporter'

// Create a report function that sends a POST request at the end of the session.
// An example body: { id: '1591874424275-9122658877754', duration: 8357, LCP: 1721, FID: 3, CLS: 0.0319 }
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

Measure [Web Vitals and custom metrics for Next.js application](https://nextjs.org/docs/advanced-features/measuring-performance):

```js
import { createApiReporter } from 'web-vitals-reporter'

// init reporter
const report = createApiReporter('/analytics')

// export `reportWebVitals` custom function
export function reportWebVitals(metric) {
  if (metric.label === 'web-vitals') {
    report(metric)
  } else {
    report({ name: metric.name, value: metric.value })
  }
}

// or just:
export { report as reportWebVitals }
```

## API

### createApiReporter(url, [options])

Create a report function, that accepts [Web Vitals' Metric](https://github.com/GoogleChrome/web-vitals#metric) (or any `{ name: string, value: number }` object),
and sends collected data to `url` using a POST request.

![web vitals reporter](https://user-images.githubusercontent.com/158189/84431070-f3604d00-ac2a-11ea-8a2d-055caa756302.png)

<!-- - CLS is final only on the tab close (tip on local debug)
- avoid Lighthouse
- values are raw, you better collect rounded values (mapMetric)
- report any metric -->

- **initial**

Use initial option to provide an extra context for your data.

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

- **mapMetric(metric, result)**

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
