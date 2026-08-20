import type { Plugin } from 'vite'
import type { Connect } from 'vite'

async function fetchOlxPage(query: string, limit: number, offset: number) {
  const url = new URL('https://www.olx.ua/api/v1/offers/')
  if (query) url.searchParams.set('query', query)
  url.searchParams.set('limit', String(Math.min(50, Math.max(1, limit))) )
  url.searchParams.set('offset', String(Math.max(0, offset)))

  const r = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; MYDanchikPortfolio/1.0)',
    },
  })
  if (!r.ok) throw new Error('OLX HTTP ' + r.status)
  return r.json() as Promise<{ data?: unknown[]; metadata?: unknown }>
}

async function fetchOlxMany(query: string, want: number, startOffset = 0) {
  const pageSize = 50
  const pages = Math.min(5, Math.max(1, Math.ceil(want / pageSize)))
  const seen = new Set<string>()
  const offers: unknown[] = []
  let metadata: unknown = null

  for (let i = 0; i < pages; i++) {
    const data = await fetchOlxPage(query, pageSize, startOffset + i * pageSize)
    if (!metadata) metadata = data.metadata || null
    const batch = data.data || []
    if (!batch.length) break
    for (const o of batch) {
      const id = String((o as { id?: string | number }).id ?? '')
      if (!id || seen.has(id)) continue
      seen.add(id)
      offers.push(o)
    }
    if (batch.length < pageSize) break
  }

  return { offers, metadata }
}

function mountOlxApi(middlewares: Connect.Server) {
  middlewares.use('/api/olx-search', async (req, res) => {
    try {
      const full = new URL(req.url || '', 'http://localhost')
      const q = full.searchParams.get('q') || ''
      const limit = Number(full.searchParams.get('limit') || 200)
      const offset = Number(full.searchParams.get('offset') || 0)
      const data = await fetchOlxMany(q, limit, offset)
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end(
        JSON.stringify({
          ok: true,
          source: 'olx-live',
          query: q,
          count: data.offers.length,
          offers: data.offers,
          metadata: data.metadata,
        }),
      )
    } catch (err) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ ok: false, error: String(err) }))
    }
  })
}

export function olxSearchPlugin(): Plugin {
  return {
    name: 'olx-search-proxy',
    configureServer(server) {
      mountOlxApi(server.middlewares)
    },
    configurePreviewServer(server) {
      mountOlxApi(server.middlewares)
    },
  }
}
