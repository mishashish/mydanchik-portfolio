;(function () {
  try {
    if (sessionStorage.getItem('myd_demo_note_hide') === '1') return
  } catch {
    /* ignore */
  }

  function copy(lang) {
    return lang === 'uk'
      ? 'Показує приблизний функціонал. Повноцінні продукти збираються під клієнта — це лише мала частина того, що можу продемонструвати.'
      : 'Shows sample functionality. Full products are built for each client — this is only a small slice of what I can demonstrate.'
  }

  function currentLang() {
    if (window.DemoLang) return window.DemoLang.get()
    return (document.documentElement.lang || '').toLowerCase().startsWith('uk') ? 'uk' : 'en'
  }

  const bar = document.createElement('aside')
  bar.className = 'demoNote'
  bar.setAttribute('role', 'note')
  const span = document.createElement('span')
  span.textContent = copy(currentLang())
  bar.innerHTML = '<b>Demo</b>'
  bar.appendChild(span)
  const close = document.createElement('button')
  close.type = 'button'
  close.setAttribute('aria-label', 'Close')
  close.textContent = '×'
  close.onclick = () => {
    bar.remove()
    try {
      sessionStorage.setItem('myd_demo_note_hide', '1')
    } catch {
      /* ignore */
    }
  }
  bar.appendChild(close)

  window.addEventListener('demo-lang', (e) => {
    span.textContent = copy(e.detail.lang)
  })

  const mount = () => {
    document.body.prepend(bar)
  }
  if (document.body) mount()
  else document.addEventListener('DOMContentLoaded', mount)
})()
