const r = await fetch(
  'https://www.bing.com/search?q=' +
    encodeURIComponent('Samsung Galaxy S24 site:ebay.com/itm') +
    '&setlang=en-US&cc=US&count=30',
  {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },
)
const t = await r.text()
const fs = await import('fs')
fs.writeFileSync('scripts/bing-sample.html', t)
console.log('len', t.length)
console.log('ebay mentions', (t.match(/ebay/gi) || []).length)
console.log('sample urls', [...t.matchAll(/https?:\/\/[^"'\\\s<>]*ebay[^"'\\\s<>]*/gi)].slice(0, 20))
console.log('cite', [...t.matchAll(/cite[^>]*>([^<]*ebay[^<]*)</gi)].slice(0, 10).map((m) => m[1]))
console.log('b_algo', (t.match(/b_algo/g) || []).length)
const algos = t.split('b_algo').slice(1, 8)
for (const a of algos) {
  const title = (a.match(/<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) || [])
  console.log({
    href: (title[1] || '').slice(0, 100),
    title: (title[2] || '').replace(/<[^>]+>/g, '').slice(0, 80),
  })
}
