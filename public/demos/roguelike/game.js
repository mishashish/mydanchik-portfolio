(() => {
  'use strict'

  const W = 768
  const H = 480
  const TS = 32
  const COLS = 22
  const ROWS = 13
  const OX = (W - COLS * TS) / 2
  const OY = 28
  const STEP = 1 / 60
  const MAX_FX = 70
  const BCOLS = 49
  const BSIZE = 16

  const canvas = document.getElementById('game')
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
  canvas.width = W
  canvas.height = H
  ctx.imageSmoothingEnabled = false

  const boot = document.getElementById('boot')
  const gameWrap = document.getElementById('gameWrap')
  const end = document.getElementById('end')
  const heartsEl = document.getElementById('hearts')
  const statsEl = document.getElementById('stats')
  const floorEl = document.getElementById('floor')
  const toastEl = document.getElementById('toast')
  const banner = document.getElementById('itemBanner')
  const startBtn = document.getElementById('startBtn')
  const heroPreview = document.getElementById('heroPreview')
  const focusHint = document.getElementById('focusHint')

  const EMBED =
    new URLSearchParams(location.search).has('embed') ||
    (window.parent && window.parent !== window)
  if (EMBED) document.documentElement.classList.add('embed')

  const qs = new URLSearchParams(location.search)
  const LANG = (() => {
    const fromQ = (qs.get('lang') || '').toLowerCase()
    if (fromQ === 'uk' || fromQ === 'en') return fromQ
    try {
      const saved = (localStorage.getItem('myd_lang') || '').toLowerCase()
      if (saved === 'uk' || saved === 'en') return saved
    } catch (_) {}
    return 'en'
  })()
  document.documentElement.lang = LANG

  const I18N = {
    uk: {
      bootStory: 'WASD ходити · стрілки стріляти · вихід — зелені двері в стіні',
      bootControls: 'Перша кімната — тренування · одразу можна йти далі по поверху',
      bootHero: 'маг · посох · фаєрболи · рандомне підземелля кожного забігу',
      start: 'УВІЙТИ В БРИФІНГ',
      again: 'ЩЕ РАЗ',
      back: '← портфоліо',
      focus: 'WASD ходити · стрілки стріляти',
      training: 'ТРЕНУВАЛЬНА КІМНАТА',
      walk: 'ХОДИТИ',
      shoot: 'СТРІЛЯТИ',
      exitHint: 'йди в зелений ПРОРІЗ у стіні · підпис ВИХІД',
      exit: 'ВИХІД',
      lore: [
        'VOID BREACH — тренувальна кімната',
        'WASD — ходити',
        'Стрілки ↑↓←→ — стріляти (куди тиснеш)',
        'SPACE / Z — вогонь у напрямку стрілок',
        'Вихід — зелений проріз у стіні (підпис ВИХІД)',
        'Постріл НЕ летить сам у ворога — цілься руками',
      ],
      toastTrain: 'ТРЕНУВАННЯ · WASD хід · стрілки вогонь',
      toastWake: (s) => `Кімната · монстри прокидаються через ${s | 0}с`,
      toastClear: 'кімнату зачищено · двері відкриті',
      toastCache: 'склад припасів',
      toastQuiet: 'тиха кімната · без ворогів',
      toastBrief: 'брифінг',
      toastHp: '+HP',
      toastPower: 'POWER GEM',
      toastCombo: (n) => `COMBO x${n}`,
      toastBossDown: (name) => `${name} переможений · спускайся глибше`,
      toastFinalGate: 'ФІНАЛЬНІ ДВЕРІ · вийди з Void',
      bannerPower: 'POWER GEM\nШкода і швидкість касту ↑',
      winTitle: 'ВІТАЮ!',
      loseTitle: 'BYTE ВПАВ',
      winText: (score) =>
        `Ти пройшов VOID BREACH.<br /><br /><span class="bless">Вітаю. Я заклинаю тебе на щось хороше —<br />хай удача, спокій і сила йдуть із тобою.</span><br /><br />SCORE ${score}`,
      loseText: (place, score) => `Поразка в ${place}. SCORE ${score} · спробуй ще`,
    },
    en: {
      bootStory: 'WASD move · arrows shoot · exit through green wall gaps',
      bootControls: 'First room is training · you can explore the floor right away',
      bootHero: 'mage · staff · fireballs · random monster dungeon each run',
      start: 'ENTER BRIEFING',
      again: 'AGAIN',
      back: '← portfolio',
      focus: 'WASD move · arrows shoot',
      training: 'TRAINING ROOM',
      walk: 'MOVE',
      shoot: 'SHOOT',
      exitHint: 'walk into the green GAP in the wall · EXIT label',
      exit: 'EXIT',
      lore: [
        'VOID BREACH — training room',
        'WASD — move',
        'Arrows ↑↓←→ — shoot (direction you press)',
        'SPACE / Z — fire in arrow facing',
        'Exit — green gap in the wall (EXIT label)',
        'Shots do NOT auto-aim — aim manually',
      ],
      toastTrain: 'TRAINING · WASD walk · arrows shoot',
      toastWake: (s) => `Room entered · monsters wake in ${s | 0}s`,
      toastClear: 'room cleared · gates open',
      toastCache: 'supply cache',
      toastQuiet: 'quiet chamber · no hostiles',
      toastBrief: 'briefing chamber',
      toastHp: '+HP',
      toastPower: 'POWER GEM',
      toastCombo: (n) => `COMBO x${n}`,
      toastBossDown: (name) => `${name} down · descend deeper`,
      toastFinalGate: 'FINAL GATE · leave the Void',
      bannerPower: 'POWER GEM\nDamage & cast speed up',
      winTitle: 'CONGRATS!',
      loseTitle: 'BYTE CRASHED',
      winText: (score) =>
        `You cleared VOID BREACH.<br /><br /><span class="bless">Congratulations. I cast a blessing on you —<br />may luck, calm, and strength walk with you.</span><br /><br />SCORE ${score}`,
      loseText: (place, score) => `Fell in ${place}. SCORE ${score} · dive again`,
    },
  }
  const Txt = I18N[LANG] || I18N.en
  const LORE_LINES = Txt.lore

  function applyBootI18n() {
    const story = document.querySelector('#boot .story')
    if (story) {
      story.innerHTML = `${Txt.bootStory}<br /><span class="controls">${Txt.bootControls}</span>`
    }
    const heroP = document.querySelector('#boot .heroCard p')
    if (heroP) heroP.textContent = Txt.bootHero
    if (startBtn) startBtn.textContent = Txt.start
    if (focusHint) focusHint.textContent = Txt.focus
    const again = document.getElementById('againBtn')
    if (again) again.textContent = Txt.again
    document.querySelectorAll('a.back').forEach((a) => {
      a.textContent = Txt.back
    })
  }
  applyBootI18n()

  const bit = new Image()
  bit.src = './assets/bit.png'

  const SPR = Object.create(null)
  const ITEM = Object.create(null)
  const keys = Object.create(null)
  let G = null
  let last = 0
  let acc = 0
  let toastT = 0
  let bannerT = 0
  let roomCache = null
  let roomCacheId = ''
  let bootAnim = 0
  let shakeT = 0
  let shakeMag = 0

  // Kenney 1-Bit Pack (colored-transparent_packed) — 16px, 49 cols
  const T = {
    floor: [1, 2, 68],
    wall: [18, 19, 20],
    fence: [18, 19],
    tree: [49, 50, 51],
    rock: [67, 68],
    plant: [5, 98, 99],
    barn: [18, 19, 20],
    fire: [504, 505],
    door: [23],
  }

  const HERO = {
    name: 'BYTE',
    hp: 4,
    speed: 168,
    fire: 0.38,
    dmg: 1,
    color: '#ff8a3a',
    body: 467,
    staff: 230,
  }

  const PEST = {
    bat: { hp: 3, speed: 128, score: 10, color: '#c8c8d8', r: 12, tile: 418, ai: 'orbit' },
    slime: { hp: 6, speed: 78, score: 16, color: '#6dffb0', r: 14, frames: [459, 460, 461, 462], ai: 'hop' },
    snake: { hp: 9, speed: 72, score: 24, color: '#9ad07a', r: 15, tile: 420, ai: 'weave' },
    ghost: { hp: 7, speed: 102, score: 22, color: '#d0d8ff', r: 13, tile: 419, ai: 'strafe' },
    squid: { hp: 8, speed: 74, score: 24, color: '#a8b0c8', r: 14, tile: 417, ai: 'weave' },
    golem: { hp: 14, speed: 52, score: 34, color: '#e8e8e8', r: 16, tile: 416, ai: 'charge' },
    imp: { hp: 4, speed: 142, score: 14, color: '#ffd24a', r: 12, tile: 405, ai: 'orbit' },
    brute: { hp: 22, speed: 58, score: 90, color: '#ff6b7a', r: 18, tile: 273, ai: 'charge' },
    skull: { hp: 11, speed: 88, score: 30, color: '#ff9a7a', r: 15, tile: 273, ai: 'hunt' },
    guard: { hp: 36, speed: 62, score: 140, color: '#ff8a3a', r: 22, tile: 273, scale: 4, boss: true, ai: 'charge' },
    queen: { hp: 55, speed: 66, score: 220, color: '#6dffb0', r: 24, frames: [459, 460, 461, 462], scale: 4.5, boss: true, ai: 'hop' },
    kernel: { hp: 90, speed: 72, score: 500, color: '#ffe08a', r: 28, tile: 273, scale: 5.5, boss: true, ai: 'hunt' },
  }

  const DEPTH_META = [
    { name: 'DEPTH 1 · Crypt Gate', pool: ['bat', 'slime', 'imp', 'ghost', 'bat', 'skull'] },
    { name: 'DEPTH 2 · Bone Halls', pool: ['slime', 'snake', 'ghost', 'squid', 'imp', 'golem', 'skull', 'bat'] },
    { name: 'DEPTH 3 · Kernel Core', pool: ['golem', 'snake', 'squid', 'ghost', 'brute', 'skull', 'imp', 'slime'] },
  ]
  const BOSS_KIND = ['guard', 'queen', 'kernel']
  const BOSS_TITLE = ['SKULL WARDEN', 'SLIME QUEEN', 'VOID KERNEL']
  const AGRO_DELAY = 3.5

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)
  const lerp = (a, b, t) => a + (b - a) * t
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

  function toast(msg) {
    toastEl.textContent = msg
    toastT = 1.5
  }

  function bitXY(id) {
    return [(id % BCOLS) * BSIZE, ((id / BCOLS) | 0) * BSIZE]
  }

  function drawBit(g, id, dx, dy, size = TS) {
    const [sx, sy] = bitXY(id)
    g.drawImage(bit, sx, sy, BSIZE, BSIZE, dx, dy, size, size)
  }

  function bakeBit(id, scale = 3) {
    const c = document.createElement('canvas')
    c.width = Math.ceil(16 * scale)
    c.height = Math.ceil(16 * scale)
    const g = c.getContext('2d')
    g.imageSmoothingEnabled = false
    drawBit(g, id, 0, 0, c.width)
    return c
  }

  function bakeBitHud(id, tw = 22, th = 20) {
    const c = document.createElement('canvas')
    c.width = tw
    c.height = th
    const g = c.getContext('2d')
    g.imageSmoothingEnabled = false
    const s = Math.min(tw, th)
    const ox = ((tw - s) / 2) | 0
    const oy = ((th - s) / 2) | 0
    drawBit(g, id, ox, oy, s)
    return c
  }

  function bakeItemPad(id, scale = 2) {
    const c = document.createElement('canvas')
    c.width = 32
    c.height = 32
    const g = c.getContext('2d')
    g.imageSmoothingEnabled = false
    g.fillStyle = 'rgba(0,0,0,.35)'
    g.fillRect(8, 24, 16, 4)
    g.fillStyle = '#3a2a18'
    g.fillRect(9, 22, 14, 3)
    g.fillStyle = '#6a4a28'
    g.fillRect(10, 21, 12, 2)
    drawBit(g, id, 8, 4, 16 * scale > 24 ? 24 : 16 * scale)
    return c
  }

  function drawByteLive(g, cx, cy, scale, opts = {}) {
    const phase = opts.phase || 0
    const moving = !!opts.moving
    const cast = Math.max(0, Math.min(1, opts.cast || 0))
    const flip = opts.flip ? -1 : 1
    const bob = moving ? Math.sin(phase) * scale * 0.55 : Math.sin(phase * 0.55) * scale * 0.28
    const lean = moving ? Math.sin(phase) * 0.08 : 0
    const cloak = moving ? Math.sin(phase + 0.4) * scale * 0.45 : Math.sin(phase * 0.5) * scale * 0.15
    const leg = moving ? Math.sin(phase) : 0
    const staffSwing = moving
      ? Math.sin(phase + 0.6) * scale * 0.7
      : Math.sin(phase * 0.4) * scale * 0.2
    const castLift = cast * scale * 2.2
    const s = Math.max(1, Math.round(scale))

    g.save()
    g.translate(cx, cy + bob)
    g.scale(flip, 1)
    g.rotate(lean)

    g.fillStyle = 'rgba(0,0,0,0.4)'
    g.beginPath()
    g.ellipse(0, s * 7.2, s * 3.4, s * 1, 0, 0, Math.PI * 2)
    g.fill()

    const ox = -4.5 * s
    const oy = -6 * s

    g.fillStyle = '#2a2a2a'
    g.fillRect(ox + s + cloak * 0.2, oy + s * 4, s * 7, s * 4)
    g.fillStyle = '#3a3a3a'
    g.fillRect(ox + s * 2 + cloak * 0.4, oy + s * 5, s * 5, s * 3)

    const body = [
      [0, 0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 2, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 0, 0, 0, 1, 0, 0],
    ]
    for (let r = 0; r < body.length; r++) {
      for (let c = 0; c < body[r].length; c++) {
        const v = body[r][c]
        if (!v) continue
        g.fillStyle = v === 2 ? '#1a1a1a' : '#f4f0e6'
        g.fillRect(ox + c * s, oy + r * s, s, s)
      }
    }
    g.fillStyle = '#f4f0e6'
    g.fillRect(ox + s * 4, oy - s, s, s)
    g.fillStyle = '#cfc7a6'
    g.fillRect(ox + s * 3.5, oy - s * 2, s, s)

    const ly = oy + s * 8
    g.fillStyle = '#d8d2c4'
    g.fillRect(ox + s * 2, ly + leg * s * 0.6, s * 2, s * 2)
    g.fillRect(ox + s * 5, ly - leg * s * 0.6, s * 2, s * 2)
    g.fillStyle = '#1a1a1a'
    g.fillRect(ox + s * 2, ly + s * 1.6 + leg * s * 0.6, s * 2, s * 0.6)
    g.fillRect(ox + s * 5, ly + s * 1.6 - leg * s * 0.6, s * 2, s * 0.6)

    const sx = ox + s * 8 + staffSwing
    const sy = oy + s * 1 - castLift
    g.fillStyle = '#6a4a28'
    g.fillRect(sx, sy, s, s * 8)
    g.fillStyle = '#8a6a3a'
    g.fillRect(sx, sy, Math.max(1, s / 2), s * 8)
    g.fillStyle = '#6a4a28'
    g.fillRect(sx - s * 2, sy, s * 2, s)
    g.fillRect(sx - s * 2, sy, s, s * 2)

    const ex = sx + s * 0.2
    const ey = sy + s * 0.2 - cast * s
    const pulse = 0.65 + Math.sin(phase * 3) * 0.35
    g.globalAlpha = 0.35 * pulse + cast * 0.45
    g.fillStyle = '#ff6a2a'
    g.beginPath()
    g.arc(ex + s * 0.5, ey + s * 0.5, s * (1.6 + cast * 1.4), 0, Math.PI * 2)
    g.fill()
    g.globalAlpha = 1
    g.fillStyle = '#ffb347'
    g.fillRect(ex, ey, s, s)
    g.fillStyle = '#fff3a0'
    g.fillRect(ex + s * 0.25, ey + s * 0.25, Math.max(1, s / 2), Math.max(1, s / 2))

    g.restore()
  }

  function bakeMage(scale = 3, pose = 'idle') {
    const c = document.createElement('canvas')
    c.width = 16 * scale
    c.height = 18 * scale
    const g = c.getContext('2d')
    g.imageSmoothingEnabled = false
    const phase = pose === 'walkA' ? 0.4 : pose === 'walkB' ? 3.5 : pose === 'cast' ? 1 : 0
    drawByteLive(g, c.width / 2, c.height / 2 + scale, scale, {
      phase,
      moving: pose === 'walkA' || pose === 'walkB',
      cast: pose === 'cast' ? 0.85 : 0,
    })
    return c
  }

  function bakeFireball(kind = 0) {
    const c = document.createElement('canvas')
    c.width = 28
    c.height = 28
    const g = c.getContext('2d')
    g.imageSmoothingEnabled = false
    const cx = 14
    const cy = 14
    // outer glow
    g.fillStyle = kind ? 'rgba(255,80,40,0.35)' : 'rgba(255,140,50,0.35)'
    g.beginPath()
    g.arc(cx, cy, 12, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#ff5a2a'
    g.beginPath()
    g.arc(cx, cy, 8, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#ff9a3a'
    g.beginPath()
    g.arc(cx - 1, cy - 1, 5, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#ffe08a'
    g.beginPath()
    g.arc(cx - 2, cy - 2, 3, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#fff'
    g.fillRect(cx - 3, cy - 3, 2, 2)
    // trail nubs
    g.fillStyle = '#ff6a2a'
    g.fillRect(2, cy - 1, 4, 2)
    g.fillRect(1, cy + 2, 3, 2)
    return c
  }

  let assetsReady = false
  function onAssets() {
    SPR.hero = bakeMage(3, 'idle')
    SPR.heroWalk = [bakeMage(3, 'walkA'), bakeMage(3, 'walkB')]
    SPR.heroAtk = bakeMage(3, 'cast')
    SPR.heroBig = bakeMage(4, 'idle')
    SPR.ball = [bakeFireball(0), bakeFireball(1)]
    if (bit.complete && bit.naturalWidth) {
      for (const [key, def] of Object.entries(PEST)) {
        const sc = def.scale || 3
        if (def.frames) SPR[key] = def.frames.map((id) => bakeBit(id, sc))
        else if (def.tile != null) SPR[key] = bakeBit(def.tile, sc)
      }
      ITEM.heartHud = bakeBitHud(529, 24, 22)
      ITEM.heart = bakeItemPad(529, 1.5)
      ITEM.power = bakeItemPad(219, 1.5)
      ITEM.gate = (() => {
        const c = document.createElement('canvas')
        c.width = 48
        c.height = 32
        const g = c.getContext('2d')
        g.imageSmoothingEnabled = false
        drawBit(g, 551, 0, 0, 32)
        drawBit(g, 547, 16, 0, 32)
        return c
      })()
    }
    startBtn.disabled = false
    startBtn.textContent = Txt.start
    if (!assetsReady) {
      assetsReady = true
      requestAnimationFrame(bootLoop)
      if (EMBED) {
        // у портфоліо одразу в гру з правильною мовою
        startBtn.click()
      }
    }
  }

  bit.onload = onAssets
  bit.onerror = onAssets
  setTimeout(() => {
    if (!assetsReady) onAssets()
  }, 0)

  function bootLoop(ts) {
    if (!boot || boot.classList.contains('hidden')) return
    bootAnim = ts * 0.001
    if (heroPreview) {
      const g = heroPreview.getContext('2d')
      const pw = heroPreview.width
      const ph = heroPreview.height
      g.imageSmoothingEnabled = false
      g.clearRect(0, 0, pw, ph)
      g.fillStyle = '#152018'
      g.fillRect(0, 0, pw, ph)
      if (bit.complete && bit.naturalWidth) {
        drawBit(g, T.floor[0], 12, 70, 40)
        drawBit(g, T.floor[2], 52, 70, 40)
        drawBit(g, T.plant[1], 6, 78, 26)
      }
      drawByteLive(g, pw / 2, 54, 3.5, {
        phase: bootAnim * 6.2,
        moving: true,
        cast: (Math.sin(bootAnim * 2.2) * 0.5 + 0.5) * 0.4,
      })
      if (SPR.ball && SPR.ball.length) {
        const a = bootAnim * 3.2
        const bx = pw / 2 + Math.cos(a) * 36
        const by = 48 + Math.sin(a) * 8
        const ball = SPR.ball[((bootAnim * 8) | 0) % SPR.ball.length]
        g.drawImage(ball, bx - 14, by - 14)
      }
    }
    requestAnimationFrame(bootLoop)
  }

  function world(c, r) {
    return { x: OX + c * TS + TS / 2, y: OY + r * TS + TS / 2 }
  }

  /** Знайти вільну клітинку біля центру (вороги не в стінах). */
  function findOpenSpawn(layout, dc = 0, dr = 0) {
    const midC = COLS >> 1
    const midR = ROWS >> 1
    const tries = [
      [dc, dr],
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [2, 0],
      [-2, 0],
      [0, 2],
      [0, -2],
      [2, 1],
      [-2, 1],
      [3, 0],
      [-3, 0],
      [1, 2],
      [-1, -2],
    ]
    for (const [odc, odr] of tries) {
      const c = midC + odc
      const r = midR + odr
      if (c < 1 || r < 1 || c >= COLS - 1 || r >= ROWS - 1) continue
      if (!layout.solid[r][c]) return world(c, r)
    }
    return world(midC, midR)
  }

  function buildRoom(type, seed) {
    const solid = Array.from({ length: ROWS }, () => Array(COLS).fill(0))
    const ground = Array.from({ length: ROWS }, () => Array(COLS).fill(T.floor[0]))
    const animTiles = []
    let s = (seed || 1) >>> 0
    if (!s) s = 1
    const rnd = () => {
      s = (s * 16807) % 2147483647
      return (s - 1) / 2147483646
    }
    const midR = (ROWS / 2) | 0
    const midC = (COLS / 2) | 0
    const shape =
      type === 'boss'
        ? 'arena'
        : type === 'item'
          ? 'garden'
          : type === 'empty'
            ? 'open'
            : ['open', 'pillars', 'chambers', 'maze', 'cross'][(rnd() * 5) | 0]

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        ground[r][c] = T.floor[(rnd() * T.floor.length) | 0]
        if (r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1) {
          solid[r][c] = 1
          ground[r][c] = T.fence[(rnd() * T.fence.length) | 0]
        }
      }
    }

    // keep cross paths clear for navigation
    for (let c = 1; c < COLS - 1; c++) {
      solid[midR][c] = 0
      ground[midR][c] = T.floor[0]
    }
    for (let r = 1; r < ROWS - 1; r++) {
      solid[r][midC] = 0
      ground[r][midC] = T.floor[0]
    }

    const openDoor = (dir) => {
      doors[dir] = true
      if (dir === 'n') {
        ;[midC - 1, midC, midC + 1].forEach((c) => {
          solid[0][c] = 0
          solid[1][c] = 0
          ground[0][c] = T.floor[0]
          ground[1][c] = T.floor[0]
        })
      }
      if (dir === 's') {
        ;[midC - 1, midC, midC + 1].forEach((c) => {
          solid[ROWS - 1][c] = 0
          solid[ROWS - 2][c] = 0
          ground[ROWS - 1][c] = T.floor[0]
          ground[ROWS - 2][c] = T.floor[0]
        })
      }
      if (dir === 'w') {
        ;[midR - 1, midR, midR + 1].forEach((r) => {
          solid[r][0] = 0
          solid[r][1] = 0
          ground[r][0] = T.floor[0]
          ground[r][1] = T.floor[0]
        })
      }
      if (dir === 'e') {
        ;[midR - 1, midR, midR + 1].forEach((r) => {
          solid[r][COLS - 1] = 0
          solid[r][COLS - 2] = 0
          ground[r][COLS - 1] = T.floor[0]
          ground[r][COLS - 2] = T.floor[0]
        })
      }
    }

    const placeSolid = (c, r, tile) => {
      if (c < 1 || r < 1 || c >= COLS - 1 || r >= ROWS - 1) return
      // коридори хреста завжди вільні (інакше застрягання між пропами)
      if (Math.abs(c - midC) <= 1 || Math.abs(r - midR) <= 1) return
      solid[r][c] = 1
      ground[r][c] = tile
    }

    const carve = (c0, r0, c1, r1) => {
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          if (r < 1 || c < 1 || r >= ROWS - 1 || c >= COLS - 1) continue
          solid[r][c] = 0
          ground[r][c] = T.floor[(rnd() * T.floor.length) | 0]
        }
      }
    }

    const clearNavLanes = () => {
      for (let c = 1; c < COLS - 1; c++) {
        for (const r of [midR - 1, midR, midR + 1]) {
          if (r < 1 || r >= ROWS - 1) continue
          solid[r][c] = 0
          ground[r][c] = T.floor[0]
        }
      }
      for (let r = 1; r < ROWS - 1; r++) {
        for (const c of [midC - 1, midC, midC + 1]) {
          if (c < 1 || c >= COLS - 1) continue
          solid[r][c] = 0
          ground[r][c] = T.floor[0]
        }
      }
    }

    if (shape === 'arena' || type === 'boss') {
      for (let c = midC - 3; c <= midC + 3; c++) placeSolid(c, 2, T.barn[(c + 3) % 3])
      placeSolid(2, midR - 2, T.wall[0])
      placeSolid(COLS - 3, midR - 2, T.wall[1])
      placeSolid(2, midR + 2, T.rock[0])
      placeSolid(COLS - 3, midR + 2, T.rock[1 % T.rock.length])
      animTiles.push({ c: midC, r: 4, kind: 'fire', phase: 0 })
      ground[4][midC] = T.fire[0]
    } else if (shape === 'pillars') {
      for (let r = 3; r < ROWS - 3; r += 4) {
        for (let c = 3; c < COLS - 3; c += 5) {
          placeSolid(c, r, T.rock[(rnd() * T.rock.length) | 0])
        }
      }
    } else if (shape === 'chambers') {
      for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 1; c < COLS - 1; c++) {
          solid[r][c] = 1
          ground[r][c] = T.wall[(rnd() * T.wall.length) | 0]
        }
      }
      const roomsN = 3 + ((rnd() * 2) | 0)
      for (let i = 0; i < roomsN; i++) {
        const w = 4 + ((rnd() * 4) | 0)
        const h = 3 + ((rnd() * 3) | 0)
        const c0 = 2 + ((rnd() * (COLS - w - 4)) | 0)
        const r0 = 2 + ((rnd() * (ROWS - h - 4)) | 0)
        carve(c0, r0, c0 + w, r0 + h)
      }
      clearNavLanes()
    } else if (shape === 'maze') {
      for (let r = 3; r < ROWS - 3; r += 2) {
        for (let c = 3; c < COLS - 3; c += 2) {
          if (rnd() < 0.35) placeSolid(c, r, rnd() < 0.5 ? T.tree[(rnd() * T.tree.length) | 0] : T.rock[0])
        }
      }
    } else if (shape === 'cross') {
      for (let r = 2; r < ROWS - 2; r++) {
        for (let c = 2; c < COLS - 2; c++) {
          if (Math.abs(c - midC) > 2 && Math.abs(r - midR) > 2 && rnd() < 0.45) {
            placeSolid(c, r, T.tree[(rnd() * T.tree.length) | 0])
          }
        }
      }
    } else if (shape === 'garden' || type === 'item') {
      for (let i = 0; i < 10; i++) {
        const c = 2 + ((rnd() * (COLS - 4)) | 0)
        const r = 2 + ((rnd() * (ROWS - 4)) | 0)
        if (Math.abs(c - midC) <= 1 || Math.abs(r - midR) <= 1) continue
        ground[r][c] = T.plant[(rnd() * T.plant.length) | 0]
        animTiles.push({ c, r, kind: 'plant', phase: rnd() * 6 })
      }
    }

    // scatter props — менше solid, більше декору без колізії
    if (shape === 'open' || type === 'normal' || type === 'start') {
      const n = type === 'start' ? 3 + ((rnd() * 2) | 0) : 4 + ((rnd() * 5) | 0)
      for (let i = 0; i < n; i++) {
        const c = 2 + ((rnd() * (COLS - 4)) | 0)
        const r = 2 + ((rnd() * (ROWS - 4)) | 0)
        if (solid[r][c]) continue
        if (Math.abs(c - midC) <= 1 || Math.abs(r - midR) <= 1) continue
        const kind = rnd()
        if (kind < 0.18) placeSolid(c, r, T.tree[(rnd() * T.tree.length) | 0])
        else if (kind < 0.28) placeSolid(c, r, T.rock[(rnd() * T.rock.length) | 0])
        else if (kind < 0.4) {
          ground[r][c] = T.fire[0]
          animTiles.push({ c, r, kind: 'fire', phase: rnd() * 4 })
        } else {
          ground[r][c] = T.plant[(rnd() * T.plant.length) | 0]
          animTiles.push({ c, r, kind: 'plant', phase: rnd() * Math.PI * 2 })
        }
      }
    }

    // фінальна розчистка проходів (після всіх пропам)
    clearNavLanes()

    return { solid, ground, animTiles, doors, openDoor, type, shape, seed }
  }

  function makeMap(depth = 1) {
    const depthIdx = Math.max(0, Math.min(2, (depth | 0) - 1))
    const meta = DEPTH_META[depthIdx]
    const seed = ((Date.now() % 1e6) ^ ((Math.random() * 1e6) | 0) ^ (depth * 9973)) >>> 0
    let s = seed || 1
    const rnd = () => {
      s = (s * 16807) % 2147483647
      return (s - 1) / 2147483646
    }

    // поверх = сітка кімнат; з глибиною більше кімнат (5→10)
    const roomCount = Math.min(10, 5 + depthIdx * 2 + ((rnd() * 2) | 0))
    const size = roomCount >= 9 ? 5 : 4
    const grid = Array.from({ length: size }, () => Array(size).fill(null))
    const rooms = []
    const sx = (size / 2) | 0
    const sy = (size / 2) | 0

    const dirs = [
      [0, -1, 'n', 's'],
      [0, 1, 's', 'n'],
      [-1, 0, 'w', 'e'],
      [1, 0, 'e', 'w'],
    ]

    // Isaac-style: ростимо зв’язний граф від старту
    const chosen = new Set([`${sx},${sy}`])
    const frontier = []
    const pushNeighbors = (cx, cy) => {
      for (const [dx, dy] of dirs) {
        const nx = cx + dx
        const ny = cy + dy
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue
        const key = `${nx},${ny}`
        if (chosen.has(key)) continue
        frontier.push([nx, ny])
      }
    }
    pushNeighbors(sx, sy)
    while (chosen.size < roomCount && frontier.length) {
      const i = (rnd() * frontier.length) | 0
      const [cx, cy] = frontier.splice(i, 1)[0]
      const key = `${cx},${cy}`
      if (chosen.has(key)) continue
      // кімната має торкатися вже обраної
      let touch = false
      for (const [dx, dy] of dirs) {
        if (chosen.has(`${cx + dx},${cy + dy}`)) {
          touch = true
          break
        }
      }
      if (!touch) continue
      chosen.add(key)
      pushNeighbors(cx, cy)
    }
    // якщо мало — добери сусідів старту
    if (chosen.size < 5) {
      for (const [dx, dy] of dirs) {
        const nx = sx + dx
        const ny = sy + dy
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue
        chosen.add(`${nx},${ny}`)
        if (chosen.size >= 5) break
      }
    }

    const place = (cx, cy, type) => {
      const room = {
        x: cx,
        y: cy,
        type,
        cleared: false,
        visited: cx === sx && cy === sy,
        layout: buildRoom(type, seed + cx * 97 + cy * 53 + ((rnd() * 1000) | 0)),
        enemies: [],
        drops: [],
      }
      grid[cy][cx] = room
      rooms.push(room)
      return room
    }

    // assign types — бос лише в кінці поверху (найдальша кімната від старту)
    const keys = [...chosen]
    const startKey = `${sx},${sy}`

    const dist = new Map([[startKey, 0]])
    const bfs = [[sx, sy]]
    for (let i = 0; i < bfs.length; i++) {
      const [cx, cy] = bfs[i]
      const d = dist.get(`${cx},${cy}`)
      for (const [dx, dy] of dirs) {
        const nx = cx + dx
        const ny = cy + dy
        const key = `${nx},${ny}`
        if (!chosen.has(key) || dist.has(key)) continue
        dist.set(key, d + 1)
        bfs.push([nx, ny])
      }
    }

    const neighborCount = (key) => {
      const [cx, cy] = key.split(',').map(Number)
      let n = 0
      for (const [dx, dy] of dirs) {
        if (chosen.has(`${cx + dx},${cy + dy}`)) n++
      }
      return n
    }

    let bossKey = startKey
    let bestDist = -1
    let bestLeaf = 99
    for (const key of keys) {
      if (key === startKey) continue
      const d = dist.get(key) ?? 0
      const leaves = neighborCount(key)
      if (d > bestDist || (d === bestDist && leaves < bestLeaf)) {
        bestDist = d
        bestLeaf = leaves
        bossKey = key
      }
    }
    // завжди окрема boss-кімната (інакше немає фінальної брами)
    if (bossKey === startKey) {
      for (const [dx, dy] of dirs) {
        const nx = sx + dx
        const ny = sy + dy
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue
        const key = `${nx},${ny}`
        chosen.add(key)
        if (!dist.has(key)) dist.set(key, 1)
        if (!keys.includes(key)) keys.push(key)
        bossKey = key
        break
      }
    }

    const rest = keys.filter((k) => k !== startKey && k !== bossKey).sort(() => rnd() - 0.5)
    const emptyKey = rest[0] || null
    const itemKey = rest[1] || null

    for (const key of keys) {
      const [cx, cy] = key.split(',').map(Number)
      let type = 'normal'
      if (key === startKey) type = 'start'
      else if (key === bossKey) type = 'boss'
      else if (key === emptyKey) type = 'empty'
      else if (key === itemKey) type = 'item'
      place(cx, cy, type)
    }

    const link = (a, b, da, db) => {
      if (!a || !b) return
      a.layout.openDoor(da)
      b.layout.openDoor(db)
    }

    // бос — лише один вхід з боку старту
    let bossEntry = null
    const bossRoom = rooms.find((r) => r.type === 'boss')
    if (bossRoom) {
      let best = 1e9
      for (const [dx, dy, da, db] of dirs) {
        const other = grid[bossRoom.y + dy] && grid[bossRoom.y + dy][bossRoom.x + dx]
        if (!other || other.type === 'boss') continue
        const d = dist.get(`${other.x},${other.y}`) ?? 1e9
        if (d < best) {
          best = d
          bossEntry = { other, da, db }
        }
      }
    }

    for (const room of rooms) {
      for (const [dx, dy, da, db] of dirs) {
        const ox = room.x + dx
        const oy = room.y + dy
        const other = grid[oy] && grid[oy][ox]
        if (!other) continue
        if (room.x + room.y * size >= other.x + other.y * size) continue
        if (room.type === 'boss' || other.type === 'boss') {
          if (
            !bossEntry ||
            !(
              (room === bossRoom && other === bossEntry.other && da === bossEntry.da) ||
              (other === bossRoom && room === bossEntry.other && db === bossEntry.da)
            )
          ) {
            continue
          }
        }
        link(room, other, da, db)
      }
    }

    // гарантія: стартова кімната завжди має двері
    const startRoom = rooms.find((r) => r.type === 'start')
    if (startRoom) {
      const hasDoor = Object.values(startRoom.layout.doors).some(Boolean)
      if (!hasDoor) {
        for (const [dx, dy, da, db] of dirs) {
          const other = grid[startRoom.y + dy] && grid[startRoom.y + dy][startRoom.x + dx]
          if (!other || other.type === 'boss') continue
          link(startRoom, other, da, db)
          break
        }
      }
    }

    const pestPool = meta.pool
    const bossKind = BOSS_KIND[depthIdx]
    for (const room of rooms) {
      if (room.type === 'empty') {
        room.enemies = []
        room.cleared = true
        continue
      }
      if (room.type === 'item') {
        const p = world(COLS >> 1, ROWS >> 1)
        if (rnd() < 0.35) room.drops.push({ kind: 'heart', x: p.x - 28, y: p.y, bob: 0 })
        room.drops.push({ kind: 'power', x: p.x + (rnd() < 0.35 ? 28 : 0), y: p.y, bob: 1 })
        room.cleared = true
        continue
      }
      let list
      if (room.type === 'start') {
        room.enemies = []
        room.cleared = true
        room.lore = depthIdx === 0
        if (depthIdx === 0) {
          // practice targets — не атакують, можна повчитись стріляти
          const drills = [
            ['slime', 4, -1],
            ['bat', 4, 1],
            ['imp', 5, 0],
          ]
          for (const [kind, dc, dr] of drills) {
            const def = PEST[kind]
            if (!def) continue
            const p = findOpenSpawn(room.layout, dc, dr)
            room.enemies.push({
              kind,
              boss: false,
              ai: 'hunt',
              aiT: 0,
              wakeT: 9999,
              aggro: false,
              practice: true,
              x: p.x,
              y: p.y,
              px: p.x,
              py: p.y,
              hp: def.hp,
              maxHp: def.hp,
              speed: def.speed * 0.35,
              score: 5,
              color: def.color,
              r: def.r,
              alive: true,
              flip: false,
              walk: Math.random() * 6,
              hop: Math.random() * 6,
              frame: Math.random() * 6,
            })
          }
        }
        continue
      } else if (room.type === 'boss') {
        list = [[bossKind, 0, -1]]
        for (let i = 0; i < 3 + depthIdx; i++) {
          const kind = pestPool[(rnd() * pestPool.length) | 0]
          list.push([kind, ((rnd() * 9) | 0) - 4, ((rnd() * 5) | 0) - 1])
        }
      } else {
        const n = 3 + depthIdx + ((rnd() * 2) | 0)
        list = []
        for (let i = 0; i < n; i++) {
          const kind = pestPool[(rnd() * pestPool.length) | 0]
          list.push([kind, ((rnd() * 9) | 0) - 4, ((rnd() * 7) | 0) - 3])
        }
      }
      const hpMul = 1.15 + depthIdx * 0.35
      for (const [kind, dc, dr] of list) {
        const def = PEST[kind]
        if (!def) continue
        const p = findOpenSpawn(room.layout, dc, dr)
        room.enemies.push({
          kind,
          boss: !!def.boss,
          ai: def.ai || 'hunt',
          aiT: Math.random() * 4,
          wakeT: AGRO_DELAY,
          aggro: false,
          practice: false,
          x: p.x,
          y: p.y,
          px: p.x,
          py: p.y,
          hp: Math.ceil(def.hp * hpMul),
          maxHp: Math.ceil(def.hp * hpMul),
          speed: def.speed * (1 + depthIdx * 0.08),
          score: def.score,
          color: def.color,
          r: def.r,
          alive: true,
          flip: false,
          walk: Math.random() * 6,
          hop: Math.random() * 6,
          frame: Math.random() * 6,
        })
      }
    }

    return { size, grid, rooms, cx: sx, cy: sy, seed, depth, depthName: meta.name, bossKind }
  }

  function room() {
    return G.map.grid[G.map.cy][G.map.cx]
  }

  function blocked(x, y, rad) {
    const layout = room().layout
    const c0 = Math.floor((x - rad - OX) / TS)
    const c1 = Math.floor((x + rad - OX) / TS)
    const r0 = Math.floor((y - rad - OY) / TS)
    const r1 = Math.floor((y + rad - OY) / TS)
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return true
        if (layout.solid[r][c]) return true
      }
    }
    return false
  }

  function collideRad(e) {
    // менший радіус — не клинить між деревами/каменями
    return Math.max(4, (e.r || 10) * 0.42)
  }

  /** Якщо вже всередині solid — випхати на вільну клітинку. */
  function resolveStuck(e) {
    const rad = collideRad(e)
    if (!blocked(e.x, e.y, rad)) return false
    const layout = room().layout
    const c0 = Math.floor((e.x - OX) / TS)
    const r0 = Math.floor((e.y - OY) / TS)
    for (let ring = 0; ring <= 5; ring++) {
      for (let dr = -ring; dr <= ring; dr++) {
        for (let dc = -ring; dc <= ring; dc++) {
          if (Math.max(Math.abs(dc), Math.abs(dr)) !== ring && ring > 0) continue
          const c = c0 + dc
          const r = r0 + dr
          if (r < 1 || c < 1 || r >= ROWS - 1 || c >= COLS - 1) continue
          if (layout.solid[r][c]) continue
          const p = world(c, r)
          if (!blocked(p.x, p.y, rad)) {
            e.x = p.x
            e.y = p.y
            return true
          }
        }
      }
    }
    const mid = world(COLS >> 1, ROWS >> 1)
    e.x = mid.x
    e.y = mid.y
    return true
  }

  function moveEnt(e, nx, ny) {
    const rad = collideRad(e)
    if (blocked(e.x, e.y, rad)) resolveStuck(e)

    const dx = nx - e.x
    const dy = ny - e.y
    const dist = Math.hypot(dx, dy)
    if (dist < 0.001) return

    // підкроки — менше проскакування в стіну на високій швидкості
    const steps = Math.max(1, Math.min(8, Math.ceil(dist / 3)))
    let x = e.x
    let y = e.y
    for (let i = 1; i <= steps; i++) {
      const tx = e.x + (dx * i) / steps
      const ty = e.y + (dy * i) / steps
      let mx = x
      let my = y
      if (!blocked(tx, y, rad)) mx = tx
      else if (!blocked(tx, y, rad * 0.75)) mx = tx
      if (!blocked(mx, ty, rad)) my = ty
      else if (!blocked(mx, ty, rad * 0.75)) my = ty
      // якщо повністю стоп — спробуй ковзнути вздовж однієї осі з меншим кроком
      if (mx === x && my === y) {
        const hx = x + Math.sign(dx) * Math.min(2, Math.abs(dx))
        const hy = y + Math.sign(dy) * Math.min(2, Math.abs(dy))
        if (dx && !blocked(hx, y, rad)) mx = hx
        if (dy && !blocked(mx, hy, rad)) my = hy
      }
      x = mx
      y = my
    }
    e.x = x
    e.y = y
  }

  function newRun() {
    G = {
      alive: true,
      depth: 1,
      maxDepth: 3,
      map: makeMap(1),
      time: 0,
      tears: [],
      particles: [],
      leaves: [],
      combo: 0,
      comboT: 0,
      briefingAlpha: 1,
      briefingHold: 5.5,
      briefingFade: false,
      doorLock: 0.5,
      player: {
        x: world(COLS >> 1, ROWS >> 1).x,
        y: world(COLS >> 1, ROWS >> 1).y,
        px: 0,
        py: 0,
        r: 9,
        hp: HERO.hp,
        maxHp: HERO.hp,
        speed: HERO.speed,
        fire: HERO.fire,
        dmg: HERO.dmg,
        color: HERO.color,
        name: HERO.name,
        cd: 0,
        inv: 0,
        score: 0,
        facing: { x: 1, y: 0 },
        flip: false,
        walk: 0,
        atkAnim: 0,
        moving: false,
        stepDust: 0,
      },
    }
    G.player.px = G.player.x
    G.player.py = G.player.y
    roomCacheId = ''
    toast(Txt.toastTrain)
    hud()
    hideFocusHintSoon()
  }

  function hideFocusHintSoon() {
    if (!focusHint) return
    focusHint.classList.remove('off')
    setTimeout(() => focusHint.classList.add('off'), 2200)
  }

  function popLostHeart() {
    if (!ITEM.heartHud || !heartsEl) return
    const img = document.createElement('img')
    img.width = 24
    img.height = 22
    img.alt = ''
    img.src = ITEM.heartHud.toDataURL()
    img.className = 'heartPix heartGone'
    heartsEl.appendChild(img)
    setTimeout(() => img.remove(), 520)
  }

  function drawHudHearts() {
    if (!heartsEl) return
    const keep = [...heartsEl.querySelectorAll('.heartGone')]
    heartsEl.innerHTML = ''
    keep.forEach((el) => heartsEl.appendChild(el))
    if (!G || !ITEM.heartHud) return
    const hp = Math.max(0, G.player.hp | 0)
    for (let i = 0; i < hp; i++) {
      const img = document.createElement('img')
      img.width = 24
      img.height = 22
      img.alt = ''
      img.src = ITEM.heartHud.toDataURL()
      img.className = 'heartPix'
      heartsEl.appendChild(img)
    }
  }

  function hud() {
    if (!G) return
    drawHudHearts()
    const combo = G.combo > 1 ? ` · x${G.combo}` : ''
    statsEl.textContent = `${G.player.name} · DMG ${G.player.dmg.toFixed(1)} · SCORE ${G.player.score}${combo}`
    const seen = G.map.rooms.filter((r) => r.visited).length
    const total = G.map.rooms.length
    floorEl.textContent = `${G.map.depthName || 'DEPTH'} · ${seen}/${total} rooms · ${G.map.cx},${G.map.cy}`
  }

  function hurtPlayer(amount = 1) {
    const p = G.player
    if (p.inv > 0) return false
    const before = p.hp
    p.hp -= amount
    p.inv = 0.55
    G.combo = 0
    G.comboT = 0
    shakeT = 0.28
    shakeMag = 7
    fx(p.x, p.y, '#ff5d6c', 10)
    toast(p.hp <= 1 ? 'CRITICAL' : 'HIT')
    for (let i = 0; i < before - Math.max(0, p.hp); i++) popLostHeart()
    hud()
    return true
  }

  function steerEnemy(e, p, dt) {
    const dx = p.x - e.x
    const dy = p.y - e.y
    const d = Math.hypot(dx, dy) || 1
    let mx = dx / d
    let my = dy / d
    let mul = 1
    e.aiT = (e.aiT || 0) + dt
    const ai = e.ai || 'hunt'
    if (ai === 'orbit') {
      const ang = Math.atan2(dy, dx) + Math.sin(e.aiT * 3.4) * 1.35
      mx = Math.cos(ang)
      my = Math.sin(ang)
      if (d < 110 && (e.aiT % 2.1) < 0.5) {
        mx = dx / d
        my = dy / d
        mul = 1.55
      }
    } else if (ai === 'strafe') {
      if ((e.aiT % 1.7) < 0.85) {
        mx = -dy / d
        my = dx / d
        mul = 1.15
      } else {
        mul = 1.25
      }
    } else if (ai === 'hop') {
      const phase = e.aiT % 1.15
      if (phase < 0.4) mul = 0
      else mul = 1.85
    } else if (ai === 'charge') {
      const phase = e.aiT % 2.8
      mul = phase < 0.85 ? 2.35 : 0.45
    } else if (ai === 'weave') {
      const side = Math.sin(e.aiT * 5.2) * 0.85
      mx = dx / d - (dy / d) * side
      my = dy / d + (dx / d) * side
      const len = Math.hypot(mx, my) || 1
      mx /= len
      my /= len
      mul = 1.1
    }
    if (dx < 0) e.flip = true
    if (dx > 0) e.flip = false
    moveEnt(e, e.x + mx * e.speed * mul * dt, e.y + my * e.speed * mul * dt)
  }

  function fx(x, y, color, n = 5) {
    const free = MAX_FX - G.particles.length
    const n2 = Math.min(n, free)
    for (let i = 0; i < n2; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 50 + Math.random() * 100
      G.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.3 + Math.random() * 0.2,
        color,
        size: 2 + ((Math.random() * 2) | 0),
      })
    }
  }

  function leaf(x, y) {
    if (G.leaves.length > 40) return
    G.leaves.push({
      x,
      y,
      vx: -20 + Math.random() * 40,
      vy: 10 + Math.random() * 30,
      rot: Math.random() * 6,
      life: 1.2 + Math.random(),
      color: Math.random() > 0.5 ? '#6a7a9a' : '#c45a6a',
    })
  }

  function nearest(p) {
    let best = null
    let bd = 1e9
    for (const e of room().enemies) {
      if (!e.alive) continue
      const d = dist(p, e)
      if (d < bd) {
        bd = d
        best = e
      }
    }
    return best
  }

  function aim(p) {
    // touch CAST / click — стріляй в сторону курсора
    if (window.__roguePtr && (keys.attack || window.__roguePtr.down)) {
      const dx = window.__roguePtr.x - p.x
      const dy = window.__roguePtr.y - p.y
      if (Math.hypot(dx, dy) > 10) {
        const len = Math.hypot(dx, dy)
        return { x: dx / len, y: dy / len }
      }
    }
    const fx = p.facing?.x
    const fy = p.facing?.y
    if (fx || fy) {
      const len = Math.hypot(fx, fy) || 1
      return { x: fx / len, y: fy / len }
    }
    return { x: p.flip ? -1 : 1, y: 0 }
  }

  function kill(e) {
    e.alive = false
    G.combo = (G.combo || 0) + 1
    G.comboT = 2.2
    const bonus = Math.min(8, G.combo - 1) * 4
    G.player.score += e.score + bonus
    fx(e.x, e.y, e.color, 12)
    leaf(e.x, e.y)
    if (G.combo >= 3) toast(Txt.toastCombo(G.combo))
    if (!e.practice && Math.random() < 0.22) {
      room().drops.push({
        kind: Math.random() < 0.4 ? 'heart' : 'power',
        x: e.x,
        y: e.y,
        bob: Math.random() * 6,
      })
    }
    hud()
  }

  function doAttack() {
    if (!G || !G.alive) return
    const p = G.player
    if (p.cd > 0) return
    const dir = aim(p)
    p.facing = dir
    if (dir.x < 0) p.flip = true
    if (dir.x > 0) p.flip = false
    p.cd = p.fire
    p.atkAnim = 0.34
    // charged fireball
    G.tears.push({
      x: p.x + dir.x * 22,
      y: p.y + dir.y * 6,
      vx: dir.x * 300,
      vy: dir.y * 300,
      r: 11,
      dmg: p.dmg,
      life: 1.15,
      hit: new Set(),
      trail: 0,
      spin: 0,
      kind: 'fireball',
    })
    fx(p.x + dir.x * 18, p.y + dir.y * 4, '#ffb347', 7)
    fx(p.x + dir.x * 18, p.y + dir.y * 4, '#ff5d3a', 5)
  }

  function tryDoor(dir) {
    if ((G.doorLock || 0) > 0) return
    const cur = room()
    if (!cur.cleared || !cur.layout.doors[dir]) return
    const d = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[dir]
    const nx = G.map.cx + d[0]
    const ny = G.map.cy + d[1]
    if (!G.map.grid[ny] || !G.map.grid[ny][nx]) return
    G.map.cx = nx
    G.map.cy = ny
    const next = room()
    next.visited = true
    const p = G.player
    const midC = COLS >> 1
    const midR = ROWS >> 1
    // спавн глибше в кімнату — інакше той самий тайл одразу телепортує назад
    if (dir === 'n') Object.assign(p, world(midC, ROWS - 3))
    if (dir === 's') Object.assign(p, world(midC, 2))
    if (dir === 'e') Object.assign(p, world(2, midR))
    if (dir === 'w') Object.assign(p, world(COLS - 3, midR))
    p.px = p.x
    p.py = p.y
    G.doorLock = 0.5
    G.tears.length = 0
    roomCacheId = ''
    if (next.type === 'boss') toast(BOSS_TITLE[(G.depth || 1) - 1] || 'BOSS')
    else if (next.type === 'item') toast(Txt.toastCache)
    else if (next.type === 'empty') toast(Txt.toastQuiet)
    else if (next.type === 'start') toast(Txt.toastBrief)
    else {
      for (const e of next.enemies) {
        if (!e.alive || e.practice) continue
        e.wakeT = AGRO_DELAY
        e.aggro = false
      }
      toast(Txt.toastWake(AGRO_DELAY))
    }
    hud()
  }

  function update(dt) {
    if (!G || !G.alive) return
    G.time += dt
    G.doorLock = Math.max(0, (G.doorLock || 0) - dt)
    if (shakeT > 0) shakeT = Math.max(0, shakeT - dt)
    if (G.comboT > 0) {
      G.comboT -= dt
      if (G.comboT <= 0) G.combo = 0
    }
    const p = G.player
    const cur = room()
    resolveStuck(p)

    p.cd = Math.max(0, p.cd - dt)
    p.inv = Math.max(0, p.inv - dt)
    p.atkAnim = Math.max(0, p.atkAnim - dt)

    let mx = 0
    let my = 0
    // WASD / pad only for move — arrows are for shooting
    if (keys.KeyW || keys.padUp) my -= 1
    if (keys.KeyS || keys.padDown) my += 1
    if (keys.KeyA || keys.padLeft) mx -= 1
    if (keys.KeyD || keys.padRight) mx += 1
    if (window.__roguePtr && window.__roguePtr.down) {
      const dx = window.__roguePtr.x - p.x
      const dy = window.__roguePtr.y - p.y
      if (Math.hypot(dx, dy) > 14) {
        if (dx > 6) mx += 1
        if (dx < -6) mx -= 1
        if (dy > 6) my += 1
        if (dy < -6) my -= 1
      }
    }
    mx = clamp(mx, -1, 1)
    my = clamp(my, -1, 1)

    let ax = 0
    let ay = 0
    if (keys.ArrowUp) ay -= 1
    if (keys.ArrowDown) ay += 1
    if (keys.ArrowLeft) ax -= 1
    if (keys.ArrowRight) ax += 1
    if (ax || ay) {
      const alen = Math.hypot(ax, ay) || 1
      p.facing = { x: ax / alen, y: ay / alen }
      if (ax < 0) p.flip = true
      if (ax > 0) p.flip = false
      doAttack()
    } else if (keys.Space || keys.KeyZ || keys.attack) {
      doAttack()
    }

    p.moving = !!(mx || my)
    // підказки лише в lore-кімнаті (1 поверх)
    if (cur.lore) {
      if (p.moving || ax || ay || keys.Space || keys.KeyZ || keys.attack) G.briefingFade = true
      if (G.briefingHold > 0) G.briefingHold -= dt
      else G.briefingFade = true
      if (G.briefingFade) G.briefingAlpha = Math.max(0, (G.briefingAlpha ?? 1) - dt * 0.85)
    }

    if (p.moving) {
      const len = Math.hypot(mx, my)
      moveEnt(p, p.x + (mx / len) * p.speed * dt, p.y + (my / len) * p.speed * dt)
      p.walk += dt * 9
      p.stepDust += dt
      if (mx < 0) p.flip = true
      if (mx > 0) p.flip = false
      // only update facing from walk if not aiming with arrows
      if (!(ax || ay)) p.facing = { x: mx / len, y: my / len }
      if (p.stepDust > 0.16) {
        p.stepDust = 0
        fx(p.x, p.y + 12, '#8a7a55', 1)
      }
    } else {
      p.walk += dt * 1.4
    }

    // practice targets не блокують двері; бойові — так
    const hostiles = cur.enemies.filter((e) => e.alive && !e.practice)
    if (!hostiles.length) {
      if (!cur.cleared) {
        cur.cleared = true
        p.score += 20
        roomCacheId = ''
        G.doorLock = Math.max(G.doorLock || 0, 0.45)
        toast(Txt.toastClear)
        if (cur.type === 'boss') {
          const idx = (G.depth || 1) - 1
          cur.drops.push({
            kind: 'gate',
            x: world(COLS >> 1, (ROWS >> 1) + 2).x,
            y: world(COLS >> 1, (ROWS >> 1) + 2).y,
            bob: 0,
          })
          toast(
            G.depth >= G.maxDepth
              ? Txt.toastFinalGate
              : Txt.toastBossDown(BOSS_TITLE[idx] || 'BOSS'),
          )
        }
        hud()
      }
    }

    // вихід: зелені двері — тільки після doorLock (анти-пінг-понг)
    if (cur.cleared && (G.doorLock || 0) <= 0) {
      const midC = COLS >> 1
      const midR = ROWS >> 1
      const pc = Math.floor((p.x - OX) / TS)
      const pr = Math.floor((p.y - OY) / TS)
      if (pr <= 1 && Math.abs(pc - midC) <= 2) tryDoor('n')
      if (pr >= ROWS - 2 && Math.abs(pc - midC) <= 2) tryDoor('s')
      if (pc <= 1 && Math.abs(pr - midR) <= 2) tryDoor('w')
      if (pc >= COLS - 2 && Math.abs(pr - midR) <= 2) tryDoor('e')
    }

    for (const e of cur.enemies) {
      if (!e.alive) continue
      if ((G.time * 10 | 0) % 15 === 0) resolveStuck(e)
      e.walk += dt * 9
      e.hop += dt * 6
      e.frame += dt * 8
      // тренувальні манекени ніколи не атакують
      if (e.practice) {
        const idle = Math.sin(e.walk * 0.5) * 10 * dt
        moveEnt(e, e.x + idle, e.y)
        continue
      }
      e.wakeT = Math.max(0, (e.wakeT ?? AGRO_DELAY) - dt)
      if (e.wakeT <= 0) e.aggro = true
      if (!e.aggro) {
        const idle = Math.sin(e.walk * 0.5) * 12 * dt
        moveEnt(e, e.x + idle, e.y)
        continue
      }
      steerEnemy(e, p, dt)
      if (dist(p, e) < p.r + e.r) {
        if (hurtPlayer(1)) {
          if (p.hp <= 0) {
            G.alive = false
            endRun(false)
            return
          }
        }
      }
    }

    for (let i = G.tears.length - 1; i >= 0; i--) {
      const t = G.tears[i]
      t.x += t.vx * dt
      t.y += t.vy * dt
      t.life -= dt
      t.spin = (t.spin || 0) + dt * 10
      t.trail += dt
      if (t.trail > 0.03) {
        t.trail = 0
        fx(t.x, t.y, '#ff8a3a', 1)
      }
      let dead = t.life <= 0 || blocked(t.x, t.y, 2)
      for (const e of cur.enemies) {
        if (!e.alive || t.hit.has(e)) continue
        if (Math.hypot(e.x - t.x, e.y - t.y) < e.r + t.r) {
          e.hp -= t.dmg
          if (!e.practice) {
            e.aggro = true
            e.wakeT = 0
          }
          t.hit.add(e)
          fx(e.x, e.y, e.color, 5)
          dead = true
          if (e.hp <= 0) kill(e)
        }
      }
      if (dead) G.tears.splice(i, 1)
    }

    for (let i = cur.drops.length - 1; i >= 0; i--) {
      const d = cur.drops[i]
      d.bob += dt * 4
      if (dist(d, p) > 26) continue
      if (d.kind === 'heart') {
        if (p.hp >= p.maxHp) continue
        p.hp = Math.min(p.maxHp, p.hp + 1)
        toast(Txt.toastHp)
        fx(d.x, d.y, '#ff5d78', 8)
      } else if (d.kind === 'power') {
        p.dmg += 0.4
        p.fire = Math.max(0.14, p.fire * 0.82)
        banner.textContent = Txt.bannerPower
        banner.classList.remove('hidden')
        bannerT = 1.8
        toast(Txt.toastPower)
        fx(d.x, d.y, '#7ecbff', 12)
      } else if (d.kind === 'gate') {
        if (G.depth >= G.maxDepth) {
          endRun(true)
          return
        }
        enterNextDepth()
        return
      }
      cur.drops.splice(i, 1)
      hud()
    }

    for (let i = G.particles.length - 1; i >= 0; i--) {
      const pt = G.particles[i]
      pt.x += pt.vx * dt
      pt.y += pt.vy * dt
      pt.life -= dt
      if (pt.life <= 0) G.particles.splice(i, 1)
    }
    for (let i = G.leaves.length - 1; i >= 0; i--) {
      const L = G.leaves[i]
      L.x += L.vx * dt
      L.y += L.vy * dt
      L.rot += dt * 4
      L.life -= dt
      if (L.life <= 0) G.leaves.splice(i, 1)
    }

    if (Math.random() < 0.02) {
      const at = cur.layout.animTiles
      if (at.length) {
        const a = at[(Math.random() * at.length) | 0]
        leaf(OX + a.c * TS + 16, OY + a.r * TS + 8)
      }
    }

    if (toastT > 0) {
      toastT -= dt
      if (toastT <= 0) toastEl.textContent = ''
    }
    if (bannerT > 0) {
      bannerT -= dt
      if (bannerT <= 0) banner.classList.add('hidden')
    }
  }

  function enterNextDepth() {
    const keep = {
      hp: G.player.hp,
      maxHp: G.player.maxHp,
      dmg: G.player.dmg,
      fire: G.player.fire,
      score: G.player.score,
    }
    G.depth = (G.depth || 1) + 1
    G.map = makeMap(G.depth)
    G.tears = []
    G.particles = []
    G.leaves = []
    roomCacheId = ''
    const spawn = world(COLS >> 1, ROWS >> 1)
    Object.assign(G.player, {
      x: spawn.x,
      y: spawn.y,
      px: spawn.x,
      py: spawn.y,
      hp: keep.hp,
      maxHp: keep.maxHp,
      dmg: keep.dmg,
      fire: keep.fire,
      score: keep.score + 50,
      inv: 1.2,
      cd: 0,
    })
    G.doorLock = 0.55
    G.briefingAlpha = 0
    G.briefingFade = true
    toast(`${G.map.depthName} · boss: ${BOSS_TITLE[G.depth - 1]}`)
    hud()
  }

  function endRun(win) {
    gameWrap.classList.add('hidden')
    end.classList.remove('hidden')
    end.classList.toggle('win', !!win)
    document.getElementById('endTitle').textContent = win ? Txt.winTitle : Txt.loseTitle
    document.getElementById('endText').innerHTML = win
      ? Txt.winText(G.player.score)
      : Txt.loseText(G.map?.depthName || (LANG === 'uk' ? 'розломі' : 'the rift'), G.player.score)
  }

  function bakeRoomView(cur) {
    const buf = document.createElement('canvas')
    buf.width = W
    buf.height = H
    const g = buf.getContext('2d')
    g.imageSmoothingEnabled = false
    g.fillStyle = '#0e1218'
    g.fillRect(0, 0, W, H)
    // soft vignette strip under field
    g.fillStyle = '#161c26'
    g.fillRect(OX - 4, OY - 4, COLS * TS + 8, ROWS * TS + 8)
    const L = cur.layout
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        drawBit(g, T.floor[0], OX + c * TS, OY + r * TS, TS)
        const id = L.ground[r][c]
        if (id !== T.floor[0]) drawBit(g, id, OX + c * TS, OY + r * TS, TS)
      }
    }
    g.fillStyle = cur.cleared ? '#8fd98a' : '#c07060'
    const midC = COLS >> 1
    const midR = ROWS >> 1
    const doorW = TS * 3
    const doorThick = 10
    if (L.doors.n) g.fillRect(OX + (midC - 1) * TS, OY - 6, doorW, doorThick)
    if (L.doors.s) g.fillRect(OX + (midC - 1) * TS, OY + ROWS * TS - 4, doorW, doorThick)
    if (L.doors.w) g.fillRect(OX - 6, OY + (midR - 1) * TS, doorThick, doorW)
    if (L.doors.e) g.fillRect(OX + COLS * TS - 4, OY + (midR - 1) * TS, doorThick, doorW)
    // стрілки на відкритих дверях
    if (cur.cleared) {
      g.fillStyle = '#b8ff9a'
      g.font = '14px VT323, monospace'
      g.textAlign = 'center'
      if (L.doors.n) g.fillText(`▲ ${Txt.exit}`, OX + midC * TS + TS / 2, OY + 16)
      if (L.doors.s) g.fillText(`▼ ${Txt.exit}`, OX + midC * TS + TS / 2, OY + ROWS * TS - 8)
      if (L.doors.w) {
        g.textAlign = 'left'
        g.fillText(`◀ ${Txt.exit}`, OX + 8, OY + midR * TS + 6)
      }
      if (L.doors.e) {
        g.textAlign = 'right'
        g.fillText(`${Txt.exit} ▶`, OX + COLS * TS - 8, OY + midR * TS + 6)
      }
    }
    for (const rm of G.map.rooms) {
      const mx = W - 14 - (G.map.size - rm.x) * 11
      const my = 6 + rm.y * 11
      g.fillStyle = rm.x === G.map.cx && rm.y === G.map.cy ? '#f0efe6' : rm.visited ? '#6a8' : '#345'
      if (rm.type === 'boss' && !(rm.x === G.map.cx && rm.y === G.map.cy)) g.fillStyle = '#c07060'
      if (rm.type === 'item' && !(rm.x === G.map.cx && rm.y === G.map.cy)) g.fillStyle = '#8fd98a'
      if (rm.type === 'empty' && !(rm.x === G.map.cx && rm.y === G.map.cy)) g.fillStyle = '#7a8a9a'
      g.fillRect(mx, my, 9, 9)
    }
    return buf
  }

  function drawHero(x, y, flip, walk, atk, moving) {
    const castT = atk > 0 ? atk / 0.34 : 0
    drawByteLive(ctx, x, y, 3.1, {
      flip,
      phase: walk,
      moving,
      cast: castT,
    })
  }

  function drawKey(x, y, label, hot) {
    ctx.fillStyle = hot ? '#7ecbff' : '#1a2230'
    ctx.fillRect(x, y, 28, 28)
    ctx.strokeStyle = hot ? '#e8eaf0' : '#5a6a80'
    ctx.strokeRect(x + 0.5, y + 0.5, 27, 27)
    ctx.fillStyle = '#e8eaf0'
    ctx.font = '12px VT323, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(label, x + 14, y + 19)
  }

  function drawBriefing() {
    const a = G.briefingAlpha ?? 1
    if (a <= 0.02) return
    ctx.save()
    ctx.globalAlpha = a
    const cx = OX + (COLS * TS) / 2
    const top = OY + 28
    ctx.fillStyle = 'rgba(8, 10, 16, 0.78)'
    ctx.fillRect(OX + 40, OY + 18, COLS * TS - 80, 200)
    ctx.strokeStyle = '#7ecbff'
    ctx.strokeRect(OX + 40, OY + 18, COLS * TS - 80, 200)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ff9a6a'
    ctx.font = '11px "Press Start 2P", monospace'
    ctx.fillText(Txt.training, cx, top + 10)
    ctx.font = '17px VT323, monospace'
    LORE_LINES.forEach((line, i) => {
      ctx.fillStyle = i === 0 ? '#7ecbff' : '#e8eaf0'
      ctx.fillText(line, cx, top + 34 + i * 18)
    })

    // WASD cluster
    const wx = OX + 90
    const wy = OY + ROWS * TS - 110
    ctx.fillStyle = '#8fd98a'
    ctx.font = '14px VT323, monospace'
    ctx.textAlign = 'left'
    ctx.fillText(Txt.walk, wx, wy - 8)
    drawKey(wx + 32, wy, 'W', keys.KeyW)
    drawKey(wx, wy + 32, 'A', keys.KeyA)
    drawKey(wx + 32, wy + 32, 'S', keys.KeyS)
    drawKey(wx + 64, wy + 32, 'D', keys.KeyD)

    // Arrow cluster
    const ax = OX + COLS * TS - 190
    ctx.fillStyle = '#ffb347'
    ctx.fillText(Txt.shoot, ax, wy - 8)
    drawKey(ax + 32, wy, '↑', keys.ArrowUp)
    drawKey(ax, wy + 32, '←', keys.ArrowLeft)
    drawKey(ax + 32, wy + 32, '↓', keys.ArrowDown)
    drawKey(ax + 64, wy + 32, '→', keys.ArrowRight)

    ctx.fillStyle = '#8fd98a'
    ctx.textAlign = 'center'
    ctx.fillText(Txt.exitHint, cx, OY + ROWS * TS - 18)
    ctx.textAlign = 'left'
    ctx.restore()
  }

  function drawEnemy(e, x, y) {
    let spr = SPR[e.kind]
    const frames = Array.isArray(spr) ? spr : null
    if (frames) spr = frames[((e.frame) | 0) % frames.length]
    else if (e.kind === 'slime' && SPR.slime) spr = SPR.slime[((e.frame) | 0) % SPR.slime.length]
    const hop = Math.abs(Math.sin(e.hop)) * (e.kind === 'bat' ? 5 : 2)
    const bob = Math.sin(e.walk) * 1.5 + hop
    ctx.fillStyle = 'rgba(0,0,0,.35)'
    ctx.fillRect((x - 11) | 0, (y + 14) | 0, 22, 5)
    if (!spr) {
      // fallback якщо спрайт не завантажився — невидимі вороги = баг
      ctx.fillStyle = e.color || '#ff6b7a'
      ctx.beginPath()
      ctx.arc(x, y + bob, e.r || 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.stroke()
    } else {
      const flap = e.kind === 'bat' ? 1 + Math.sin(e.frame * 2) * 0.08 : 1
      ctx.save()
      ctx.translate(x | 0, (y + bob) | 0)
      ctx.scale((e.flip ? -1 : 1) * flap, 2 - flap)
      ctx.drawImage(spr, -spr.width / 2, -spr.height / 2)
      ctx.restore()
    }
    if (e.hp < e.maxHp) {
      ctx.fillStyle = '#401018'
      ctx.fillRect(x - 14, y - 24, 28, 4)
      ctx.fillStyle = '#ff5d6c'
      ctx.fillRect(x - 14, y - 24, 28 * (e.hp / e.maxHp), 4)
      ctx.fillStyle = '#ffd0d8'
      ctx.fillRect(x - 14, y - 24, Math.max(0, 28 * (e.hp / e.maxHp) - 2), 1)
    }
  }

  function drawDrop(d) {
    const bob = Math.sin(d.bob) * 4
    const img = ITEM[d.kind === 'power' ? 'power' : d.kind]
    if (!img) return
    ctx.globalAlpha = 0.25 + Math.sin(d.bob * 2) * 0.15
    ctx.fillStyle =
      d.kind === 'heart' ? '#ff5d78' : d.kind === 'power' ? '#7ecbff' : d.kind === 'gate' ? '#6dffb0' : '#ffe08a'
    ctx.beginPath()
    ctx.arc(d.x, d.y + bob, d.kind === 'gate' ? 22 : 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.drawImage(img, d.x - img.width / 2, d.y + bob - img.height / 2)
  }

  function draw(alpha) {
    if (!G) return
    const cur = room()
    const id = `${G.map.cx},${G.map.cy},${cur.cleared}`
    if (id !== roomCacheId) {
      roomCache = bakeRoomView(cur)
      roomCacheId = id
    }
    ctx.save()
    if (shakeT > 0) {
      const m = shakeMag * (shakeT / 0.28)
      ctx.translate((Math.random() - 0.5) * m * 2, (Math.random() - 0.5) * m * 2)
    }
    ctx.drawImage(roomCache, 0, 0)

    // animated plants / campfires
    for (const a of cur.layout.animTiles) {
      const px = OX + a.c * TS
      const py = OY + a.r * TS
      if (a.kind === 'plant') {
        const sway = Math.sin(G.time * 3 + a.phase) * 2.5
        drawBit(ctx, T.floor[0], px, py, TS)
        drawBit(ctx, cur.layout.ground[a.r][a.c], px + sway, py, TS)
      } else if (a.kind === 'fire') {
        const fid = T.fire[((G.time * 8 + a.phase) | 0) % T.fire.length]
        drawBit(ctx, T.floor[0], px, py, TS)
        drawBit(ctx, fid, px, py - Math.abs(Math.sin(G.time * 10 + a.phase)) * 2, TS)
      }
    }

    for (const d of cur.drops) drawDrop(d)

    for (const e of cur.enemies) {
      if (!e.alive) continue
      drawEnemy(e, lerp(e.px, e.x, alpha), lerp(e.py, e.y, alpha))
      if (!e.practice && !e.aggro && e.wakeT > 0 && e.wakeT < 30) {
        const bx = lerp(e.px, e.x, alpha)
        const by = lerp(e.py, e.y, alpha) - (e.r + 10)
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(bx - 10, by - 10, 20, 12)
        ctx.fillStyle = '#ffe08a'
        ctx.font = '10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(String(Math.ceil(e.wakeT)), bx, by)
        ctx.textAlign = 'left'
      }
      if (e.boss && e.alive) {
        const bx = lerp(e.px, e.x, alpha)
        const by = lerp(e.py, e.y, alpha) - (e.r + 18)
        const bw = 56
        const pct = Math.max(0, e.hp / e.maxHp)
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(bx - bw / 2, by, bw, 6)
        ctx.fillStyle = e.color || '#ff6b7a'
        ctx.fillRect(bx - bw / 2, by, bw * pct, 6)
        ctx.strokeStyle = '#f0efe6'
        ctx.strokeRect(bx - bw / 2, by, bw, 6)
      }
    }

    if (cur.lore) {
      drawBriefing()
    }

    for (const t of G.tears) {
      const ball = SPR.ball ? SPR.ball[((G.time * 10 + (t.spin || 0)) | 0) % SPR.ball.length] : null
      const ang = Math.atan2(t.vy, t.vx)
      ctx.save()
      ctx.translate(t.x, t.y)
      ctx.rotate(ang)
      ctx.globalAlpha = 0.4
      ctx.fillStyle = '#ff4a1a'
      ctx.beginPath()
      ctx.ellipse(-2, 0, t.r + 6, t.r + 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      if (ball) ctx.drawImage(ball, -ball.width / 2, -ball.height / 2)
      else {
        ctx.fillStyle = '#ffb347'
        ctx.beginPath()
        ctx.arc(0, 0, 7, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    for (const pt of G.particles) {
      ctx.globalAlpha = Math.max(0, pt.life * 2)
      ctx.fillStyle = pt.color
      ctx.fillRect(pt.x | 0, pt.y | 0, pt.size, pt.size)
    }
    for (const L of G.leaves) {
      ctx.save()
      ctx.globalAlpha = Math.min(1, L.life)
      ctx.translate(L.x, L.y)
      ctx.rotate(L.rot)
      ctx.fillStyle = L.color
      ctx.fillRect(-2, -1, 5, 3)
      ctx.restore()
    }
    ctx.globalAlpha = 1

    const p = G.player
    if (!(p.inv > 0 && ((G.time * 16) | 0) % 2 === 0)) {
      drawHero(lerp(p.px, p.x, alpha), lerp(p.py, p.y, alpha), p.flip, p.walk, p.atkAnim, p.moving)
    }
    if (p.hp <= 1) {
      ctx.fillStyle = `rgba(120, 10, 20, ${0.12 + Math.sin(G.time * 8) * 0.06})`
      ctx.fillRect(0, 0, W, H)
    }
    ctx.restore()
  }

  function snapshot() {
    if (!G) return
    G.player.px = G.player.x
    G.player.py = G.player.y
    for (const e of room().enemies) {
      e.px = e.x
      e.py = e.y
    }
  }

  function frame(ts) {
    const now = ts * 0.001
    if (!last) last = now
    let dt = now - last
    last = now
    if (dt > 0.08) dt = 0.08
    acc += dt
    let steps = 0
    while (acc >= STEP && steps < 4) {
      snapshot()
      if (!gameWrap.classList.contains('hidden')) update(STEP)
      acc -= STEP
      steps++
    }
    if (acc > STEP * 4) acc = 0
    if (!gameWrap.classList.contains('hidden')) draw(acc / STEP)
    requestAnimationFrame(frame)
  }

  startBtn.disabled = true
  startBtn.textContent = '…'
  startBtn.onclick = () => {
    boot.classList.add('hidden')
    end.classList.add('hidden')
    gameWrap.classList.remove('hidden')
    newRun()
    canvas.focus({ preventScroll: true })
    hideFocusHintSoon()
  }
  document.getElementById('againBtn').onclick = () => {
    end.classList.add('hidden')
    boot.classList.add('hidden')
    gameWrap.classList.remove('hidden')
    newRun()
    canvas.focus({ preventScroll: true })
    hideFocusHintSoon()
  }

  window.addEventListener('keydown', (e) => {
    keys[e.code] = true
    if (focusHint) focusHint.classList.add('off')
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault()
    if (e.code === 'KeyR' && !e.repeat && !gameWrap.classList.contains('hidden')) newRun()
    if ((e.code === 'Space' || e.code === 'KeyZ') && !e.repeat) doAttack()
  })
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false
  })

  document.querySelectorAll('[data-pad]').forEach((btn) => {
    const code = btn.getAttribute('data-pad')
    const set = (v) => {
      if (code === 'attack') keys.attack = v
      else if (code === 'KeyW') keys.padUp = v
      else if (code === 'KeyS') keys.padDown = v
      else if (code === 'KeyA') keys.padLeft = v
      else if (code === 'KeyD') keys.padRight = v
    }
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      set(true)
      if (code === 'attack') doAttack()
      btn.setPointerCapture(e.pointerId)
    })
    const off = () => set(false)
    btn.addEventListener('pointerup', off)
    btn.addEventListener('pointercancel', off)
    btn.addEventListener('lostpointercapture', off)
  })

  window.__roguePtr = { x: 0, y: 0, down: false }
  canvas.tabIndex = 0
  canvas.addEventListener('pointerdown', (e) => {
    if (!G || gameWrap.classList.contains('hidden')) return
    canvas.focus({ preventScroll: true })
    if (focusHint) focusHint.classList.add('off')
    canvas.setPointerCapture(e.pointerId)
    const rect = canvas.getBoundingClientRect()
    const sx = ((e.clientX - rect.left) / rect.width) * W
    const sy = ((e.clientY - rect.top) / rect.height) * H
    window.__roguePtr = { x: sx, y: sy, down: true }
    const p = G.player
    const dx = sx - p.x
    const dy = sy - p.y
    const len = Math.hypot(dx, dy) || 1
    p.facing = { x: dx / len, y: dy / len }
    // click/hold = walk toward point (cast via SPACE / CAST)
  })
  canvas.addEventListener('pointermove', (e) => {
    if (!window.__roguePtr.down) return
    const rect = canvas.getBoundingClientRect()
    window.__roguePtr.x = ((e.clientX - rect.left) / rect.width) * W
    window.__roguePtr.y = ((e.clientY - rect.top) / rect.height) * H
  })
  const up = () => {
    window.__roguePtr.down = false
  }
  canvas.addEventListener('pointerup', up)
  canvas.addEventListener('pointercancel', up)

  requestAnimationFrame(frame)
})()
