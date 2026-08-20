(() => {
  'use strict'

  const I18N = {
    en: {
      sub: 'Cut video into parts · transcript · burn-in subtitles',
      setup: 'Pipeline',
      urlLabel: 'Video link',
      topicLabel: 'Theme (optional)',
      topicPh: 'Series name / hook theme',
      modeLabel: 'Cut mode',
      lenLabel: 'Clip length',
      capLabel: 'Subtitle language',
      run: 'Cut & transcribe',
      exportSrt: 'Export SRT',
      copy: 'Copy pack',
      copied: 'Copied',
      ready: 'Ready — paste a link or try a sample',
      noVideo: 'No video yet',
      clipsTitle: 'Cut parts',
      trTitle: 'Transcript',
      noteTitle: 'Output',
      noteBody: 'Clips + dialogue subtitles ready to drop on series hooks / Shorts.',
      stepDl: 'Download source',
      stepSpeech: 'Detect speech',
      stepTr: 'Build transcript',
      stepCut: 'Cut highlight parts',
      stepSub: 'Sync subtitles',
      done: (c, s) => `Done · ${c} clips · score ${s}`,
      errLink: 'Please paste a video link',
      err: (m) => `Couldn’t process · ${m}`,
      srcCaps: 'Live captions',
      srcDemo: 'Demo transcript',
      srcSynth: 'Speech model (offline demo)',
      kinds: { hook: 'HOOK', beat: 'BEAT', proof: 'PROOF', cta: 'CTA', scene: 'SCENE' },
    },
    uk: {
      sub: 'Нарізка на частини · транскрипт · субтитри на відео',
      setup: 'Пайплайн',
      urlLabel: 'Посилання на відео',
      topicLabel: 'Тема (опційно)',
      topicPh: 'Назва серіалу / тема закиду',
      modeLabel: 'Режим нарізки',
      lenLabel: 'Довжина кліпу',
      capLabel: 'Мова субтитрів',
      run: 'Нарізати і транскрибувати',
      exportSrt: 'Експорт SRT',
      copy: 'Копіювати',
      copied: 'Скопійовано',
      ready: 'Готово — встав лінк або спробуй sample',
      noVideo: 'Відео ще немає',
      clipsTitle: 'Нарізані частини',
      trTitle: 'Транскрипт',
      noteTitle: 'Вихід',
      noteBody: 'Кліпи + діалогові субтитри для закидів серіалів / Shorts.',
      stepDl: 'Завантаження сорсу',
      stepSpeech: 'Детект мови',
      stepTr: 'Збірка транскрипту',
      stepCut: 'Нарізка хайлайтів',
      stepSub: 'Синк субтитрів',
      done: (c, s) => `Готово · ${c} кліпів · score ${s}`,
      errLink: 'Встав посилання на відео',
      err: (m) => `Не вийшло · ${m}`,
      srcCaps: 'Живі субтитри',
      srcDemo: 'Демо-транскрипт',
      srcSynth: 'Модель мови (офлайн-демо)',
      kinds: { hook: 'ХУК', beat: 'БІТ', proof: 'ПРУФ', cta: 'CTA', scene: 'СЦЕНА' },
    },
  }

  /** Always-on demo transcripts (portfolio must work offline-ish). */
  const DEMO_CUES = {
    jNQXAC9IVRw: [
      { start: 0.0, end: 2.4, text: 'Alright, so here we are — in front of the elephants.' },
      { start: 2.5, end: 5.2, text: 'The cool thing about these guys is that they have really, really long trunks.' },
      { start: 5.3, end: 7.8, text: 'And that’s cool.' },
      { start: 7.9, end: 11.2, text: 'And that’s pretty much all there is to say.' },
    ],
    'aqz-KE-bpKQ': [
      { start: 0.0, end: 2.2, text: 'Hold up — rewind that frame.' },
      { start: 2.3, end: 5.0, text: 'You’re telling me this was the plan the whole time?' },
      { start: 5.1, end: 8.4, text: 'Watch the beat drop. That’s the cut we steal.' },
      { start: 8.5, end: 12.0, text: 'Save this for the next hook.' },
      { start: 12.1, end: 16.5, text: 'Part two is the payoff — don’t scroll.' },
      { start: 16.6, end: 22.0, text: 'Okay. That reaction? That’s the clip.' },
      { start: 22.1, end: 28.0, text: 'Drop it as a series tease. Caption stays burned in.' },
    ],
  }

  const $ = (id) => document.getElementById(id)
  let lang = localStorage.getItem('shorts_lab_lang') === 'uk' ? 'uk' : 'en'
  let pack = null
  let video = null
  let playTimer = null
  let activeClip = 0
  let playhead = 0

  const t = () => I18N[lang]

  function applyLang() {
    document.documentElement.lang = lang
    document.querySelectorAll('[data-i]').forEach((el) => {
      const key = el.getAttribute('data-i')
      const val = t()[key]
      if (typeof val === 'string') el.textContent = val
    })
    $('topic').placeholder = t().topicPh
    document.querySelectorAll('[data-lang]').forEach((b) => {
      b.classList.toggle('on', b.getAttribute('data-lang') === lang)
    })
    if (!video) $('vidMeta').textContent = t().noVideo
    if (!pack) $('status').textContent = t().ready
    else {
      renderClips()
      renderTranscript()
      $('outNote').textContent = `${t().noteBody} · ${sourceLabel(pack.source)}`
    }
  }

  function setStatus(msg) {
    $('status').textContent = msg
  }

  function setPipe(active) {
    const order = ['dl', 'speech', 'tr', 'cut', 'sub']
    const idx = order.indexOf(active)
    document.querySelectorAll('#pipe li').forEach((li) => {
      const step = li.getAttribute('data-step')
      const i = order.indexOf(step)
      li.classList.toggle('on', step === active)
      li.classList.toggle('done', idx >= 0 && i < idx)
    })
  }

  function clearPipe() {
    document.querySelectorAll('#pipe li').forEach((li) => li.classList.remove('on', 'done'))
  }

  function parseYouTubeId(url) {
    if (!url) return null
    try {
      const u = new URL(url.trim())
      const host = u.hostname.replace(/^www\./, '')
      if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null
      if (host.includes('youtube.com')) {
        if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || null
        if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null
        return u.searchParams.get('v')
      }
    } catch {
      const m = String(url).match(/(?:youtu\.be\/|shorts\/|v=)([\w-]{6,})/)
      return m ? m[1] : null
    }
    return null
  }

  function fmtTime(s) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  function srtStamp(s) {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    const ms = Math.floor((s % 1) * 1000)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms).padStart(3, '0')}`
  }

  function cuesToSrt(cues, offset = 0) {
    return cues
      .map((c, i) => {
        const a = Math.max(0, c.start - offset)
        const b = Math.max(a + 0.2, c.end - offset)
        return `${i + 1}\n${srtStamp(a)} --> ${srtStamp(b)}\n${c.text}\n`
      })
      .join('\n')
  }

  function sourceLabel(src) {
    if (src === 'captions') return t().srcCaps
    if (src === 'demo') return t().srcDemo
    return t().srcSynth
  }

  function wait(ms) {
    return new Promise((r) => setTimeout(r, ms))
  }

  function parseVttOrSrt(raw) {
    const lines = raw.replace(/\r/g, '').split('\n')
    const cues = []
    const timeRe = /(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{3}\s*-->\s*(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{3}/
    const toSec = (tok) => {
      const clean = tok.replace(',', '.')
      const p = clean.split(':').map(Number)
      if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2]
      return p[0] * 60 + p[1]
    }
    for (let i = 0; i < lines.length; i++) {
      if (!timeRe.test(lines[i])) continue
      const [left, right] = lines[i].split('-->').map((x) => x.trim().split(' ')[0])
      const text = []
      i++
      while (i < lines.length && lines[i].trim()) {
        text.push(lines[i].trim().replace(/<[^>]+>/g, ''))
        i++
      }
      if (text.length) {
        cues.push({ start: toSec(left), end: toSec(right), text: text.join(' ') })
      }
    }
    return cues
  }

  function parseJson3(data) {
    const events = data?.events || []
    const cues = []
    for (const ev of events) {
      if (!ev.segs || ev.tStartMs == null) continue
      const text = ev.segs
        .map((s) => s.utf8 || '')
        .join('')
        .replace(/\n/g, ' ')
        .trim()
      if (!text || text === '\n') continue
      const start = ev.tStartMs / 1000
      const end = start + (ev.dDurationMs || 1800) / 1000
      cues.push({ start, end, text })
    }
    return cues
  }

  async function fetchViaProxy(url) {
    const proxies = [
      (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    ]
    for (const make of proxies) {
      try {
        const r = await fetch(make(url), { signal: AbortSignal.timeout(4500) })
        if (!r.ok) continue
        const text = await r.text()
        if (text && text.length > 20 && !/error|blocked|denied/i.test(text.slice(0, 80))) {
          return text
        }
      } catch {
        /* try next */
      }
    }
    return null
  }

  async function fetchLiveCaptions(videoId, pref) {
    const langs =
      pref === 'auto'
        ? lang === 'uk'
          ? ['uk', 'ru', 'en', 'a.uk', 'a.ru', 'a.en']
          : ['en', 'uk', 'ru', 'a.en', 'a.uk']
        : [pref, `a.${pref}`, 'en']

    for (const L of langs) {
      const bases = [
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${L}&fmt=json3`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${L}&fmt=vtt`,
        `https://video.google.com/timedtext?v=${videoId}&lang=${L}&fmt=vtt`,
      ]
      for (const url of bases) {
        const raw = await fetchViaProxy(url)
        if (!raw) continue
        try {
          if (raw.trim().startsWith('{')) {
            const cues = parseJson3(JSON.parse(raw))
            if (cues.length) return cues
          } else {
            const cues = parseVttOrSrt(raw)
            if (cues.length) return cues
          }
        } catch {
          /* next */
        }
      }
    }
    return null
  }

  function synthDialogue(topic, mode, len, uiLang) {
    const theme = (topic || (uiLang === 'uk' ? 'серіал' : 'the series')).trim()
    const short = theme.length > 36 ? theme.slice(0, 34) + '…' : theme
    const en = uiLang !== 'uk'
    const lines =
      mode === 'series'
        ? en
          ? [
              `Wait — that look. Rewind “${short}”.`,
              `You’re saying this was the plan?`,
              `Don’t blink. This is the scene they cut.`,
              `Caption this. Drop it as a tease.`,
              `Part two hits harder — stay.`,
              `That line? That’s the hook for the feed.`,
              `Burn the dialogue in. Keep the silence.`,
              `Save for the next episode drop.`,
            ]
          : [
              `Стій — той погляд. Перемотай «${short}».`,
              `Ти кажеш, це був план?`,
              `Не кліпай. Це сцена, яку ріжуть.`,
              `Підпиши діалог. Кидай як закид.`,
              `Друга частина жорсткіша — лишайся.`,
              `Ця репліка — хук для стрічки.`,
              `Випали субтитри. Залиш паузу.`,
              `Збережи під наступний дроп серії.`,
            ]
        : en
          ? [
              `Stop scrolling — “${short}” in 3 seconds.`,
              `Mistake #1 most creators make.`,
              `Here’s the fix on screen.`,
              `Proof: watch the result.`,
              `One move. One wow frame.`,
              `Save this before you forget.`,
            ]
          : [
              `Стоп скрол — «${short}» за 3 секунди.`,
              `Помилка №1, яку роблять усі.`,
              `Ось фікс прямо на екрані.`,
              `Пруф: дивись результат.`,
              `Один прийом. Один вау-кадр.`,
              `Збережи, поки не забув.`,
            ]

    const step = Math.max(1.8, len / Math.max(4, lines.length))
    return lines.map((text, i) => ({
      start: +(i * step).toFixed(2),
      end: +((i + 1) * step - 0.12).toFixed(2),
      text,
    }))
  }

  function cutClips(cues, targetLen, mode) {
    if (!cues.length) return []
    const total = cues[cues.length - 1].end
    const kinds =
      mode === 'series' ? ['hook', 'scene', 'beat', 'proof', 'cta'] : ['hook', 'beat', 'proof', 'cta']
    const clips = []
    let i = 0
    let clipIdx = 0
    while (i < cues.length && clips.length < 6) {
      const start = cues[i].start
      let end = start
      const lines = []
      while (i < cues.length && end - start < targetLen * 0.92) {
        lines.push(cues[i])
        end = cues[i].end
        i++
        if (end - start >= targetLen * 0.55 && i < cues.length) {
          const gap = cues[i].start - end
          if (gap > 0.9) break
        }
      }
      if (!lines.length) break
      const kind = kinds[Math.min(clipIdx, kinds.length - 1)]
      clips.push({
        id: clipIdx,
        kind,
        label: `${fmtTime(start)} · ${kind.toUpperCase()}`,
        start: +start.toFixed(2),
        end: +Math.min(total, Math.max(end, start + 2)).toFixed(2),
        text: lines.map((l) => l.text).join(' '),
        lines,
      })
      clipIdx++
      if (i >= cues.length) break
      // slight overlap skip for pacing
      if (cues[i] && cues[i].start - end < 0.4) {
        /* continue from next natural line */
      }
    }
    if (!clips.length && cues.length) {
      clips.push({
        id: 0,
        kind: 'hook',
        label: `0:00 · HOOK`,
        start: cues[0].start,
        end: Math.min(cues[cues.length - 1].end, targetLen),
        text: cues.map((c) => c.text).join(' '),
        lines: cues,
      })
    }
    return clips
  }

  function scorePack(cues, clips, source) {
    let s = 62
    s += Math.min(18, cues.length * 2)
    s += Math.min(12, clips.length * 3)
    if (source === 'captions') s += 10
    if (source === 'demo') s += 6
    return Math.min(97, s)
  }

  async function fetchMeta(url) {
    const yt = parseYouTubeId(url)
    try {
      const r = await fetch('https://noembed.com/embed?url=' + encodeURIComponent(url))
      if (!r.ok) throw new Error('HTTP ' + r.status)
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      return {
        title: data.title || 'Untitled',
        author: data.author_name || 'creator',
        thumbnail: data.thumbnail_url || (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : null),
        provider: data.provider_name || 'Video',
        youtubeId: yt,
        url,
      }
    } catch (e) {
      if (yt) {
        return {
          title: $('topic').value.trim() || 'YouTube video',
          author: 'creator',
          thumbnail: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
          provider: 'YouTube',
          youtubeId: yt,
          url,
        }
      }
      throw e
    }
  }

  function setVideoSource(info, start = 0, end = null) {
    video = info
    const layer = $('vidLayer')
    const frame = $('ytFrame')
    const thumb = $('thumbImg')
    const bg = $('bgFx')

    if (!info) {
      layer.classList.add('hidden')
      bg.classList.remove('hidden')
      $('aiBadge').classList.add('hidden')
      frame.removeAttribute('src')
      thumb.classList.add('hidden')
      $('vidMeta').textContent = t().noVideo
      return
    }

    layer.classList.remove('hidden')
    bg.classList.add('hidden')
    $('aiBadge').classList.remove('hidden')
    $('handle').textContent = '@' + (info.author || 'creator').replace(/\s+/g, '').slice(0, 18)
    $('vidMeta').textContent = `${info.provider || 'Video'} · ${info.title}`

    if (info.youtubeId) {
      thumb.classList.add('hidden')
      frame.classList.remove('hidden')
      const id = info.youtubeId
      let src =
        `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1` +
        `&playsinline=1&iv_load_policy=3&start=${Math.floor(start)}`
      if (end && end > start) src += `&end=${Math.ceil(end)}`
      frame.src = src
    } else if (info.thumbnail) {
      frame.classList.add('hidden')
      frame.removeAttribute('src')
      thumb.classList.remove('hidden')
      thumb.src = info.thumbnail
    }
  }

  function cueAt(cues, time) {
    for (let i = cues.length - 1; i >= 0; i--) {
      if (time >= cues[i].start && time <= cues[i].end + 0.15) return cues[i]
    }
    for (let i = cues.length - 1; i >= 0; i--) {
      if (time >= cues[i].start) return cues[i]
    }
    return cues[0] || null
  }

  function setSubs(text) {
    const el = $('subs')
    el.textContent = text || ''
    el.classList.remove('pop')
    void el.offsetWidth
    if (text) el.classList.add('pop')
  }

  function renderClips() {
    const kinds = t().kinds
    $('clips').innerHTML = pack.clips
      .map(
        (c, i) => `
      <button type="button" class="clip ${i === activeClip ? 'active' : ''}" data-c="${i}">
        <span class="clipMeta"><b>${kinds[c.kind] || c.kind}</b> ${fmtTime(c.start)}–${fmtTime(c.end)}</span>
        ${c.text.slice(0, 110)}${c.text.length > 110 ? '…' : ''}
      </button>`,
      )
      .join('')
    $('clipCount').textContent = String(pack.clips.length)
    $('timeline').innerHTML = pack.clips
      .map(
        (c, i) =>
          `<button type="button" class="beat ${i === activeClip ? 'on' : ''}" data-c="${i}">${fmtTime(c.start)} ${c.kind.toUpperCase()}</button>`,
      )
      .join('')
  }

  function renderTranscript() {
    $('transcript').innerHTML = pack.cues
      .map(
        (c, i) =>
          `<button type="button" class="cue" data-cue="${i}"><b>${fmtTime(c.start)}</b><span>${c.text}</span></button>`,
      )
      .join('')
    $('cueCount').textContent = String(pack.cues.length)
  }

  function playClip(index) {
    if (!pack || !pack.clips[index]) return
    activeClip = index
    const clip = pack.clips[index]
    renderClips()
    $('descLine').textContent = clip.text.slice(0, 80) + (clip.text.length > 80 ? '…' : '')
    $('likes').textContent = (8 + pack.score / 10).toFixed(1) + 'K'
    if (pack.meta) setVideoSource(pack.meta, clip.start, clip.end)

    if (playTimer) clearInterval(playTimer)
    const duration = Math.max(1.5, clip.end - clip.start)
    const t0 = performance.now()
    playhead = clip.start
    const first = cueAt(clip.lines.length ? clip.lines : pack.cues, playhead)
    setSubs(first?.text || clip.text)

    playTimer = setInterval(() => {
      const elapsed = (performance.now() - t0) / 1000
      const p = Math.min(1, elapsed / duration)
      playhead = clip.start + elapsed
      $('prog').style.width = `${p * 100}%`
      const cue = cueAt(clip.lines.length ? clip.lines : pack.cues, playhead)
      if (cue && $('subs').textContent !== cue.text) setSubs(cue.text)
      if (p >= 1) {
        clearInterval(playTimer)
        playTimer = null
      }
    }, 50)
  }

  function applyPack(next) {
    pack = next
    activeClip = 0
    $('scorePill').textContent = String(pack.score)
    $('outNote').textContent = `${t().noteBody} · ${sourceLabel(pack.source)}`
    if (pack.meta) setVideoSource(pack.meta, pack.clips[0]?.start || 0, pack.clips[0]?.end)
    renderClips()
    renderTranscript()
    playClip(0)
  }

  async function runPipeline() {
    const url = $('url').value.trim()
    if (!url) {
      setStatus(t().errLink)
      $('url').focus()
      return
    }

    $('runBtn').disabled = true
    $('scan').classList.add('on')
    $('subs').textContent = '…'
    $('scorePill').textContent = '…'

    try {
      setPipe('dl')
      setStatus(t().stepDl + '…')
      const meta = await fetchMeta(url)
      const manual = $('topic').value.trim()
      const topic = manual || meta.title.replace(/\([^)]*\)/g, '').trim()
      $('topic').value = topic
      await wait(280)

      setPipe('speech')
      setStatus(t().stepSpeech + '…')
      await wait(320)

      setPipe('tr')
      setStatus(t().stepTr + '…')
      const yt = meta.youtubeId
      const pref = $('capLang').value
      let cues = null
      let source = 'synth'

      if (yt && DEMO_CUES[yt]) {
        cues = DEMO_CUES[yt].map((c) => ({ ...c }))
        source = 'demo'
      }

      if (yt) {
        const live = await fetchLiveCaptions(yt, pref)
        if (live?.length) {
          cues = live
          source = 'captions'
        }
      }

      if (!cues?.length) {
        cues = synthDialogue(topic, $('mode').value, Number($('len').value), lang)
        source = source === 'demo' ? 'demo' : 'synth'
      }

      await wait(240)
      setPipe('cut')
      setStatus(t().stepCut + '…')
      const clips = cutClips(cues, Number($('len').value), $('mode').value)
      await wait(220)

      setPipe('sub')
      setStatus(t().stepSub + '…')
      await wait(180)

      const score = scorePack(cues, clips, source)
      applyPack({
        meta,
        topic,
        mode: $('mode').value,
        len: Number($('len').value),
        cues,
        clips,
        source,
        score,
        srt: cuesToSrt(cues),
      })
      document.querySelectorAll('#pipe li').forEach((li) => {
        li.classList.remove('on')
        li.classList.add('done')
      })
      setStatus(t().done(clips.length, score))
    } catch (e) {
      clearPipe()
      setStatus(t().err(e.message || e))
      setSubs('')
      setVideoSource(null)
    } finally {
      $('scan').classList.remove('on')
      $('runBtn').disabled = false
    }
  }

  async function exportSrt() {
    if (!pack) return
    const clip = pack.clips[activeClip]
    const body = clip ? cuesToSrt(clip.lines.length ? clip.lines : pack.cues, clip.start) : pack.srt
    try {
      await navigator.clipboard.writeText(body)
      $('srtBtn').textContent = t().copied
      setTimeout(() => {
        $('srtBtn').textContent = t().exportSrt
      }, 1100)
    } catch {
      /* ignore */
    }
  }

  async function copyPack() {
    if (!pack) return
    const kinds = t().kinds
    const text = [
      'Shorts Lab — Cut / Transcript / Subs',
      pack.meta ? `Video: ${pack.meta.url || pack.meta.title}` : '',
      `Theme: ${pack.topic}`,
      `Source: ${sourceLabel(pack.source)} · score ${pack.score}`,
      '',
      'CLIPS:',
      ...pack.clips.map(
        (c, i) =>
          `${i + 1}. [${kinds[c.kind] || c.kind}] ${fmtTime(c.start)}–${fmtTime(c.end)}\n${c.text}`,
      ),
      '',
      'TRANSCRIPT:',
      ...pack.cues.map((c) => `[${fmtTime(c.start)}] ${c.text}`),
      '',
      '--- SRT ---',
      pack.srt,
    ]
      .filter(Boolean)
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      $('copyBtn').textContent = t().copied
      setTimeout(() => {
        $('copyBtn').textContent = t().copy
      }, 1100)
    } catch {
      /* ignore */
    }
  }

  $('runBtn').onclick = runPipeline
  $('srtBtn').onclick = exportSrt
  $('copyBtn').onclick = copyPack

  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.onclick = () => {
      lang = btn.getAttribute('data-lang') === 'uk' ? 'uk' : 'en'
      localStorage.setItem('shorts_lab_lang', lang)
      applyLang()
    }
  })

  document.addEventListener('click', (e) => {
    const demo = e.target.closest('[data-demo]')
    if (demo) {
      $('url').value = demo.getAttribute('data-demo')
      runPipeline()
      return
    }
    const c = e.target.closest('[data-c]')
    if (c && pack) playClip(Number(c.dataset.c))
    const cue = e.target.closest('[data-cue]')
    if (cue && pack) {
      const line = pack.cues[Number(cue.dataset.cue)]
      if (!line) return
      setSubs(line.text)
      if (pack.meta) setVideoSource(pack.meta, line.start, line.end + 2)
      document.querySelectorAll('.cue').forEach((el) => el.classList.remove('on'))
      cue.classList.add('on')
    }
  })

  $('url').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      runPipeline()
    }
  })

  applyLang()
  $('url').value = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
  runPipeline()
})()
