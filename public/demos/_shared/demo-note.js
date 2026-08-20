;(function () {
  try {
    if (sessionStorage.getItem('myd_demo_note_hide') === '1') return
  } catch {
    /* ignore */
  }

  const lang = (document.documentElement.lang || '').toLowerCase().startsWith('uk') ? 'uk' : 'en'
  const text =
    lang === 'uk'
      ? 'Показує приблизний функціонал. Повноцінні продукти збираються під клієнта — це лише мала частина того, що можу продемонструвати.'
      : 'Shows sample functionality. Full products are built for each client — this is only a small slice of what I can demonstrate.'

  const bar = document.createElement('aside')
  bar.className = 'demoNote'
  bar.setAttribute('role', 'note')
  bar.innerHTML = `<b>Demo</b><span>${text}</span><button type="button" aria-label="Close">×</button>`
  bar.querySelector('button').onclick = () => {
    bar.remove()
    try {
      sessionStorage.setItem('myd_demo_note_hide', '1')
    } catch {
      /* ignore */
    }
  }

  const mount = () => {
    document.body.prepend(bar)
  }
  if (document.body) mount()
  else document.addEventListener('DOMContentLoaded', mount)
})()
