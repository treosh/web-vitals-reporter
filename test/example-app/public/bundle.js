// canvas-confetti v1.2.0 built on 2020-04-03T22:26:09.865Z
var module = {}

// source content
;(function main(global, module, isWorker, workerSize) {
  var canUseWorker = !!(
    global.Worker &&
    global.Blob &&
    global.Promise &&
    global.OffscreenCanvas &&
    global.HTMLCanvasElement &&
    global.HTMLCanvasElement.prototype.transferControlToOffscreen &&
    global.URL &&
    global.URL.createObjectURL
  )

  function noop() {}

  // create a promise if it exists, otherwise, just
  // call the function directly
  function promise(func) {
    var ModulePromise = module.exports.Promise
    var Prom = ModulePromise !== void 0 ? ModulePromise : global.Promise

    if (typeof Prom === 'function') {
      return new Prom(func)
    }

    func(noop, noop)

    return null
  }

  var raf = (function () {
    var TIME = Math.floor(1000 / 60)
    var frame, cancel
    var frames = {}
    var lastFrameTime = 0

    if (typeof requestAnimationFrame === 'function' && typeof cancelAnimationFrame === 'function') {
      frame = function (cb) {
        var id = Math.random()

        frames[id] = requestAnimationFrame(function onFrame(time) {
          if (lastFrameTime === time || lastFrameTime + TIME - 1 < time) {
            lastFrameTime = time
            delete frames[id]

            cb()
          } else {
            frames[id] = requestAnimationFrame(onFrame)
          }
        })

        return id
      }
      cancel = function (id) {
        if (frames[id]) {
          cancelAnimationFrame(frames[id])
        }
      }
    } else {
      frame = function (cb) {
        return setTimeout(cb, TIME)
      }
      cancel = function (timer) {
        return clearTimeout(timer)
      }
    }

    return { frame: frame, cancel: cancel }
  })()

  var getWorker = (function () {
    var worker
    var prom
    var resolves = {}

    function decorate(worker) {
      function execute(options, callback) {
        worker.postMessage({ options: options || {}, callback: callback })
      }
      worker.init = function initWorker(canvas) {
        var offscreen = canvas.transferControlToOffscreen()
        worker.postMessage({ canvas: offscreen }, [offscreen])
      }

      worker.fire = function fireWorker(options, size, done) {
        if (prom) {
          execute(options, null)
          return prom
        }

        var id = Math.random().toString(36).slice(2)

        prom = promise(function (resolve) {
          function workerDone(msg) {
            if (msg.data.callback !== id) {
              return
            }

            delete resolves[id]
            worker.removeEventListener('message', workerDone)

            prom = null
            done()
            resolve()
          }

          worker.addEventListener('message', workerDone)
          execute(options, id)

          resolves[id] = workerDone.bind(null, { data: { callback: id } })
        })

        return prom
      }

      worker.reset = function resetWorker() {
        worker.postMessage({ reset: true })

        for (var id in resolves) {
          resolves[id]()
          delete resolves[id]
        }
      }
    }

    return function () {
      if (worker) {
        return worker
      }

      if (!isWorker && canUseWorker) {
        var code = [
          'var CONFETTI, SIZE = {}, module = {};',
          '(' + main.toString() + ')(this, module, true, SIZE);',
          'onmessage = function(msg) {',
          '  if (msg.data.options) {',
          '    CONFETTI(msg.data.options).then(function () {',
          '      if (msg.data.callback) {',
          '        postMessage({ callback: msg.data.callback });',
          '      }',
          '    });',
          '  } else if (msg.data.reset) {',
          '    CONFETTI.reset();',
          '  } else if (msg.data.resize) {',
          '    SIZE.width = msg.data.resize.width;',
          '    SIZE.height = msg.data.resize.height;',
          '  } else if (msg.data.canvas) {',
          '    SIZE.width = msg.data.canvas.width;',
          '    SIZE.height = msg.data.canvas.height;',
          '    CONFETTI = module.exports.create(msg.data.canvas);',
          '  }',
          '}',
        ].join('\n')
        try {
          worker = new Worker(URL.createObjectURL(new Blob([code])))
        } catch (e) {
          // eslint-disable-next-line no-console
          typeof console !== undefined && typeof console.warn === 'function'
            ? console.warn('🎊 Count not load worker', e)
            : null

          return null
        }

        decorate(worker)
      }

      return worker
    }
  })()

  var defaults = {
    particleCount: 50,
    angle: 90,
    spread: 45,
    startVelocity: 45,
    decay: 0.9,
    gravity: 1,
    ticks: 200,
    x: 0.5,
    y: 0.5,
    shapes: ['square', 'circle'],
    zIndex: 100,
    colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
    // probably should be true, but back-compat
    disableForReducedMotion: false,
  }

  function convert(val, transform) {
    return transform ? transform(val) : val
  }

  function isOk(val) {
    return !(val === null || val === undefined)
  }

  function prop(options, name, transform) {
    return convert(options && isOk(options[name]) ? options[name] : defaults[name], transform)
  }

  function randomInt(min, max) {
    // [min, max)
    return Math.floor(Math.random() * (max - min)) + min
  }

  function toDecimal(str) {
    return parseInt(str, 16)
  }

  function hexToRgb(str) {
    var val = String(str).replace(/[^0-9a-f]/gi, '')

    if (val.length < 6) {
      val = val[0] + val[0] + val[1] + val[1] + val[2] + val[2]
    }

    return {
      r: toDecimal(val.substring(0, 2)),
      g: toDecimal(val.substring(2, 4)),
      b: toDecimal(val.substring(4, 6)),
    }
  }

  function getOrigin(options) {
    var origin = prop(options, 'origin', Object)
    origin.x = prop(origin, 'x', Number)
    origin.y = prop(origin, 'y', Number)

    return origin
  }

  function setCanvasWindowSize(canvas) {
    canvas.width = document.documentElement.clientWidth
    canvas.height = document.documentElement.clientHeight
  }

  function setCanvasRectSize(canvas) {
    var rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
  }

  function getCanvas(zIndex) {
    var canvas = document.createElement('canvas')

    canvas.style.position = 'fixed'
    canvas.style.top = '0px'
    canvas.style.left = '0px'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = zIndex

    return canvas
  }

  function ellipse(context, x, y, radiusX, radiusY, rotation, startAngle, endAngle, antiClockwise) {
    context.save()
    context.translate(x, y)
    context.rotate(rotation)
    context.scale(radiusX, radiusY)
    context.arc(0, 0, 1, startAngle, endAngle, antiClockwise)
    context.restore()
  }

  function randomPhysics(opts) {
    var radAngle = opts.angle * (Math.PI / 180)
    var radSpread = opts.spread * (Math.PI / 180)

    return {
      x: opts.x,
      y: opts.y,
      wobble: Math.random() * 10,
      velocity: opts.startVelocity * 0.5 + Math.random() * opts.startVelocity,
      angle2D: -radAngle + (0.5 * radSpread - Math.random() * radSpread),
      tiltAngle: Math.random() * Math.PI,
      color: hexToRgb(opts.color),
      shape: opts.shape,
      tick: 0,
      totalTicks: opts.ticks,
      decay: opts.decay,
      random: Math.random() + 5,
      tiltSin: 0,
      tiltCos: 0,
      wobbleX: 0,
      wobbleY: 0,
      gravity: opts.gravity * 3,
      ovalScalar: 0.6,
    }
  }

  function updateFetti(context, fetti) {
    fetti.x += Math.cos(fetti.angle2D) * fetti.velocity
    fetti.y += Math.sin(fetti.angle2D) * fetti.velocity + fetti.gravity
    fetti.wobble += 0.1
    fetti.velocity *= fetti.decay
    fetti.tiltAngle += 0.1
    fetti.tiltSin = Math.sin(fetti.tiltAngle)
    fetti.tiltCos = Math.cos(fetti.tiltAngle)
    fetti.random = Math.random() + 5
    fetti.wobbleX = fetti.x + 10 * Math.cos(fetti.wobble)
    fetti.wobbleY = fetti.y + 10 * Math.sin(fetti.wobble)

    var progress = fetti.tick++ / fetti.totalTicks

    var x1 = fetti.x + fetti.random * fetti.tiltCos
    var y1 = fetti.y + fetti.random * fetti.tiltSin
    var x2 = fetti.wobbleX + fetti.random * fetti.tiltCos
    var y2 = fetti.wobbleY + fetti.random * fetti.tiltSin

    context.fillStyle =
      'rgba(' + fetti.color.r + ', ' + fetti.color.g + ', ' + fetti.color.b + ', ' + (1 - progress) + ')'
    context.beginPath()

    if (fetti.shape === 'circle') {
      context.ellipse
        ? context.ellipse(
            fetti.x,
            fetti.y,
            Math.abs(x2 - x1) * fetti.ovalScalar,
            Math.abs(y2 - y1) * fetti.ovalScalar,
            (Math.PI / 10) * fetti.wobble,
            0,
            2 * Math.PI
          )
        : ellipse(
            context,
            fetti.x,
            fetti.y,
            Math.abs(x2 - x1) * fetti.ovalScalar,
            Math.abs(y2 - y1) * fetti.ovalScalar,
            (Math.PI / 10) * fetti.wobble,
            0,
            2 * Math.PI
          )
    } else {
      context.moveTo(Math.floor(fetti.x), Math.floor(fetti.y))
      context.lineTo(Math.floor(fetti.wobbleX), Math.floor(y1))
      context.lineTo(Math.floor(x2), Math.floor(y2))
      context.lineTo(Math.floor(x1), Math.floor(fetti.wobbleY))
    }

    context.closePath()
    context.fill()

    return fetti.tick < fetti.totalTicks
  }

  function animate(canvas, fettis, resizer, size, done) {
    var animatingFettis = fettis.slice()
    var context = canvas.getContext('2d')
    var animationFrame
    var destroy

    var prom = promise(function (resolve) {
      function onDone() {
        animationFrame = destroy = null

        context.clearRect(0, 0, size.width, size.height)

        done()
        resolve()
      }

      function update() {
        if (isWorker && !(size.width === workerSize.width && size.height === workerSize.height)) {
          size.width = canvas.width = workerSize.width
          size.height = canvas.height = workerSize.height
        }

        if (!size.width && !size.height) {
          resizer(canvas)
          size.width = canvas.width
          size.height = canvas.height
        }

        context.clearRect(0, 0, size.width, size.height)

        animatingFettis = animatingFettis.filter(function (fetti) {
          return updateFetti(context, fetti)
        })

        if (animatingFettis.length) {
          animationFrame = raf.frame(update)
        } else {
          onDone()
        }
      }

      animationFrame = raf.frame(update)
      destroy = onDone
    })

    return {
      addFettis: function (fettis) {
        animatingFettis = animatingFettis.concat(fettis)

        return prom
      },
      canvas: canvas,
      promise: prom,
      reset: function () {
        if (animationFrame) {
          raf.cancel(animationFrame)
        }

        if (destroy) {
          destroy()
        }
      },
    }
  }

  function confettiCannon(canvas, globalOpts) {
    var isLibCanvas = !canvas
    var allowResize = !!prop(globalOpts || {}, 'resize')
    var globalDisableForReducedMotion = prop(globalOpts, 'disableForReducedMotion', Boolean)
    var shouldUseWorker = canUseWorker && !!prop(globalOpts || {}, 'useWorker')
    var worker = shouldUseWorker ? getWorker() : null
    var resizer = isLibCanvas ? setCanvasWindowSize : setCanvasRectSize
    var initialized = canvas && worker ? !!canvas.__confetti_initialized : false
    var preferLessMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion)').matches
    var animationObj

    function fireLocal(options, size, done) {
      var particleCount = prop(options, 'particleCount', Math.floor)
      var angle = prop(options, 'angle', Number)
      var spread = prop(options, 'spread', Number)
      var startVelocity = prop(options, 'startVelocity', Number)
      var decay = prop(options, 'decay', Number)
      var gravity = prop(options, 'gravity', Number)
      var colors = prop(options, 'colors')
      var ticks = prop(options, 'ticks', Number)
      var shapes = prop(options, 'shapes')
      var origin = getOrigin(options)

      var temp = particleCount
      var fettis = []

      var startX = canvas.width * origin.x
      var startY = canvas.height * origin.y

      while (temp--) {
        fettis.push(
          randomPhysics({
            x: startX,
            y: startY,
            angle: angle,
            spread: spread,
            startVelocity: startVelocity,
            color: colors[temp % colors.length],
            shape: shapes[randomInt(0, shapes.length)],
            ticks: ticks,
            decay: decay,
            gravity: gravity,
          })
        )
      }

      // if we have a previous canvas already animating,
      // add to it
      if (animationObj) {
        return animationObj.addFettis(fettis)
      }

      animationObj = animate(canvas, fettis, resizer, size, done)

      return animationObj.promise
    }

    function fire(options) {
      var disableForReducedMotion = globalDisableForReducedMotion || prop(options, 'disableForReducedMotion', Boolean)
      var zIndex = prop(options, 'zIndex', Number)

      if (disableForReducedMotion && preferLessMotion) {
        return promise(function (resolve) {
          resolve()
        })
      }

      if (isLibCanvas && animationObj) {
        // use existing canvas from in-progress animation
        canvas = animationObj.canvas
      } else if (isLibCanvas && !canvas) {
        // create and initialize a new canvas
        canvas = getCanvas(zIndex)
        document.body.appendChild(canvas)
      }

      if (allowResize && !initialized) {
        // initialize the size of a user-supplied canvas
        resizer(canvas)
      }

      var size = {
        width: canvas.width,
        height: canvas.height,
      }

      if (worker && !initialized) {
        worker.init(canvas)
      }

      initialized = true

      if (worker) {
        canvas.__confetti_initialized = true
      }

      function onResize() {
        if (worker) {
          // TODO this really shouldn't be immediate, because it is expensive
          var obj = {
            getBoundingClientRect: function () {
              if (!isLibCanvas) {
                return canvas.getBoundingClientRect()
              }
            },
          }

          resizer(obj)

          worker.postMessage({
            resize: {
              width: obj.width,
              height: obj.height,
            },
          })
          return
        }

        // don't actually query the size here, since this
        // can execute frequently and rapidly
        size.width = size.height = null
      }

      function done() {
        animationObj = null

        if (allowResize) {
          global.removeEventListener('resize', onResize)
        }

        if (isLibCanvas && canvas) {
          document.body.removeChild(canvas)
          canvas = null
          initialized = false
        }
      }

      if (allowResize) {
        global.addEventListener('resize', onResize, false)
      }

      if (worker) {
        return worker.fire(options, size, done)
      }

      return fireLocal(options, size, done)
    }

    fire.reset = function () {
      if (worker) {
        worker.reset()
      }

      if (animationObj) {
        animationObj.reset()
      }
    }

    return fire
  }

  module.exports = confettiCannon(null, { useWorker: true, resize: true })
  module.exports.create = confettiCannon
})(
  (function () {
    if (typeof window !== 'undefined') {
      return window
    }

    if (typeof self !== 'undefined') {
      return self
    }

    return this
  })(),
  module,
  false
)
var create = module.exports.create

