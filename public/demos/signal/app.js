(() => {
  'use strict'

  const COINS =
    'bitcoin,ethereum,solana,toncoin,ripple,dogecoin,cardano,avalanche-2,chainlink,near'
  const API =
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' +
    COINS +
    '&order=market_cap_desc&sparkline=false&price_change_percentage=24h'

  const canvas = document.getElementById('radar')
  const ctx = canvas.getContext('2d')
  const feed = document.getElementById('feed')
  const logEl = document.getElementById('log')
  const sweepLabel = document.getElementById('sweepLabel')
  const linkState = document.getElementById('linkState')
  const clockEl = document.getElementById('clock')

  let markets = []
  let angle = 0
  let vol = 1
  let muted = false
  let blips = []
  let lastPing = 0

  function money(n) {
    if (n == null || !Number.isFinite(n)) return '—'
    if (n >= 1000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
    if (n >= 1) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 })
    return '$' + n.toLocaleString('en-US', { maximumSignificantDigits: 4 })
  }

  function log(line) {
    const t = new Date().toLocaleTimeString('uk-UA', { hour12: false })
    logEl.textContent = `[${t}] ${line}\n` + logEl.textContent.slice(0, 900)
  }

  function tickClock() {
    clockEl.textContent = new Date().toLocaleTimeString('uk-UA', { hour12: false })
  }

  function buildBlips(list) {
    blips = list.map((c, i) => {
      const chg = Math.abs(c.price_change_percentage_24h || 0)
      const r = 0.25 + Math.min(0.7, chg / 18)
      const a = (i / list.length) * Math.PI * 2 + Math.random() * 0.4
      return {
        a,
        r,
        hot: (c.price_change_percentage_24h || 0) >= 0,
        pulse: Math.random() * Math.PI * 2,
        sym: (c.symbol || '?').toUpperCase(),
      }
    })
  }

  function renderFeed(list) {
    feed.innerHTML = list
      .map((c) => {
        const chg = c.price_change_percentage_24h
        const up = chg >= 0
        const cls = up ? 'up' : 'dn'
        const sign = up ? '+' : ''
        return `
        <article class="coin">
          <img src="${c.image}" alt="" width="28" height="28" loading="lazy" />
          <div class="name">
            <b>${c.name}</b>
            <span>${c.symbol}</span>
          </div>
          <div class="px">
            <div>${money(c.current_price)}</div>
            <div class="chg ${cls}">${sign}${(chg ?? 0).toFixed(2)}%</div>
          </div>
        </article>`
      })
      .join('')

    const gain = list.filter((c) => (c.price_change_percentage_24h || 0) > 0).length
    const loss = list.length - gain
    document.getElementById('sCount').textContent = String(list.length)
    document.getElementById('sGain').textContent = String(gain)
    document.getElementById('sLoss').textContent = String(loss)
    document.getElementById('sPing').textContent = lastPing ? `${lastPing}ms` : '—'
  }

  async function loadMarkets() {
    linkState.textContent = '● SYNC'
    linkState.classList.add('on')
    const t0 = performance.now()
    try {
      const r = await fetch(API)
      if (!r.ok) throw new Error('HTTP ' + r.status)
      markets = await r.json()
      lastPing = Math.round(performance.now() - t0)
      const avg = markets.reduce((s, c) => s + Math.abs(c.price_change_percentage_24h || 0), 0) / (markets.length || 1)
      vol = 0.7 + Math.min(1.6, avg / 8)
      buildBlips(markets)
      renderFeed(markets)
      linkState.textContent = '● LIVE'
      log(`uplink ok · ${markets.length} assets · ping ${lastPing}ms`)
      if (!muted) {
        const top = [...markets].sort(
          (a, b) => Math.abs(b.price_change_percentage_24h || 0) - Math.abs(a.price_change_percentage_24h || 0),
        )[0]
        if (top) {
          log(
            `alert · ${top.symbol.toUpperCase()} ${(top.price_change_percentage_24h || 0).toFixed(2)}% / 24h`,
          )
        }
      }
    } catch (e) {
      linkState.textContent = '● DOWN'
      linkState.classList.remove('on')
      feed.innerHTML = `<div class="loading">SIGNAL LOST · ${String(e.message || e)}</div>`
      log('error · ' + (e.message || e))
    }
  }

  function drawRadar(ts) {
    const w = canvas.width
    const h = canvas.height
    const cx = w / 2
    const cy = h / 2
    const R = Math.min(w, h) * 0.42

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)

    // grid rings
    ctx.strokeStyle = '#1a3d28'
    ctx.lineWidth = 1
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath()
      ctx.arc(cx, cy, (R * i) / 4, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(cx - R, cy)
    ctx.lineTo(cx + R, cy)
    ctx.moveTo(cx, cy - R)
    ctx.lineTo(cx, cy + R)
    ctx.stroke()

    // sweep
    angle = (ts * 0.00055 * vol) % (Math.PI * 2)
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
    grad.addColorStop(0, 'rgba(109,255,176,0.25)')
    grad.addColorStop(1, 'rgba(109,255,176,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, R, angle - 0.55, angle)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = '#6dffb0'
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R)
    ctx.stroke()

    // blips
    for (const b of blips) {
      b.pulse += 0.08
      const dist = Math.abs(((b.a - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
      const lit = dist < 0.35 ? 1 : 0.35
      const x = cx + Math.cos(b.a) * b.r * R
      const y = cy + Math.sin(b.a) * b.r * R
      const s = 3 + Math.sin(b.pulse) * 1.5
      ctx.fillStyle = b.hot ? `rgba(109,255,176,${lit})` : `rgba(255,93,108,${lit})`
      ctx.fillRect(x - s / 2, y - s / 2, s, s)
      if (lit > 0.8) {
        ctx.fillStyle = `rgba(255,255,255,${lit * 0.8})`
        ctx.font = '10px VT323, monospace'
        ctx.fillText(b.sym, x + 6, y - 4)
      }
    }

    // outer frame
    ctx.strokeStyle = '#fff'
    ctx.strokeRect(8, 8, w - 16, h - 16)

    sweepLabel.textContent = `${((angle * 180) / Math.PI) | 0}°`
    requestAnimationFrame(drawRadar)
  }

  document.getElementById('refreshBtn').onclick = () => {
    log('manual refresh…')
    loadMarkets()
  }

  document.querySelectorAll('[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd')
      if (cmd === 'scan') {
        log('full spectrum scan…')
        loadMarkets()
      } else if (cmd === 'pulse') {
        vol = 2.2
        log('pulse boost · radar ×2.2')
        setTimeout(() => {
          vol = 1
          log('pulse fade')
        }, 2500)
      } else if (cmd === 'mute') {
        muted = !muted
        log(muted ? 'alerts muted' : 'alerts armed')
      }
    })
  })

  tickClock()
  setInterval(tickClock, 1000)
  loadMarkets()
  setInterval(loadMarkets, 60000)
  requestAnimationFrame(drawRadar)
  log('boot · SIGNAL DECK online')
})()
