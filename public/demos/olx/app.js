(() => {
  'use strict'

  const PALETTE = {
    phones: ['#dbeafe', '#93c5fd', '#1d4ed8'],
    pc: ['#e0e7ff', '#a5b4fc', '#4338ca'],
    game: ['#fce7f3', '#f9a8d4', '#be185d'],
    transport: ['#dcfce7', '#86efac', '#15803d'],
    home: ['#ffedd5', '#fdba74', '#c2410c'],
  }

  const ICONS = {
    phones: '📱',
    pc: '💻',
    game: '🎮',
    transport: '🚗',
    home: '🏠',
  }

  const CAT_LABEL = {
    phones: 'Телефони',
    pc: 'Комп’ютери',
    game: 'Ігри та консолі',
    transport: 'Транспорт',
    home: 'Дім і сад',
  }

  const CAT_HAY = {
    phones: 'телефони смартфон',
    pc: 'компютери ноутбук пк',
    game: 'ігри консолі',
    transport: 'транспорт авто',
    home: 'дім сад техніка',
  }

  // curated Unsplash photo ids by topic
  const PHOTO_IDS = {
    iphone: ['photo-1591337676887-a217a6970a8a', 'photo-1510557880182-3d4d3cba35a5', 'photo-1695048133142-1a204844ee01'],
    samsung: ['photo-1610945415295-d9bbf067e59c', 'photo-1585060544812-6b45742d762f', 'photo-1610945264803-c22b62d2a7b3'],
    pixel: ['photo-1598327105666-5b89351aff97', 'photo-1601784551446-20c9e07cdbdb'],
    airpods: ['photo-1600294037681-c80b4cb5b434', 'photo-1606220945770-b5b6c2c55bf1', 'photo-1572569511254-d8f925fe2cbb'],
    watch: ['photo-1434493789847-2f02dc6ca35d', 'photo-1579586337278-3befd40fd17a'],
    macbook: ['photo-1517336714731-489689fd1ca8', 'photo-1496181133206-80ce9b88a853', 'photo-1541807084-5c52b6b3adef'],
    laptop: ['photo-1603302576837-37561b2e2302', 'photo-1588872657578-7efd1f1555ed', 'photo-1525547719571-a2d4ac8945e2'],
    pc: ['photo-1587202372775-e229f172b9d7', 'photo-1593640408182-31c70c8268f5', 'photo-1625948515291-69613efd103f'],
    gpu: ['photo-1591488320449-011701bb6704', 'photo-1587202372634-32705e3bf8c8'],
    monitor: ['photo-1527443224154-c4a3942d3acf', 'photo-1593640408182-31c70c8268f5'],
    keyboard: ['photo-1587829741301-dc798b83add3', 'photo-1618384887929-16ec2cab24a0'],
    ps5: ['photo-1606144042614-b2417e99c4e3', 'photo-1607853202273-797f1c22a38e', 'photo-1593305841991-05c297ba4735'],
    xbox: ['photo-1621259182978-fbf93132d53d', 'photo-1605901309584-818e25960b8f'],
    switch: ['photo-1578303512597-81e6d8c595ea', 'photo-1612287230202-1ff1d85d1bdf'],
    steam: ['photo-1612287230202-1ff1d85d1bdf', 'photo-1552820728-8b83bb6b773f'],
    quest: ['photo-1622979135225-d2ba269cf1ac', 'photo-1593508512255-86ab42a8e826'],
    game: ['photo-1493711662062-fa541adb3fc8', 'photo-1552820728-8b83bb6b773f'],
    car: ['photo-1492144534655-ae79c964c9d7', 'photo-1503376780353-7e6692767b70', 'photo-1549317661-bd32c8ce0db2'],
    bike: ['photo-1485965120184-e220f721d03e', 'photo-1571068316344-75bc76f37836'],
    scooter: ['photo-1558618666-fcd25c85cd64', 'photo-1571068316344-75bc76f37836'],
    sofa: ['photo-1555041469-a586c61ea9bc', 'photo-1493663284031-b7e3aefcae8e'],
    fridge: ['photo-1571175443880-49e1d25b2bc5', 'photo-1584568694244-14fbdf83bd30'],
    washer: ['photo-1626806787461-102c1bfaaea1', 'photo-1610557892470-55d9e80c0bce'],
    vacuum: ['photo-1558317374-067fb5f30001', 'photo-1581578731548-c64695cc6952'],
    home: ['photo-1586023492125-27b2c045efd7', 'photo-1616486338812-3dadae4b4ace', 'photo-1556912173-46c336c7fd55'],
    phone: ['photo-1511707171634-5f897ff02aa9', 'photo-1592899677977-9c10ca588bbd'],
  }

  const SEED = [
    ['iPhone 15 Pro 256GB', 'phones', 'Київ', 42900, 'used', 2, true],
    ['iPhone 15 Pro Max 512', 'phones', 'Львів', 49800, 'new', 1, true],
    ['iPhone 15 128GB', 'phones', 'Дніпро', 36500, 'new', 2, true],
    ['iPhone 14 Pro 256GB', 'phones', 'Київ', 33900, 'used', 4, true],
    ['iPhone 14 128GB ідеал', 'phones', 'Львів', 28500, 'used', 5, true],
    ['iPhone 13 Pro 256', 'phones', 'Одеса', 24500, 'used', 6, true],
    ['iPhone 13 128GB', 'phones', 'Одеса', 19800, 'used', 9, true],
    ['iPhone 12 64GB', 'phones', 'Харків', 14200, 'used', 11, true],
    ['iPhone SE 2022', 'phones', 'Київ', 12500, 'used', 8, true],
    ['Samsung Galaxy S24 Ultra', 'phones', 'Київ', 45500, 'new', 1, true],
    ['Samsung Galaxy S24', 'phones', 'Львів', 31200, 'new', 3, true],
    ['Samsung Galaxy S23 Ultra', 'phones', 'Дніпро', 34800, 'used', 5, true],
    ['Samsung Galaxy S23', 'phones', 'Дніпро', 22100, 'used', 7, true],
    ['Samsung Galaxy A55', 'phones', 'Одеса', 14500, 'new', 2, true],
    ['Xiaomi 14 512GB', 'phones', 'Харків', 24900, 'new', 3, true],
    ['Xiaomi 13T Pro', 'phones', 'Київ', 16800, 'used', 6, true],
    ['Redmi Note 13 Pro', 'phones', 'Львів', 9900, 'new', 4, true],
    ['Google Pixel 8 Pro', 'phones', 'Київ', 26800, 'used', 5, true],
    ['Google Pixel 8', 'phones', 'Київ', 20500, 'used', 6, false],
    ['Google Pixel 7a', 'phones', 'Харків', 13200, 'used', 9, true],
    ['OnePlus 12 256GB', 'phones', 'Одеса', 22900, 'used', 4, true],
    ['Nothing Phone 2', 'phones', 'Дніпро', 15600, 'used', 7, true],
    ['AirPods Pro 2', 'phones', 'Київ', 7900, 'new', 1, true],
    ['AirPods Pro 2 USB-C', 'phones', 'Львів', 8200, 'new', 2, true],
    ['AirPods Pro 2 б/в', 'phones', 'Львів', 5400, 'used', 5, true],
    ['AirPods 3', 'phones', 'Київ', 4800, 'used', 8, true],
    ['AirPods Max Silver', 'phones', 'Одеса', 14500, 'used', 10, true],
    ['Sony WH-1000XM5', 'phones', 'Київ', 11200, 'used', 6, true],
    ['Samsung Galaxy Buds 2 Pro', 'phones', 'Дніпро', 3900, 'used', 7, true],
    ['Apple Watch Ultra 2', 'phones', 'Київ', 28900, 'new', 3, true],
    ['Apple Watch Series 9', 'phones', 'Львів', 14500, 'used', 5, true],
    ['MacBook Pro 14 M3', 'pc', 'Київ', 78900, 'new', 2, true],
    ['MacBook Pro 16 M3 Pro', 'pc', 'Київ', 112000, 'new', 1, true],
    ['MacBook Air M2 16/512', 'pc', 'Львів', 45200, 'used', 4, true],
    ['MacBook Air M3 15', 'pc', 'Одеса', 54800, 'new', 3, true],
    ['MacBook Pro 13 M2', 'pc', 'Харків', 38900, 'used', 9, true],
    ['iMac 24 M1', 'pc', 'Київ', 42000, 'used', 12, true],
    ['iMac 24 M3', 'pc', 'Львів', 62000, 'new', 4, true],
    ['Lenovo Legion 5 RTX4060', 'pc', 'Одеса', 38900, 'used', 8, true],
    ['Lenovo ThinkPad X1 Carbon', 'pc', 'Київ', 29500, 'used', 11, true],
    ['ASUS TUF Gaming F15', 'pc', 'Дніпро', 31500, 'used', 10, true],
    ['ASUS ROG Zephyrus G14', 'pc', 'Київ', 52000, 'used', 6, true],
    ['HP Pavilion 15', 'pc', 'Харків', 18900, 'used', 14, true],
    ['Acer Nitro 5 RTX4050', 'pc', 'Одеса', 34200, 'used', 7, true],
    ['Dell XPS 13 Plus', 'pc', 'Львів', 41000, 'used', 8, true],
    ['PC Ryzen 5 + RTX 3060', 'pc', 'Харків', 27400, 'used', 5, true],
    ['PC Ryzen 7 + RTX 4070', 'pc', 'Київ', 48500, 'new', 2, true],
    ['PC Intel i5 + RTX 4060', 'pc', 'Дніпро', 32900, 'used', 6, true],
    ['RTX 4070 Super', 'pc', 'Київ', 28900, 'new', 2, true],
    ['RTX 4080', 'pc', 'Львів', 42000, 'used', 5, true],
    ['RTX 4060 Ti 16GB', 'pc', 'Одеса', 19800, 'new', 3, true],
    ['RTX 3060 12GB', 'pc', 'Харків', 11200, 'used', 12, true],
    ['RX 7800 XT', 'pc', 'Київ', 24500, 'used', 7, true],
    ['Монітор LG UltraGear 27', 'pc', 'Харків', 11200, 'used', 8, true],
    ['Монітор Samsung Odyssey G7', 'pc', 'Київ', 14500, 'used', 6, true],
    ['Монітор Dell UltraSharp 27', 'pc', 'Львів', 9800, 'used', 10, true],
    ['Клавіатура Keychron Q1', 'pc', 'Одеса', 6200, 'used', 4, true],
    ['Клавіатура Logitech MX Keys', 'pc', 'Київ', 4500, 'used', 9, true],
    ['Миша Logitech MX Master 3S', 'pc', 'Дніпро', 3800, 'new', 2, true],
    ['SSD Samsung 990 Pro 2TB', 'pc', 'Київ', 7200, 'new', 1, true],
    ['PlayStation 5 Disk', 'game', 'Київ', 18900, 'used', 3, true],
    ['PlayStation 5 Slim', 'game', 'Львів', 20500, 'new', 2, true],
    ['PS5 + 2 геймпада', 'game', 'Львів', 21500, 'used', 4, true],
    ['PS5 Digital Edition', 'game', 'Одеса', 16500, 'used', 8, true],
    ['PS5 DualSense', 'game', 'Київ', 2500, 'new', 1, true],
    ['PS5 DualSense Edge', 'game', 'Дніпро', 6200, 'used', 5, true],
    ['Xbox Series X', 'game', 'Одеса', 19800, 'used', 6, true],
    ['Xbox Series S 1TB', 'game', 'Київ', 13200, 'new', 3, true],
    ['Nintendo Switch OLED', 'game', 'Київ', 12900, 'new', 2, true],
    ['Nintendo Switch Lite', 'game', 'Харків', 6900, 'used', 11, true],
    ['Steam Deck 512', 'game', 'Дніпро', 17500, 'used', 9, true],
    ['Steam Deck OLED 1TB', 'game', 'Київ', 24900, 'new', 4, true],
    ['Meta Quest 3 128', 'game', 'Львів', 18900, 'used', 6, true],
    ['Meta Quest 3 512', 'game', 'Київ', 24500, 'new', 2, true],
    ['FIFA 25 PS5', 'game', 'Харків', 1200, 'new', 1, true],
    ['GTA V PS5', 'game', 'Одеса', 900, 'used', 14, true],
    ['God of War Ragnarok', 'game', 'Київ', 1450, 'used', 7, true],
    ['Spider-Man 2 PS5', 'game', 'Львів', 1600, 'new', 3, true],
    ['Elden Ring PS5', 'game', 'Дніпро', 1100, 'used', 10, true],
    ['BMW 320i 2018', 'transport', 'Київ', 690000, 'used', 15, true],
    ['BMW X5 2019', 'transport', 'Львів', 1250000, 'used', 12, true],
    ['Volkswagen Golf 7', 'transport', 'Львів', 410000, 'used', 20, true],
    ['Volkswagen Passat B8', 'transport', 'Київ', 520000, 'used', 18, true],
    ['Tesla Model 3 2021', 'transport', 'Київ', 980000, 'used', 8, true],
    ['Tesla Model Y 2022', 'transport', 'Одеса', 1350000, 'used', 6, true],
    ['Toyota Camry 70', 'transport', 'Дніпро', 780000, 'used', 14, true],
    ['Toyota RAV4 2018', 'transport', 'Харків', 890000, 'used', 16, true],
    ['Skoda Octavia A7', 'transport', 'Дніпро', 355000, 'used', 18, true],
    ['Skoda Superb 2017', 'transport', 'Київ', 480000, 'used', 22, true],
    ['Mercedes C200 2016', 'transport', 'Львів', 720000, 'used', 19, true],
    ['Audi A4 B9', 'transport', 'Одеса', 810000, 'used', 11, true],
    ['Yamaha MT-07', 'transport', 'Одеса', 245000, 'used', 11, true],
    ['Honda CB500F', 'transport', 'Київ', 198000, 'used', 13, true],
    ['Велосипед Trek Marlin', 'transport', 'Дніпро', 14500, 'used', 6, true],
    ['Велосипед Giant Talon', 'transport', 'Київ', 16800, 'used', 9, true],
    ['Електросамокат Ninebot', 'transport', 'Київ', 14500, 'used', 7, true],
    ['Електросамокат Xiaomi Pro 2', 'transport', 'Львів', 9800, 'used', 10, true],
    ['Диван кутовий новий', 'home', 'Київ', 18900, 'new', 4, true],
    ['Диван прямий сірий', 'home', 'Львів', 11200, 'used', 12, true],
    ['Холодильник Bosch', 'home', 'Львів', 16200, 'used', 7, true],
    ['Холодильник Samsung NoFrost', 'home', 'Київ', 19800, 'used', 5, true],
    ['Пральна машина Samsung', 'home', 'Одеса', 9800, 'used', 9, true],
    ['Пральна машина LG 8кг', 'home', 'Дніпро', 11200, 'used', 8, true],
    ['Dyson V15 Detect', 'home', 'Київ', 17500, 'used', 3, true],
    ['Dyson Airwrap', 'home', 'Львів', 14500, 'used', 6, true],
    ['Пилосос Xiaomi', 'home', 'Харків', 4300, 'used', 10, false],
    ['Пилосос Roborock S8', 'home', 'Київ', 16800, 'new', 2, true],
    ['Стіл письмовий дуб', 'home', 'Одеса', 3900, 'used', 14, true],
    ['Стілець офісний Herman', 'home', 'Київ', 6200, 'used', 11, true],
    ['Ліжко двоспальне 160', 'home', 'Дніпро', 8900, 'used', 15, true],
    ['Шкаф-купе 2.4м', 'home', 'Харків', 12500, 'used', 13, true],
    ['Кондиціонер Cooper&Hunter', 'home', 'Київ', 14500, 'used', 7, true],
    ['Мікрохвильовка Samsung', 'home', 'Одеса', 2800, 'used', 16, true],
  ]

  const CITIES = ['Київ', 'Львів', 'Одеса', 'Харків', 'Дніпро']
  const EXTRAS = [
    ['iPhone 11 128GB', 'phones', 9800],
    ['iPhone XR 64GB', 'phones', 7200],
    ['Samsung Galaxy Z Flip5', 'phones', 28500],
    ['Samsung Galaxy Z Fold5', 'phones', 42000],
    ['Xiaomi 12T', 'phones', 11200],
    ['Poco F5 Pro', 'phones', 13500],
    ['Honor Magic 5 Lite', 'phones', 8900],
    ['AirPods Pro 1', 'phones', 3200],
    ['Beats Studio Pro', 'phones', 7800],
    ['JBL Charge 5', 'phones', 4500],
    ['MacBook Air M1 8/256', 'pc', 28500],
    ['Mac mini M2', 'pc', 31200],
    ['Surface Laptop 5', 'pc', 35600],
    ['MSI Katana 15', 'pc', 36800],
    ['Gigabyte Aorus 15', 'pc', 41200],
    ['RTX 4070 Ti', 'pc', 34500],
    ['RTX 3080 10GB', 'pc', 19800],
    ['RX 6700 XT', 'pc', 14500],
    ['Монітор BenQ EX2710', 'pc', 8900],
    ['Навушники HyperX Cloud II', 'pc', 2800],
    ['PlayStation 4 Pro', 'game', 8900],
    ['Xbox One X', 'game', 7200],
    ['Nintendo Switch + Mario Kart', 'game', 11800],
    ['PS Portal', 'game', 8900],
    ['Horizon Forbidden West', 'game', 950],
    ['The Last of Us Part II', 'game', 800],
    ['Call of Duty MW3', 'game', 1400],
    ['Renault Megane 2017', 'transport', 320000],
    ['Hyundai Tucson 2018', 'transport', 650000],
    ['Kia Sportage 2019', 'transport', 710000],
    ['Ford Focus 2016', 'transport', 280000],
    ['Mazda CX-5 2017', 'transport', 690000],
    ['Електровелосипед', 'transport', 24500],
    ['Скутер Honda Dio', 'transport', 42000],
    ['Кавоварка DeLonghi', 'home', 5600],
    ['Мультиварка Redmond', 'home', 2400],
    ['Телевізор LG OLED 55', 'home', 32000],
    ['Телевізор Samsung QLED 65', 'home', 38000],
    ['Праска Philips Azur', 'home', 1800],
    ['Фен Dyson Supersonic', 'home', 11200],
    ['Матрац ортопедичний', 'home', 6900],
    ['Крісло геймерське DXRacer', 'home', 7800],
  ]

  function scoreOf(price, days, hasPhoto, cond) {
    let s = 58
    if (hasPhoto) s += 10
    if (cond === 'new') s += 8
    if (days <= 2) s += 14
    else if (days <= 5) s += 8
    else if (days >= 12) s -= 8
    if (price < 10000) s += 5
    if (price > 200000) s -= 3
    return Math.max(8, Math.min(99, Math.round(s)))
  }

  function photoTopic(title, cat) {
    const t = title.toLowerCase()
    if (t.includes('iphone')) return 'iphone'
    if (t.includes('galaxy') || (t.includes('samsung') && (t.includes('s2') || t.includes('z ')))) return 'samsung'
    if (t.includes('pixel')) return 'pixel'
    if (t.includes('airpods') || t.includes('buds') || t.includes('wh-1000') || t.includes('beats') || t.includes('jbl')) return 'airpods'
    if (t.includes('watch')) return 'watch'
    if (t.includes('macbook') || t.includes('imac') || t.includes('mac mini')) return 'macbook'
    if (t.includes('rtx') || t.includes('rx ')) return 'gpu'
    if (t.includes('монітор') || t.includes('monitor')) return 'monitor'
    if (t.includes('клавіатур') || t.includes('keychron') || t.includes('миша')) return 'keyboard'
    if (t.includes('ps5') || t.includes('playstation') || t.includes('dualsense') || t.includes('ps portal') || t.includes('fifa') || t.includes('gta') || t.includes('spider') || t.includes('elden') || t.includes('god of war') || t.includes('horizon') || t.includes('last of us') || t.includes('call of duty')) return 'ps5'
    if (t.includes('xbox')) return 'xbox'
    if (t.includes('switch') || t.includes('nintendo')) return 'switch'
    if (t.includes('steam')) return 'steam'
    if (t.includes('quest')) return 'quest'
    if (t.includes('велосипед')) return 'bike'
    if (t.includes('самокат') || t.includes('скутер')) return 'scooter'
    if (t.includes('bmw') || t.includes('volkswagen') || t.includes('tesla') || t.includes('toyota') || t.includes('skoda') || t.includes('mercedes') || t.includes('audi') || t.includes('renault') || t.includes('hyundai') || t.includes('kia') || t.includes('ford') || t.includes('mazda') || t.includes('yamaha') || t.includes('honda cb')) return 'car'
    if (t.includes('диван') || t.includes('ліжко') || t.includes('шкаф') || t.includes('стіл') || t.includes('стілець') || t.includes('крісло') || t.includes('матрац')) return 'sofa'
    if (t.includes('холодильник')) return 'fridge'
    if (t.includes('пральна')) return 'washer'
    if (t.includes('пилосос') || t.includes('dyson') || t.includes('roborock')) return 'vacuum'
    if (t.includes('legion') || t.includes('asus') || t.includes('thinkpad') || t.includes('pavilion') || t.includes('nitro') || t.includes('xps') || t.includes('surface') || t.includes('msi') || t.includes('aorus') || t.includes('laptop')) return 'laptop'
    if (t.includes('pc ') || t.includes('ssd') || cat === 'pc') return 'pc'
    if (cat === 'phones') return 'phone'
    if (cat === 'game') return 'game'
    if (cat === 'transport') return 'car'
    return 'home'
  }

  function unsplash(id, w) {
    return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${Math.round(w * 0.75)}&q=80`
  }

  function localFallback(item) {
    const [c1, c2] = item.colors
    const label = encodeURIComponent(item.title.slice(0, 28))
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${c1}"/>
            <stop offset="100%" stop-color="${c2}"/>
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#g)"/>
        <rect x="80" y="90" width="640" height="420" rx="28" fill="rgba(255,255,255,.55)"/>
        <text x="400" y="290" text-anchor="middle" font-size="72">${item.icon}</text>
        <text x="400" y="360" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="#15202b">${label}</text>
      </svg>`
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }

  function buildImages(item) {
    const topic = photoTopic(item.title, item.cat)
    const pool = PHOTO_IDS[topic] || PHOTO_IDS.home
    const a = pool[item.id % pool.length]
    const b = pool[(item.id + 1) % pool.length]
    const c = pool[(item.id + 2) % pool.length]
    if (!item.photo) return [localFallback(item)]
    return [unsplash(a, 900), unsplash(b, 700), unsplash(c, 700)]
  }

  function marketHint(price, score) {
    if (score >= 80) return { label: 'Дуже вигідно', tip: 'Ціна нижча за типову вибірку, свіже оголошення.' }
    if (score >= 65) return { label: 'Нормальна ціна', tip: 'В межах ринку. Можна торгуватись на 5–8%.' }
    return { label: 'Дорого / ризиковано', tip: 'Перевірте продавця і порівняйте з аналогами.' }
  }

  function describe(item) {
    const cond = item.cond === 'new' ? 'Новий товар' : 'Б/в у хорошому стані'
    return `${cond}. ${CAT_LABEL[item.cat]} · ${item.city}. Опубліковано ${item.days} дн. тому. У бойовій версії тут буде повний текст з OLX, фото продавця та історія цін.`
  }

  const RAW = SEED.slice()
  EXTRAS.forEach((row, i) => {
    const [title, cat, price] = row
    RAW.push([title, cat, CITIES[i % CITIES.length], price, i % 3 === 0 ? 'new' : 'used', 1 + (i % 20), i % 11 !== 0])
  })

  const SELLERS = ['Олександр', 'Марія', 'Ігор', 'Анна', 'Дмитро', 'Олена', 'Сергій', 'Наталія']

  const DATA = RAW.map((row, i) => {
    const [title, cat, city, price, cond, days, photo] = row
    const base = {
      id: i + 1,
      title,
      cat,
      city,
      price,
      cond,
      days,
      photo,
      icon: ICONS[cat],
      colors: PALETTE[cat],
      score: scoreOf(price, days, photo, cond),
      views: 40 + ((i * 37) % 900),
      seller: SELLERS[i % SELLERS.length],
      rating: (4.2 + ((i * 7) % 8) / 10).toFixed(1),
    }
    base.images = buildImages(base)
    base.cover = base.images[0]
    base.hint = marketHint(base.price, base.score)
    base.desc = describe(base)
    base.hay = normalize(
      [title, city, CAT_HAY[cat] || '', cond === 'new' ? 'новий new' : 'б/в used'].join(' '),
    )
    return base
  })

  const SYNONYMS = {
    ps5: ['playstation 5', 'ps5', 'dualsense'],
    playstation: ['playstation', 'ps5', 'ps4'],
    airpods: ['airpods', 'навушники apple'],
    macbook: ['macbook', 'макбук'],
    iphone: ['iphone', 'айфон'],
    rtx: ['rtx', 'відеокарта'],
    xbox: ['xbox', 'series'],
    switch: ['nintendo switch', 'switch'],
    galaxy: ['galaxy', 'samsung'],
  }

  const TREND = ['iPhone 15', 'PS5', 'MacBook', 'AirPods', 'Galaxy S24', 'RTX']

  const state = {
    tab: 'search',
    q: '',
    cat: '',
    city: '',
    min: null,
    max: null,
    cond: '',
    sort: 'score',
    photoOnly: false,
    bestOnly: false,
    minScore: 0,
    view: 'grid',
    fav: loadFav(),
    list: [],
    activeId: null,
    galleryIdx: 0,
  }

  const $ = (id) => document.getElementById(id)

  function normalize(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/['’`]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function loadFav() {
    try {
      return new Set(JSON.parse(localStorage.getItem('dealfinder_fav') || '[]'))
    } catch {
      return new Set()
    }
  }

  function saveFav() {
    localStorage.setItem('dealfinder_fav', JSON.stringify([...state.fav]))
    const el = $('favCount')
    if (el) el.textContent = String(state.fav.size)
  }

  function money(n) {
    return n.toLocaleString('uk-UA') + ' ₴'
  }

  function expandQuery(q) {
    const tokens = normalize(q).split(' ').filter(Boolean)
    if (!tokens.length) return []
    return tokens.map((token) => {
      const syn = SYNONYMS[token]
      if (syn) return syn.map(normalize)
      return [token]
    })
  }

  function matchesQuery(item, q) {
    const groups = expandQuery(q)
    if (!groups.length) return true
    return groups.every((alts) => alts.some((alt) => item.hay.includes(alt)))
  }

  function forceScoreZero() {
    const score = $('score')
    const label = $('scoreLabel')
    if (score) {
      score.value = '0'
      score.setAttribute('value', '0')
    }
    if (label) label.textContent = '0'
    state.minScore = 0
  }

  function readFilters() {
    state.q = normalize($('q').value)
    state.cat = $('cat').value
    state.city = $('city').value
    const min = Number($('min').value)
    const max = Number($('max').value)
    state.min = Number.isFinite(min) && $('min').value !== '' ? min : null
    state.max = Number.isFinite(max) && $('max').value !== '' ? max : null
    if (state.min != null && state.max != null && state.min > state.max) {
      const t = state.min
      state.min = state.max
      state.max = t
      $('min').value = String(state.min)
      $('max').value = String(state.max)
    }
    state.cond = $('cond').value
    state.sort = $('sort').value
    state.photoOnly = $('photoOnly').checked
    state.bestOnly = $('bestOnly').checked
    let ms = Number($('score').value)
    if (!Number.isFinite(ms) || ms < 0) ms = 0
    if (ms > 95) {
      ms = 0
      forceScoreZero()
    }
    state.minScore = ms
  }

  function apply() {
    readFilters()
    let list = DATA.slice()

    if (state.tab === 'fav') {
      list = list.filter((x) => state.fav.has(x.id))
    } else {
      if (state.q) list = list.filter((x) => matchesQuery(x, state.q))
      if (state.cat) list = list.filter((x) => x.cat === state.cat)
      if (state.city) list = list.filter((x) => x.city === state.city)
      if (state.cond) list = list.filter((x) => x.cond === state.cond)
      if (state.min != null) list = list.filter((x) => x.price >= state.min)
      if (state.max != null) list = list.filter((x) => x.price <= state.max)
      if (state.photoOnly) list = list.filter((x) => x.photo)
      if (state.bestOnly) list = list.filter((x) => x.score >= 70)
      if (state.minScore > 0) list = list.filter((x) => x.score >= state.minScore)
    }

    if (state.sort === 'score') list.sort((a, b) => b.score - a.score)
    if (state.sort === 'priceAsc') list.sort((a, b) => a.price - b.price)
    if (state.sort === 'priceDesc') list.sort((a, b) => b.price - a.price)
    if (state.sort === 'new') list.sort((a, b) => a.days - b.days)

    state.list = list
    render()
  }

  function scoreClass(s) {
    if (s >= 75) return 'good'
    if (s >= 55) return 'mid'
    return 'bad'
  }

  function renderStats(list) {
    if (!list.length) {
      $('stats').innerHTML = '<b>Статистика</b><div>Немає даних для вибраного запиту</div>'
      return
    }
    const prices = list.map((x) => x.price).sort((a, b) => a - b)
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    const mid = prices[Math.floor(prices.length / 2)]
    $('stats').innerHTML = `
      <b>Статистика вибірки</b>
      <div>Оголошень: <b>${list.length}</b></div>
      <div>Мін. ціна: <b>${money(prices[0])}</b></div>
      <div>Макс. ціна: <b>${money(prices[prices.length - 1])}</b></div>
      <div>Середня: <b>${money(avg)}</b></div>
      <div>Медіана: <b>${money(mid)}</b></div>
    `
  }

  function imgTag(src, alt, fallbackItem) {
    const fb = localFallback(fallbackItem)
    return `<img src="${src}" alt="${alt}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${fb}'" />`
  }

  function render() {
    const list = state.list
    $('countTitle').textContent = state.tab === 'fav' ? 'Обране' : 'Оголошення'
    $('count').textContent = `${list.length} результатів`
    $('favCount').textContent = String(state.fav.size)
    renderStats(list)

    const box = $('cards')
    box.className = `cards ${state.view}`
    box.innerHTML = ''

    if (!list.length) {
      const strict =
        state.minScore > 0 ||
        state.bestOnly ||
        state.photoOnly ||
        state.min != null ||
        state.max != null ||
        state.cond ||
        state.cat ||
        state.city
      $('empty').classList.remove('hidden')
      $('empty').innerHTML = strict
        ? `Нічого не знайдено.<br/><button type="button" class="btnPrimary" id="emptyReset" style="margin-top:12px">Скинути фільтри і шукати знову</button>`
        : `Нічого не знайдено. Спробуйте інший запит.`
      const btn = document.getElementById('emptyReset')
      if (btn) btn.onclick = resetAll
      return
    }
    $('empty').classList.add('hidden')

    for (const item of list) {
      const el = document.createElement('article')
      el.className = 'card'
      el.dataset.open = String(item.id)
      const liked = state.fav.has(item.id)
      el.innerHTML = `
        <div class="thumb">
          ${imgTag(item.cover, item.title, item)}
          <span class="thumbBadge ${scoreClass(item.score)}">Score ${item.score}</span>
          ${item.photo ? '' : '<span class="noPhoto">Без фото</span>'}
        </div>
        <div class="cardBody">
          <h3 class="title">${item.title}</h3>
          <div class="meta">${item.city} · ${item.cond === 'new' ? 'новий' : 'б/в'} · ${item.days} дн. тому</div>
          <div class="dealHint">${item.hint.label}</div>
          <div class="priceRow">
            <div class="price">${money(item.price)}</div>
            <span class="views">${item.views} переглядів</span>
          </div>
        </div>
        <div class="actions">
          <button type="button" class="open" data-open="${item.id}">Дивитись</button>
          <button type="button" class="fav ${liked ? 'on' : ''}" data-fav="${item.id}">${liked ? '♥' : '♡'}</button>
        </div>
      `
      box.appendChild(el)
    }
  }

  function openItem(id, galleryIdx = 0) {
    const item = DATA.find((x) => x.id === id)
    if (!item) return
    state.activeId = id
    state.galleryIdx = Math.max(0, Math.min(galleryIdx, item.images.length - 1))
    const img = item.images[state.galleryIdx]
    const liked = state.fav.has(item.id)
    const thumbs = item.images
      .map(
        (src, i) =>
          `<button type="button" class="galThumb ${i === state.galleryIdx ? 'on' : ''}" data-gal="${i}">${imgTag(src, item.title + ' ' + (i + 1), item)}</button>`,
      )
      .join('')

    $('modalBody').innerHTML = `
      <div class="detail">
        <div class="detailGallery">
          <div class="detailMain">
            ${imgTag(img, item.title, item)}
          </div>
          <div class="detailThumbs">${thumbs}</div>
        </div>
        <div class="detailInfo">
          <div class="detailTop">
            <span class="catPill">${CAT_LABEL[item.cat]}</span>
            <span class="score ${scoreClass(item.score)}">Score ${item.score}</span>
          </div>
          <h3>${item.title}</h3>
          <p class="detailPrice">${money(item.price)}</p>
          <p class="detailMeta">${item.city} · ${item.cond === 'new' ? 'Новий' : 'Б/в'} · ${item.days} дн. тому · ${item.views} переглядів</p>

          <div class="sellerCard">
            <div class="sellerAvatar">${item.seller.slice(0, 1)}</div>
            <div>
              <b>${item.seller}</b>
              <div>Рейтинг ${item.rating} · на сайті з 2021</div>
            </div>
          </div>

          <div class="dealBox">
            <b>${item.hint.label}</b>
            <p>${item.hint.tip}</p>
          </div>

          <p class="detailDesc">${item.desc}</p>

          <div class="detailActions">
            <button type="button" class="btnPrimary" data-fav="${item.id}">
              ${liked ? 'Прибрати з обраного' : 'Додати в обране'}
            </button>
            <button type="button" class="btnGhost" id="closeFromDetail">Закрити</button>
          </div>
        </div>
      </div>
    `
    $('modal').classList.remove('hidden')
    document.body.style.overflow = 'hidden'
    const closeBtn = document.getElementById('closeFromDetail')
    if (closeBtn) closeBtn.onclick = closeModal
  }

  function closeModal() {
    $('modal').classList.add('hidden')
    document.body.style.overflow = ''
    state.activeId = null
  }

  function toggleFav(id) {
    if (state.fav.has(id)) state.fav.delete(id)
    else state.fav.add(id)
    saveFav()
    apply()
    if (state.activeId === id) openItem(id, state.galleryIdx)
  }

  function resetAll() {
    $('q').value = ''
    $('cat').value = ''
    $('city').value = ''
    $('min').value = ''
    $('max').value = ''
    $('cond').value = ''
    $('sort').value = 'score'
    $('photoOnly').checked = false
    $('bestOnly').checked = false
    forceScoreZero()
    state.tab = 'search'
    document.querySelectorAll('.navBtn').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === 'search')
    })
    apply()
  }

  function runSearch() {
    forceScoreZero()
    $('bestOnly').checked = false
    state.tab = 'search'
    document.querySelectorAll('.navBtn').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === 'search')
    })
    apply()
  }

  function bind() {
    forceScoreZero()
    $('photoOnly').checked = false
    $('bestOnly').checked = false

    $('chips').innerHTML = TREND.map(
      (t) => `<button type="button" class="chip" data-q="${t}">${t}</button>`,
    ).join('')

    $('searchBtn').onclick = runSearch
    $('applyBtn').onclick = () => {
      if (Number($('score').value) >= 100) forceScoreZero()
      apply()
    }
    $('q').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        runSearch()
      }
    })
    let debounce = null
    $('q').addEventListener('input', () => {
      clearTimeout(debounce)
      debounce = setTimeout(() => {
        forceScoreZero()
        state.tab = 'search'
        apply()
      }, 180)
    })
    $('score').oninput = () => {
      $('scoreLabel').textContent = $('score').value
    }

    ;['cat', 'city', 'cond', 'sort'].forEach((id) => {
      $(id).addEventListener('change', apply)
    })

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

    $('resetBtn').onclick = resetAll

    document.querySelectorAll('.navBtn').forEach((btn) => {
      btn.onclick = () => {
        state.tab = btn.dataset.tab
        document.querySelectorAll('.navBtn').forEach((b) => {
          b.classList.toggle('active', b.dataset.tab === state.tab)
        })
        if (state.tab === 'search') forceScoreZero()
        apply()
      }
    })

    $('closeModal').onclick = closeModal
    $('modal').addEventListener('click', (e) => {
      if (e.target.id === 'modal') closeModal()
    })
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal()
    })

    document.addEventListener('click', (e) => {
      const t = e.target
      if (!(t instanceof HTMLElement)) return

      const chip = t.closest('[data-q]')
      if (chip instanceof HTMLElement && chip.dataset.q) {
        $('q').value = chip.dataset.q
        runSearch()
        return
      }

      const gal = t.closest('[data-gal]')
      if (gal instanceof HTMLElement && state.activeId != null) {
        openItem(state.activeId, Number(gal.dataset.gal))
        return
      }

      const fav = t.closest('[data-fav]')
      if (fav instanceof HTMLElement && fav.dataset.fav) {
        e.stopPropagation()
        toggleFav(Number(fav.dataset.fav))
        return
      }

      const open = t.closest('[data-open]')
      if (open instanceof HTMLElement && open.dataset.open) {
        openItem(Number(open.dataset.open))
      }
    })
  }

  bind()
  saveFav()
  apply()
})()