var t,
  n,
  e = function () {
    return ''.concat(Date.now(), '-').concat(Math.floor(8999999999999 * Math.random()) + 1e12)
  },
  i = function (t) {
    var n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : -1
    return { name: t, value: n, delta: 0, entries: [], id: e(), isFinal: !1 }
  },
  a = function (t, n) {
    try {
      if (PerformanceObserver.supportedEntryTypes.includes(t)) {
        var e = new PerformanceObserver(function (t) {
          return t.getEntries().map(n)
        })
        return e.observe({ type: t, buffered: !0 }), e
      }
    } catch (t) {}
  },
  r = !1,
  o = !1,
  s = function (t) {
    r = !t.persisted
  },
  u = function () {
    addEventListener('pagehide', s), addEventListener('unload', function () {})
  },
  c = function (t) {
    var n = arguments.length > 1 && void 0 !== arguments[1] && arguments[1]
    o || (u(), (o = !0)),
      addEventListener(
        'visibilitychange',
        function (n) {
          var e = n.timeStamp
          'hidden' === document.visibilityState && t({ timeStamp: e, isUnloading: r })
        },
        { capture: !0, once: n }
      )
  },
  l = function (t, n, e, i) {
    var a
    return function () {
      e && n.isFinal && e.disconnect(),
        n.value >= 0 &&
          (i || n.isFinal || 'hidden' === document.visibilityState) &&
          ((n.delta = n.value - (a || 0)), (n.delta || n.isFinal || void 0 === a) && (t(n), (a = n.value)))
    }
  },
  p = function (t) {
    var n = arguments.length > 1 && void 0 !== arguments[1] && arguments[1],
      e = i('CLS', 0),
      r = function (t) {
        t.hadRecentInput || ((e.value += t.value), e.entries.push(t), s())
      },
      o = a('layout-shift', r),
      s = l(t, e, o, n)
    c(function (t) {
      var n = t.isUnloading
      o && o.takeRecords().map(r), n && (e.isFinal = !0), s()
    })
  },
  d = function () {
    return (
      void 0 === t &&
        ((t = 'hidden' === document.visibilityState ? 0 : 1 / 0),
        c(function (n) {
          var e = n.timeStamp
          return (t = e)
        }, !0)),
      {
        get timeStamp() {
          return t
        },
      }
    )
  },
  m = function (t) {
    var n = i('FCP'),
      e = d(),
      r = a('paint', function (t) {
        'first-contentful-paint' === t.name &&
          t.startTime < e.timeStamp &&
          ((n.value = t.startTime), (n.isFinal = !0), n.entries.push(t), o())
      }),
      o = l(t, n, r)
  },
  v = function (t) {
    var n = i('FID'),
      e = d(),
      r = function (t) {
        t.startTime < e.timeStamp &&
          ((n.value = t.processingStart - t.startTime), n.entries.push(t), (n.isFinal = !0), s())
      },
      o = a('first-input', r),
      s = l(t, n, o)
    c(function () {
      o && (o.takeRecords().map(r), o.disconnect())
    }, !0),
      o ||
        (window.perfMetrics &&
          window.perfMetrics.onFirstInputDelay &&
          window.perfMetrics.onFirstInputDelay(function (t, i) {
            i.timeStamp < e.timeStamp &&
              ((n.value = t),
              (n.isFinal = !0),
              (n.entries = [
                {
                  entryType: 'first-input',
                  name: i.type,
                  target: i.target,
                  cancelable: i.cancelable,
                  startTime: i.timeStamp,
                  processingStart: i.timeStamp + t,
                },
              ]),
              s())
          }))
  },
  f = function () {
    return (
      n ||
        (n = new Promise(function (t) {
          return ['scroll', 'keydown', 'pointerdown'].map(function (n) {
            addEventListener(n, t, { once: !0, passive: !0, capture: !0 })
          })
        })),
      n
    )
  },
  g = function (t) {
    var n = arguments.length > 1 && void 0 !== arguments[1] && arguments[1],
      e = i('LCP'),
      r = d(),
      o = function (t) {
        var n = t.startTime
        n < r.timeStamp ? ((e.value = n), e.entries.push(t)) : (e.isFinal = !0), u()
      },
      s = a('largest-contentful-paint', o),
      u = l(t, e, s, n),
      p = function () {
        e.isFinal || (s && s.takeRecords().map(o), (e.isFinal = !0), u())
      }
    f().then(p), c(p, !0)
  },
  h = function (t) {
    var n,
      e = i('TTFB')
    ;(n = function () {
      try {
        var n =
          performance.getEntriesByType('navigation')[0] ||
          (function () {
            var t = performance.timing,
              n = { entryType: 'navigation', startTime: 0 }
            for (var e in t) 'navigationStart' !== e && 'toJSON' !== e && (n[e] = Math.max(t[e] - t.navigationStart, 0))
            return n
          })()
        ;(e.value = e.delta = n.responseStart), (e.entries = [n]), (e.isFinal = !0), t(e)
      } catch (t) {}
    }),
      'complete' === document.readyState ? setTimeout(n, 0) : addEventListener('pageshow', n)
  }

