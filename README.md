# web-vitals-reporter

> Report Web Vitals.

```js
import { getCLS, getFID, getLCP } from 'web-vitals'
import { createApiReporter } from 'web-vitals-reporter'

// create a report callback
const report = createApiReporter('/analytics')

getCLS(report)
getFID(report)
getLCP(report)
```
