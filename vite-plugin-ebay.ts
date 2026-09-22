import type { Plugin } from 'vite'
import type { Connect } from 'vite'
import { loadEnv } from 'vite'

export type EbayItem = {
  id: string
  title: string
  subtitle: string | null
  url: string
  price: number | null
  priceTo: number | null
  currency: string
  image: string | null
  condition: string | null
  shipping: string | null
  location: string | null
  buyingOptions: string[]
  buyingFormat: string | null
  sponsored: boolean
  seller: {
    username: string | null
    reviews: number | null
    feedback: number | null
  }
}

function buildPublicSearchUrl(params: URLSearchParams) {
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

function extractPrice(node: any): { price: number | null; priceTo: number | null; currency: string } {
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

function mapBuyingOptions(node: any): string[] {
  const fmt = String(node?.buying_format || node?.buying_format_text || '').toLowerCase()
  const out: string[] = []
  if (fmt.includes('buy') || fmt === 'bin' || fmt.includes('fixed')) out.push('FIXED_PRICE')
  if (fmt.includes('auction')) out.push('AUCTION')
  if (fmt.includes('offer') || fmt === 'bo') out.push('BEST_OFFER')
  if (Array.isArray(node?.buyingOptions)) {
    for (const x of node.buyingOptions) out.push(String(x))
  }
  return [...new Set(out)]
}

function mapSerpOrganic(nodes: any[]): EbayItem[] {
  return (nodes || [])
    .map((it: any, i: number) => {
      const { price, priceTo, currency } = extractPrice(it)
      const ship = String(it?.shipping || '')
      return {
        id: String(it?.product_id || it?.link || i),
        title: String(it?.title || 'eBay item'),
        subtitle: it?.subtitle ? String(it.subtitle) : null,
        url: String(it?.link || ''),
        price,
        priceTo,
        currency,
        image: it?.thumbnail || null,
        condition: it?.condition ? String(it.condition) : null,
        shipping: /free/i.test(ship) ? 'Free shipping' : ship || null,
        location: it?.location ? String(it.location) : null,
        buyingOptions: mapBuyingOptions(it),
        buyingFormat: it?.buying_format_text || it?.buying_format || null,
        sponsored: !!it?.sponsored,
        seller: {
          username: it?.seller?.username ? String(it.seller.username) : null,
          reviews:
            it?.seller?.reviews != null && Number.isFinite(Number(it.seller.reviews))
              ? Number(it.seller.reviews)
              : null,
          feedback:
            it?.seller?.positive_feedback_in_percentage != null
              ? Number(it.seller.positive_feedback_in_percentage)
              : null,
        },
      } satisfies EbayItem
    })
    .filter((x) => x.url)
}

/** SerpApi eBay Search — https://serpapi.com/ebay-search-api */
async function serpApiSearch(apiKey: string, params: URLSearchParams): Promise<{
  items: EbayItem[]
  total: number | null
  query: string
}> {
  const q = params.get('q') || 'electronics'
  const url = new URL('https://serpapi.com/search.json')
  url.searchParams.set('engine', 'ebay')
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('_nkw', q)

  const marketplace = params.get('marketplace') || 'EBAY_US'
  const domainMap: Record<string, string> = {
    EBAY_US: 'ebay.com',
    EBAY_GB: 'ebay.co.uk',
    EBAY_DE: 'ebay.de',
  }
  url.searchParams.set('ebay_domain', domainMap[marketplace] || params.get('domain') || 'ebay.com')

  const limit = Number(params.get('limit') || 50)
  const ipg = limit >= 200 ? '200' : limit >= 100 ? '100' : limit >= 50 ? '50' : '25'
  url.searchParams.set('_ipg', ipg)
  url.searchParams.set('_pgn', params.get('page') || '1')

  if (params.get('min')) url.searchParams.set('_udlo', params.get('min')!)
  if (params.get('max')) url.searchParams.set('_udhi', params.get('max')!)

  const condition = params.get('condition')
  if (condition === 'new') url.searchParams.set('LH_ItemCondition', '1000')
  if (condition === 'used') url.searchParams.set('LH_ItemCondition', '3000')

  const format = params.get('format')
  if (format === 'bin') url.searchParams.set('buying_format', 'BIN')
  if (format === 'auction') url.searchParams.set('buying_format', 'Auction')

  const show: string[] = []
  if (params.get('freeShipping') === '1') show.push('FS')
  if (params.get('returns') === '1') show.push('RPA')
  if (params.get('auth') === '1') show.push('AV')
  if (params.get('deals') === '1') show.push('Savings')
  if (show.length) url.searchParams.set('show_only', show.join(','))

  const sortMap: Record<string, string> = {
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
  const data = (await r.json()) as any
  if (data?.error) throw new Error(String(data.error))

  const organic = data?.organic_results || []
  const total =
    data?.search_information?.total_results != null
      ? Number(data.search_information.total_results)
      : null

  return {
    items: mapSerpOrganic(organic),
    total: Number.isFinite(total as number) ? (total as number) : null,
    query: String(data?.search_information?.query_displayed || q),
  }
}

function mountEbayApi(middlewares: Connect.Server, root: string, mode: string) {
  middlewares.use('/api/ebay-search', async (req, res) => {
    try {
      const env = loadEnv(mode, root, '')
      const serpKey = (
        env.SERPAPI_API_KEY ||
        env['\ufeffSERPAPI_API_KEY'] ||
        process.env.SERPAPI_API_KEY ||
        ''
      ).trim()
      const full = new URL(req.url || '', 'http://localhost')
      const searchUrl = buildPublicSearchUrl(full.searchParams)

      if (!serpKey) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(
          JSON.stringify({
            ok: false,
            reason: 'no_credentials',
            searchUrl,
            message:
              'Add SERPAPI_API_KEY to .env for live eBay via SerpApi (https://serpapi.com/ebay-search-api)',
          }),
        )
        return
      }

      const result = await serpApiSearch(serpKey, full.searchParams)
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
  })
}

export function ebaySearchPlugin(): Plugin {
  return {
    name: 'ebay-search-proxy',
    configureServer(server) {
      mountEbayApi(server.middlewares, server.config.root, server.config.mode)
    },
    configurePreviewServer(server) {
      mountEbayApi(server.middlewares, server.config.root, server.config.mode)
    },
  }
}
