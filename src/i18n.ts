export type Lang = 'uk' | 'en'

export const LANGS: { id: Lang; label: string }[] = [
  { id: 'uk', label: 'UK' },
  { id: 'en', label: 'EN' },
]

const dict = {
  uk: {
    logoSub: 'Автоматизація · Веб · Боти',
    online: 'Доступний',
    menu: 'Меню',
    nav: {
      home: 'Головна',
      about: 'Про мене',
      stack: 'Стек',
      services: 'Послуги',
      play: 'Гра',
      projects: 'Проєкти',
      contact: 'Контакт',
    },
    hero: {
      tagline: 'Розробка під бізнес-задачі',
      lead1: 'Сайти, парсери, Telegram-боти та автоматизація',
      lead2: 'від брифу до робочого продукту.',
      projects: 'Проєкти',
      contact: 'Звʼязатись',
      scroll: 'Далі',
      stats: [
        { b: '20+', s: 'проєктів' },
        { b: '5+', s: 'років' },
        { b: '24/7', s: 'на звʼязку' },
        { b: '100%', s: 'фокус' },
      ],
    },
    about: {
      head: '01 — Про мене',
      who: 'Хто я',
      lead:
        'Роблю сайти й автоматизацію під бізнес: лендінги, парсери, Telegram-боти, скрипти та внутрішні інструменти. Беру задачу → збираю робочий продукт → віддаю готовим до використання.',
      tags: [
        'websites',
        'parsers & scrapers',
        'telegram bots',
        'automation',
        'scripts & tools',
      ],
      viewProjects: 'Дивитись проєкти',
      writeMe: 'Написати',
      how: 'Як працюю',
      steps: [
        'Слухаю задачу і фіксую результат',
        'Збираю MVP / демо під ваш кейс',
        'Доводжу до стабільної версії',
        'Передаю з інструкцією і підтримкою',
      ],
      meta: [
        { b: '5+', s: 'років досвіду' },
        { b: '20+', s: 'проєктів' },
        { b: '24/7', s: 'на звʼязку' },
      ],
      sceneLabel: 'Системна модель',
    },
    stack: {
      head: '02 — Стек',
      lvl: 'Інструменти в роботі',
      lead: 'Те, чим реально збираю продукти клієнтам: боти, парсинг, API та автоматизація.',
      groups: {
        core: 'Основа',
        bots: 'Боти та API',
        auto: 'Автоматизація',
      },
    },
    services: {
      head: '03 — Послуги',
      what: 'Що роблю',
      run: 'Детальніше →',
      notice:
        'Демо нижче — приклади підходу. Під клієнта збираю повний продукт: дизайн, логіка, адмінка, інтеграції.',
      items: [
        {
          title: 'Сайти',
          text: 'Лендінги, студії, магазини, адмінки. Чистий UX, анімації, адаптовано під бренд клієнта.',
          href: '#projects',
        },
        {
          title: 'Парсери',
          text: 'Збір даних із сайтів і маркетплейсів. Фільтри, антибан, експорт у таблиці / API.',
          href: '/demos/ebay/index.html',
        },
        {
          title: 'Telegram-боти',
          text: 'Боти продажів, підтримки, верифікації, доступу та сповіщень на aiogram.',
          href: '#contact',
        },
        {
          title: 'Скрипти і тули',
          text: 'CLI, дашборди, карти, адмін-панелі та кастомні IT-інструменти.',
          href: '/demos/tribal/index.html',
        },
      ],
    },
    play: {
      head: '04 // ГРА',
      badge: 'НА САЙТІ',
      title: 'VOID BREACH',
      lore: 'ЛОР',
      text:
        'Void Kernel тріснув — і з розлому вилізли тільки монстри: слизні, кажани, черепи, ґолеми. BYTE — піксельний маг із посохом: бродить сайтом, а коли тиснеш ГРАТИ — пірнає в рандомне підземелля, щоб пробити 3 глибини й перезапустити ядро.',
      play: 'ГРАТИ',
      open: 'НА ВЕСЬ ЕКРАН',
      tip: 'WASD · SPACE вогонь. 4 серця зникають при уроні · комбо · фінал — Void Kernel.',
    },
    projects: {
      head: '04 — Проєкти',
      selected: 'Вибрані роботи',
      active: 'Демо',
      demo: 'Відкрити демо',
      notice:
        'Демо показують приблизний функціонал. Повноцінні продукти збираються під клієнта — це лише частина можливостей.',
      items: [
        {
          id: 'void',
          title: 'VOID.OS Board',
          text: 'Жива карта лотів: claim, ledger, інтерактивна дошка.',
          tags: ['Web3', 'React', 'Live'],
        },
        {
          id: 'ebay',
          title: 'OLX Pulse',
          text: 'Живий пошук OLX + deal score. Приклад парсера під моніторинг угод.',
          tags: ['OLX', 'Parser', 'Score'],
        },
        {
          id: 'tribal',
          title: 'INKWARD',
          text: 'Сайт студії тату з адмінкою: галерея, пости, відгуки, мапа, статистика.',
          tags: ['Website', 'CMS', 'Admin'],
        },
        {
          id: 'cafe',
          title: 'KŌHI',
          text: 'Кавʼярня: меню, кошик, оплата столика / онлайн, roast і pickup.',
          tags: ['Website', 'Cafe', 'Brand'],
        },
      ],
    },
    contact: {
      head: '05 — Контакт',
      open: 'Відкритий до задач',
      title: 'Обговоримо задачу',
      text: 'Потрібен парсер, бот, сайт або автоматизація? Напишіть у Telegram — оцінимо обсяг і зберемо робочий інструмент.',
      mail: 'Написати в Telegram',
      prompt: '@mydanchik_o',
    },
    footer: {
      copy: '© MYDANCHIK',
      tag: 'Web · Automation · Bots',
      build: '2026',
    },
  },
  en: {
    logoSub: 'Automation · Web · Bots',
    online: 'Available',
    menu: 'Menu',
    nav: {
      home: 'Home',
      about: 'About',
      stack: 'Stack',
      services: 'Services',
      play: 'Play',
      projects: 'Projects',
      contact: 'Contact',
    },
    hero: {
      tagline: 'Built for business outcomes',
      lead1: 'Websites, parsers, Telegram bots and automation',
      lead2: 'from brief to a working product.',
      projects: 'Projects',
      contact: 'Contact',
      scroll: 'Scroll',
      stats: [
        { b: '20+', s: 'projects' },
        { b: '5+', s: 'years' },
        { b: '24/7', s: 'reachable' },
        { b: '100%', s: 'focus' },
      ],
    },
    about: {
      head: '01 — About',
      who: 'Who I am',
      lead:
        'I build websites and business automation: landings, parsers, Telegram bots, scripts and internal tools. Take a brief → ship a working product → hand it over ready to use.',
      tags: [
        'websites',
        'parsers & scrapers',
        'telegram bots',
        'automation',
        'scripts & tools',
      ],
      viewProjects: 'View projects',
      writeMe: 'Message me',
      how: 'How I work',
      steps: [
        'Listen to the brief and lock the outcome',
        'Build an MVP / demo for your case',
        'Harden it into a stable version',
        'Hand over with docs and support',
      ],
      meta: [
        { b: '5+', s: 'years experience' },
        { b: '20+', s: 'projects' },
        { b: '24/7', s: 'reachable' },
      ],
      sceneLabel: 'System model',
    },
    stack: {
      head: '02 — Stack',
      lvl: 'Tools in production',
      lead: 'What I actually ship for clients: bots, parsing, APIs and automation.',
      groups: {
        core: 'Core',
        bots: 'Bots & API',
        auto: 'Automation',
      },
    },
    services: {
      head: '03 — Services',
      what: 'What I build',
      run: 'Learn more →',
      notice:
        'Demos below are approach samples. For clients I ship the full product: design, logic, admin, integrations.',
      items: [
        {
          title: 'Websites',
          text: 'Landing pages, studios, shops, admin panels. Clean UX, motion, tailored to the brand.',
          href: '#projects',
        },
        {
          title: 'Parsers',
          text: 'Data collection from sites and marketplaces. Filters, anti-ban, export to sheets / API.',
          href: '/demos/ebay/index.html',
        },
        {
          title: 'Telegram bots',
          text: 'Sales, support, verification, access and notification bots on aiogram.',
          href: '#contact',
        },
        {
          title: 'Scripts & tools',
          text: 'CLI tools, dashboards, maps, admin panels and custom IT utilities.',
          href: '/demos/tribal/index.html',
        },
      ],
    },
    play: {
      head: '04 // PLAY',
      badge: 'ON SITE',
      title: 'VOID BREACH',
      lore: 'LORE',
      text:
        'The Void Kernel cracked open — only monsters crawled out: slimes, bats, skulls, golems. BYTE is a pixel mage with a staff: he wanders this site, and when you hit PLAY he drops into a random dungeon to clear 3 depths and reboot the core.',
      play: 'PLAY',
      open: 'FULL SCREEN',
      tip: 'WASD · SPACE fire. 4 hearts vanish on hit · combos · finale is the Void Kernel.',
    },
    projects: {
      head: '04 — Projects',
      selected: 'Selected work',
      active: 'Demo',
      demo: 'Open demo',
      notice:
        'Demos show sample functionality. Full products are built per client — this is only a slice of what I can demonstrate.',
      items: [
        {
          id: 'void',
          title: 'VOID.OS Board',
          text: 'Live lot map: claim, ledger, interactive board.',
          tags: ['Web3', 'React', 'Live'],
        },
        {
          id: 'ebay',
          title: 'OLX Pulse',
          text: 'Live OLX search + deal score. A parser sample for deal monitoring.',
          tags: ['OLX', 'Parser', 'Score'],
        },
        {
          id: 'tribal',
          title: 'INKWARD',
          text: 'Tattoo studio website with admin: gallery, posts, reviews, map, stats.',
          tags: ['Website', 'CMS', 'Admin'],
        },
        {
          id: 'cafe',
          title: 'KŌHI',
          text: 'Café: menu, cart, table pay / online pay, roast and pickup.',
          tags: ['Website', 'Cafe', 'Brand'],
        },
      ],
    },
    contact: {
      head: '05 — Contact',
      open: 'Open for work',
      title: 'Let’s discuss your task',
      text: 'Need a parser, bot, website or automation? Message me on Telegram — we estimate scope and build a working tool.',
      mail: 'Message on Telegram',
      prompt: '@mydanchik_o',
    },
    footer: {
      copy: '© MYDANCHIK',
      tag: 'Web · Automation · Bots',
      build: '2026',
    },
  },
} as const

