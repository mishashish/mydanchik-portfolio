(() => {
  'use strict'

  const TREND = ['iphone 15', 'macbook air m2', 'rtx 4070', 'airpods pro', 'lego technic', 'nintendo switch', 'sony wh-1000xm5']

  const state = {
    tab: 'search',
    view: 'grid',
    items: [],
    raw: [],
    fav: loadFav(),
    loading: false,
    source: '',
    note: '',
    error: '',
    searchUrl: '',
    total: null,
  }

  const $ = (id) => document.getElementById(id)

  function loadFav() {
    try {
      return new Map(JSON.parse(localStorage.getItem('bayfinder_fav_v2') || '[]'))
    } catch {
      return new Map()
    }
  }

  function saveFav() {
    localStorage.setItem('bayfinder_fav_v2', JSON.stringify([...state.fav.entries()]))
    $('favCount').textContent = String(state.fav.size)
  }

  function money(n, currency = 'USD') {
    if (n == null || !Number.isFinite(n)) return '—'
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        maximumFractionDigits: n >= 100 ? 0 : 2,
      }).format(n)
    } catch {
      return `$${n}`
    }
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function placeholder(title) {
    const label = encodeURIComponent((title || 'eBay').slice(0, 28))
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#eef2f0"/><rect x="36" y="36" width="568" height="408" rx="16" fill="#fff" stroke="#cfd8d3"/><text x="320" y="240" text-anchor="middle" font-family="Arial" font-size="22" fill="#5b6b63">${label}</text></svg>`
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }

  /** Deal score using SerpApi fields: price, condition, seller trust, shipping, format, title risks. */
  function scoreItem(item, median) {
    let score = 28
    const why = []
    const parts = {
      price: 0,
      condition: 0,
      seller: 0,
      shipping: 0,
      format: 0,
      title: 0,
      media: 0,
    }
    const title = `${item.title || ''} ${item.subtitle || ''}`.toLowerCase()
    const cond = `${item.condition || ''}`.toLowerCase()
    const ship = `${item.shipping || ''}`.toLowerCase()

    // --- price vs market ---
    if (item.price != null && median != null && median > 0) {
      const ratio = item.price / median
      if (ratio <= 0.7) {
        parts.price = 22
        why.push({ ok: true, text: `Ціна ≪ медіани (−${Math.round((1 - ratio) * 100)}%)` })
      } else if (ratio <= 0.85) {
        parts.price = 14
        why.push({ ok: true, text: `Нижче ринку (−${Math.round((1 - ratio) * 100)}% від медіани)` })
      } else if (ratio <= 0.98) {
        parts.price = 8
        why.push({ ok: true, text: 'Трохи нижче медіани вибірки' })
      } else if (ratio <= 1.12) {
        parts.price = 2
        why.push({ ok: true, text: 'Близько до ринкової медіани' })
      } else if (ratio <= 1.35) {
        parts.price = -6
        why.push({ ok: false, text: 'Дорожче медіани' })
      } else {
        parts.price = -14
        why.push({ ok: false, text: `Значно вище ринку (+${Math.round((ratio - 1) * 100)}%)` })
      }
    }

    // --- condition ---
    if (/brand new|new/.test(cond) && !/open.?box|refurb/.test(cond)) {
      parts.condition = 12
      why.push({ ok: true, text: `Стан: ${item.condition}` })
    } else if (/open.?box|refurbished|certified/.test(cond)) {
      parts.condition = 7
      why.push({ ok: true, text: `Стан: ${item.condition}` })
    } else if (/used|pre-?owned|good|very good|excellent/.test(cond)) {
      parts.condition = 4
      why.push({ ok: true, text: `Стан: ${item.condition || 'Used'}` })
    } else if (/parts|not working|for parts/.test(cond)) {
      parts.condition = -16
      why.push({ ok: false, text: 'For parts / not working' })
    }

    // --- seller trust (SerpApi seller.reviews + feedback %) ---
    const reviews = item.seller?.reviews
    const feedback = item.seller?.feedback
    if (feedback != null && Number.isFinite(feedback)) {
      if (feedback >= 99.5 && (reviews || 0) >= 500) {
        parts.seller = 14
        why.push({ ok: true, text: `Топ-продавець ${feedback}% · ${reviews.toLocaleString()} reviews` })
      } else if (feedback >= 98 && (reviews || 0) >= 50) {
        parts.seller = 9
        why.push({ ok: true, text: `Надійний продавець ${feedback}% · ${(reviews || 0).toLocaleString()} reviews` })
      } else if (feedback >= 95) {
        parts.seller = 4
        why.push({ ok: true, text: `Seller feedback ${feedback}%` })
      } else if (feedback < 95) {
        parts.seller = -10
        why.push({ ok: false, text: `Низький feedback ${feedback}%` })
      }
    } else if (reviews != null && reviews >= 1000) {
      parts.seller = 6
      why.push({ ok: true, text: `Багато відгуків: ${reviews.toLocaleString()}` })
    } else if (reviews != null && reviews < 5) {
      parts.seller = -4
      why.push({ ok: false, text: 'Мало відгуків у продавця' })
    }

    // --- shipping ---
    if (/free/.test(ship)) {
      parts.shipping = 8
      why.push({ ok: true, text: 'Free shipping' })
    } else if (ship) {
      parts.shipping = 1
    }

    // --- buying format ---
    if (item.buyingOptions?.includes('FIXED_PRICE') || /buy it now/i.test(item.buyingFormat || '')) {
      parts.format = 4
      why.push({ ok: true, text: 'Buy It Now' })
    }
    if (item.buyingOptions?.includes('AUCTION') && !item.buyingOptions?.includes('FIXED_PRICE')) {
      parts.format -= 2
      why.push({ ok: false, text: 'Тільки Auction — ціна може зрости' })
    }

    // --- media / sponsored ---
    if (item.image) parts.media = 3
    else {
      parts.media = -3
      why.push({ ok: false, text: 'Немає thumbnail' })
    }
    if (item.sponsored) {
      parts.media -= 2
      why.push({ ok: false, text: 'Sponsored listing' })
    }

    // --- title risk / quality ---
    if (/sealed|brand new|unopened|warranty|authenticity/.test(title)) {
      parts.title = 5
      why.push({ ok: true, text: 'У title: sealed / warranty / authenticity' })
    }
    if (/broken|for parts|cracked|faulty|spares|as is|no returns|read description/.test(title)) {
      parts.title -= 12
      why.push({ ok: false, text: 'Ризик у title (parts / damaged / as-is)' })
    }

    score = Math.max(
      1,
      Math.min(
        99,
        Math.round(
          score +
            parts.price +
            parts.condition +
            parts.seller +
            parts.shipping +
            parts.format +
            parts.title +
            parts.media,
        ),
      ),
    )
    if (!why.length) why.push({ ok: true, text: 'Базовий рейтинг по ціні й якості лота' })
    return { score, why: why.slice(0, 6), parts }
  }

  function enrich(list) {
    const prices = list.map((x) => x.price).filter((n) => n != null && Number.isFinite(n))
    const median = prices.length ? prices.slice().sort((a, b) => a - b)[Math.floor(prices.length / 2)] : null
    return list.map((item) => {
      const { score, why, parts } = scoreItem(item, median)
      return {
        ...item,
        score,
        why,
        scoreParts: parts,
        whyShort: why.filter((w) => w.ok).slice(0, 2).map((w) => w.text).join(' · ') || why[0]?.text || '',
        median,
      }
    })
  }

  function readFilters() {
    return {
      q: $('q').value.trim(),
      marketplace: $('marketplace')?.value || 'EBAY_US',
      min: $('min').value,
      max: $('max').value,
      minScore: Number($('minScore').value || 0),
      minFeedback: Number($('minFeedback')?.value || 0),
      minReviews: Number($('minReviews')?.value || 0),
      sort: $('sort').value,
      state: $('state').value,
      format: $('format')?.value || '',
      freeShipping: $('freeShipping')?.checked ? '1' : '',
      hideSponsored: !!$('hideSponsored')?.checked,
    }
  }

  function filterAndSort(list, f) {
    let out = list.slice()
    const min = f.min !== '' ? Number(f.min) : null
    const max = f.max !== '' ? Number(f.max) : null
    if (min != null && Number.isFinite(min)) out = out.filter((x) => x.price != null && x.price >= min)
    if (max != null && Number.isFinite(max)) out = out.filter((x) => x.price != null && x.price <= max)
    if (f.state === 'new') out = out.filter((x) => /new/i.test(x.condition || '') && !/parts/i.test(x.condition || ''))
    if (f.state === 'used') out = out.filter((x) => /used|pre-?owned|good|excellent|refurb|open/i.test(x.condition || ''))
    if (f.format === 'bin') {
      out = out.filter(
        (x) =>
          x.buyingOptions?.includes('FIXED_PRICE') ||
          /buy it now/i.test(x.buyingFormat || '') ||
          !x.buyingOptions?.includes('AUCTION'),
      )
    }
    if (f.format === 'auction') out = out.filter((x) => x.buyingOptions?.includes('AUCTION'))
    if (f.freeShipping) out = out.filter((x) => /free/i.test(x.shipping || ''))
    if (f.hideSponsored) out = out.filter((x) => !x.sponsored)
    if (f.minFeedback > 0) {
      out = out.filter((x) => x.seller?.feedback == null || x.seller.feedback >= f.minFeedback)
    }
    if (f.minReviews > 0) {
      out = out.filter((x) => (x.seller?.reviews || 0) >= f.minReviews)
    }
    out = out.filter((x) => x.score >= (f.minScore || 0))

    if (f.sort === 'priceAsc') out.sort((a, b) => (a.price ?? 1e12) - (b.price ?? 1e12))
    else if (f.sort === 'priceDesc') out.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    else if (f.sort === 'seller') {
      out.sort(
        (a, b) =>
          (b.seller?.feedback || 0) - (a.seller?.feedback || 0) ||
          (b.seller?.reviews || 0) - (a.seller?.reviews || 0),
      )
    } else out.sort((a, b) => b.score - a.score)
    return out
  }

  async function fetchJson(url, ms = 25000) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), ms)
    try {
      const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
      return await r.json()
    } finally {
      clearTimeout(t)
    }
  }

  function mapApiItem(it) {
    return {
      id: String(it.id),
      title: it.title || 'eBay item',
      subtitle: it.subtitle || null,
      url: it.url || '',
      price: it.price == null ? null : Number(it.price),
      priceTo: it.priceTo == null ? null : Number(it.priceTo),
      currency: it.currency || 'USD',
      image: it.image || null,
      condition: it.condition || '',
      shipping: it.shipping || null,
      location: it.location || null,
      buyingOptions: it.buyingOptions || [],
      buyingFormat: it.buyingFormat || null,
      sponsored: !!it.sponsored,
      seller: {
        username: it.seller?.username || null,
        reviews: it.seller?.reviews ?? null,
        feedback: it.seller?.feedback ?? null,
      },
    }
  }

  async function fetchLive(f) {
    const u = new URL('/api/ebay-search', location.origin)
    u.searchParams.set('q', f.q || 'iphone')
    u.searchParams.set('limit', '50')
    u.searchParams.set('marketplace', f.marketplace || 'EBAY_US')
    if (f.min) u.searchParams.set('min', f.min)
    if (f.max) u.searchParams.set('max', f.max)
    if (f.state) u.searchParams.set('condition', f.state)
    if (f.format) u.searchParams.set('format', f.format)
    if (f.freeShipping) u.searchParams.set('freeShipping', '1')
    if (f.sort && f.sort !== 'score' && f.sort !== 'seller') u.searchParams.set('sort', f.sort)

    const data = await fetchJson(u.toString())
    if (!data.ok) {
      const err = new Error(data.message || data.error || data.reason || 'eBay API failed')
      err.searchUrl = data.searchUrl
      err.reason = data.reason
      throw err
    }
    return {
      items: (data.items || []).map(mapApiItem),
      source: data.source || 'serpapi-ebay',
      searchUrl: data.searchUrl || '',
      total: data.total ?? null,
    }
  }

  async function fetchSnapshot(q) {
    const r = await fetch('./catalog.json')
    if (!r.ok) throw new Error('catalog missing')
    const data = await r.json()
    let items = (data.items || []).map(mapApiItem)
    if (q) {
      const needle = q.toLowerCase().split(/\s+/).filter(Boolean)
      items = items.filter((it) => {
        const hay = `${it.title} ${it.subtitle || ''}`.toLowerCase()
        return needle.every((t) => hay.includes(t))
      })
    }
    return {
      items,
      source: 'snapshot',
      searchUrl: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q || 'iphone')}`,
      total: items.length,
    }
  }

  function L(uk, en) {
    return window.DemoLang && window.DemoLang.get() === 'en' ? en : uk
  }

  async function loadItems(f) {
    try {
      const live = await fetchLive(f)
      if (live.items.length) return live
      state.note = L('SerpApi повернув 0 лотів — snapshot.', 'SerpApi returned 0 listings — snapshot.')
    } catch (e) {
      state.note =
        e.reason === 'no_credentials'
          ? L(
              'Немає SERPAPI_API_KEY — snapshot. Додай ключ з serpapi.com для live eBay.',
              'No SERPAPI_API_KEY — snapshot. Add a serpapi.com key for live eBay.',
            )
          : L(
              `Live eBay недоступний (${e.message}). Snapshot.`,
              `Live eBay unavailable (${e.message}). Snapshot.`,
            )
      state.searchUrl = e.searchUrl || ''
    }
    return fetchSnapshot(f.q)
  }

  function applyLocal() {
    const f = readFilters()
    const enriched = enrich(state.raw)
    const items = filterAndSort(enriched, f)
    state.items = items
    const avg = items.length ? Math.round(items.reduce((s, x) => s + x.score, 0) / items.length) : 0
    const prices = items.map((x) => x.price).filter((n) => n != null)
    const med = prices.length ? prices.slice().sort((a, b) => a - b)[Math.floor(prices.length / 2)] : null
    const hot = items.filter((x) => x.score >= 70).length
    const trusted = items.filter((x) => (x.seller?.feedback || 0) >= 99 && (x.seller?.reviews || 0) >= 100).length
    const freeShip = items.filter((x) => /free/i.test(x.shipping || '')).length
    const best = items.slice().sort((a, b) => b.score - a.score).slice(0, 5)

    $('stats').innerHTML = `
      <b>${L('Аналітика', 'Analytics')}</b>
      <div>${L('Джерело', 'Source')}: <b>${escapeHtml(state.source === 'serpapi-ebay' ? 'SerpApi eBay' : state.source || '—')}</b></div>
      <div>${L('У видачі API', 'From API')}: <b>${state.raw.length}</b>${state.total != null ? ` / ~${Number(state.total).toLocaleString()}` : ''}</div>
      <div>${L('Після фільтрів', 'After filters')}: <b>${items.length}</b></div>
      <div>Hot deals (≥70): <b>${hot}</b></div>
      <div>Trusted sellers: <b>${trusted}</b></div>
      <div>Free shipping: <b>${freeShip}</b></div>
      <div>Avg score: <b>${avg || '—'}</b></div>
      <div>Median: <b>${med != null ? money(med) : '—'}</b></div>
      ${state.note ? `<div style="margin-top:8px;color:#b45309">${escapeHtml(state.note)}</div>` : ''}
      ${state.searchUrl ? `<div style="margin-top:6px"><a href="${escapeHtml(state.searchUrl)}" target="_blank" rel="noreferrer">Той самий пошук на eBay →</a></div>` : ''}
    `
    renderBest(best, med)
    render()
  }

  function renderBest(best, med) {
    const box = $('bestPanel')
    if (!box) return
    if (!best?.length) {
      box.innerHTML = `<b>Топ угоди</b><p class="bestEmpty">Зроби пошук — ранжуємо за ціною, продавцем і станом.</p>`
      return
    }
    box.innerHTML = `
      <b>Топ угоди</b>
      <p class="bestLead">Score = ціна vs median${med != null ? ` (${money(med)})` : ''} + seller trust + shipping + стан.</p>
      <ol class="bestList">
        ${best
          .map(
            (item, i) => `<li class="bestItem" data-open="${escapeHtml(item.id)}">
              <div class="bestTop"><span class="bestRank">#${i + 1}</span><span class="bestScore">SCORE ${item.score}</span></div>
              <strong class="bestTitle">${escapeHtml(item.title)}</strong>
              <div class="bestMeta">${money(item.price, item.currency)}${item.condition ? ` · ${escapeHtml(item.condition)}` : ''}${
                item.seller?.feedback != null ? ` · ${item.seller.feedback}%` : ''
              }</div>
              <ul class="bestWhy">${(item.why || [])
                .slice(0, 3)
                .map((w) => `<li class="${w.ok ? 'ok' : 'bad'}">${escapeHtml(w.text)}</li>`)
                .join('')}</ul>
            </li>`,
          )
          .join('')}
      </ol>`
  }

  async function run() {
    state.tab = 'search'
    syncTabs()
    state.loading = true
    state.error = ''
    state.note = ''
    state.items = []
    renderShell()
    $('livePill').textContent = '…'

    try {
      const f = readFilters()
      const { items, source, searchUrl, total } = await loadItems(f)
      state.source = source
      state.searchUrl = searchUrl || ''
      state.total = total
      state.raw = items
      $('livePill').textContent = source === 'serpapi-ebay' ? 'LIVE SerpApi' : 'CACHE'
      $('livePill').classList.toggle('snap', source !== 'serpapi-ebay')
      state.loading = false
      applyLocal()
    } catch (err) {
      state.loading = false
      state.error = String(err.message || err)
      $('livePill').textContent = 'ERR'
      $('stats').innerHTML = `<b>Error</b><div>${escapeHtml(state.error)}</div>`
      render()
    }
  }

  function syncTabs() {
    document.querySelectorAll('.navBtn').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === state.tab)
    })
  }

  function renderShell() {
    $('loading').classList.toggle('hidden', !state.loading)
    if (state.loading) {
      $('cards').innerHTML = ''
      $('empty').classList.add('hidden')
      $('count').textContent = 'SerpApi → eBay…'
    }
  }

  function visible() {
    return state.tab === 'fav' ? [...state.fav.values()] : state.items
  }

  function sellerLine(item) {
    const s = item.seller || {}
    if (!s.username && s.feedback == null) return ''
    const bits = []
    if (s.username) bits.push(s.username)
    if (s.feedback != null) bits.push(`${s.feedback}%`)
    if (s.reviews != null) bits.push(`${Number(s.reviews).toLocaleString()} rev`)
    return bits.join(' · ')
  }

  function render() {
    const list = visible()
    $('countTitle').textContent = state.tab === 'fav' ? 'Saved' : 'eBay listings'
    $('count').textContent = `${list.length} results`
    $('favCount').textContent = String(state.fav.size)
    $('loading').classList.add('hidden')
    const box = $('cards')
    box.className = `cards ${state.view}`
    box.innerHTML = ''

    if (!list.length) {
      $('empty').classList.remove('hidden')
      $('empty').textContent =
        state.error ||
        (state.tab === 'fav' ? 'Немає збережених.' : 'Нічого не пройшло фільтри. Послаб критерії.')
      return
    }
    $('empty').classList.add('hidden')

    for (const item of list) {
      const el = document.createElement('article')
      el.className = 'card'
      const liked = state.fav.has(item.id)
      const img = item.image || placeholder(item.title)
      const seller = sellerLine(item)
      el.innerHTML = `
        <div class="thumb">
          <img src="${img}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${placeholder(item.title)}'" />
          <span class="badge deal ${item.score >= 70 ? 'hot' : ''}">SCORE ${item.score}</span>
          ${item.sponsored ? '<span class="badge top">AD</span>' : ''}
        </div>
        <div class="cardBody">
          <h3 class="title">${escapeHtml(item.title)}</h3>
          <div class="meta">${escapeHtml(item.condition || 'eBay')}${item.shipping ? ` · ${escapeHtml(item.shipping)}` : ''}${
            item.buyingFormat ? ` · ${escapeHtml(item.buyingFormat)}` : ''
          }</div>
          ${seller ? `<div class="ship">${escapeHtml(seller)}</div>` : ''}
          ${item.whyShort ? `<p class="whyLine">${escapeHtml(item.whyShort)}</p>` : ''}
          <div class="price">${money(item.price, item.currency)}${
            item.priceTo != null ? ` – ${money(item.priceTo, item.currency)}` : ''
          }</div>
        </div>
        <div class="actions">
          <button type="button" class="open" data-open="${escapeHtml(item.id)}">Чому score</button>
          <button type="button" class="fav ${liked ? 'on' : ''}" data-fav="${escapeHtml(item.id)}">${liked ? '♥' : '♡'}</button>
        </div>`
      box.appendChild(el)
    }
  }

  function findItem(id) {
    return state.items.find((x) => x.id === id) || state.fav.get(id) || state.raw.find((x) => x.id === id)
  }

  function openItem(id) {
    const item = findItem(id)
    if (!item) return
    const p = item.scoreParts || {}
    $('modalBody').innerHTML = `
      <div class="detail">
        <div class="detailImg">
          <img src="${item.image || placeholder(item.title)}" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${placeholder(item.title)}'" />
        </div>
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          ${item.subtitle ? `<p class="muted">${escapeHtml(item.subtitle)}</p>` : ''}
          <div class="price">SCORE ${item.score} · ${money(item.price, item.currency)}</div>
          <p class="detailCond"><b>Стан:</b> ${escapeHtml(item.condition || 'n/a')}
            ${item.shipping ? ` · ${escapeHtml(item.shipping)}` : ''}
            ${item.location ? ` · ${escapeHtml(item.location)}` : ''}</p>
          <p class="detailCond"><b>Продавець:</b> ${escapeHtml(sellerLine(item) || 'n/a')}</p>
          <div class="whyBox">
            <b>Чому цей score</b>
            <ul>${(item.why || []).map((w) => `<li class="${w.ok ? 'ok' : 'bad'}">${escapeHtml(w.text)}</li>`).join('')}</ul>
          </div>
          <p class="scoreBreak"><b>Розклад</b><br/>
            Ціна: ${Number(p.price || 0)} · Стан: ${Number(p.condition || 0)} · Seller: ${Number(p.seller || 0)}<br/>
            Shipping: ${Number(p.shipping || 0)} · Format: ${Number(p.format || 0)} · Title: ${Number(p.title || 0)} · Media: ${Number(p.media || 0)}
          </p>
          <div class="detailActions">
            ${item.url ? `<a class="btnRed" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Відкрити на eBay</a>` : ''}
            <button type="button" class="btnBlue" data-fav="${escapeHtml(item.id)}">${state.fav.has(item.id) ? 'Unsave' : 'Save'}</button>
            <button type="button" id="closeFromDetail">Close</button>
          </div>
        </div>
      </div>`
    $('modal').classList.remove('hidden')
    document.body.style.overflow = 'hidden'
    const c = document.getElementById('closeFromDetail')
    if (c) c.onclick = closeModal
  }

  function closeModal() {
    $('modal').classList.add('hidden')
    document.body.style.overflow = ''
  }

  function toggleFav(id) {
    const item = findItem(id)
    if (!item) return
    if (state.fav.has(id)) state.fav.delete(id)
    else state.fav.set(id, item)
    saveFav()
    render()
    if (!$('modal').classList.contains('hidden')) openItem(id)
  }

  function bind() {
    $('chips').innerHTML = TREND.map((t) => `<button type="button" class="chip" data-q="${t}">${t}</button>`).join('')
    $('searchForm').onsubmit = (e) => {
      e.preventDefault()
      run()
    }
    $('applyBtn').onclick = () => {
      if (state.raw.length) applyLocal()
      else run()
    }
    $('resetBtn').onclick = () => {
      $('q').value = 'iphone 15'
      $('min').value = ''
      $('max').value = ''
      $('minScore').value = '0'
      if ($('minFeedback')) $('minFeedback').value = '0'
      if ($('minReviews')) $('minReviews').value = '0'
      $('sort').value = 'score'
      $('state').value = ''
      if ($('format')) $('format').value = ''
      if ($('marketplace')) $('marketplace').value = 'EBAY_US'
      if ($('freeShipping')) $('freeShipping').checked = false
      if ($('hideSponsored')) $('hideSponsored').checked = false
      run()
    }
    $('sort').onchange = () => {
      if (state.raw.length) applyLocal()
    }
    $('gridBtn').onclick = () => {
      state.view = 'grid'
      $('gridBtn').classList.add('on')
      $('listBtn').classList.remove('on')
      render()
    }
    $('listBtn').onclick = () => {
      state.view = 'list'
      $('listBtn').classList.add('on')
      $('gridBtn').classList.remove('on')
      render()
    }
    document.querySelectorAll('.navBtn').forEach((btn) => {
      btn.onclick = () => {
        state.tab = btn.dataset.tab
        syncTabs()
        render()
      }
    })
    $('closeModal').onclick = closeModal
    $('modal').onclick = (e) => {
      if (e.target.id === 'modal') closeModal()
    }
    document.onkeydown = (e) => {
      if (e.key === 'Escape') closeModal()
    }
    document.onclick = (e) => {
      const t = e.target
      if (!(t instanceof HTMLElement)) return
      const chip = t.closest('[data-q]')
      if (chip?.dataset.q) {
        $('q').value = chip.dataset.q
        run()
        return
      }
      const fav = t.closest('[data-fav]')
      if (fav?.dataset.fav) {
        e.preventDefault()
        toggleFav(fav.dataset.fav)
        return
      }
      const open = t.closest('[data-open]')
      if (open?.dataset.open) openItem(open.dataset.open)
    }
  }

  bind()
  saveFav()
  if (window.DemoLang) {
    window.DemoLang.mount(document.getElementById('langMount'), 'bay')
    window.addEventListener('demo-lang', () => {
      applyLocal()
      render()
    })
  }
  run()
})()