/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
let isUnloading = false
let listenersAdded = false
const onPageHide = (event) => {
  isUnloading = !event.persisted
}
const addListeners = () => {
  addEventListener('pagehide', onPageHide)
  // Unload is needed to fix this bug:
  // https://bugs.chromium.org/p/chromium/issues/detail?id=987409
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  addEventListener('unload', () => {})
}
const onHidden = (cb, once = false) => {
  if (!listenersAdded) {
    addListeners()
    listenersAdded = true
  }
  addEventListener(
    'visibilitychange',
    ({ timeStamp }) => {
      if (document.visibilityState === 'hidden') {
        cb({ timeStamp, isUnloading })
      }
    },
    { capture: true, once }
  )
}

/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Performantly generate a unique, 27-char string by combining the current
 * timestamp with a 13-digit random number.
 * @return {string}
 */
const generateUniqueID = () => {
  return `${Date.now()}-${Math.floor(Math.random() * (9e12 - 1)) + 1e12}`
}

/** @typedef {Object<string,any>} Result */
/** @typedef {import('web-vitals').Metric | Object<string,any>} Metric */
/** @typedef {{ effectiveType: 'slow-2g' | '2g' | '3g' | '4g', rtt: number, downlink: number }} NetworkInformation */

/**
 * Create Web Vitals API reporter, that accepts `Metric` values and sends it to `url`
 * using `navigator.sendBeacon` when available or fallbacks back to XMLHttpRequest.
 *
 * The function sends request only once.
 * Use `onSend` to implement a custom logic.
 *
 * @param {string} url
 * @param {{ initial?: object, mapMetric?: (metric: Metric, result: Result) => Result, beforeSend?: (result: Result) => Result, onSend?: (url: string, result: Result) => any }} [opts]
 * @return {(metric: Metric) => void}
 */

