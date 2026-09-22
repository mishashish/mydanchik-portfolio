function buildPublicSearchUrl(params) {
  const q = params.get('q') || 'electronics'
  const url = new URL('https://www.ebay.com/sch/i.html')
  url.searchParams.set('_nkw', q)
  url.searchParams.set('_ipg', '50')
  const min = params.get('min')
  const max = params.get('max')
  if (min) url.searchParams.set('_udlo', min)
  if (max) url.searchParams.set('_udhi', max)
  const condition = params.get('condition')
  if (condition === 'new') url.searchParams.set('LH_ItemCondition', '1000')
  if (condition === 'used') url.searchParams.set('LH_ItemCondition', '3000')
  const format = params.get('format')
  if (format === 'bin') url.searchParams.set('LH_BIN', '1')
  if (format === 'auction') url.searchParams.set('LH_Auction', '1')
  return url.toString()
}

function extractPrice(node) {
  if (node?.price?.extracted != null) {
    return { price: Number(node.price.extracted), priceTo: null, currency: 'USD' }
  }
  if (node?.price?.from?.extracted != null) {
    return {
      price: Number(node.price.from.extracted),
      priceTo: node?.price?.to?.extracted != null ? Number(node.price.to.extracted) : null,
      currency: 'USD',
    }
  }
  if (node?.price?.value != null) {
    return {
      price: Number(node.price.value),
      priceTo: null,
      currency: String(node.price.currency || 'USD'),
    }
  }
  return { price: null, priceTo: null, currency: 'USD' }
}

function mapBuyingOptions(node) {
  const fmt = String(node?.buying_format || node?.buying_format_text || '').toLowerCase()
  const out = []
  if (fmt.includes('buy') || fmt === 'bin' || fmt.includes('fixed')) out.push('FIXED_PRICE')
  if (fmt.includes('auction')) out.push('AUCTION')
  if (fmt.includes('offer') || fmt === 'bo') out.push('BEST_OFFER')
  if (Array.isArray(node?.buyingOptions)) {
    for (const x of node.buyingOptions) out.push(String(x))
  }
  return [...new Set(out)]
}

function mapSerpOrganic(nodes) {
  return (nodes || [])
    .map((it, i) => {
      const price = extractPrice(it)
      const opts = mapBuyingOptions(it)
      return {
        id: String(it?.product_id || it?.epid || it?.link || i),
        title: String(it?.title || 'Listing'),
        subtitle: it?.subtitle ? String(it.subtitle) : null,
        url: String(it?.link || it?.product_link || ''),
        price: price.price,
        priceTo: price.priceTo,
        currency: price.currency,
        image: it?.thumbnail || it?.image || null,
        condition: it?.condition ? String(it.condition) : null,
        shipping: it?.shipping ? String(it.shipping) : it?.delivery ? String(it.delivery) : null,
        location: it?.location ? String(it.location) : null,
        buyingOptions: opts,
        buyingFormat: it?.buying_format ? String(it.buying_format) : null,
        sponsored: Boolean(it?.sponsored),
        seller: {
          username: it?.seller?.username || it?.seller?.name || null,
          reviews:
            it?.seller?.reviews != null && Number.isFinite(Number(it.seller.reviews))
              ? Number(it.seller.reviews)
              : null,
          feedback:
            it?.seller?.positive_feedback_in_percentage != null
              ? Number(it.seller.positive_feedback_in_percentage)
              : null,
        },
      }
    })
    .filter((x) => x.url)
}

async function serpApiSearch(apiKey, params) {
  const q = params.get('q') || 'electronics'
  const url = new URL('https://serpapi.com/search.json')
  url.searchParams.set('engine', 'ebay')
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('_nkw', q)

  const marketplace = params.get('marketplace') || 'EBAY_US'
  const domainMap = {
    EBAY_US: 'ebay.com',
    EBAY_GB: 'ebay.co.uk',
    EBAY_DE: 'ebay.de',
  }
  url.searchParams.set('ebay_domain', domainMap[marketplace] || params.get('domain') || 'ebay.com')

  const limit = Number(params.get('limit') || 50)
  const ipg = limit >= 200 ? '200' : limit >= 100 ? '100' : limit >= 50 ? '50' : '25'
  url.searchParams.set('_ipg', ipg)
  url.searchParams.set('_pgn', params.get('page') || '1')

  if (params.get('min')) url.searchParams.set('_udlo', params.get('min'))
  if (params.get('max')) url.searchParams.set('_udhi', params.get('max'))

  const condition = params.get('condition')
  if (condition === 'new') url.searchParams.set('LH_ItemCondition', '1000')
  if (condition === 'used') url.searchParams.set('LH_ItemCondition', '3000')

  const format = params.get('format')
  if (format === 'bin') url.searchParams.set('buying_format', 'BIN')
  if (format === 'auction') url.searchParams.set('buying_format', 'Auction')

  const show = []
  if (params.get('freeShipping') === '1') show.push('FS')
  if (params.get('returns') === '1') show.push('RPA')
  if (params.get('auth') === '1') show.push('AV')
  if (params.get('deals') === '1') show.push('Savings')
  if (show.length) url.searchParams.set('show_only', show.join(','))

  const sortMap = {
    priceAsc: '15',
    priceDesc: '16',
    new: '10',
    ending: '1',
    best: '12',
  }
  const sort = params.get('sort')
  if (sort && sortMap[sort]) url.searchParams.set('_sop', sortMap[sort])

  const r = await fetch(url.toString())
  if (!r.ok) throw new Error('SerpApi HTTP ' + r.status)
  const data = await r.json()
  if (data?.error) throw new Error(String(data.error))

  const organic = data?.organic_results || []
  const total =
    data?.search_information?.total_results != null
      ? Number(data.search_information.total_results)
      : null

  return {
    items: mapSerpOrganic(organic),
    total: Number.isFinite(total) ? total : null,
    query: String(data?.search_information?.query_displayed || q),
  }
}

export default async function handler(req, res) {
  try {
    const serpKey = String(process.env.SERPAPI_API_KEY || '').trim()
    const full = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`)
    const searchUrl = buildPublicSearchUrl(full.searchParams)

    if (!serpKey) {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(
        JSON.stringify({
          ok: false,
          reason: 'no_credentials',
          searchUrl,
          message:
            'Add SERPAPI_API_KEY in Vercel env for live eBay via SerpApi (https://serpapi.com/ebay-search-api)',
        }),
      )
      return
    }

    const result = await serpApiSearch(serpKey, full.searchParams)
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(
      JSON.stringify({
        ok: true,
        source: 'serpapi-ebay',
        query: result.query,
        count: result.items.length,
        total: result.total,
        searchUrl,
        items: result.items,
      }),
    )
  } catch (err) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ ok: false, error: String(err) }))
  }
}
