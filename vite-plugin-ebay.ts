import type { Plugin } from 'vite'
import { loadEnv } from 'vite'

type EbayItem = {
  id: string
  title: string
  url: string
  price: number | null
  currency: string
  image: string | null
  condition: string | null
  shipping: string | null
}

function buildSearchUrl(params: URLSearchParams) {
  const q = params.get('q') || 'electronics'
  const url = new URL('https://www.ebay.com/sch/i.html')
  url.searchParams.set('_nkw', q)
  url.searchParams.set('_ipg', params.get('limit') || '48')
  const cat = params.get('cat')
  if (cat) url.searchParams.set('_sacat', cat)
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
  const sortMap: Record<string, string> = {
    best: '12',
    new: '15',
    priceAsc: '2',
    priceDesc: '3',
    ending: '1',
  }
  const sort = params.get('sort')
  if (sort && sortMap[sort]) url.searchParams.set('_sop', sortMap[sort])
  return url.toString()
}

function mapFindingItems(nodes: any[]): EbayItem[] {
  return (nodes || [])
    .map((it: any, i: number) => {
      const price = Number(it?.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ ?? NaN)
      const currency = it?.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'] || 'USD'
      return {
        id: String(it?.itemId?.[0] || i),
        title: String(it?.title?.[0] || 'eBay item'),
        url: String(it?.viewItemURL?.[0] || ''),
        price: Number.isFinite(price) ? price : null,
        currency,
        image: it?.galleryURL?.[0] || it?.pictureURLLarge?.[0] || null,
        condition: it?.condition?.[0]?.conditionDisplayName?.[0] || null,
        shipping:
          it?.shippingInfo?.[0]?.shippingServiceCost?.[0]?.__value__ === '0.0'
            ? 'Free shipping'
            : null,
      } satisfies EbayItem
    })
    .filter((x) => x.url)
}

async function findingSearch(appId: string, params: URLSearchParams): Promise<EbayItem[]> {
  const q = params.get('q') || 'electronics'
  const url = new URL('https://svcs.ebay.com/services/search/FindingService/v1')
  url.searchParams.set('OPERATION-NAME', 'findItemsByKeywords')
  url.searchParams.set('SERVICE-VERSION', '1.13.0')
  url.searchParams.set('SECURITY-APPNAME', appId)
  url.searchParams.set('RESPONSE-DATA-FORMAT', 'JSON')
  url.searchParams.set('REST-PAYLOAD', '')
  url.searchParams.set('keywords', q)
  url.searchParams.set('paginationInput.entriesPerPage', params.get('limit') || '40')
  url.searchParams.set('outputSelector(0)', 'PictureURLLarge')
  url.searchParams.set('outputSelector(1)', 'GalleryInfo')
  if (params.get('cat')) url.searchParams.set('categoryId', params.get('cat')!)

  let filterIdx = 0
  if (params.get('min')) {
    url.searchParams.set(`itemFilter(${filterIdx}).name`, 'MinPrice')
    url.searchParams.set(`itemFilter(${filterIdx}).value`, params.get('min')!)
    url.searchParams.set(`itemFilter(${filterIdx}).paramName`, 'Currency')
    url.searchParams.set(`itemFilter(${filterIdx}).paramValue`, 'USD')
    filterIdx++
  }
  if (params.get('max')) {
    url.searchParams.set(`itemFilter(${filterIdx}).name`, 'MaxPrice')
    url.searchParams.set(`itemFilter(${filterIdx}).value`, params.get('max')!)
    url.searchParams.set(`itemFilter(${filterIdx}).paramName`, 'Currency')
    url.searchParams.set(`itemFilter(${filterIdx}).paramValue`, 'USD')
    filterIdx++
  }
  if (params.get('condition') === 'new') {
    url.searchParams.set(`itemFilter(${filterIdx}).name`, 'Condition')
    url.searchParams.set(`itemFilter(${filterIdx}).value`, '1000')
    filterIdx++
  }
  if (params.get('condition') === 'used') {
    url.searchParams.set(`itemFilter(${filterIdx}).name`, 'Condition')
    url.searchParams.set(`itemFilter(${filterIdx}).value`, '3000')
    filterIdx++
  }
  if (params.get('format') === 'bin') {
    url.searchParams.set(`itemFilter(${filterIdx}).name`, 'ListingType')
    url.searchParams.set(`itemFilter(${filterIdx}).value`, 'FixedPrice')
    filterIdx++
  }
  if (params.get('format') === 'auction') {
    url.searchParams.set(`itemFilter(${filterIdx}).name`, 'ListingType')
    url.searchParams.set(`itemFilter(${filterIdx}).value`, 'Auction')
    filterIdx++
  }

  const sortMap: Record<string, string> = {
    best: 'BestMatch',
    new: 'StartTimeNewest',
    priceAsc: 'PricePlusShippingLowest',
    priceDesc: 'PricePlusShippingHighest',
    ending: 'EndTimeSoonest',
  }
  const sort = params.get('sort')
  if (sort && sortMap[sort]) url.searchParams.set('sortOrder', sortMap[sort])

  const r = await fetch(url.toString())
  if (!r.ok) throw new Error('finding HTTP ' + r.status)
  const data = await r.json()
  const resp = data?.findItemsByKeywordsResponse?.[0]
  const ack = resp?.ack?.[0]
  if (ack && ack !== 'Success' && ack !== 'Warning') {
    throw new Error(resp?.errorMessage?.[0]?.error?.[0]?.message?.[0] || 'Finding API error')
  }
  return mapFindingItems(resp?.searchResult?.[0]?.item || [])
}

export function ebaySearchPlugin(): Plugin {
  return {
    name: 'ebay-search-proxy',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '')
      const envAppId = env.EBAY_APP_ID || process.env.EBAY_APP_ID || ''

      server.middlewares.use('/api/ebay-search', async (req, res) => {
        try {
          const full = new URL(req.url || '', 'http://localhost')
          const searchUrl = buildSearchUrl(full.searchParams)
          const appId = full.searchParams.get('appId') || envAppId

          if (!appId) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(
              JSON.stringify({
                ok: false,
                reason: 'no_app_id',
                searchUrl,
                message: 'Need eBay App ID (Finding API) for live listings.',
              }),
            )
            return
          }

          const items = await findingSearch(appId, full.searchParams)
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          res.end(
            JSON.stringify({
              ok: true,
              source: 'ebay-finding-api',
              query: full.searchParams.get('q'),
              count: items.length,
              searchUrl,
              items,
            }),
          )
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ok: false, error: String(err) }))
        }
      })
    },
  }
}
