async function get(url) {
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 BayFinderDemo/1.0',
      Accept: 'text/plain,text/markdown,*/*',
    },
  })
  const t = await r.text()
  return { status: r.status, len: t.length, sample: t.slice(0, 600) }
}

const q = encodeURIComponent('https://www.ebay.com/sch/i.html?_nkw=AirPods+Pro&_ipg=20')
const urls = [
  `https://r.jina.ai/http://www.ebay.com/sch/i.html?_nkw=AirPods+Pro&_ipg=20`,
  `https://r.jina.ai/${decodeURIComponent(q)}`,
]

for (const u of urls) {
  try {
    console.log('\nTRY', u.slice(0, 90))
    const res = await get(u)
    console.log(res.status, res.len)
    console.log(res.sample)
  } catch (e) {
    console.log('fail', e.message)
  }
}
