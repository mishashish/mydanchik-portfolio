(() => {
  'use strict'

  const TREND = ['iphone', 'samsung', 'ноутбук', 'playstation', 'airpods', 'macbook', 'велосипед', 'квартира']

  const state = {
    tab: 'search',
    view: 'grid',
    items: [],
    raw: [],
    fav: loadFav(),
    loading: false,
    source: '',
    via: '',
    relay: '',
    error: '',
    note: '',
    nextOffset: 0,
    hasMore: false,
    loadingMore: false,
  }

  const $ = (id) => document.getElementById(id)

  function loadFav() {
    try {
      return new Map(JSON.parse(localStorage.getItem('olxpulse_fav_v1') || '[]'))
    } catch {
      return new Map()
    }
  }

  function saveFav() {
    localStorage.setItem('olxpulse_fav_v1', JSON.stringify([...state.fav.entries()]))
    $('favCount').textContent = String(state.fav.size)
  }

  function money(n) {
    if (n == null || !Number.isFinite(n)) return '—'
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      maximumFractionDigits: 0,
    }).format(n)
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function photoUrl(link, w = 640, h = 480) {
    if (!link) return null
    return String(link).replace('{width}', String(w)).replace('{height}', String(h)).replace(':443', '')
  }

  function placeholder(title) {
    const label = encodeURIComponent((title || 'OLX').slice(0, 28))
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#eef2f0"/><rect x="36" y="36" width="568" height="408" rx="16" fill="#fff" stroke="#cfd8d3"/><text x="320" y="240" text-anchor="middle" font-family="Arial" font-size="22" fill="#5b6b63">${label}</text></svg>`
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }

  function param(offer, key) {
    return (offer.params || []).find((p) => p.key === key)
  }

  function scoreParts({ disc, ageH, promo, photos, sellerOnline, negotiable, titleHit, descBonus, condBonus, priceBonus }) {
    // base so ordinary ads still pass low min-score and sort meaningfully
    const base = 28
    const fromDiscount = Math.min(16, disc * 0.65)
    const fromFresh = ageH < 12 ? 14 : ageH < 48 ? 11 : ageH < 120 ? 8 : ageH < 336 ? 5 : 2
    const fromPromo = (promo.top_ad ? 8 : 0) + (promo.urgent ? 5 : 0) + (promo.highlighted ? 3 : 0)
    const fromPhotos = Math.min(12, 3 + photos * 1.2)
    const fromSeller = sellerOnline ? 5 : 1
    const fromNeg = negotiable ? 2 : 0
    const fromTitle = titleHit ? 6 : 0
    const fromDesc = Math.max(-12, Math.min(18, descBonus || 0))
    const fromCond = Math.max(-8, Math.min(12, condBonus || 0))
    const fromPrice = Math.max(-10, Math.min(14, priceBonus || 0))
    const total = Math.max(
      1,
      Math.min(
        99,
        Math.round(
          base +
            fromDiscount +
            fromFresh +
            fromPromo +
            fromPhotos +
            fromSeller +
            fromNeg +
            fromTitle +
            fromDesc +
            fromCond +
            fromPrice,
        ),
      ),
    )
    return {
      total,
      base,
      fromDiscount,
      fromFresh,
      fromPromo,
      fromPhotos,
      fromSeller,
      fromNeg,
      fromTitle,
      fromDesc,
      fromCond,
      fromPrice,
    }
  }

  /** Читає опис + стан: плюси/мінуси для score і пояснень. */
  function analyzeText(description, condition, conditionKey) {
    const raw = `${condition || ''} ${conditionKey || ''} ${description || ''}`.toLowerCase()
    const flags = {
      isNew: false,
      isUsed: false,
      warranty: false,
      boxed: false,
      docs: false,
      delivery: false,
      safeDeal: false,
      cleanIcloud: false,
      neverlock: false,
      defect: false,
      repair: false,
      bargain: false,
    }
    const reasons = []

    if (/нов(ий|а|е|і)|new\b|sealed|запечатан|не розпаков|не активован|open.?box|як новий/.test(raw)) {
      flags.isNew = true
      reasons.push({ ok: true, text: 'У описі/стані: новий або майже новий' })
    }
    if (/вживан|б\/у|б\.у|used|second|був у використан|не новий/.test(raw)) {
      flags.isUsed = true
      if (!flags.isNew) reasons.push({ ok: true, text: 'Вказано вживаний стан (прозоро)' })
    }
    if (/гарант/.test(raw)) {
      flags.warranty = true
      reasons.push({ ok: true, text: 'Є згадка про гарантію' })
    }
    if (/коробк|комплект|повний комплект|box|полный комплект/.test(raw)) {
      flags.boxed = true
      reasons.push({ ok: true, text: 'Комплект / коробка в описі' })
    }
    if (/документ|чек|квитанц|рахунок/.test(raw)) {
      flags.docs = true
      reasons.push({ ok: true, text: 'Документи / чек згадані' })
    }
    if (/доставк|нова пошта|укрпошт|відправ|пересил/.test(raw)) {
      flags.delivery = true
      reasons.push({ ok: true, text: 'Готові відправити / доставка' })
    }
    if (/безпечн(а|ої) угод|олх достав|olx delivery|safe deal/.test(raw)) {
      flags.safeDeal = true
      reasons.push({ ok: true, text: 'Безпечна угода / OLX доставка' })
    }
    if (/чистий icloud|icloud чист|без icloud|знятий з обліков/.test(raw)) {
      flags.cleanIcloud = true
      reasons.push({ ok: true, text: 'Чистий iCloud / без блокувань' })
    }
    if (/neverlock|неверлок|будь.?як(ий|ого) оператор/.test(raw)) {
      flags.neverlock = true
      reasons.push({ ok: true, text: 'Neverlock / усі оператори' })
    }
    if (/торг|знижк|договірн|ціна обговорен/.test(raw)) {
      flags.bargain = true
      reasons.push({ ok: true, text: 'Торг / обговорення ціни' })
    }
    if (/тріщин|розбит|битий|не працює|несправн|дефект|подряпин|вмʼятин|вмятин|екран бит/.test(raw)) {
      flags.defect = true
      reasons.push({ ok: false, text: 'У описі є дефекти / пошкодження' })
    }
    if (/ремонт|після ремонту|перепаян|замін(а|ений) екран|замін(а|ена) батаре/.test(raw)) {
      flags.repair = true
      reasons.push({ ok: false, text: 'Згадка ремонту / заміни деталей' })
    }

    let bonus = 0
    if (flags.isNew) bonus += 8
    else if (flags.isUsed) bonus += 2
    if (flags.warranty) bonus += 4
    if (flags.boxed) bonus += 3
    if (flags.docs) bonus += 2
    if (flags.delivery) bonus += 2
    if (flags.safeDeal) bonus += 3
    if (flags.cleanIcloud) bonus += 3
    if (flags.neverlock) bonus += 2
    if (flags.bargain) bonus += 1
    if (flags.defect) bonus -= 10
    if (flags.repair) bonus -= 4

    // стан з поля OLX
    let condBonus = 0
    const ck = `${conditionKey || ''} ${condition || ''}`.toLowerCase()
    if (/new|нов/.test(ck)) {
      condBonus += 8
      if (!flags.isNew) reasons.push({ ok: true, text: `Стан у картці: ${condition || 'новий'}` })
    } else if (/used|вжив|б\/у/.test(ck)) {
      condBonus += 2
    }

    return { flags, reasons, descBonus: bonus, condBonus }
  }

  function priceInsight(price, median, was, disc) {
    const reasons = []
    let bonus = 0
    if (price == null || !Number.isFinite(price)) {
      return { reasons, priceBonus: 0 }
    }
    if (median != null && median > 0) {
      const ratio = price / median
      if (ratio <= 0.7) {
        bonus += 12
        reasons.push({ ok: true, text: `Ціна помітно нижча медіани вибірки (−${Math.round((1 - ratio) * 100)}%)` })
      } else if (ratio <= 0.9) {
        bonus += 7
        reasons.push({ ok: true, text: 'Ціна нижча за медіану по durому пошуку' })
      } else if (ratio <= 1.1) {
        bonus += 2
        reasons.push({ ok: true, text: 'Ціна близько до ринку (медіана)' })
      } else if (ratio <= 1.35) {
        bonus -= 3
        reasons.push({ ok: false, text: 'Ціна трохи вища медіани' })
      } else {
        bonus -= 8
        reasons.push({ ok: false, text: 'Ціна суттєво вища за медіану вибірки' })
      }
    }
    if (Number.isFinite(was) && was > price && disc >= 8) {
      bonus += Math.min(6, Math.round(disc / 8))
      reasons.push({ ok: true, text: `Знижка з попередньої ціни ≈ ${Math.round(disc)}%` })
    }
    return { reasons, priceBonus: bonus }
  }

  function buildWhy(item, median) {
    const textA = analyzeText(item.description, item.condition, item.conditionKey)
    const priceA = priceInsight(item.price, median, item.was, item.discount)
    const why = [...priceA.reasons, ...textA.reasons]
    const p = item.scoreParts || {}
    if ((p.fromFresh || 0) >= 11) why.push({ ok: true, text: 'Свіже оголошення' })
    if ((p.fromPhotos || 0) >= 8) why.push({ ok: true, text: `Багато фото (${item.images?.length || 0})` })
    if (item.sellerOnline) why.push({ ok: true, text: 'Продавець зараз online' })
    if (item.promo?.top_ad) why.push({ ok: true, text: 'TOP-промо на OLX' })
    if (item.titleHit) why.push({ ok: true, text: 'Заголовок добре збігається з пошуком' })
    if (!why.length) why.push({ ok: true, text: 'Базовий рейтинг за свіжістю й фото' })
    return why.slice(0, 6)
  }

  function enrichScores(items) {
    const prices = items.map((x) => x.price).filter((n) => n != null && Number.isFinite(n))
    const median = prices.length ? prices.slice().sort((a, b) => a - b)[Math.floor(prices.length / 2)] : null
    return items.map((item) => {
      const textA = analyzeText(item.description, item.condition, item.conditionKey)
      const priceA = priceInsight(item.price, median, item.was, item.discount)
      const parts = scoreParts({
        disc: item.discount || 0,
        ageH: item.ageH,
        promo: item.promo || {},
        photos: item.images?.length || 0,
        sellerOnline: item.sellerOnline,
        negotiable: !!item.negotiable,
        titleHit: item.titleHit,
        descBonus: textA.descBonus,
        condBonus: textA.condBonus,
        priceBonus: priceA.priceBonus,
      })
      const why = buildWhy({ ...item, scoreParts: parts }, median)
      return {
        ...item,
        score: parts.total,
        scoreParts: parts,
        analysis: { ...textA.flags, median, why },
        why,
        whyShort: why.filter((w) => w.ok).slice(0, 2).map((w) => w.text).join(' · ') || why[0]?.text || '',
      }
    })
  }

  function titleMatchScore(title, q) {
    if (!q) return false
    return queryMatch(`${title || ''}`, q).ok
  }

  const TRANSLIT = {
    а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh',
    з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
    о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
    ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'yu', я: 'ya',
  }

  function toLat(s) {
    return String(s || '')
      .toLowerCase()
      .split('')
      .map((ch) => TRANSLIT[ch] ?? ch)
      .join('')
  }

  function expandTokens(q) {
    // цифри моделей (6, 7, se) теж важливі — раніше length>1 їх відсікав
    const raw = String(q || '')
      .toLowerCase()
      .split(/[\s,+/|_-]+/)
      .filter((t) => t.length > 0)
    const out = new Set()
    for (const t of raw) {
      out.add(t)
      out.add(toLat(t))
      if (t === 'самсунг' || t === 'samsung') {
        out.add('samsung')
        out.add('самсунг')
        out.add('galaxy')
      }
      if (t === 'айфон' || t === 'iphone') {
        out.add('iphone')
        out.add('айфон')
      }
      if (t === 'ноутбук' || t === 'laptop') {
        out.add('ноутбук')
        out.add('laptop')
        out.add('notebook')
      }
    }
    return [...out]
  }

  /** Розбір запиту: бренд + модель (samsung A 56 → a56; iphone 6 → 6, не 16). */
  function parseQuery(q) {
    const raw = String(q || '').toLowerCase().trim()
    const parts = raw.split(/[\s,+/|_-]+/).filter(Boolean)
    const brands = []
    const models = []
    const words = []
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]
      const lat = toLat(p)
      const next = parts[i + 1]

      // «A 56» / «S 22» → a56 / s22
      if (/^[a-zа-яіїєґ]$/i.test(p) && next && /^\d{1,3}[a-z0-9]*$/i.test(next)) {
        models.push((p + next).toLowerCase().replace(/[^a-z0-9]/g, ''))
        i += 1
        continue
      }

      if (/^(iphone|айфон|apple)$/.test(lat) || p === 'айфон') {
        brands.push('iphone')
        continue
      }
      if (/^(samsung|самсунг)$/.test(lat) || p === 'самсунг') {
        brands.push('samsung')
        continue
      }
      if (/^galaxy$/.test(lat)) {
        brands.push('samsung')
        words.push('galaxy')
        continue
      }
      if (/^(xiaomi|redmi|poco)$/.test(lat)) {
        brands.push('xiaomi')
        continue
      }
      // a56, s22, s23ultra, a566b
      if (/^[a-z]{1,2}\d{1,3}[a-z0-9]*$/i.test(p)) {
        models.push(p.toLowerCase().replace(/[^a-z0-9]/g, ''))
        continue
      }
      if (/^\d{1,2}(s|pro|max|plus|mini)?$/i.test(p) || /^\d{1,2}$/.test(p)) {
        models.push(p.replace(/[^0-9a-z]/gi, ''))
        continue
      }
      if (/^(se|xr|xs|x)$/i.test(p)) {
        models.push(p.toLowerCase())
        continue
      }
      if (p.length > 1) words.push(lat)
    }
    return { raw, brands: [...new Set(brands)], models: [...new Set(models)], words: [...new Set(words)] }
  }

  function hasModelToken(hay, model) {
    const m = String(model).toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!m) return false
    const text = String(hay || '').toLowerCase()
    // нормалізуємо «A 56» / «A56» в токени
    const norm = text
      .replace(/(iphone|айфон|galaxy|redmi|samsung|самсунг)/gi, ' $1 ')
      .replace(/([a-zа-яіїєґ])(\d)/gi, '$1 $2')
      .replace(/(\d)([a-zа-яіїєґ])/gi, '$1 $2')
    const tokens = norm.split(/[^a-z0-9а-яіїєґ+]+/i).filter(Boolean)
    const compact = text.replace(/[\s_\-./]/g, '')

    // модель типу a56 / s22
    if (/^[a-z]+\d+/.test(m)) {
      const letter = m.replace(/\d.*$/, '')
      const digits = m.replace(/^[a-z]+/, '').replace(/[a-z]+$/i, '') || m.replace(/^[a-z]+/, '')
      const digCore = digits.replace(/\D/g, '') || m.replace(/\D/g, '')
      if (new RegExp(`${letter}\\s*${digCore}`, 'i').test(norm)) return true
      if (compact.includes(m)) return true
      // A566B при пошуку A56
      if (digCore && new RegExp(`(?:^|[^a-z0-9])${letter}${digCore}[a-z0-9]*`, 'i').test(compact)) return true
      return tokens.some((t) => t === m || new RegExp(`^${letter}${digCore}[a-z0-9]*$`).test(t))
    }

    if (/^\d+$/.test(m)) {
      // точне число: 6 ≠ 16 ≠ 56 в середині 256
      return tokens.some((t) => {
        if (t === m) return true
        if (new RegExp(`^(iphone|айфон)${m}(s|plus|pro|max|mini)?$`).test(t)) return true
        if (new RegExp(`^[asmz]${m}[a-z0-9]*$`).test(t)) return true // a56 при запиті «56»
        if (t === `${m}s` || t === `${m}plus` || t === `${m}pro`) return true
        return false
      })
    }

    const re = new RegExp(`(?:^|[^a-z0-9])${m}(?:[^a-z0-9]|$)`, 'i')
    return re.test(text)
  }

  function queryMatch(text, q, opts = {}) {
    const pq = parseQuery(q)
    if (!pq.raw) return { ok: true, score: 0, pq }
    const hay = String(text || '').toLowerCase()
    const hayLat = toLat(hay)
    let score = 0
    let ok = true
    const titleOnly = !!opts.titleOnly

    // загальний запит «телефон / смартфон» → будь-який телефонний девайс (не аксесуар)
    const phoneGeneric =
      pq.words.some((w) => /^(telefon|smartfon|phone)$/.test(w)) || /^(телефон|смартфон|phone)$/i.test(pq.raw)
    if (phoneGeneric && !pq.brands.length && !pq.models.length) {
      const device = isPhoneDeviceText(hay) && !isPhoneAccessoryText(hay)
      return { ok: device, score: device ? 45 : 0, pq }
    }

    for (const b of pq.brands) {
      const hit =
        (b === 'iphone' && /iphone|айфон/.test(hay)) ||
        (b === 'samsung' && /samsung|самсунг/.test(hay)) ||
        (b === 'samsung' && !titleOnly && /galaxy|галактика/.test(hay)) ||
        (b === 'samsung' && titleOnly && /galaxy\s*[aszm]?\d|galaxy\s*a\s*\d|galaxy\s*s\s*\d|галактика/.test(hay)) ||
        (b === 'xiaomi' && /xiaomi|redmi|poco|сяомі/.test(hay)) ||
        (b !== 'samsung' && hayLat.includes(b))
      if (!hit) ok = false
      else score += 40
    }

    for (const m of pq.models) {
      if (!hasModelToken(hay, m)) ok = false
      else score += 50
    }

    for (const w of pq.words) {
      if (w.length < 2) continue
      if (/^(telefon|smartfon|phone|galaxy)$/.test(w)) {
        if (/galaxy|галактика|telefon|smartfon|iphone|айфон|samsung/.test(hayLat) || isPhoneDeviceText(hay)) score += 12
        continue
      }
      if (hayLat.includes(w) || hay.includes(w)) score += 12
      else if (pq.brands.length || pq.models.length) {
        // додаткові слова не блокують, якщо бренд+модель вже є
      } else {
        ok = false
      }
    }

    // якщо лише слова без бренду/моделі — усі слова обов’язкові
    if (!pq.brands.length && !pq.models.length && pq.words.length) {
      ok = pq.words.every((w) => {
        if (/^(telefon|smartfon|phone)$/.test(w)) return isPhoneDeviceText(hay)
        return hayLat.includes(w) || hay.includes(w)
      })
      score = ok ? pq.words.length * 20 : 0
    }

    return { ok, score, pq }
  }

  /** Суворий матч лише по заголовку (+ бренд з OLX). Опис не підмішуємо — там часто «порівняй з Samsung». */
  function offerMatchesQuery(item, q) {
    if (!q) return { ok: true, score: 0 }
    return queryMatch(`${item.title || ''} ${item.brand || ''}`, q, { titleOnly: true })
  }

  const CAT_TYPE_LABEL = {
    electronics: 'Електроніка',
    goods: 'Товари',
    automotive: 'Авто',
    real_estate: 'Нерухомість',
    accommodation: 'Житло',
    item_rentals: 'Оренда',
    job: 'Робота',
    services: 'Послуги',
    animals: 'Тварини',
    fashion: 'Мода',
    house_garden: 'Дім і сад',
    for_free: 'Безкоштовно',
  }

  /** OLX-like category tree (demo taxonomy). */
  const OLX_TREE = [
    {
      id: 'electronics',
      name: 'Електроніка',
      icon: '📱',
      types: ['electronics'],
      children: [
        {
          id: 'phones',
          name: 'Телефони',
          ids: [85],
          re: /iphone|айфон|смартфон|\bтелефон\b|galaxy|xiaomi|redmi|pixel|oneplus|poco|honor|huawei|realme|tecno|infinix|motorola|nokia|neverlock|неверлок|samsung\s*(galaxy|[as]\d{1,2}|note|z\s*fold|z\s*flip)/,
        },
        {
          id: 'phone_acc',
          name: 'Аксесуари до телефонів',
          ids: [80],
          re: /чохол|чехол|\bcase\b|бампер|зарядк|кабель|cable|адаптер|power.?bank|павербанк|magsafe|тримач|holder|захисн.*(скл|плів)|плівк.*екран|скло.*екран|накладк|flip.?cover|usb.?c.*(кабель|cable)|lightning/,
        },
        {
          id: 'phones_all',
          name: 'Телефони та аксесуари',
          ids: [],
          re: null,
          group: ['phones', 'phone_acc'],
        },
        { id: 'tablets', name: 'Планшети / ел. книги', ids: [511], re: /ipad|планшет|tablet|kindle|ebook/ },
        { id: 'laptops', name: 'Ноутбуки та ПК', ids: [3848, 3416], re: /macbook|ноутбук|laptop|thinkpad|asus|acer|lenovo|notebook|макбук|пк\b|системник/ },
        { id: 'gaming', name: 'Ігри та приставки', ids: [1760, 1758], re: /playstation|xbox|nintendo|ps5|ps4|ігров|steam deck|консол|switch/ },
        { id: 'audio', name: 'Аудіотехніка', ids: [], re: /airpods|навушник|headphone|buds|колонк|speaker|гарнітур|jbl/ },
        { id: 'tv', name: 'ТВ / Відео', ids: [], re: /\btv\b|телевізор|monitor|монітор|проектор/ },
        { id: 'photo', name: 'Фото / відео', ids: [], re: /камер|фотоапарат|gopro|обєктив|дрон/ },
        {
          id: 'home_tech',
          name: 'Техніка для дому',
          ids: [],
          re: /пилосос|пральн|стиральн|кондиціонер|кондиционер|тепловий\s*насос|теплонасос|спліт|холодильник|мороз|морозильн|посудомий|мікрохвил|кавоварк|фен\b|бойлер|водонагр|витяжк|духовк|плита\b|обогрівач|сушильн/,
        },
      ],
    },
    {
      id: 'realty',
      name: 'Нерухомість',
      icon: '🏠',
      types: ['real_estate', 'accommodation'],
      children: [
        { id: 'flat', name: 'Квартири', ids: [1], re: /квартир|апартамент/ },
        { id: 'house', name: 'Будинки', ids: [], re: /будинок|коттедж|таунхаус/ },
        { id: 'room', name: 'Кімнати', ids: [], re: /кімнат/ },
        { id: 'land', name: 'Земля', ids: [], re: /ділянка|земел|соток/ },
        { id: 'rent', name: 'Оренда житла', ids: [], re: /оренда.*(квартир|житл|кімнат)|зняти квартир/ },
      ],
    },
    {
      id: 'auto',
      name: 'Авто',
      icon: '🚗',
      types: ['automotive'],
      children: [
        { id: 'cars', name: 'Легкові авто', ids: [], re: /bmw|toyota|mercedes|volkswagen|hyundai|автомобіль|седан|кросовер/ },
        { id: 'moto', name: 'Мото', ids: [], re: /мото|скутер|байк/ },
        { id: 'parts', name: 'Запчастини', ids: [], re: /запчаст|диск|шина|акумулятор авто/ },
        { id: 'rent_auto', name: 'Оренда авто', ids: [], re: /оренда авто|прокат авто/ },
      ],
    },
    {
      id: 'house',
      name: 'Дім і сад',
      icon: '🪴',
      types: ['house_garden', 'goods'],
      children: [
        { id: 'furniture', name: 'Меблі', ids: [101, 102], re: /мебл|диван|стіл|шафа|ліжко/ },
        { id: 'garden', name: 'Сад / город', ids: [], re: /сад|газонок|теплиц|інструмент сад/ },
        { id: 'tools', name: 'Інструменти', ids: [], re: /дриль|шуруповерт|перфоратор|інструмент/ },
        { id: 'other_goods', name: 'Інші товари', ids: [112], re: /./ },
      ],
    },
    {
      id: 'fashion',
      name: 'Мода і стиль',
      icon: '👟',
      types: ['fashion'],
      children: [
        { id: 'clothes', name: 'Одяг', ids: [], re: /куртк|футболка|джинси|плаття|одяг/ },
        { id: 'shoes', name: 'Взуття', ids: [], re: /кросівк|черевик|туфл|взутт/ },
        { id: 'bags', name: 'Аксесуари', ids: [], re: /сумк|гаман|ремінь|окуляр/ },
      ],
    },
    {
      id: 'hobby',
      name: 'Хобі та спорт',
      icon: '⚽',
      types: ['goods'],
      children: [
        { id: 'bikes', name: 'Велосипеди', ids: [], re: /велосипед|bike|електровел/ },
        { id: 'sport', name: 'Спорт', ids: [], re: /гантел|тренажер|лиж|самокат/ },
        { id: 'music', name: 'Музика', ids: [], re: /гітар|синтезатор|піаніно|скрипка/ },
      ],
    },
    {
      id: 'kids',
      name: 'Дитячий світ',
      icon: '🧸',
      types: ['goods'],
      children: [
        { id: 'toys', name: 'Іграшки', ids: [], re: /іграшк|lego|конструктор/ },
        { id: 'kids_clothes', name: 'Дитячий одяг', ids: [], re: /дитяч.*(одяг|куртк)|комбінезон/ },
        { id: 'stroller', name: 'Коляски / автокрісла', ids: [], re: /коляск|автокрісл/ },
      ],
    },
    {
      id: 'animals',
      name: 'Тварини',
      icon: '🐾',
      types: ['animals'],
      children: [
        { id: 'dogs', name: 'Собаки', ids: [], re: /собак|цуцен/ },
        { id: 'cats', name: 'Коти', ids: [], re: /кіт\b|кот\b|кошен/ },
        { id: 'pet_goods', name: 'Зоотовари', ids: [], re: /корм|акваріум|клітк/ },
      ],
    },
    {
      id: 'job',
      name: 'Робота',
      icon: '💼',
      types: ['job'],
      children: [
        { id: 'vacancy', name: 'Вакансії', ids: [], re: /вакансі|шукаємо|робота/ },
        { id: 'resume', name: 'Резюме', ids: [], re: /резюме|шукаю роботу/ },
      ],
    },
    {
      id: 'services',
      name: 'Бізнес та послуги',
      icon: '🛠️',
      types: ['services', 'item_rentals'],
      children: [
        { id: 'repair', name: 'Ремонт / будівництво', ids: [], re: /ремонт|будівниц|сантехн|електрик/ },
        { id: 'beauty', name: 'Краса / здоровʼя', ids: [], re: /перукар|манікюр|масаж|косметолог/ },
        { id: 'rentals', name: 'Оренда товарів', ids: [], re: /оренда|прокат/ },
        { id: 'other_svc', name: 'Інші послуги', ids: [], re: /послуг|service/ },
      ],
    },
    {
      id: 'free',
      name: 'Віддам даром',
      icon: '🎁',
      types: ['for_free'],
      children: [{ id: 'giveaway', name: 'Безкоштовно', ids: [], re: /даром|безкоштовн|віддам/ }],
    },
  ]

  function findRoot(id) {
    return OLX_TREE.find((c) => c.id === id) || null
  }

  function findLeaf(rootId, leafId) {
    const root = findRoot(rootId)
    return root?.children?.find((c) => c.id === leafId) || null
  }

  function isHomeApplianceText(hay) {
    return /пральн|стиральн|пральна\s*машин|кондиціонер|кондиционер|тепловий\s*насос|теплонасос|спліт.?систем|климат|клімат|холодильник|мороз|морозильн|посудомий|мікрохвил|пилосос|кавоварк|витяжк|бойлер|водонагр|духовк|плита\b|обогрівач|сушильн\s*машин|праска\b|фен\b|варочн|мультиварк|хлібопіч|соковижимал|мʼясоруб|мясоруб/.test(
      hay,
    )
  }

  function isPhoneAccessoryText(hay) {
    if (isHomeApplianceText(hay)) return false
    return /чохол|чехол|\bcase\b|бампер|зарядк|кабель|cable|адаптер|power.?bank|павербанк|magsafe|тримач|holder|захисн.*(скл|плів)|плівк|накладк|flip.?cover|usb.?c.*(кабель|cable)|lightning\s*(кабель|cable)|док.?станц|stylus|стилус/.test(
      hay,
    )
  }

  function isPhoneDeviceText(hay) {
    if (isHomeApplianceText(hay)) return false
    // «samsung» без galaxy/моделі — це часто пралки/ТВ, не телефон
    return /iphone|айфон|смартфон|\bтелефон\b|galaxy|xiaomi|redmi|pixel|oneplus|\bpoco\b|honor|huawei|realme|tecno|infinix|motorola|nokia|neverlock|неверлок|samsung\s*(galaxy|[as]\d{1,2}|note|z\s*fold|z\s*flip)|galaxy\s*[asz]?\d/.test(
      hay,
    )
  }

  /** З запиту: телефон → лише телефони; аксесуар → аксесуари. */
  function inferPhoneCategory(q) {
    const raw = String(q || '').toLowerCase().trim()
    if (!raw) return null
    if (/аксесуар.*(телефон|iphone|айфон)|чохол|чехол|зарядк|кабель|power.?bank|павербанк|\bcase\b/.test(raw)) {
      return { root: 'electronics', leaf: 'phone_acc', label: 'Аксесуари до телефонів' }
    }
    if (/телефон.*(та|і|и)\s*аксесуар|аксесуар.*(та|і)\s*телефон/.test(raw)) {
      return { root: 'electronics', leaf: 'phones_all', label: 'Телефони та аксесуари' }
    }
    const pq = parseQuery(raw)
    if (
      pq.brands.includes('iphone') ||
      pq.brands.includes('samsung') ||
      pq.brands.includes('xiaomi') ||
      /телефон|смартфон|айфон|iphone|galaxy|redmi/.test(raw)
    ) {
      return { root: 'electronics', leaf: 'phones', label: 'Телефони' }
    }
    return null
  }

  function categoryMatchesFilter(itemLeaf, filterLeaf) {
    if (!filterLeaf) return true
    if (filterLeaf === itemLeaf) return true
    const leaf = findLeaf('electronics', filterLeaf) || OLX_TREE.flatMap((r) => r.children || []).find((c) => c.id === filterLeaf)
    if (leaf?.group?.includes(itemLeaf)) return true
    return false
  }

  function detectCategory(type, title, brand, olxId) {
    const hay = `${title || ''} ${brand || ''}`.toLowerCase()
    const idNum = Number(olxId)

    // побутова техніка завжди перша (samsung-пралка ≠ телефон, навіть якщо OLX id кривий)
    if (isHomeApplianceText(hay)) {
      return {
        root: 'electronics',
        leaf: 'home_tech',
        label: 'Електроніка · Техніка для дому',
        short: 'Техніка для дому',
      }
    }

    // аксесуари раніше за телефони (чохол iPhone ≠ телефон)
    if (isPhoneAccessoryText(hay)) {
      return {
        root: 'electronics',
        leaf: 'phone_acc',
        label: 'Електроніка · Аксесуари до телефонів',
        short: 'Аксесуари до телефонів',
      }
    }
    if (isPhoneDeviceText(hay)) {
      return {
        root: 'electronics',
        leaf: 'phones',
        label: 'Електроніка · Телефони',
        short: 'Телефони',
      }
    }

    for (const root of OLX_TREE) {
      for (const leaf of root.children || []) {
        if (leaf.group) continue
        // не довіряємо phone-id, якщо заголовок не про телефон
        if ((leaf.id === 'phones' || leaf.id === 'phone_acc') && leaf.ids?.includes(idNum)) {
          continue
        }
        if (leaf.ids?.includes(idNum)) {
          return {
            root: root.id,
            leaf: leaf.id,
            label: `${root.name} · ${leaf.name}`,
            short: leaf.name,
          }
        }
      }
    }

    for (const root of OLX_TREE) {
      for (const leaf of root.children || []) {
        if (leaf.group || !leaf.re) continue
        if (leaf.id === 'phones' || leaf.id === 'phone_acc') continue
        if (leaf.re.test(hay) && leaf.id !== 'other_goods') {
          return {
            root: root.id,
            leaf: leaf.id,
            label: `${root.name} · ${leaf.name}`,
            short: leaf.name,
          }
        }
      }
    }

    const byType = OLX_TREE.find((r) => r.types?.includes(type))
    if (byType) {
      const leaf =
        byType.id === 'electronics'
          ? byType.children?.find((c) => c.id === 'home_tech') || byType.children?.find((c) => !c.group && c.id !== 'phones')
          : byType.children?.[0]
      return {
        root: byType.id,
        leaf: leaf?.id || byType.id,
        label: leaf ? `${byType.name} · ${leaf.name}` : byType.name,
        short: leaf?.name || byType.name,
      }
    }

    const key = type || 'other'
    return {
      root: key,
      leaf: key,
      label: CAT_TYPE_LABEL[key] || key || 'Інше',
      short: CAT_TYPE_LABEL[key] || key || 'Інше',
    }
  }

  let catView = { root: null } // null = main grid
  let catDraft = { root: '', leaf: '' }

  function catLabelText(root, leaf) {
    if (!root && !leaf) return 'Усі категорії'
    const r = findRoot(root)
    if (!r) return 'Усі категорії'
    if (!leaf) return r.name
    const l = findLeaf(root, leaf)
    return l ? `${r.name} · ${l.name}` : r.name
  }

  function syncCatBtn() {
    const root = $('categoryRoot')?.value || ''
    const leaf = $('category')?.value || ''
    if ($('catPickLabel')) $('catPickLabel').textContent = catLabelText(root, leaf)
  }

  function openCatModal() {
    catDraft = {
      root: $('categoryRoot')?.value || '',
      leaf: $('category')?.value || '',
    }
    catView = { root: catDraft.root || null }
    $('catModal').classList.remove('hidden')
    renderCatModal()
  }

  function closeCatModal() {
    $('catModal').classList.add('hidden')
  }

  function renderCatModal() {
    const body = $('catBody')
    const back = $('catBack')
    const title = $('catSheetTitle')
    const crumbs = $('catCrumbs')
    if (!body) return

    if (!catView.root) {
      back.classList.add('hidden')
      title.textContent = 'Категорії'
      crumbs.textContent = 'Як на OLX · обери розділ'
      body.className = 'catBody catGrid'
      body.innerHTML = OLX_TREE.map(
        (r) => `
        <button type="button" class="catTile ${catDraft.root === r.id && !catDraft.leaf ? 'on' : ''}" data-cat-root="${r.id}">
          <span class="catIcon">${r.icon}</span>
          <span>${escapeHtml(r.name)}</span>
        </button>`,
      ).join('')
      return
    }

    const root = findRoot(catView.root)
    back.classList.remove('hidden')
    title.textContent = root?.name || 'Підкатегорії'
    crumbs.textContent = `Усі категорії › ${root?.name || ''}`
    body.className = 'catBody catList'
    const allBtn = `
      <button type="button" class="catRow ${catDraft.root === root.id && !catDraft.leaf ? 'on' : ''}" data-pick-root="${root.id}">
        <span>Уся категорія «${escapeHtml(root.name)}»</span>
        <span>›</span>
      </button>`
    const rows = (root.children || [])
      .map(
        (c) => `
      <button type="button" class="catRow ${catDraft.root === root.id && catDraft.leaf === c.id ? 'on' : ''}" data-pick-leaf="${c.id}" data-root="${root.id}">
        <span>${escapeHtml(c.name)}</span>
        <span>›</span>
      </button>`,
      )
      .join('')
    body.innerHTML = allBtn + rows
  }

  function applyCatDraft() {
    if ($('categoryRoot')) $('categoryRoot').value = catDraft.root || ''
    if ($('category')) $('category').value = catDraft.leaf || ''
    syncCatBtn()
    closeCatModal()
    if (state.raw.length) applyLocal()
  }

  function mapOffer(o, q = '') {
    const priceP = param(o, 'price')
    const price = Number(priceP?.value?.value)
    const was = Number(priceP?.value?.previous_value)
    const disc =
      Number.isFinite(price) && Number.isFinite(was) && was > price ? ((was - price) / was) * 100 : 0
    const stateP = param(o, 'state')
    const brand =
      param(o, 'mobile_phone_manufacturer')?.value?.label ||
      param(o, 'computers_brand_notebooks')?.value?.label ||
      param(o, 'brand')?.value?.label ||
      ''
    const city = o.location?.city?.name || ''
    const region = o.location?.region?.name || ''
    const created = Date.parse(o.created_time || o.last_refresh_time || '') || 0
    const ageH = created ? (Date.now() - created) / 36e5 : 999
    const photos = (o.photos || []).map((p) => photoUrl(p.link)).filter(Boolean)
    const promo = o.promotion || {}
    const sellerOnline = !!o.user?.is_online
    const desc = String(o.description || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .slice(0, 1200)
    const condition = stateP?.value?.label || ''
    const conditionKey = stateP?.value?.key || ''
    const textA = analyzeText(desc, condition, conditionKey)
    const rel = queryMatch(`${o.title || ''} ${brand}`, q, { titleOnly: true })
    const parts = scoreParts({
      disc,
      ageH,
      promo,
      photos: photos.length,
      sellerOnline,
      negotiable: !!priceP?.value?.negotiable,
      titleHit: rel.ok,
      descBonus: textA.descBonus,
      condBonus: textA.condBonus,
      priceBonus: 0,
    })
    const cat = detectCategory(o.category?.type, o.title, brand, o.category?.id)

    return {
      id: String(o.id),
      title: o.title || 'Оголошення',
      description: desc.slice(0, 800),
      url: o.url || '',
      price: Number.isFinite(price) ? price : null,
      was: Number.isFinite(was) && was > 0 ? was : null,
      discount: disc,
      image: photos[0] || null,
      images: photos,
      brand,
      category: cat.leaf,
      categoryRoot: cat.root,
      categoryLabel: cat.label,
      categoryShort: cat.short,
      categoryType: o.category?.type || '',
      categoryId: o.category?.id ?? null,
      condition,
      conditionKey,
      city,
      region,
      seller: o.user?.name || o.contact?.name || 'Продавець',
      sellerOnline,
      negotiable: !!priceP?.value?.negotiable,
      created,
      ageH,
      promo,
      score: parts.total,
      scoreParts: parts,
      titleHit: rel.ok,
      relevance: rel.score,
      hay: `${o.title || ''} ${brand} ${city} ${region} ${cat.label} ${desc}`.toLowerCase(),
    }
  }

  function readFilters() {
    return {
      q: $('q').value.trim(),
      city: $('city').value,
      min: $('min').value,
      max: $('max').value,
      minScore: Number($('minScore').value || 0),
      sort: $('sort').value,
      state: $('state').value,
      category: $('category')?.value || '',
      categoryRoot: $('categoryRoot')?.value || '',
    }
  }

  const CITY_ALIAS = {
    Київ: ['київ', 'киев', 'kyiv', 'kiev'],
    Львів: ['львів', 'львов', 'lviv'],
    Одеса: ['одеса', 'одесса', 'odesa', 'odessa'],
    Харків: ['харків', 'харьков', 'kharkiv'],
    Дніпро: ['дніпро', 'днепр', 'dnipro'],
  }

  function cityMatch(item, filterCity) {
    if (!filterCity) return true
    const hay = `${item.city || ''} ${item.region || ''}`.toLowerCase()
    const aliases = CITY_ALIAS[filterCity] || [filterCity.toLowerCase()]
    return aliases.some((a) => hay.includes(a))
  }

  function filterAndSort(list, f) {
    let out = list.slice()
    // жорсткий матч запиту по TITLE: «samsung A 56» ≠ Oppo / S22
    if (f.q) {
      out = out
        .map((x) => {
          const m = offerMatchesQuery(x, f.q)
          return { ...x, titleHit: m.ok, relevance: m.score }
        })
        .filter((x) => x.titleHit)
    }

    let catLeaf = f.category || ''
    let catRoot = f.categoryRoot || ''
    // якщо категорію не обрано вручну — з «телефон / iphone» лишаємо лише телефони
    if (!catLeaf && !catRoot && f.q) {
      const inferred = inferPhoneCategory(f.q)
      if (inferred) {
        catLeaf = inferred.leaf
        catRoot = inferred.root
      }
    }

    if (catLeaf) out = out.filter((x) => categoryMatchesFilter(x.category, catLeaf))
    else if (catRoot) out = out.filter((x) => x.categoryRoot === catRoot)

    // підстраховка: у телефонних категоріях ніколи не показуємо пралки/кондиціонери
    if (/^(phones|phone_acc|phones_all)$/.test(catLeaf)) {
      out = out.filter((x) => !isHomeApplianceText(`${x.title || ''} ${x.description || ''} ${x.brand || ''}`))
    }

    if (f.city) out = out.filter((x) => cityMatch(x, f.city))
    if (f.state === 'new') out = out.filter((x) => /new|нов/i.test(`${x.conditionKey} ${x.condition}`))
    if (f.state === 'used') out = out.filter((x) => /used|вжив|б\/у|bu\b/i.test(`${x.conditionKey} ${x.condition}`))
    const min = f.min !== '' ? Number(f.min) : null
    const max = f.max !== '' ? Number(f.max) : null
    if (min != null && Number.isFinite(min)) out = out.filter((x) => x.price != null && x.price >= min)
    if (max != null && Number.isFinite(max)) out = out.filter((x) => x.price != null && x.price <= max)
    const gate = Number.isFinite(f.minScore) ? f.minScore : 0
    out = out.filter((x) => x.score >= gate)

    if (f.sort === 'priceAsc') out.sort((a, b) => (a.price ?? 1e12) - (b.price ?? 1e12))
    else if (f.sort === 'priceDesc') out.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    else if (f.sort === 'fresh') out.sort((a, b) => b.created - a.created)
    else if (f.sort === 'discount') out.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0))
    else if (f.sort === 'category')
      out.sort((a, b) => {
        const c = String(a.categoryLabel || '').localeCompare(String(b.categoryLabel || ''), 'uk')
        if (c !== 0) return c
        return b.score - a.score
      })
    else
      out.sort((a, b) => {
        const ra = a.relevance ?? 0
        const rb = b.relevance ?? 0
        if (rb !== ra) return rb - ra
        return b.score - a.score
      })
    return out
  }

  /** Soften stacked filters so demos don't look "empty". */
  function softFilter(list, f) {
    let items = filterAndSort(list, f)
    const notes = []
    let cur = { ...f }
    const phoneLocked =
      /^(phones|phone_acc|phones_all)$/.test(cur.category || '') || !!inferPhoneCategory(cur.q || '')

    if (items.length < 10 && cur.minScore > 0) {
      cur = { ...cur, minScore: 0 }
      items = filterAndSort(list, cur)
      notes.push(`Min score знижено до 0 — інакше відсікало забагато лотів`)
    }
    // категорію телефонів не скидаємо — інакше знову мішанина
    if (items.length < 10 && (cur.category || cur.categoryRoot) && !phoneLocked) {
      cur = { ...cur, category: '', categoryRoot: '' }
      items = filterAndSort(list, cur)
      notes.push(`Категорію скинуто — у вибраній було замало лотів`)
    }
    if (items.length < 10 && cur.state) {
      cur = { ...cur, state: '' }
      items = filterAndSort(list, cur)
      notes.push(`Фільтр стану прибрано — по «новому» було замало`)
    }
    if (items.length < 10 && cur.city) {
      cur = { ...cur, city: '' }
      items = filterAndSort(list, cur)
      notes.push(`Місто розширено на всю Україну`)
    }
    return { items, notes }
  }

  function fillCategoryOptions(_list) {
    syncCatBtn()
  }

  function dedupeOffers(list) {
    const seen = new Set()
    const out = []
    for (const o of list) {
      const id = String(o?.id ?? '')
      if (!id || seen.has(id)) continue
      seen.add(id)
      out.push(o)
    }
    return out
  }

  function olxPublicUrl(q, limit = 50, offset = 0) {
    const u = new URL('https://www.olx.ua/api/v1/offers/')
    if (q) u.searchParams.set('query', q)
    u.searchParams.set('limit', String(limit))
    u.searchParams.set('offset', String(offset))
    return u.toString()
  }

  function extractOffers(payload) {
    if (!payload) return []
    if (typeof payload === 'string') {
      try {
        return extractOffers(JSON.parse(payload))
      } catch {
        const m = payload.match(/\{[\s\S]*"data"\s*:\s*\[[\s\S]*\}/)
        if (m) {
          try {
            return extractOffers(JSON.parse(m[0]))
          } catch {
            /* ignore */
          }
        }
        return []
      }
    }
    if (Array.isArray(payload.offers)) return payload.offers
    if (Array.isArray(payload.data)) return payload.data
    const content = payload?.data?.content
    if (typeof content === 'string') {
      try {
        const inner = JSON.parse(content)
        if (Array.isArray(inner.data)) return inner.data
        if (Array.isArray(inner.offers)) return inner.offers
      } catch {
        /* ignore */
      }
    }
    if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data
    return []
  }

  async function fetchJson(url, ms = 9000) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), ms)
    try {
      const r = await fetch(url, {
        signal: ctrl.signal,
        headers: { Accept: 'application/json' },
      })
      if (!r.ok) throw new Error('HTTP ' + r.status)
      const text = await r.text()
      try {
        return JSON.parse(text)
      } catch {
        return text
      }
    } finally {
      clearTimeout(t)
    }
  }

  async function fetchPagesVia(relayFetch, pages = 4) {
    const jobs = Array.from({ length: pages }, (_, i) =>
      relayFetch(i * 50)
        .then((batch) => (Array.isArray(batch) ? batch : []))
        .catch(() => []),
    )
    const batches = await Promise.all(jobs)
    const all = []
    let lastLen = 0
    for (const batch of batches) {
      if (!batch.length) continue
      all.push(...batch)
      lastLen = batch.length
    }
    return { offers: dedupeOffers(all), lastLen, pagesTried: pages }
  }

  async function fetchOnePage(via, query, offset) {
    if (via === 'dev-proxy') {
      const data = await fetchJson(
        `/api/olx-search?q=${encodeURIComponent(query)}&limit=50&offset=${offset}`,
        12000,
      )
      if (!data.ok) throw new Error(data.error || 'dev proxy')
      return data.offers || []
    }
    if (via === 'jina') {
      const target = olxPublicUrl(query, 50, offset)
      const data = await fetchJson('https://r.jina.ai/' + target, 14000)
      return extractOffers(data)
    }
    if (via === 'allorigins') {
      const target = olxPublicUrl(query, 50, offset)
      const data = await fetchJson(
        'https://api.allorigins.win/raw?url=' + encodeURIComponent(target),
        12000,
      )
      return extractOffers(typeof data === 'string' ? data : data)
    }
    return []
  }

  /** Public OLX site API (not Partner/developer.olx.ua) + CORS relays. */
  async function fetchLive(q) {
    const query = q || 'iphone'
    const relays = [
      {
        name: 'dev-proxy',
        run: async () => {
          const data = await fetchJson(
            `/api/olx-search?q=${encodeURIComponent(query)}&limit=200`,
            18000,
          )
          if (!data.ok) throw new Error(data.error || 'dev proxy')
          const offers = data.offers || []
          return { offers, lastLen: offers.length >= 50 ? 50 : offers.length }
        },
      },
      {
        name: 'jina',
        run: async () => fetchPagesVia(async (offset) => {
          const target = olxPublicUrl(query, 50, offset)
          const data = await fetchJson('https://r.jina.ai/' + target, 14000)
          return extractOffers(data)
        }, 4),
      },
      {
        name: 'allorigins',
        run: async () => fetchPagesVia(async (offset) => {
          const target = olxPublicUrl(query, 50, offset)
          const data = await fetchJson(
            'https://api.allorigins.win/raw?url=' + encodeURIComponent(target),
            12000,
          )
          return extractOffers(typeof data === 'string' ? data : data)
        }, 3),
      },
    ]

    const errors = []
    for (const relay of relays) {
      try {
        const result = await relay.run()
        const offers = result.offers || result
        if (offers?.length) {
          return {
            offers,
            source: 'live',
            via: 'live',
            relay: relay.name,
            hasMore: (result.lastLen ?? offers.length) >= 40,
            nextOffset: offers.length,
          }
        }
      } catch (e) {
        errors.push(e.message || String(e))
      }
    }
    throw new Error(errors.slice(0, 2).join(' · ') || 'live fetch failed')
  }

  async function fetchSnapshot(q) {
    const r = await fetch('./catalog.json')
    if (!r.ok) throw new Error('catalog missing')
    const data = await r.json()
    let offers = data.offers || data.data || []
    if (q && String(q).trim()) {
      const scored = offers
        .map((o) => {
          const m = queryMatch(`${o.title || ''}`, q, { titleOnly: true })
          return { o, m }
        })
        .filter((x) => x.m.ok)
        .sort((a, b) => b.m.score - a.m.score)
      offers = scored.map((x) => x.o)
    }
    return { offers, source: 'snapshot', via: 'cache', relay: 'local' }
  }

  async function loadOffers(q) {
    try {
      const live = await fetchLive(q)
      if (live.offers.length) return live
    } catch (e) {
      state.note = `Live OLX тимчасово недоступний (${e.message}). Показав snapshot.`
    }
    const snap = await fetchSnapshot(q)
    return { ...snap, hasMore: false, nextOffset: 0 }
  }

  function applyLocal() {
    const f = readFilters()
    state.tab = 'search'
    syncTabs()
    fillCategoryOptions(state.raw)
    // спочатку score з опису/ціни/стану, потім фільтри
    const enriched = enrichScores(state.raw)
    const soft = softFilter(enriched, f)
    let items = soft.items
    if (f.sort === 'score' || !f.sort) {
      items = items.slice().sort((a, b) => {
        const ra = a.relevance ?? 0
        const rb = b.relevance ?? 0
        if (rb !== ra) return rb - ra
        return b.score - a.score
      })
    }
    if (soft.notes.length && !state.note?.includes('Live OLX')) {
      state.note = soft.notes.join('. ')
    } else if (!state.note?.includes('Live OLX') && !soft.notes.length) {
      state.note = ''
    }
    state.items = items
    const avg = items.length ? Math.round(items.reduce((s, x) => s + x.score, 0) / items.length) : 0
    const prices = items.map((x) => x.price).filter((n) => n != null)
    const med = prices.length ? prices.slice().sort((a, b) => a - b)[Math.floor(prices.length / 2)] : null
    const hot = items.filter((x) => x.score >= 65).length
    const cats = new Map()
    for (const x of items) cats.set(x.categoryLabel, (cats.get(x.categoryLabel) || 0) + 1)
    const topCat = [...cats.entries()].sort((a, b) => b[1] - a[1])[0]
    const bars = [0, 0, 0, 0, 0]
    for (const x of items) {
      const bucket = Math.min(4, Math.floor(x.score / 20))
      bars[bucket] += 1
    }
    const maxBar = Math.max(1, ...bars)
    const best = items.slice().sort((a, b) => b.score - a.score).slice(0, 5)
    $('stats').innerHTML = `
      <b>Run result</b>
      <div>Джерело: <b>${state.source === 'live' ? 'OLX.ua live' : 'локальний кеш'}</b></div>
      <div>Знайдено: <b>${state.raw.length}</b></div>
      <div>Показано: <b>${items.length}</b></div>
      <div>Категорій: <b>${cats.size}</b>${topCat ? ` · топ: ${escapeHtml(topCat[0])}` : ''}</div>
      <div>Hot deals (≥65): <b>${hot}</b></div>
      <div>Avg score: <b>${avg || '—'}</b></div>
      <div>Median ₴: <b>${med != null ? money(med) : '—'}</b></div>
      <div class="scorePulse" aria-hidden="true">${bars
        .map((n, i) => `<i style="--h:${Math.round((n / maxBar) * 100)}%" title="${i * 20}–${i * 20 + 19}"></i>`)
        .join('')}</div>
      ${state.note ? `<div style="margin-top:8px;color:#b45309">${escapeHtml(state.note)}</div>` : ''}
    `
    renderBest(best, med)
    render()
  }

  function renderBest(best, med) {
    const box = $('bestPanel')
    if (!box) return
    if (!best?.length) {
      box.innerHTML = `<b>Кращі товари</b><p class="bestEmpty">Зроби пошук — тут з’являться топ-лоти з поясненням.</p>`
      return
    }
    box.innerHTML = `
      <b>Кращі товари</b>
      <p class="bestLead">Топ за score: ціна vs медіана${med != null ? ` (${money(med)})` : ''}, стан і текст опису.</p>
      <ol class="bestList">
        ${best
          .map((item, i) => {
            const whys = (item.why || []).slice(0, 3)
            return `<li class="bestItem" data-open="${escapeHtml(item.id)}">
              <div class="bestTop">
                <span class="bestRank">#${i + 1}</span>
                <span class="bestScore">SCORE ${item.score}</span>
              </div>
              <strong class="bestTitle">${escapeHtml(item.title)}</strong>
              <div class="bestMeta">${money(item.price)}${item.condition ? ` · ${escapeHtml(item.condition)}` : ''}</div>
              <ul class="bestWhy">${whys
                .map((w) => `<li class="${w.ok ? 'ok' : 'bad'}">${escapeHtml(w.text)}</li>`)
                .join('')}</ul>
            </li>`
          })
          .join('')}
      </ol>`
  }

  async function run() {
    const f = readFilters()
    // авто-категорія з запиту, якщо користувач нічого не обрав
    if (!f.category && !f.categoryRoot && f.q) {
      const inferred = inferPhoneCategory(f.q)
      if (inferred) {
        if ($('category')) $('category').value = inferred.leaf
        if ($('categoryRoot')) $('categoryRoot').value = inferred.root
        syncCatBtn()
      }
    }
    state.tab = 'search'
    syncTabs()
    state.loading = true
    state.error = ''
    state.note = ''
    state.items = []
    state.hasMore = false
    state.nextOffset = 0
    renderShell()
    $('livePill').textContent = '…'

    try {
      const f2 = readFilters()
      const { offers, source, via, relay, hasMore, nextOffset } = await loadOffers(f2.q)
      state.source = source
      state.via = via
      state.relay = relay || ''
      state.hasMore = !!hasMore && source === 'live'
      state.nextOffset = nextOffset || offers.length
      state.raw = offers.map((o) => mapOffer(o, f2.q))
      $('livePill').textContent = source === 'live' ? 'LIVE OLX' : 'CACHE'
      $('livePill').classList.toggle('snap', source !== 'live')
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

  async function loadMore() {
    if (!state.hasMore || state.loadingMore || state.source !== 'live') return
    const f = readFilters()
    state.loadingMore = true
    render()
    try {
      const batch = await fetchOnePage(state.relay || 'jina', f.q || 'iphone', state.nextOffset)
      const mapped = (batch || []).map((o) => mapOffer(o, f.q))
      const before = state.raw.length
      const merged = dedupeOffers([...state.raw, ...mapped])
      state.raw = merged
      state.nextOffset += 50
      state.hasMore = (batch?.length || 0) >= 40 && merged.length > before
      applyLocal()
    } catch (e) {
      state.hasMore = false
      state.note = `Не вдалось підвантажити ще: ${e.message || e}`
      applyLocal()
    } finally {
      state.loadingMore = false
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
      $('count').textContent = 'Тягну оголошення…'
    }
  }

  function visible() {
    return state.tab === 'fav' ? [...state.fav.values()] : state.items
  }

  function render() {
    const list = visible()
    $('countTitle').textContent = state.tab === 'fav' ? 'Збережені' : 'Оголошення OLX'
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
        (state.tab === 'fav' ? 'Немає збережених.' : 'Нічого не пройшло фільтр. Знизь Min score.')
      return
    }
    $('empty').classList.add('hidden')

    for (const item of list) {
      const el = document.createElement('article')
      el.className = 'card'
      const liked = state.fav.has(item.id)
      const img = item.image || placeholder(item.title)
      const loc = [item.city, item.region].filter(Boolean).join(' · ')
      el.innerHTML = `
        <div class="thumb">
          <img src="${img}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${placeholder(item.title)}'" />
          <span class="badge deal ${item.score >= 55 ? 'hot' : ''}">SCORE ${item.score}</span>
          ${item.promo?.top_ad ? '<span class="badge top">TOP</span>' : ''}
        </div>
        <div class="cardBody">
          <h3 class="title">${escapeHtml(item.title)}</h3>
          <div class="meta">${escapeHtml(item.categoryShort || item.categoryLabel || '')}${(item.categoryShort || item.categoryLabel) ? ' · ' : ''}${escapeHtml(loc || 'Україна')}${item.condition ? ` · ${escapeHtml(item.condition)}` : ''}${item.discount > 1 ? ` · −${Math.round(item.discount)}%` : ''}</div>
          ${item.whyShort ? `<p class="whyLine">${escapeHtml(item.whyShort)}</p>` : ''}
          <div class="price">${money(item.price)}${item.was ? ` <small class="was">${money(item.was)}</small>` : ''}</div>
          <div class="ship">${escapeHtml(item.seller)}${item.sellerOnline ? ' · online' : ''} · photos ${item.images.length}</div>
        </div>
        <div class="actions">
          <button type="button" class="open" data-open="${escapeHtml(item.id)}">Чому цей score</button>
          <button type="button" class="fav ${liked ? 'on' : ''}" data-fav="${escapeHtml(item.id)}">${liked ? '♥' : '♡'}</button>
        </div>
      `
      box.appendChild(el)
    }

    if (state.tab === 'search' && state.hasMore) {
      const more = document.createElement('div')
      more.className = 'moreWrap'
      more.innerHTML = `<button type="button" class="btnBlue" id="moreBtn" ${state.loadingMore ? 'disabled' : ''}>${
        state.loadingMore ? 'Завантажую…' : 'Ще оголошення з OLX'
      }</button>`
      box.appendChild(more)
      const btn = more.querySelector('#moreBtn')
      if (btn) btn.onclick = () => loadMore()
    }
  }

  function findItem(id) {
    return state.items.find((x) => x.id === id) || state.fav.get(id) || state.raw.find((x) => x.id === id)
  }

  function openItem(id) {
    const item = findItem(id)
    if (!item) return
    const p = item.scoreParts || {}
    const why = item.why || buildWhy(item, item.analysis?.median)
    $('modalBody').innerHTML = `
      <div class="detail">
        <div class="detailImg">
          <img src="${item.image || placeholder(item.title)}" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${placeholder(item.title)}'" />
        </div>
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <div class="price">SCORE ${item.score} · ${money(item.price)}</div>
          <p class="detailCond"><b>Стан:</b> ${escapeHtml(item.condition || 'не вказано')}${item.negotiable ? ' · торг' : ''}</p>
          <p>${escapeHtml(item.description || 'Опис відсутній')}</p>
          <div class="whyBox">
            <b>Чому цей товар у рейтингу</b>
            <ul>${why.map((w) => `<li class="${w.ok ? 'ok' : 'bad'}">${escapeHtml(w.text)}</li>`).join('')}</ul>
          </div>
          <p class="scoreBreak"><b>Розклад score</b><br/>
            Ціна vs ринок: ${Number(p.fromPrice || 0).toFixed(1)} ·
            Опис: ${Number(p.fromDesc || 0).toFixed(1)} ·
            Стан: ${Number(p.fromCond || 0).toFixed(1)}<br/>
            Знижка: ${Number(p.fromDiscount || 0).toFixed(1)} ·
            Свіжість: ${Number(p.fromFresh || 0).toFixed(1)} ·
            Фото: ${Number(p.fromPhotos || 0).toFixed(1)} ·
            Промо: ${Number(p.fromPromo || 0)} ·
            Online: ${Number(p.fromSeller || 0)}
          </p>
          <div class="detailActions">
            ${item.url ? `<a class="btnRed" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Відкрити на OLX</a>` : ''}
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
      $('q').value = 'iphone'
      $('city').value = ''
      $('min').value = ''
      $('max').value = ''
      $('minScore').value = '0'
      $('sort').value = 'score'
      $('state').value = ''
      if ($('category')) $('category').value = ''
      if ($('categoryRoot')) $('categoryRoot').value = ''
      syncCatBtn()
      run()
    }
    $('catPickBtn').onclick = openCatModal
    $('catClose').onclick = closeCatModal
    $('catClear').onclick = () => {
      catDraft = { root: '', leaf: '' }
      applyCatDraft()
    }
    $('catApply').onclick = applyCatDraft
    $('catBack').onclick = () => {
      catView = { root: null }
      renderCatModal()
    }
    $('catModal').onclick = (e) => {
      if (e.target.id === 'catModal') closeCatModal()
    }
    $('catBody').onclick = (e) => {
      const rootBtn = e.target.closest('[data-cat-root]')
      if (rootBtn) {
        catView = { root: rootBtn.dataset.catRoot }
        renderCatModal()
        return
      }
      const pickRoot = e.target.closest('[data-pick-root]')
      if (pickRoot) {
        catDraft = { root: pickRoot.dataset.pickRoot, leaf: '' }
        renderCatModal()
        return
      }
      const pickLeaf = e.target.closest('[data-pick-leaf]')
      if (pickLeaf) {
        catDraft = { root: pickLeaf.dataset.root, leaf: pickLeaf.dataset.pickLeaf }
        renderCatModal()
      }
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
      if (e.key === 'Escape') {
        closeCatModal()
        closeModal()
      }
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
  syncCatBtn()
  saveFav()
  run()
})()
