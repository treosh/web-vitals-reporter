import test from 'ava'
import playwright from 'playwright'
import { getLatestAnalytics } from './example-app/server'

// run in chromium

test('works in chromium', async (t) => {
  const browser = await playwright.chromium.launch() // ['chromium', 'firefox', 'webkit']
  const context = await browser.newContext()

  const page = await context.newPage()
  await page.goto(`http://localhost:5000/`)
  await page.click('canvas')
  await browser.close()

  await new Promise((resolve) => {
    setTimeout(() => {
      console.log('latest analytics:', getLatestAnalytics())
      resolve()
    }, 500)
  })

  t.true(true)
})
