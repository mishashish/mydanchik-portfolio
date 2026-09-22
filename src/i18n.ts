export type Lang = 'uk' | 'en'

export const LANGS: { id: Lang; label: string }[] = [
  { id: 'uk', label: 'UK' },
  { id: 'en', label: 'EN' },
]

const dict = {
  uk: {
    logoSub: 'DEV // АВТОМАТИЗАЦІЯ',
    online: '● ONLINE',
    menu: 'Меню',
    nav: {
      home: 'ГОЛОВНА',
      about: 'ПРО МЕНЕ',
      stack: 'СТЕК',
      services: 'ПОСЛУГИ',
      play: 'ГРА',
      projects: 'ПРОЄКТИ',
      contact: 'КОНТАКТ',
    },
    hero: {
      tagline: 'PIXEL DEV PORTFOLIO // v2',
      lead1: 'Сайти · парсери · Telegram-боти · автоматизація',
      lead2: 'Від брифу до робочого продукту під бізнес.',
      projects: 'ПРОЄКТИ',
      contact: 'КОНТАКТ',
      scroll: '▼ ДАЛІ',
      stats: [
        { b: '20+', s: 'ПРОЄКТІВ' },
        { b: '5+', s: 'РОКІВ' },
        { b: '24/7', s: 'НА ЗВʼЯЗКУ' },
        { b: '100%', s: 'ФОКУС' },
      ],
    },
    about: {
      head: '01 // ПРО МЕНЕ',
      who: 'ХТО Я',
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
      how: 'ЯК ПРАЦЮЮ',
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
    },
    stack: {
      head: '02 // TECH STACK',
      lvl: 'PRODUCTION TOOLKIT',
      lead: 'Стек під боти, парсинг і автоматизацію — те, чим реально збираю продукти клієнтам.',
      groups: {
        core: 'CORE',
        bots: 'BOTS & API',
        auto: 'AUTOMATION',
      },
    },
    services: {
      head: '03 // ПОСЛУГИ',
      what: 'ЩО РОБЛЮ',
      run: 'ВІДКРИТИ →',
      notice:
        'Нижче — живі продукти й робочі демо з реальних білдів, не заглушки.',
      items: [
        {
          title: 'САЙТИ',
          text: 'Лендінги, студії, магазини, адмінки. Чистий UX, анімації, адаптовано під бренд клієнта.',
          href: '/demos/cafe/index.html',
        },
        {
          title: 'ПАРСЕРИ',
          text: 'Збір даних із сайтів і маркетплейсів. Фільтри, антибан, експорт у таблиці / API.',
          href: '/demos/ebay/index.html',
        },
        {
          title: 'TG БОТИ',
          text: 'Боти продажів, підтримки, верифікації, доступу та сповіщень на aiogram.',
          href: '#contact',
        },
        {
          title: 'СКРИПТИ І ТУЛИ',
          text: 'CLI, дашборди, карти, адмін-панелі та кастомні IT-інструменти.',
          href: '/demos/ebay/index.html',
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
      head: '04 // ПРОЄКТИ',
      selected: 'ЖИВІ БІЛДИ',
      active: 'LIVE',
      demo: 'ВІДКРИТИ',
      notice:
        'Тільки робочі продукти: live-додатки з папки «робота» + повноцінні демо (без заглушок).',
      items: [
        {
          id: 'void',
          title: 'VOID.OS Board',
          text: 'Жива карта лотів: claim, ledger, інтерактивна дошка.',
          tags: ['Web3', 'React', 'Live'],
        },
        {
          id: 'nexus',
          title: 'NEXUS',
          text: 'Спільний цифровий персонаж: 128 клітин, 3D honeycomb, публічна памʼять.',
          tags: ['3D', 'Mind', 'Next'],
        },
        {
          id: 'ebay',
          title: 'BayFinder eBay',
          text: 'Live eBay через SerpApi + deal score (ціна, seller trust, shipping).',
          tags: ['eBay', 'SerpApi', 'Score'],
        },
        {
          id: 'tribal',
          title: 'INKWARD',
          text: 'Neo tribal studio: cinematic gallery, body zones, journal, booking.',
          tags: ['Neo Tribal', 'Studio', 'CMS'],
        },
        {
          id: 'cafe',
          title: 'KŌHI',
          text: 'Кавʼярня: меню, кошик, mono-стіл / онлайн-оплата, roast.',
          tags: ['Cafe', 'Brand', 'Pay'],
        },
      ],
    },
    contact: {
      head: '05 // КОНТАКТ',
      open: 'ВІДКРИТИЙ ДО ЗАДАЧ',
      title: 'НАПИСАТИ МЕНІ',
      text: 'Потрібен парсер, бот, сайт або автоматизація? Кидай задачу в Telegram — оцінимо і зберемо робочий інструмент.',
      mail: 'НАПИСАТИ В TG',
      prompt: '@mydanchik_o · status ONLINE',
    },
    footer: {
      copy: '© MYDANCHIK',
      tag: 'PIXEL IT PORTFOLIO',
      build: 'BUILD: 2026',
    },
  },
  en: {
    logoSub: 'DEV // AUTOMATION',
    online: '● ONLINE',
    menu: 'Menu',
    nav: {
      home: 'HOME',
      about: 'ABOUT',
      stack: 'STACK',
      services: 'SERVICES',
      play: 'PLAY',
      projects: 'PROJECTS',
      contact: 'CONTACT',
    },
    hero: {
      tagline: 'PIXEL DEV PORTFOLIO // v2',
      lead1: 'Websites · parsers · Telegram bots · automation',
      lead2: 'From brief to a working product for business.',
      projects: 'PROJECTS',
      contact: 'CONTACT',
      scroll: '▼ SCROLL',
      stats: [
        { b: '20+', s: 'PROJECTS' },
        { b: '5+', s: 'YEARS' },
        { b: '24/7', s: 'REACHABLE' },
        { b: '100%', s: 'FOCUS' },
      ],
    },
    about: {
      head: '01 // ABOUT',
      who: 'WHO I AM',
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
      how: 'HOW I WORK',
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
    },
    stack: {
      head: '02 // TECH STACK',
      lvl: 'PRODUCTION TOOLKIT',
      lead: 'Stack for bots, parsing and automation — what I actually ship for clients.',
      groups: {
        core: 'CORE',
        bots: 'BOTS & API',
        auto: 'AUTOMATION',
      },
    },
    services: {
      head: '03 // SERVICES',
      what: 'WHAT I BUILD',
      run: 'OPEN →',
      notice:
        'Below are live products and working demos from real builds — not stubs.',
      items: [
        {
          title: 'WEBSITES',
          text: 'Landing pages, studios, shops, admin panels. Clean UX, motion, tailored to the brand.',
          href: '/demos/cafe/index.html',
        },
        {
          title: 'PARSERS',
          text: 'Data collection from sites and marketplaces. Filters, anti-ban, export to sheets / API.',
          href: '/demos/ebay/index.html',
        },
        {
          title: 'TG BOTS',
          text: 'Sales, support, verification, access and notification bots on aiogram.',
          href: '#contact',
        },
        {
          title: 'SCRIPTS & TOOLS',
          text: 'CLI tools, dashboards, maps, admin panels and custom IT utilities.',
          href: '/demos/ebay/index.html',
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
      head: '04 // PROJECTS',
      selected: 'LIVE BUILDS',
      active: 'LIVE',
      demo: 'OPEN',
      notice:
        'Only working products: live apps from the work folder + full demos (no stubs).',
      items: [
        {
          id: 'void',
          title: 'VOID.OS Board',
          text: 'Live lot map: claim, ledger, interactive board.',
          tags: ['Web3', 'React', 'Live'],
        },
        {
          id: 'nexus',
          title: 'NEXUS',
          text: 'Shared digital character: 128 cells, 3D honeycomb, public memory.',
          tags: ['3D', 'Mind', 'Next'],
        },
        {
          id: 'ebay',
          title: 'BayFinder eBay',
          text: 'Live eBay via SerpApi + deal score (price, seller trust, shipping).',
          tags: ['eBay', 'SerpApi', 'Score'],
        },
        {
          id: 'tribal',
          title: 'INKWARD',
          text: 'Neo tribal studio: cinematic gallery, body zones, journal, booking.',
          tags: ['Neo Tribal', 'Studio', 'CMS'],
        },
        {
          id: 'cafe',
          title: 'KŌHI',
          text: 'Café: menu, cart, mono table / online pay, roast.',
          tags: ['Cafe', 'Brand', 'Pay'],
        },
      ],
    },
    contact: {
      head: '05 // CONTACT',
      open: 'OPEN FOR TASKS',
      title: 'MESSAGE ME',
      text: 'Need a parser, bot, website or automation? Message me on Telegram — we estimate and build a working tool.',
      mail: 'MESSAGE ON TG',
      prompt: '@mydanchik_o · status ONLINE',
    },
    footer: {
      copy: '© MYDANCHIK',
      tag: 'PIXEL IT PORTFOLIO',
      build: 'BUILD: 2026',
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
  nexus: {
    demo: 'https://nexus-nine-wine-41.vercel.app/',
    preview: '/previews/void.png',
  },
  ebay: {
    demo: '/demos/ebay/index.html',
    preview: '/previews/olx.svg',
  },
  tribal: {
    demo: '/demos/tribal/index.html',
    preview: '/previews/tribal.jpg',
  },
  cafe: {
    demo: '/demos/cafe/index.html',
    preview: '/previews/cafe.jpg',
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
