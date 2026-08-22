(() => {
  'use strict'

  const IMG = (file) => `assets/${file}?v=7`

  const MENU = [
    {
      id: 'shadow',
      cat: 'Espresso',
      name: 'Shadow Roast',
      desc: 'Dark, deep, slightly dangerous',
      price: 75,
      img: IMG('shadow.jpg'),
    },
    {
      id: 'flat',
      cat: 'Espresso',
      name: 'Flat White',
      desc: 'Подвійний еспресо · молоко',
      price: 85,
      img: IMG('flat.jpg'),
    },
    {
      id: 'sunrise',
      cat: 'Pour over',
      name: 'Crocodile Sunrise',
      desc: 'V60 · citrus · bright finish',
      price: 110,
      img: IMG('sunrise.jpg'),
    },
    {
      id: 'guji',
      cat: 'Pour over',
      name: 'Filter Guji',
      desc: 'Квіткова кислота · чайний body',
      price: 95,
      img: IMG('guji.jpg'),
    },
    {
      id: 'affogato',
      cat: 'Specials',
      name: 'Croc Affogato',
      desc: 'Еспресо поверх ванілі',
      price: 130,
      img: IMG('affogato.jpg'),
    },
    {
      id: 'chai',
      cat: 'Specials',
      name: 'Chai Croc Latte',
      desc: 'Пряний · кремовий',
      price: 120,
      img: IMG('chai.jpg'),
    },
    {
      id: 'matcha',
      cat: 'Specials',
      name: 'Matcha Tiramisu',
      desc: 'Layers of green, cream, dreams',
      price: 145,
      img: IMG('matcha.jpg'),
    },
    {
      id: 'lemonade',
      cat: 'Cold',
      name: 'Yuzu Lemonade',
      desc: 'Кислий · свіжий · лід',
      price: 90,
      img: IMG('lemonade.jpg'),
    },
    {
      id: 'croissant',
      cat: 'Bakery',
      name: 'Butter Croissant',
      desc: 'Свіжа випічка зранку',
      price: 65,
      img: IMG('croissant.jpg'),
    },
    {
      id: 'brownie',
      cat: 'Bakery',
      name: 'Cocoa Brownie',
      desc: 'Щільний шоколадний квадрат',
      price: 80,
      img: IMG('brownie.jpg'),
    },
    {
      id: 'honey',
      cat: 'Cakes',
      name: 'Медовик',
      desc: 'Класичний торт · тонкі коржі',
      price: 160,
      img: IMG('cake-honey.jpg'),
    },
    {
      id: 'cheesecake',
      cat: 'Cakes',
      name: 'Чизкейк',
      desc: 'Нью-Йорк · ягідний топ',
      price: 155,
      img: IMG('cake-cheese.jpg'),
    },
    {
      id: 'choco',
      cat: 'Cakes',
      name: 'Шоколадний торт',
      desc: 'Ганаш · какао · щільний',
      price: 170,
      img: IMG('cake-choco.jpg'),
    },
    {
      id: 'carrot',
      cat: 'Cakes',
      name: 'Морквяний торт',
      desc: 'Крем-сир · горіхи',
      price: 150,
      img: IMG('cake-carrot.jpg'),
    },
    {
      id: 'bag',
      cat: 'Beans',
      name: 'House Blend 250g',
      desc: 'На винос · medium roast',
      price: 420,
      img: IMG('bag.jpg'),
    },
  ]

  const SECTIONS = [
    { cat: 'Espresso', title: 'Espresso', note: 'шот · молоко · тінь' },
    { cat: 'Pour over', title: 'Pour over', note: 'V60 · filter · світло' },
    { cat: 'Specials', title: 'Specials', note: 'сезонні позиції' },
    { cat: 'Cold', title: 'Cold', note: 'лід · свіжість' },
    { cat: 'Bakery', title: 'Bakery', note: 'зранку з печі' },
    { cat: 'Cakes', title: 'Тортики', note: 'шматочок до кави' },
    { cat: 'Beans', title: 'Beans', note: 'додому' },
  ]

  const ORIGINS = [
    {
      id: 'eth',
      name: 'Ethiopia',
      note: 'Жасмин · бергамот',
      taste: 'Квітковий, чайний body, довгий солодкий фініш. Ідеально під V60 і Crocodile Sunrise.',
      tone: '#e8783a',
    },
    {
      id: 'col',
      name: 'Colombia',
      note: 'Какао · карамель',
      taste: 'Щільніший cup, горіхова солодкість. Дружить з молоком і Shadow Roast.',
      tone: '#d46528',
    },
    {
      id: 'ken',
      name: 'Kenya',
      note: 'Смородина · вино',
      taste: 'Яскрава кислота, соковитий mid. Для тих, хто любить «вау».',
      tone: '#1a2744',
    },
    {
      id: 'bra',
      name: 'Brazil',
      note: 'Горіх · шоколад',
      taste: 'М’який, низька кислота. База для еспресо-бленду KŌHI.',
      tone: '#f0dfc0',
    },
  ]

  const DEFAULT_REVIEWS = [
    {
      id: 'r1',
      name: 'Марія',
      stars: 5,
      text: 'Sunrise на V60 — як з меню крокодила з вітрини. Повертаюсь.',
      at: Date.now() - 86400000 * 8,
    },
    {
      id: 'r2',
      name: 'Andriy',
      stars: 5,
      text: 'Тихо, смачно, Wi‑Fi тримає. Flat White ідеальний.',
      at: Date.now() - 86400000 * 3,
    },
    {
      id: 'r3',
      name: 'Olya',
      stars: 4,
      text: 'Matcha tiramisu — wow. В обід трохи черга.',
      at: Date.now() - 86400000,
    },
  ]

  const $ = (id) => document.getElementById(id)
  const CATS = ['All', ...SECTIONS.map((s) => s.cat)]
  let cat = 'All'
  let cart = JSON.parse(localStorage.getItem('kohi_cart_v2') || '[]')
  let history = JSON.parse(localStorage.getItem('kohi_orders_v1') || '[]')
  let reviews = JSON.parse(localStorage.getItem('kohi_reviews_v1') || 'null') || DEFAULT_REVIEWS.slice()
  let roastT = 0

  function saveCart() {
    localStorage.setItem('kohi_cart_v2', JSON.stringify(cart))
  }
  function saveHistory() {
    localStorage.setItem('kohi_orders_v1', JSON.stringify(history))
  }
  function saveReviews() {
    localStorage.setItem('kohi_reviews_v1', JSON.stringify(reviews))
  }

  function money(n) {
    return `${n} ₴`
  }

  function cartSum() {
    return cart.reduce((s, x) => s + x.price * x.qty, 0)
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function cardHtml(m, i = 0) {
    const span = i % 7 === 0 || i % 7 === 4 ? ' wide' : ''
    return `
      <article class="card reveal${span}" style="--d:${(i % 8) * 50}ms">
        <div class="cardMedia">
          <img src="${escapeHtml(m.img)}" alt="${escapeHtml(m.name)}" loading="lazy" decoding="async" />
          <span class="cat">${escapeHtml(m.cat === 'Cakes' ? 'Тортики' : m.cat)}</span>
        </div>
        <div class="cardBody">
          <h3>${escapeHtml(m.name)}</h3>
          <p>${escapeHtml(m.desc)}</p>
          <div class="priceRow">
            <div class="price">${money(m.price)}</div>
            <button type="button" data-add="${m.id}">+ У кошик</button>
          </div>
        </div>
      </article>`
  }

  function renderTabs() {
    $('menuTabs').innerHTML = CATS.map((c) => {
      const label = c === 'Cakes' ? 'Тортики' : c === 'All' ? 'Усе меню' : c
      const count =
        c === 'All' ? MENU.length : MENU.filter((m) => m.cat === c).length
      return `<button type="button" class="menuTab ${c === cat ? 'on' : ''}" data-cat="${escapeHtml(c)}">${escapeHtml(label)} <em>${count}</em></button>`
    }).join('')
  }

  function renderMenu() {
    if (cat === 'All') {
      $('menuGrid').innerHTML = `
        <div class="menuBento">
          ${MENU.map((m, i) => cardHtml(m, i)).join('')}
        </div>`
    } else {
      const sections = SECTIONS.filter((s) => s.cat === cat)
      $('menuGrid').innerHTML = sections
        .map((sec) => {
          const items = MENU.filter((m) => m.cat === sec.cat)
          if (!items.length) return ''
          return `
          <section class="menuBlock">
            <header class="menuDivider">
              <h3>${escapeHtml(sec.title)}</h3>
              <span>${escapeHtml(sec.note)} · ${items.length}</span>
            </header>
            <div class="menuBento menuBento--cat">
              ${items.map((m, i) => cardHtml(m, i)).join('')}
            </div>
          </section>`
        })
        .join('')
    }
    observeReveal()
  }

  function observeReveal() {
    const nodes = document.querySelectorAll('.reveal:not(.in)')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    nodes.forEach((n) => io.observe(n))
  }

  function renderOrigins() {
    $('originGrid').innerHTML = ORIGINS.map(
      (o, i) => `
      <button type="button" class="origin ${i === 0 ? 'on' : ''}" data-o="${o.id}" style="--tone:${o.tone}">
        <i class="originSwatch" aria-hidden="true"></i>
        <span class="originCopy"><b>${o.name}</b><span>${o.note}</span></span>
      </button>`,
    ).join('')
    $('tasteMap').textContent = ORIGINS[0].taste
  }

  function renderReviews() {
    $('reviewGrid').innerHTML = reviews
      .slice()
      .sort((a, b) => b.at - a.at)
      .map(
        (r) => `
      <article class="reviewCard">
        <div class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
        <b>${escapeHtml(r.name)}</b>
        <p>${escapeHtml(r.text)}</p>
        <time>${new Date(r.at).toLocaleDateString('uk-UA')}</time>
      </article>`,
      )
      .join('')
  }

  function renderHistory() {
    const box = $('historyList')
    if (!history.length) {
      box.innerHTML = '<p class="emptyHist">Поки немає оплачених замовлень. Додай у кошик і натисни «Оплатити».</p>'
      return
    }
    box.innerHTML = history
      .slice()
      .sort((a, b) => b.at - a.at)
      .map(
        (o) => `
      <article class="histCard">
        <div class="histTop">
          <b>#${escapeHtml(o.id)}</b>
          <span>${new Date(o.at).toLocaleString('uk-UA')}</span>
        </div>
        <ul>${o.items.map((i) => `<li>${escapeHtml(i.name)} × ${i.qty} — ${money(i.price * i.qty)}</li>`).join('')}</ul>
        <div class="histPay">
          <span>${escapeHtml(o.method || (o.kind === 'table' ? 'Столик' : 'Онлайн'))} · ${escapeHtml(o.when || 'Pickup')}</span>
          <b>${money(o.total)}</b>
          <em>${escapeHtml(o.status)}</em>
        </div>
      </article>`,
      )
      .join('')
  }

  function renderCart() {
    $('cartCount').textContent = String(cart.reduce((s, x) => s + x.qty, 0))
    $('cartList').innerHTML = cart.length
      ? cart
          .map(
            (c) => `
        <div class="cartItem">
          <img src="${escapeHtml(c.img || '')}" alt="" />
          <div class="cartMeta">
            <span>${escapeHtml(c.name)}</span>
            <div class="qtyRow">
              <button type="button" data-qty="${c.id}" data-d="-1">−</button>
              <b>${c.qty}</b>
              <button type="button" data-qty="${c.id}" data-d="1">+</button>
            </div>
          </div>
          <b>${money(c.price * c.qty)}</b>
        </div>`,
          )
          .join('')
      : '<p class="cartEmpty">Порожньо — обери щось з меню</p>'
    $('cartSum').textContent = money(cartSum())
    $('payBtn').disabled = !cart.length
  }

  function add(id) {
    const item = MENU.find((m) => m.id === id)
    if (!item) return
    const row = cart.find((c) => c.id === id)
    if (row) row.qty++
    else cart.push({ id: item.id, name: item.name, price: item.price, qty: 1, img: item.img })
    saveCart()
    renderCart()
  }

  function changeQty(id, d) {
    const row = cart.find((c) => c.id === id)
    if (!row) return
    row.qty += d
    if (row.qty <= 0) cart = cart.filter((c) => c.id !== id)
    saveCart()
    renderCart()
  }

  function formatCard(v) {
    return v
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  let payMode = 'online' // online | table
  let tableDraft = null

  const TABLES = {
    3: { total: 420, label: 'біля вікна' },
    7: { total: 380, label: 'бар' },
    12: { total: 560, label: 'тераса' },
    18: { total: 290, label: 'куток' },
  }

  function selectedTable() {
    const on = document.querySelector('.tableChip.on')
    const id = on?.dataset.table || '3'
    const meta = TABLES[id] || TABLES[3]
    return {
      table: String(id),
      label: on?.dataset.label || meta.label,
      total: Number(on?.dataset.total) || meta.total,
      guests: 0,
      name: 'Гість',
      phone: '',
      when: 'Зараз',
    }
  }

  function syncTableNote() {
    const d = selectedTable()
    if ($('tableNote')) {
      $('tableNote').textContent = `Симуляція скану QR столика №${d.table} · ${money(d.total)}`
    }
  }

  function openMonoPay(draft) {
    tableDraft = draft
    payMode = 'table'
    if ($('monoTable')) $('monoTable').textContent = `Стіл №${draft.table} · ${draft.label}`
    if ($('monoSum')) $('monoSum').textContent = money(draft.total)
    if ($('monoNote')) $('monoNote').textContent = ''
    const btn = $('monoPayBtn')
    if (btn) {
      btn.disabled = false
      btn.textContent = 'Сплатити'
    }
    closePay()
    $('monoModal')?.classList.remove('hidden')
    $('scrim').classList.remove('hidden')
  }

  function closeMono() {
    $('monoModal')?.classList.add('hidden')
  }

  function openPay(mode = 'online') {
    payMode = mode
    $('payNote').textContent = ''
    if (mode === 'table') {
      openMonoPay(selectedTable())
      return
    }
    if (!cart.length) {
      if ($('onlineNote')) $('onlineNote').textContent = 'Спочатку додай щось у кошик з меню.'
      return
    }
    if ($('onlineNote')) $('onlineNote').textContent = ''
    $('payTitle').textContent = 'Оплата онлайн · демо'
    $('payAmount').textContent = money(cartSum())
    $('payWhen').innerHTML = `
      <option>Самовивіз · сьогодні 16:00</option>
      <option>Самовивіз · сьогодні 18:00</option>
      <option>Самовивіз · завтра 11:00</option>`
    closeMono()
    $('payModal').classList.remove('hidden')
    $('scrim').classList.remove('hidden')
  }

  function closePay() {
    $('payModal').classList.add('hidden')
  }

  function closeAll() {
    $('cartDrawer').classList.add('hidden')
    closePay()
    closeMono()
    $('scrim').classList.add('hidden')
  }

  function placeOrder(meta) {
    const isTable = payMode === 'table' && tableDraft
    const order = {
      id: Math.random().toString(36).slice(2, 8).toUpperCase(),
      at: Date.now(),
      kind: isTable ? 'table' : 'online',
      items: isTable
        ? [
            {
              id: 'table',
              name: `Столик №${tableDraft.table}${tableDraft.label ? ` · ${tableDraft.label}` : ''}`,
              price: tableDraft.total,
              qty: 1,
            },
          ]
        : cart.map((c) => ({ ...c })),
      total: isTable ? tableDraft.total : cartSum(),
      when: meta.when,
      name: meta.name,
      phone: '',
      table: isTable ? tableDraft.table : '',
      status: isTable ? 'Столик · mono оплачено' : 'Оплачено · готуємо',
      last4: meta.last4,
      method: meta.method || 'Картка',
    }
    history.unshift(order)
    saveHistory()
    if (!isTable) {
      cart = []
      saveCart()
      renderCart()
    }
    tableDraft = null
    renderHistory()
    return order
  }

  const phases = ['Drying', 'Maillard', 'First crack', 'Development', 'Drop']
  function tickRoast() {
    roastT += 1
    const m = String(Math.floor(roastT / 60)).padStart(2, '0')
    const s = String(roastT % 60).padStart(2, '0')
    $('roastTimer').textContent = `${m}:${s}`
    const temp = 150 + Math.min(60, Math.floor(roastT / 2))
    $('roastTemp').textContent = `${temp}°`
    const pi = Math.min(phases.length - 1, Math.floor(roastT / 25))
    $('roastPhase').textContent = phases[pi]
    const prog = Math.min(0.92, roastT / 140)
    $('roastArc').style.strokeDashoffset = String(327 * (1 - prog))
    if (roastT > 150) roastT = 0
  }
  setInterval(tickRoast, 1000)
  tickRoast()

  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-cat]')
    if (tab) {
      cat = tab.dataset.cat
      renderTabs()
      renderMenu()
      return
    }
    const addBtn = e.target.closest('[data-add]')
    if (addBtn) {
      add(addBtn.dataset.add)
      return
    }
    const qty = e.target.closest('[data-qty]')
    if (qty) {
      changeQty(qty.dataset.qty, Number(qty.dataset.d) || 0)
      return
    }
    const o = e.target.closest('[data-o]')
    if (o) {
      document.querySelectorAll('.origin').forEach((el) => el.classList.remove('on'))
      o.classList.add('on')
      const item = ORIGINS.find((x) => x.id === o.dataset.o)
      if (item) {
        $('tasteMap').textContent = item.taste
        $('batchName').textContent = item.name
      }
    }
  })

  $('cartBtn').onclick = () => {
    $('cartDrawer').classList.remove('hidden')
    $('scrim').classList.remove('hidden')
    closePay()
    closeMono()
  }
  $('cartClose').onclick = closeAll
  $('scrim').onclick = closeAll
  $('cartClear').onclick = () => {
    cart = []
    saveCart()
    renderCart()
  }
  $('payBtn').onclick = () => openPay('online')
  const payOnlineBtn = $('payOnlineBtn')
  if (payOnlineBtn) {
    payOnlineBtn.onclick = () => {
      if (!cart.length) {
        if ($('onlineNote')) $('onlineNote').textContent = 'Кошик порожній — спочатку обери з меню.'
        $('cartDrawer').classList.remove('hidden')
        $('scrim').classList.remove('hidden')
        return
      }
      openPay('online')
    }
  }

  document.querySelectorAll('.tableChip').forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll('.tableChip').forEach((b) => b.classList.remove('on'))
      btn.classList.add('on')
      syncTableNote()
    }
  })
  syncTableNote()

  $('tableMonoBtn')?.addEventListener('click', () => {
    openMonoPay(selectedTable())
  })

  function monoConfirm() {
    if (!tableDraft) return
    payMode = 'table'
    const draft = tableDraft
    const btn = $('monoPayBtn')
    if (btn) {
      btn.disabled = true
      btn.textContent = 'Обробка…'
    }
    if ($('monoNote')) $('monoNote').textContent = 'mono · підтвердження…'
    setTimeout(() => {
      const order = placeOrder({
        name: 'Гість',
        when: `Стіл №${draft.table} · зараз`,
        last4: 'mono',
        method: 'mono',
      })
      if ($('monoNote')) $('monoNote').textContent = `Сплачено · #${order.id}`
      if (btn) btn.textContent = 'Готово'
      setTimeout(() => {
        closeAll()
        document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' })
      }, 700)
    }, 700)
  }

  $('monoClose')?.addEventListener('click', () => {
    closeMono()
    if ($('cartDrawer').classList.contains('hidden') && $('payModal').classList.contains('hidden')) {
      $('scrim').classList.add('hidden')
    }
  })
  $('monoPayBtn')?.addEventListener('click', monoConfirm)

  $('payClose').onclick = () => {
    closePay()
    if (!$('cartDrawer').classList.contains('hidden')) $('scrim').classList.remove('hidden')
    else if (!$('monoModal')?.classList.contains('hidden')) $('scrim').classList.remove('hidden')
    else $('scrim').classList.add('hidden')
  }

  $('payCard').addEventListener('input', (e) => {
    e.target.value = formatCard(e.target.value)
  })
  $('payExp').addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`
    e.target.value = v
  })

  function finishDemoPay(label, last4) {
    const whenEl = $('payWhen')
    const nameEl = $('payName')
    const order = placeOrder({
      name: (nameEl?.value || '').trim() || label,
      when: whenEl?.value || 'Самовивіз',
      last4,
      method: label,
    })
    const method = order.method || label
    $('payNote').textContent =
      order.kind === 'table'
        ? `Столик · ${method} · #${order.id}`
        : `${method} · #${order.id} · **** ${order.last4}`
    setTimeout(() => {
      closeAll()
      document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' })
    }, 700)
    return order
  }

  function walletPay(method, fakeLast4) {
    const g = $('gPayBtn')
    const a = $('aPayBtn')
    const submit = $('paySubmit')
    ;[g, a, submit].forEach((b) => {
      if (b) b.disabled = true
    })
    $('payNote').textContent = `${method} · підтвердження…`
    setTimeout(() => {
      finishDemoPay(method, fakeLast4)
      ;[g, a, submit].forEach((b) => {
        if (b) b.disabled = false
      })
      if (submit) submit.textContent = 'Підтвердити оплату'
      $('payForm')?.reset()
    }, 700)
  }

  $('gPayBtn').onclick = () => walletPay('Google Pay', '4242')
  $('aPayBtn').onclick = () => walletPay('Apple Pay', '1111')

  $('payForm').onsubmit = (e) => {
    e.preventDefault()
    const digits = $('payCard').value.replace(/\D/g, '')
    if (digits.length < 16) {
      $('payNote').textContent = 'Введи 16 цифр картки (будь-які для демо).'
      return
    }
    const btn = $('paySubmit')
    btn.disabled = true
    btn.textContent = 'Обробка…'
    setTimeout(() => {
      finishDemoPay('Картка', digits.slice(-4))
      btn.disabled = false
      btn.textContent = 'Підтвердити оплату'
      e.target.reset()
    }, 900)
  }

  // legacy pickup form removed — table + online pay instead

  $('reviewForm').onsubmit = (e) => {
    e.preventDefault()
    reviews.unshift({
      id: Math.random().toString(36).slice(2, 8),
      name: $('revName').value.trim(),
      stars: Number($('revStars').value) || 5,
      text: $('revText').value.trim(),
      at: Date.now(),
    })
    saveReviews()
    renderReviews()
    e.target.reset()
  }

  renderTabs()
  renderMenu()
  renderOrigins()
  renderReviews()
  renderHistory()
  renderCart()
})()