function createApiReporter(url, opts = {}) {
  let isSent = false
  let isCalled = false
  let result = /** @type {Result} */ ({ id: generateUniqueID(), ...opts.initial })

  const sendValues = () => {
    if (isSent) return // data is already sent
    if (!isCalled) return // no data collected

    result.duration = now()
    if (opts.beforeSend) {
      result = { ...result, ...opts.beforeSend(result) }
    }
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
    // Safari does not fire "visibilitychange" on the tab close
    // So we have 2 options: loose Safari data, or loose LCP/CLS that depends on "visibilitychange" logic.
    // Current solution: if LCP/CLS supported, use `onHidden` otherwise, use `pagehide` to fire the callback in the end.
    //
    // More details: https://github.com/treosh/web-vitals-reporter/issues/3
    const supportedEntryTypes = (PerformanceObserver && PerformanceObserver.supportedEntryTypes) || []
    const isLatestVisibilityChangeSupported = supportedEntryTypes.indexOf('layout-shift') !== -1

    if (isLatestVisibilityChangeSupported) {
      onHidden(({ isUnloading }) => {
        if (isUnloading) sendValues()
      })
    } else {
      addEventListener('pagehide', sendValues, { capture: true, once: true })
    }
  })

  return report
}

/**
 * Get device information.
 * - Effective connection type: https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
 * - Device memory: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
 */

function getDeviceInfo() {
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
    connection: conn ? { effectiveType: conn.effectiveType, rtt: conn.rtt, downlink: conn.downlink } : null,
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

// setup confetti 🎊
const $canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('canvas'))
create($canvas, { resize: true })({ particleCount: 200, spread: 200 })

// Init report callback with information about the browser.
const sendToAnalytics = createApiReporter('/analytics', { initial: getDeviceInfo() })

// setup web-vitals
h(sendToAnalytics)
m(sendToAnalytics)
g(sendToAnalytics)
v(sendToAnalytics)
p(sendToAnalytics)
