import test from 'ava'
import playwright from 'playwright'
import { resetAnalytics, getLatestAnalytics } from './example-app/server'

const url = 'http://localhost:5000/'

test.serial('chromium', async (t) => {
  const browser = await playwright.chromium.launch() // 'chromium', 'firefox', 'webkit'
  const result = await getResult(browser)

  // check keys
  t.true(Object.keys(result).length > 0, 'result should not be empty')
  t.deepEqual(Object.keys(result).sort(), [
    'CLS',
    'FCP',
    'FID',
    'LCP',
    'TTFB',
    'connection',
    'cpus',
    'duration',
    'id',
    'memory',
    'referrer',
    'url',
    'userAgent',
  ])

  // metadata
  t.is(result.id.length, 27)
  t.true(typeof result.duration === 'number' && result.duration > 0)
  t.is(result.url, url)
  t.is(result.referrer, '')
  t.true(result.userAgent.includes('HeadlessChrome'))
  t.deepEqual(Object.keys(result.connection).sort(), ['downlink', 'effectiveType', 'rtt'])
  t.true(typeof result.memory === 'number' && result.cpus > 0)
  t.true(typeof result.cpus === 'number' && result.cpus > 0)

  // metrics
  t.true(typeof result.TTFB === 'number' && result.cpus > 0)
  t.true(typeof result.FCP === 'number' && result.FCP > result.TTFB)
  t.true(typeof result.LCP === 'number' && result.LCP >= result.FCP)
  t.true(typeof result.FID === 'number' && result.FID >= 0)
  t.true(typeof result.CLS === 'number' && result.CLS >= 0)
})

test.serial('firefox', async (t) => {
  const browser = await playwright.firefox.launch()
  const result = await getResult(browser)

  // check keys
  t.true(Object.keys(result).length > 0, 'result should not be empty')
  t.deepEqual(Object.keys(result).sort(), ['FID', 'TTFB', 'cpus', 'duration', 'id', 'referrer', 'url', 'userAgent'])

  // metadata
  t.is(result.id.length, 27)
  t.true(typeof result.duration === 'number' && result.duration > 0)
  t.is(result.url, url)
  t.is(result.referrer, '')
  t.true(result.userAgent.includes('Firefox'))
  t.true(typeof result.cpus === 'number' && result.cpus > 0)

  // metrics
  t.true(typeof result.TTFB === 'number' && result.cpus > 0)
  t.true(typeof result.FID === 'number' && result.FID >= 0)
})

test.skip('webkit', async (t) => {
  const browser = await playwright.webkit.launch()
  const result = await getResult(browser)
  console.log(result)

  // check keys
  t.true(Object.keys(result).length > 0, 'result should not be empty')
  t.deepEqual(Object.keys(result).sort(), ['FID', 'TTFB', 'cpus', 'duration', 'id', 'referrer', 'url', 'userAgent'])

  // metadata
  t.is(result.id.length, 27)
  t.true(typeof result.duration === 'number' && result.duration > 0)
  t.is(result.url, url)
  t.is(result.referrer, '')
  t.true(result.userAgent.includes('Safari'))
  t.true(typeof result.cpus === 'number' && result.cpus > 0)

  // metrics
  t.true(typeof result.TTFB === 'number' && result.cpus > 0)
  t.true(typeof result.FID === 'number' && result.FID >= 0)
})

/** @param {import('playwright').Browser} browser */
async function getResult(browser) {
  resetAnalytics()
  const context = await browser.newContext()
  const page = await context.newPage()
  page.on('console', console.log)
  await page.goto(url)
  await page.click('canvas')
  await page.waitForTimeout(1000)
  await page.close({ runBeforeUnload: true })
  await page.waitForTimeout(1000)

  await browser.close()
  return /** @type {any} */ (getLatestAnalytics())
}
