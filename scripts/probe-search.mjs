async function dump(name, url) {
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
      Accept: 'application/json,text/html,*/*',
    },
  })
  const t = await r.text()
  console.log('\n' + name, r.status, t.slice(0, 400).replace(/\s+/g, ' '))
  try {
    const j = JSON.parse(t)
    console.log('results', (j.results || []).slice(0, 5).map((x) => ({ title: x.title, url: x.url })))
  } catch {}
  const ids = [...new Set([...(t.matchAll(/ebay\.com\/itm\/(?:[^/"'\s<>]+\/)?(\d{9,14})/gi) || [])].map((m) => m[1]))]
  console.log('ids', ids.slice(0, 10))
}

const q = encodeURIComponent('"Samsung Galaxy S24" ebay.com/itm')
await dump('bing', `https://www.bing.com/search?q=${encodeURIComponent('Samsung Galaxy S24 site:ebay.com')}&setlang=en-US&cc=US`)
await dump('searx', `https://searx.tiekoetter.com/search?q=${q}&format=json&language=en-US`)
await dump('searx3', `https://searxng.site/search?q=${encodeURIComponent('Samsung Galaxy S24 site:ebay.com/itm')}&format=json`)
await dump('google-ish', `https://www.googleapis.com/customsearch/v1?q=test`)
