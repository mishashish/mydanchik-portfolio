const q = encodeURIComponent('Samsung Galaxy S24 site:ebay.com/itm')
const r = await fetch('https://html.duckduckgo.com/html/?q=' + q, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
})
const t = await r.text()
const fs = await import('fs')
fs.writeFileSync('scripts/ddg-sample.html', t)

// result blocks
const blocks = t.split(/class="result__body"/).slice(1)
console.log('blocks', blocks.length)
for (const b of blocks.slice(0, 5)) {
  const title = (b.match(/class="result__a"[^>]*>([\s\S]*?)<\/a>/) || [])[1]?.replace(/<[^>]+>/g, '').trim()
  const href = (b.match(/uddg=([^&"]+)/) || [])[1]
  const url = href ? decodeURIComponent(href) : ''
  const snip = (b.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/) || [])[1]?.replace(/<[^>]+>/g, '').trim()
  console.log({ title, url: url.slice(0, 80), snip: (snip || '').slice(0, 120) })
}

// try ebay item oembed / vi pages
const id = '257131323344'
for (const u of [
  `https://www.ebay.com/itm/ws/eBayISAPI.dll?ViewItemMini&item=${id}`,
  `https://open.spotify.com`, // noop
  `https://r.jina.ai/http://www.ebay.com/itm/${id}`,
]) {
  try {
    const rr = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow' })
    const tt = await rr.text()
    console.log('\n', u.slice(0, 60), rr.status, tt.length, tt.slice(0, 200).replace(/\s+/g, ' '))
  } catch (e) {
    console.log('fail', e.message)
  }
}
