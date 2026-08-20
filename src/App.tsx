import { useEffect, useState, type MouseEvent } from 'react'
import './App.css'
import {
  getDict,
  LANGS,
  PROJECT_META,
  STACK_GROUPS,
  type Lang,
} from './i18n'

const NAV_IDS = ['home', 'about', 'stack', 'services', 'projects', 'contact'] as const

function useClock(lang: Lang) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return now.toLocaleTimeString(lang === 'uk' ? 'uk-UA' : 'en-GB', { hour12: false })
}

function loadLang(): Lang {
  const saved = localStorage.getItem('myd_lang')
  if (saved === 'uk' || saved === 'en') return saved
  return navigator.language.toLowerCase().startsWith('uk') ? 'uk' : 'en'
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [lang, setLang] = useState<Lang>(loadLang)
  const [logoHits, setLogoHits] = useState(0)
  const clock = useClock(lang)
  const t = getDict(lang)
  const voidUrl = `/demos/roguelike/index.html?lang=${lang}`

  useEffect(() => {
    localStorage.setItem('myd_lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    if (logoHits === 0) return
    const id = window.setTimeout(() => setLogoHits(0), 2200)
    return () => window.clearTimeout(id)
  }, [logoHits])

  function onLogoClick(_e: MouseEvent) {
    // 7 кліків по лого за ~2с → VOID BREACH
    setLogoHits((n) => {
      const next = n + 1
      if (next >= 7) {
        window.open(voidUrl, '_blank', 'noopener,noreferrer')
        return 0
      }
      return next
    })
  }

  return (
    <div className="site">
      <header className="topbar">
        <a
          className="logo"
          href="#home"
          onClick={(e) => {
            onLogoClick(e)
          }}
        >
          <img className="logoMark" src="/logo.svg" alt="" width={40} height={40} />
          <span className="logoText">
            MYDANCHIK
            <small>{t.logoSub}</small>
          </span>
        </a>

        <nav className={`nav ${menuOpen ? 'is-open' : ''}`}>
          {NAV_IDS.map((id) => (
            <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>
              {t.nav[id]}
            </a>
          ))}
        </nav>

        <div className="topMeta">
          <div className="langSwitch" role="group" aria-label="Language">
            {LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                className={lang === l.id ? 'on' : ''}
                onClick={() => setLang(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
          <span className="pill online">{t.online}</span>
          <span className="pill">{clock}</span>
          <button
            type="button"
            className="burger"
            aria-label={t.menu}
            onClick={() => setMenuOpen((v) => !v)}
          >
            ≡
          </button>
        </div>
      </header>

      <section className="hero" id="home">
        <video
          className="heroVideo"
          src="/video/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="wmCover" aria-hidden="true" />
        <div className="heroShade" />

        <div className="heroContent">
          <p className="tagline">{t.hero.tagline}</p>
          <h1>
            MYDAN-
            <br />
            CHIK
          </h1>
          <p className="heroLead">
            {t.hero.lead1}
            <br />
            {t.hero.lead2}
          </p>
          <div className="heroActions">
            <a className="btn" href="#projects">
              {t.hero.projects}
            </a>
            <a className="btn ghost" href="#contact">
              {t.hero.contact}
            </a>
          </div>
          <div className="heroStats">
            {t.hero.stats.map((s) => (
              <div key={s.s}>
                <b>{s.b}</b>
                <span>{s.s}</span>
              </div>
            ))}
          </div>
        </div>

        <a className="scrollDown" href="#about">
          {t.hero.scroll}
        </a>
      </section>

      <section className="block about" id="about">
        <div className="blockHead">
          <span>{t.about.head}</span>
          <span>{t.about.who}</span>
        </div>
        <div className="aboutGrid">
          <div className="panel aboutMain">
            <div className="aboutTitleRow">
              <img className="aboutLogo" src="/logo.svg" alt="" width={36} height={36} />
              <h2>MYDANCHIK</h2>
              <span className="statusPill">
                <i /> ONLINE
              </span>
            </div>
            <p className="aboutLead">{t.about.lead}</p>
            <div className="aboutTags">
              {t.about.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="aboutActions">
              <a className="btn" href="#projects">
                {t.about.viewProjects}
              </a>
              <a className="btn ghost" href="#contact">
                {t.about.writeMe}
              </a>
            </div>
          </div>

          <div className="panel aboutSide">
            <h3>{t.about.how}</h3>
            <ol className="steps">
              {t.about.steps.map((step, i) => (
                <li key={step}>
                  <b>0{i + 1}</b>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <div className="aboutMeta">
              {t.about.meta.map((m) => (
                <div key={m.s}>
                  <strong>{m.b}</strong>
                  <span>{m.s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="block stack" id="stack">
        <div className="blockHead">
          <span>{t.stack.head}</span>
          <span>{t.stack.lvl}</span>
        </div>
        <p className="stackLead">{t.stack.lead}</p>
        <div className="stackBoard">
          {STACK_GROUPS.map((group) => (
            <div key={group.id} className="stackGroup">
              <div className="stackGroupHead">
                <span>{t.stack.groups[group.id]}</span>
                <i aria-hidden="true" />
              </div>
              <div className="stackGrid">
                {group.items.map((item) => (
                  <div key={item.name} className="stackCard">
                    <div className="stackTop">
                      <b>{item.name}</b>
                      <span className="stackLvl">{item.lvl}%</span>
                    </div>
                    <div className="bar" aria-hidden="true">
                      <i style={{ width: `${item.lvl}%` }} />
                    </div>
                    <div className="stackMeta">
                      {item.lvl >= 90
                        ? lang === 'uk'
                          ? 'експерт'
                          : 'expert'
                        : item.lvl >= 80
                          ? lang === 'uk'
                            ? 'сильно'
                            : 'strong'
                          : lang === 'uk'
                            ? 'впевнено'
                            : 'solid'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="block services" id="services">
        <div className="blockHead">
          <span>{t.services.head}</span>
          <span>{t.services.what}</span>
        </div>
        <p className="projectsNotice">{t.services.notice}</p>
        <div className="serviceGrid">
          {t.services.items.map((s) => (
            <article key={s.title} className="panel serviceCard">
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <a
                className="run"
                href={s.href}
                {...(s.href.startsWith('http') || s.href.startsWith('/demos')
                  ? { target: '_blank', rel: 'noreferrer' }
                  : {})}
              >
                {t.services.run}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="block projects" id="projects">
        <div className="blockHead">
          <span>{t.projects.head}</span>
          <span>{t.projects.selected}</span>
        </div>
        <p className="projectsNotice">{t.projects.notice}</p>
        <div className="projectGrid">
          {t.projects.items.map((p, i) => {
            const meta = PROJECT_META[p.id]
            return (
              <article key={p.id} className="panel projectCard">
                <a className="projPreview" href={meta.demo} target="_blank" rel="noreferrer">
                  <img src={meta.preview} alt={p.title} />
                </a>
                <div className="projTop">
                  <span>#{String(i + 1).padStart(2, '0')}</span>
                  <span>{t.projects.active}</span>
                </div>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
                <div className="tags">
                  {p.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="projActions">
                  <a href={meta.demo} target="_blank" rel="noreferrer">
                    {t.projects.demo}
                  </a>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="block contact" id="contact">
        <div className="blockHead">
          <span>{t.contact.head}</span>
          <span>{t.contact.open}</span>
        </div>
        <div className="contactGrid">
          <div className="panel">
            <h2>{t.contact.title}</h2>
            <p>{t.contact.text}</p>
            <a className="btn" href="https://t.me/mydanchik_o" target="_blank" rel="noreferrer">
              {t.contact.mail}
            </a>
          </div>
          <div className="panel contactLinks">
            <a href="https://t.me/mydanchik_o" target="_blank" rel="noreferrer">
              [ TELEGRAM ]
            </a>
            <a href="https://www.fiverr.com/mydanchik" target="_blank" rel="noreferrer">
              [ FIVERR ]
            </a>
            <a
              href="https://freelancehunt.com/freelancer/mydanchik.html#portfolio-rozrobka-botiv"
              target="_blank"
              rel="noreferrer"
            >
              [ FREELANCEHUNT ]
            </a>
            <a href="https://www.instagram.com/_mydanchik" target="_blank" rel="noreferrer">
              [ INSTAGRAM ]
            </a>
            <p className="prompt">{t.contact.prompt}</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <span>{t.footer.copy}</span>
        <span>{t.footer.tag}</span>
        <span className="footerBuild">
          {t.footer.build}
          <a className="voidSeed" href={voidUrl} target="_blank" rel="noreferrer" title="">
            ·
          </a>
        </span>
      </footer>
    </div>
  )
}
