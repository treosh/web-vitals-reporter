# web-vitals-reporter

> A tiny utility (600 B) to simplify [web-vitals](https://github.com/GoogleChrome/web-vitals) reporting.

## Usage

Report Core Web Vitals to API:

```js
import { getLCP, getFID, getCLS } from 'web-vitals'
import { createApiReporter } from 'web-vitals-reporter'

// create a report callback
const report = createApiReporter('/analytics')

getCLS(report)
getFID(report)
getLCP(report)
```

Report to Google Analytics:

```js
import { getCLS, getFID, getLCP } from 'web-vitals'
import { createGaReporter } from 'web-vitals-reporter/google-analytics'

// assume, google analytics is installed using gtag.js
const report = createGaReporter({ mode: 'gtag' })

getCLS(report)
getFID(report)
getLCP(report)
```
