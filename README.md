# web-vitals-reporter

> A tiny (800 B) utility to simplify [web vitals](https://github.com/GoogleChrome/web-vitals) reporting.

The [web-vitals](https://github.com/GoogleChrome/web-vitals) is a small and powerful library that helps to accurately measure [Web Vitals](https://web.dev/vitals/) (essential metrics for a healthy site). It has no opinion on how to report data from the field to analytics. The `web-vitals-reporter` makes collecting Web Vitals as simple, as sending one `POST` request.

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
// An example body: { id: '1591874402350-8969370227936', duration: 19185, url: 'https://treo.sh/',
//                    referrer: 'https://github.com/, userAgent: 'Mozilla/5.0 ...',
//                    cpus: 8, memory: 8, connection: {rtt: 100, downlink: 5, effectiveType: '4g'},
//                    TTFB: 253, FCP: 502, LCP: 1487, FID: 6, CLS: 1.5602 }

const sendToAnalytics = createApiReporter('/analytics', { initial: getDeviceInfo() })

getTTFB(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getFID(sendToAnalytics)
getCLS(sendToAnalytics)
```

Measure performance for [Next.js application](https://nextjs.org/docs/advanced-features/measuring-performance):

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

Create a report function, that accepts [Web Vitals' Metric](https://github.com/GoogleChrome/web-vitals#metric) or any `{ name: string, value: number }` object.
At the end of the session, it sends collected data to `url` using a POST request.

#### options.initial

Use `initial` option to add extra context to a result object. By default `web-vitals-reporter` only adds `id` and session `duration`. It's possible to rewrite `id` with the `initial` object.

```js
import { createApiReporter, getDeviceInfo } from 'web-vitals-reporter'

const report = createApiReporter('/analytics', {
  initial: { ...getDeviceInfo(), id: 'custom-id' },
})
```

#### options.onSend(url, result)

By default `web-vitals-reporter` uses [`sendBeacon`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon) and fallbacks to a `XMLHttpRequest`.

Use `onSend` option to implement a custom request logic, like logging data in development, or adding extra headers with `window.fetch`.

```js
import { createApiReporter } from 'web-vitals-reporter'

// detect Lighthouse using an `userAgent`
const isLighthouse = Boolean(navigator.userAgent.match('Chrome-Lighthouse'))

// exclude `localhost`
const isLocalhost = location.origin.includes('localhost')

// don't send results to API when a page tested with Lighthouse
const report = createApiReporter('/analytics', {
  onSend: isLighthouse || isLocalhost ? (url, result) => console.log(JSON.stringify(result, null, '  ')) : null,
})
```

To see output in the console, set `Preserve log` option and refresh the page.

![web vitals reporter](https://user-images.githubusercontent.com/158189/84431070-f3604d00-ac2a-11ea-8a2d-055caa756302.png)

#### options.mapMetric(metric, result)

By default `web-vitals-reporter` only rounds `metric.value` for Web Vitals ([code](https://github.com/treosh/web-vitals-reporter/blob/master/src/index.js#L43)).

Use `mapMetric` to implement a custom metric mapping, and capture detailed data. For example:

```js
import { createApiReporter } from 'web-vitals-reporter'

const report = createApiReporter('/analytics', {
  mapMetric: (metric) => {
    switch (metric.name) {
      // capture LCP element and its size
      case 'LCP': {
        const entry = metric.entries[metric.entries.length - 1] // use the last
        return {
          largestContentfulPaint: metric.value,
          largestContentfulElement: getCssSelector(entry.element), // custom helper
          largestContentfulElementSize: entry.size,
        }
      }

      // capture cumulative/largest/total layout shift
      case 'CLS': {
        return {
          cumulativeLayoutShift: metric.value,
          largestLayoutShift: Math.max(...metric.entries.map((e) => e.value)),
          totalLayoutShifts: metric.entries.length,
        }
      }

      // report more information about first input
      case 'FID': {
        const entry = metric.entries[0]
        return {
          firstInputDelay: metric.value,
          firstInputName: entry.name,
          firstInputTime: entry.startTime,
        }
      }

      // default name –> value mapping
      default:
        return { [metric.name]: metric.value }
    }
  },
})

getLCP(report)
getFID(report)
getCLS(report)
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