export type Dict = (typeof dict)['uk']

export function getDict(lang: Lang): Dict {
  return dict[lang] as Dict
}

export const PROJECT_META: Record<
  string,
  { demo: string; preview: string }
> = {
  void: {
    demo: 'https://ashy-gamma-42.vercel.app/',
    preview: '/previews/void.png',
  },
  ebay: {
    demo: '/demos/ebay/index.html',
    preview: '/previews/olx.svg',
  },
  tribal: {
    demo: '/demos/tribal/index.html',
    preview: '/previews/tribal.svg',
  },
  cafe: {
    demo: '/demos/cafe/index.html',
    preview: '/previews/cafe.svg',
  },
}

export type StackItem = { name: string }
export type StackGroup = { id: 'core' | 'bots' | 'auto'; items: StackItem[] }

export const STACK_GROUPS: StackGroup[] = [
  {
    id: 'core',
    items: [{ name: 'Python' }, { name: 'TypeScript' }, { name: 'PostgreSQL' }],
  },
  {
    id: 'bots',
    items: [{ name: 'aiogram' }, { name: 'Telegram Bot API' }, { name: 'FastAPI' }],
  },
  {
    id: 'auto',
    items: [
      { name: 'Playwright' },
      { name: 'Automation / ETL' },
      { name: 'Parsing pipelines' },
    ],
  },
]

export const STACK: StackItem[] = STACK_GROUPS.flatMap((g) => g.items)
