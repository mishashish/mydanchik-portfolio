;(function () {
  const KEY = 'myd_lang'

  function loadLang() {
    try {
      const saved = localStorage.getItem(KEY)
      if (saved === 'uk' || saved === 'en') return saved
    } catch {
      /* ignore */
    }
    return (document.documentElement.lang || 'uk').toLowerCase().startsWith('en') ? 'en' : 'uk'
  }

  function saveLang(lang) {
    try {
      localStorage.setItem(KEY, lang)
    } catch {
      /* ignore */
    }
  }

  function applyStatic(lang) {
    document.documentElement.lang = lang
    document.querySelectorAll('[data-i18n-uk]').forEach((el) => {
      const uk = el.getAttribute('data-i18n-uk')
      const en = el.getAttribute('data-i18n-en')
      const val = lang === 'en' ? en : uk
      if (val == null) return
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.hasAttribute('placeholder')) el.setAttribute('placeholder', val)
        else el.value = val
      } else if (el.hasAttribute('data-i18n-html')) {
        el.innerHTML = val
      } else {
        el.textContent = val
      }
    })
    document.querySelectorAll('[data-i18n-ph-uk]').forEach((el) => {
      const uk = el.getAttribute('data-i18n-ph-uk')
      const en = el.getAttribute('data-i18n-ph-en')
      el.setAttribute('placeholder', lang === 'en' ? en || uk : uk)
    })
  }

  window.DemoLang = {
    KEY,
    get: loadLang,
    set(lang) {
      if (lang !== 'uk' && lang !== 'en') return
      saveLang(lang)
      applyStatic(lang)
      window.dispatchEvent(new CustomEvent('demo-lang', { detail: { lang } }))
    },
    mount(host, variant) {
      if (!host) return loadLang()
      const lang = loadLang()
      const box = document.createElement('div')
      box.className = 'demoLang' + (variant ? ` demoLang--${variant}` : '')
      box.setAttribute('role', 'group')
      box.setAttribute('aria-label', 'Language')
      box.innerHTML =
        '<button type="button" data-lang="uk">UA</button><button type="button" data-lang="en">EN</button>'
      const sync = (l) => {
        box.querySelectorAll('button').forEach((b) => {
          b.classList.toggle('on', b.getAttribute('data-lang') === l)
        })
      }
      box.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-lang]')
        if (!btn) return
        window.DemoLang.set(btn.getAttribute('data-lang'))
      })
      window.addEventListener('demo-lang', (e) => sync(e.detail.lang))
      host.prepend(box)
      sync(lang)
      applyStatic(lang)
      return lang
    },
  }
})()
