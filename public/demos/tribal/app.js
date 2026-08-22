(() => {
  'use strict'

  const KEY = 'inkward_studio_v8'
  const PASS = 'inkward'
  const MAX_STORE = 2_500_000 // ~2.5MB — інакше вкладка «не відповідає»

  const DEFAULTS = {
    contact: {
      title: 'INKWARD',
      eyebrow: 'Neo Tribal · Kyiv',
      lead: 'Нео-трайбл, що лягає на тіло: гострі лінії, blackwork, негативний простір і рух силуету.',
      addr: 'Київ, Поділ · вул. Сагайдачного 12',
      hours: 'Вт–Нд · 12:00–21:00 · лише за записом',
      email: 'book@inkward.studio',
      phone: '+380 67 000 00 00',
      tg: '@inkward',
      lat: '50.4635',
      lon: '30.5215',
      bookText: 'Кинь зону на тілі й 1–2 референси — зберемо нео-ескіз під твій силует.',
      logo: './assets/logo.svg',
    },
    banners: [
      {
        id: 'b1',
        src: './assets/banner-neo.svg',
        title: 'Neo under the skin',
        text: 'Лінії під анатомію — hip, thigh, spine, shoulder. Не орнамент зверху, а частина силуету.',
      },
      {
        id: 'b2',
        src: './assets/hero-ink.jpg',
        title: 'Black · sharp · quiet',
        text: 'Тиха кімната на Подолі. Ескіз → сесія → догляд. Без черг, лише запис.',
      },
    ],
    gallery: [
      { id: 'g1', src: './assets/work-1.jpg', caption: 'Spine spear' },
      { id: 'g2', src: './assets/neo-hip.svg', caption: 'Hip flow' },
      { id: 'g3', src: './assets/work-2.jpg', caption: 'Shoulder band' },
      { id: 'g4', src: './assets/neo-thigh.svg', caption: 'Thigh black' },
      { id: 'g5', src: './assets/work-3.jpg', caption: 'Forearm neo' },
      { id: 'g6', src: './assets/work-5.jpg', caption: 'Session lines' },
    ],
    posts: [
      {
        id: 'a1',
        title: 'Нео-трайбл у INKWARD',
        body: 'Ми працюємо лише з neo tribal і blackwork: гострі лінії, абстрактні форми, симетрія й негативний простір. Ескіз завжди підганяється під плече, стегно, спину чи стегно — щоб малюнок рухався разом із тілом.',
        image: './assets/banner-neo.svg',
        tag: 'Neo',
        at: Date.now() - 86400000 * 12,
      },
      {
        id: 'a2',
        title: 'Майстер Олег · blackwork',
        body: 'Олег збирає великі композиції: spine, thigh black, щільний mesh. Любить довгі сесії без поспіху й чисту лінію. Запис через TG — кидай зону й референс.',
        image: './assets/work-1.jpg',
        tag: 'Майстри',
        at: Date.now() - 86400000 * 8,
      },
      {
        id: 'a3',
        title: 'Майстриня Ніна · fine neo',
        body: 'Ніна робить тонкий neo на передпліччя, ключицю й hip flow. Читає анатомію, залишає повітря між формами. Якщо хочеш легший рисунок без важкої заливки — до неї.',
        image: './assets/neo-hip.svg',
        tag: 'Майстри',
        at: Date.now() - 86400000 * 5,
      },
      {
        id: 'a4',
        title: 'Як лягає нео на тіло',
        body: '1) Зона й референси. 2) Ескіз під твій силует. 3) Трасування й робота лінією. 4) Догляд на руки. Mid-size — 2–4 години. Великі thigh / spine ділимо на кілька візитів.',
        image: './assets/work-3.jpg',
        tag: 'Процес',
        at: Date.now() - 86400000 * 2,
      },
      {
        id: 'a5',
        title: 'Догляд перші 14 днів',
        body: 'М’яке миття, тонка плівка мазі, без сонця й басейну. Якщо свербіння сильне — пиши майстру в TG. Ми на зв’язку після сесії.',
        image: './assets/work-5.jpg',
        tag: 'Догляд',
        at: Date.now() - 86400000,
      },
    ],
    reviews: [
      {
        id: 'r1',
        name: 'Марія',
        stars: 5,
        text: 'Hip flow сидить як друга шкіра. Лінія чиста, студія тиха.',
        at: Date.now() - 86400000 * 10,
        ok: true,
      },
      {
        id: 'r2',
        name: 'Taras',
        stars: 5,
        text: 'Spine spear — саме те, що хотів від neo. Без зайвого шуму.',
        at: Date.now() - 86400000 * 6,
        ok: true,
      },
      {
        id: 'r3',
        name: 'Olya',
        stars: 5,
        text: 'Thigh blackwork вийшов глибокий. Ескіз підігнали під рух ноги.',
        at: Date.now() - 86400000 * 2,
        ok: true,
      },
    ],
    stats: { views: 0, books: 0, uploads: 0, reviews: 3 },
  }

  const $ = (id) => document.getElementById(id)

  function load() {
    try {
      const rawStr = localStorage.getItem(KEY) || 'null'
      if (rawStr.length > MAX_STORE) {
        localStorage.removeItem(KEY)
        return structuredClone(DEFAULTS)
      }
      const raw = JSON.parse(rawStr)
      if (!raw) return structuredClone(DEFAULTS)
      return {
        contact: { ...DEFAULTS.contact, ...(raw.contact || {}) },
        banners:
          Array.isArray(raw.banners) && raw.banners.length
            ? raw.banners
            : DEFAULTS.banners.slice(),
        gallery:
          Array.isArray(raw.gallery) && raw.gallery.length
            ? raw.gallery
            : DEFAULTS.gallery.slice(),
        posts: Array.isArray(raw.posts) && raw.posts.length ? raw.posts : DEFAULTS.posts.slice(),
        reviews: Array.isArray(raw.reviews) ? raw.reviews : DEFAULTS.reviews.slice(),
        stats: { ...DEFAULTS.stats, ...(raw.stats || {}) },
      }
    } catch {
      try {
        localStorage.removeItem(KEY)
      } catch (_) {}
      return structuredClone(DEFAULTS)
    }
  }

  function save() {
    try {
      const packed = JSON.stringify(state)
      if (packed.length > MAX_STORE) {
        // занадто багато base64-фото — скидаємо галерею на дефолт, щоб сайт знову відкривався
        state.gallery = DEFAULTS.gallery.slice()
        state.banners = DEFAULTS.banners.slice()
        state.posts = DEFAULTS.posts.map((p) => ({ ...p }))
        localStorage.setItem(KEY, JSON.stringify(state))
        return
      }
      localStorage.setItem(KEY, packed)
    } catch (_) {
      try {
        localStorage.removeItem(KEY)
      } catch (__) {}
    }
  }

  let state = load()
  let pendingPostImage = ''
  let pendingBannerImage = ''
  try {
    state.stats.views = (state.stats.views || 0) + 1
    save()
  } catch (_) {}

  function uid() {
    return Math.random().toString(36).slice(2, 9)
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function readFile(file, maxSide = 1400) {
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onerror = reject
      r.onload = () => {
        const img = new Image()
        img.onload = () => {
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
          const w = Math.max(1, Math.round(img.width * scale))
          const h = Math.max(1, Math.round(img.height * scale))
          const c = document.createElement('canvas')
          c.width = w
          c.height = h
          const g = c.getContext('2d')
          g.drawImage(img, 0, 0, w, h)
          resolve(c.toDataURL('image/jpeg', 0.82))
        }
        img.onerror = () => resolve(String(r.result))
        img.src = String(r.result)
      }
      r.readAsDataURL(file)
    })
  }

  function renderPublic() {
    const c = state.contact
    $('heroTitle').textContent = c.title || 'INKWARD'
    $('heroEyebrow').textContent = c.eyebrow
    $('heroLead').textContent = c.lead
    $('addrText').textContent = c.addr
    $('hoursText').textContent = c.hours
    $('bookText').textContent = c.bookText
    $('contactLine').textContent = `${c.email} · ${c.phone} · ${c.tg}`
    $('mailBtn').href = `mailto:${c.email}?subject=INKWARD%20booking`
    $('mapsLink').href = `https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lon}#map=17/${c.lat}/${c.lon}`
    const lat = Number(c.lat)
    const lon = Number(c.lon)
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      const d = 0.006
      $('mapFrame').src =
        `https://www.openstreetmap.org/export/embed.html?bbox=${lon - d}%2C${lat - d}%2C${lon + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lon}`
    }

    const logo = c.logo || './assets/logo.svg'
    $('navLogo').src = logo
    $('navLogo').alt = c.title || 'INKWARD'
    $('markText').textContent = c.title || 'INKWARD'

    $('banners').innerHTML = state.banners
      .map(
        (b) => `
      <article class="banner">
        <img src="${escapeHtml(b.src)}" alt="" loading="lazy" onerror="this.style.display='none'" />
        <div>
          <h3>${escapeHtml(b.title || 'INKWARD')}</h3>
          <p>${escapeHtml(b.text || '')}</p>
        </div>
      </article>`,
      )
      .join('')

    $('gallery').innerHTML = state.gallery
      .map(
        (g) => `
      <article class="shot">
        <img src="${escapeHtml(g.src)}" alt="${escapeHtml(g.caption || 'work')}" loading="lazy"
          onerror="this.onerror=null;this.src='./assets/work-1.jpg'" />
        <span>${escapeHtml(g.caption || 'work')}</span>
      </article>`,
      )
      .join('')

    observeReveal()

    $('posts').innerHTML = state.posts
      .slice()
      .sort((a, b) => b.at - a.at)
      .map(
        (p) => `
      <article class="post article">
        ${p.image ? `<img class="postImg" src="${escapeHtml(p.image)}" alt="" loading="lazy" onerror="this.remove()" />` : ''}
        <div class="articleBody">
          ${p.tag ? `<span class="articleTag">${escapeHtml(p.tag)}</span>` : ''}
          <time>${new Date(p.at).toLocaleDateString('uk-UA')}</time>
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.body)}</p>
        </div>
      </article>`,
      )
      .join('')

    $('reviewGrid').innerHTML = state.reviews
      .filter((r) => r.ok)
      .slice()
      .sort((a, b) => b.at - a.at)
      .map(
        (r) => `
      <article class="review">
        <div class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
        <b>${escapeHtml(r.name)}</b>
        <p>${escapeHtml(r.text)}</p>
      </article>`,
      )
      .join('')
  }

  function observeReveal() {
    const nodes = document.querySelectorAll('.shot, .reveal')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('in')
        })
      },
      { threshold: 0.12 },
    )
    nodes.forEach((s, i) => {
      s.style.transitionDelay = `${(i % 6) * 60}ms`
      io.observe(s)
    })
  }

  function renderAdmin() {
    const s = state.stats
    $('statGrid').innerHTML = `
      <div><b>${s.views}</b><span>перегляди</span></div>
      <div><b>${s.books || 0}</b><span>кліки book</span></div>
      <div><b>${state.gallery.length}</b><span>фото</span></div>
      <div><b>${state.posts.length}</b><span>статті</span></div>
      <div><b>${state.reviews.filter((r) => r.ok).length}</b><span>відгуки OK</span></div>
      <div><b>${s.uploads || 0}</b><span>завантаження</span></div>
      <div><b>${state.banners.length}</b><span>банери</span></div>
    `

    $('adminGallery').innerHTML = state.gallery
      .map(
        (g) => `
      <div class="adminItem">
        <img src="${escapeHtml(g.src)}" alt="" />
        <div class="row">
          <span>${escapeHtml(g.caption || '—')}</span>
          <button type="button" class="ghostBtn" data-del-g="${g.id}">Delete</button>
        </div>
      </div>`,
      )
      .join('')

    $('adminBanners').innerHTML = state.banners
      .map(
        (b) => `
      <div class="adminItem">
        <img src="${escapeHtml(b.src)}" alt="" />
        <b>${escapeHtml(b.title || '')}</b>
        <span>${escapeHtml(b.text || '')}</span>
        <button type="button" class="ghostBtn" data-del-b="${b.id}">Delete</button>
      </div>`,
      )
      .join('')

    $('adminPosts').innerHTML = state.posts
      .slice()
      .sort((a, b) => b.at - a.at)
      .map(
        (p) => `
      <div class="adminItem">
        ${p.image ? `<img src="${escapeHtml(p.image)}" alt="" />` : ''}
        <b>${escapeHtml(p.title)}</b>
        <span>${escapeHtml((p.body || '').slice(0, 120))}</span>
        ${p.tag ? `<span>${escapeHtml(p.tag)}</span>` : ''}
        <button type="button" class="ghostBtn" data-del-p="${p.id}">Delete</button>
      </div>`,
      )
      .join('')

    $('adminReviews').innerHTML = state.reviews
      .slice()
      .sort((a, b) => b.at - a.at)
      .map(
        (r) => `
      <div class="adminItem">
        <div class="row"><b>${escapeHtml(r.name)}</b><span>${r.stars}★</span></div>
        <span>${escapeHtml(r.text)}</span>
        <div class="row">
          <button type="button" class="ghostBtn" data-ok-r="${r.id}">${r.ok ? 'Hide' : 'Publish'}</button>
          <button type="button" class="ghostBtn" data-del-r="${r.id}">Delete</button>
        </div>
      </div>`,
      )
      .join('')

    const c = state.contact
    $('cTitle').value = c.title
    $('cEyebrow').value = c.eyebrow
    $('cLead').value = c.lead
    $('cAddr').value = c.addr
    $('cHours').value = c.hours
    $('cEmail').value = c.email
    $('cPhone').value = c.phone
    $('cTg').value = c.tg
    $('cLat').value = c.lat
    $('cLon').value = c.lon
    $('logoPreview').src = c.logo || './assets/logo.svg'
  }

  function openAdmin() {
    $('admin').classList.remove('hidden')
    $('adminScrim').classList.remove('hidden')
    const authed = sessionStorage.getItem('inkward_auth') === '1'
    $('adminLogin').classList.toggle('hidden', authed)
    $('adminBody').classList.toggle('hidden', !authed)
    if (authed) renderAdmin()
  }

  function closeAdmin() {
    $('admin').classList.add('hidden')
    $('adminScrim').classList.add('hidden')
  }

  $('adminOpen').onclick = openAdmin
  $('adminClose').onclick = closeAdmin
  $('adminScrim').onclick = closeAdmin

  $('adminLoginBtn').onclick = () => {
    if ($('adminPass').value === PASS) {
      sessionStorage.setItem('inkward_auth', '1')
      $('adminLogin').classList.add('hidden')
      $('adminBody').classList.remove('hidden')
      renderAdmin()
    } else {
      alert('Невірний пароль')
    }
  }

  $('adminLogout').onclick = () => {
    sessionStorage.removeItem('inkward_auth')
    $('adminBody').classList.add('hidden')
    $('adminLogin').classList.remove('hidden')
  }

  document.querySelectorAll('.adminTabs button').forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll('.adminTabs button').forEach((b) => b.classList.remove('on'))
      document.querySelectorAll('.adminPane').forEach((p) => p.classList.remove('on'))
      btn.classList.add('on')
      document.querySelector(`[data-pane="${btn.dataset.tab}"]`)?.classList.add('on')
    }
  })

  $('imgUpload').onchange = async (e) => {
    const files = [...(e.target.files || [])]
    const caption = $('imgCaption').value.trim()
    for (const file of files) {
      const src = await readFile(file)
      state.gallery.unshift({
        id: uid(),
        src,
        caption: caption || file.name.replace(/\.\w+$/, ''),
      })
      state.stats.uploads = (state.stats.uploads || 0) + 1
    }
    $('imgCaption').value = ''
    e.target.value = ''
    save()
    renderPublic()
    renderAdmin()
  }

  $('logoUpload').onchange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    state.contact.logo = await readFile(file, 400)
    state.stats.uploads = (state.stats.uploads || 0) + 1
    e.target.value = ''
    save()
    renderPublic()
    renderAdmin()
  }

  $('bannerFile').onchange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    pendingBannerImage = await readFile(file, 1600)
    $('bannerPreview').src = pendingBannerImage
    $('bannerPreview').classList.remove('hidden')
    e.target.value = ''
  }

  $('bannerAdd').onclick = () => {
    const title = $('bannerTitle').value.trim() || 'INKWARD'
    const text = $('bannerText').value.trim()
    const src = pendingBannerImage || './assets/banner-neo.svg'
    state.banners.unshift({ id: uid(), src, title, text })
    pendingBannerImage = ''
    $('bannerTitle').value = ''
    $('bannerText').value = ''
    $('bannerPreview').classList.add('hidden')
    if (src.startsWith('data:')) state.stats.uploads = (state.stats.uploads || 0) + 1
    save()
    renderPublic()
    renderAdmin()
  }

  $('postImage').onchange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    pendingPostImage = await readFile(file)
    $('postImgPreview').src = pendingPostImage
    $('postImgPreview').classList.remove('hidden')
    e.target.value = ''
  }

  $('postAdd').onclick = () => {
    const title = $('postTitle').value.trim()
    const body = $('postBody').value.trim()
    if (!title || !body) return
    state.posts.unshift({
      id: uid(),
      title,
      body,
      image: pendingPostImage || '',
      tag: $('postTag')?.value.trim() || 'Стаття',
      at: Date.now(),
    })
    pendingPostImage = ''
    ;['postTitle', 'postBody', 'postTag'].forEach((id) => {
      if ($(id)) $(id).value = ''
    })
    $('postImgPreview').classList.add('hidden')
    save()
    renderPublic()
    renderAdmin()
  }

  $('contactSave').onclick = () => {
    state.contact = {
      ...state.contact,
      title: $('cTitle').value.trim() || 'INKWARD',
      eyebrow: $('cEyebrow').value.trim(),
      lead: $('cLead').value.trim(),
      addr: $('cAddr').value.trim(),
      hours: $('cHours').value.trim(),
      email: $('cEmail').value.trim(),
      phone: $('cPhone').value.trim(),
      tg: $('cTg').value.trim(),
      lat: $('cLat').value.trim(),
      lon: $('cLon').value.trim(),
    }
    save()
    renderPublic()
    alert('Збережено')
  }

  $('resetStats').onclick = () => {
    state.stats = {
      views: 1,
      books: 0,
      uploads: 0,
      reviews: state.reviews.filter((r) => r.ok).length,
    }
    save()
    renderAdmin()
    renderPublic()
  }

  $('resetDemo').onclick = () => {
    if (!confirm('Скинути демо-дані до заводських?')) return
    localStorage.removeItem(KEY)
    state = structuredClone(DEFAULTS)
    state.stats.views = 1
    save()
    renderPublic()
    renderAdmin()
  }

  $('adminBody').onclick = (e) => {
    const g = e.target.closest('[data-del-g]')
    if (g) {
      state.gallery = state.gallery.filter((x) => x.id !== g.dataset.delG)
      save()
      renderPublic()
      renderAdmin()
      return
    }
    const b = e.target.closest('[data-del-b]')
    if (b) {
      state.banners = state.banners.filter((x) => x.id !== b.dataset.delB)
      save()
      renderPublic()
      renderAdmin()
      return
    }
    const p = e.target.closest('[data-del-p]')
    if (p) {
      state.posts = state.posts.filter((x) => x.id !== p.dataset.delP)
      save()
      renderPublic()
      renderAdmin()
      return
    }
    const d = e.target.closest('[data-del-r]')
    if (d) {
      state.reviews = state.reviews.filter((x) => x.id !== d.dataset.delR)
      save()
      renderPublic()
      renderAdmin()
      return
    }
    const o = e.target.closest('[data-ok-r]')
    if (o) {
      const rev = state.reviews.find((x) => x.id === o.dataset.okR)
      if (rev) rev.ok = !rev.ok
      save()
      renderPublic()
      renderAdmin()
    }
  }

  $('reviewForm').onsubmit = (e) => {
    e.preventDefault()
    state.reviews.unshift({
      id: uid(),
      name: $('revName').value.trim(),
      stars: Number($('revStars').value) || 5,
      text: $('revText').value.trim(),
      at: Date.now(),
      ok: true,
    })
    state.stats.reviews = state.reviews.filter((r) => r.ok).length
    $('revName').value = ''
    $('revText').value = ''
    save()
    renderPublic()
  }

  $('mailBtn').addEventListener('click', () => {
    state.stats.books = (state.stats.books || 0) + 1
    save()
  })

  const heroMedia = document.getElementById('heroMedia')
  if (heroMedia) {
    window.addEventListener(
      'pointermove',
      (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 10
        const y = (e.clientY / window.innerHeight - 0.5) * 8
        heroMedia.style.transform = `translate(${x}px, ${y}px)`
      },
      { passive: true },
    )
  }

  observeReveal()

  try {
    renderPublic()
  } catch (err) {
    console.error('INKWARD render failed', err)
    try {
      localStorage.removeItem(KEY)
      state = structuredClone(DEFAULTS)
      renderPublic()
    } catch (_) {}
  }
})()
