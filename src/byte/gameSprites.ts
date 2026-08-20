/** Kenney 1-bit pack sprites — same tiles as VOID BREACH. */

export type PackMobKind =
  | 'bat'
  | 'slime'
  | 'snake'
  | 'ghost'
  | 'squid'
  | 'golem'
  | 'imp'
  | 'skull'
  | 'brute'

type PestDef =
  | { tile: number; frames?: undefined }
  | { frames: number[]; tile?: undefined }

const BCOLS = 49
const BSIZE = 16

const PEST: Record<PackMobKind, PestDef> = {
  bat: { tile: 418 },
  slime: { frames: [459, 460, 461, 462] },
  snake: { tile: 420 },
  ghost: { tile: 419 },
  squid: { tile: 417 },
  golem: { tile: 416 },
  imp: { tile: 405 },
  skull: { tile: 273 },
  brute: { tile: 273 },
}

let bit: HTMLImageElement | null = null
let ready = false
const cache = new Map<string, HTMLCanvasElement | HTMLCanvasElement[]>()
const waiters: Array<() => void> = []

function bakeFrom(
  img: HTMLImageElement,
  cols: number,
  size: number,
  id: number,
  scale: number,
) {
  const c = document.createElement('canvas')
  c.width = Math.ceil(size * scale)
  c.height = Math.ceil(size * scale)
  const g = c.getContext('2d')!
  g.imageSmoothingEnabled = false
  const sx = (id % cols) * size
  const sy = ((id / cols) | 0) * size
  g.drawImage(img, sx, sy, size, size, 0, 0, c.width, c.height)
  return c
}

function ensureSheets() {
  if (bit) return
  bit = new Image()
  bit.src = '/demos/roguelike/assets/bit.png'
  bit.onload = () => {
    cache.clear()
    ready = !!bit?.complete
    if (ready) waiters.splice(0).forEach((fn) => fn())
  }
  bit.onerror = () => {
    ready = false
  }
}

export function whenSpritesReady(fn: () => void) {
  ensureSheets()
  if (ready) fn()
  else waiters.push(fn)
}

export function spritesReady() {
  ensureSheets()
  return ready
}

function spriteFor(kind: PackMobKind, scale = 3): HTMLCanvasElement | HTMLCanvasElement[] | null {
  ensureSheets()
  const key = `${kind}:${scale}`
  if (cache.has(key)) return cache.get(key)!
  const def = PEST[kind]
  if (!def || !bit?.complete) return null

  if (def.frames) {
    const frames = def.frames.map((id) => bakeFrom(bit!, BCOLS, BSIZE, id, scale))
    cache.set(key, frames)
    return frames
  }
  if (def.tile != null) {
    const c = bakeFrom(bit, BCOLS, BSIZE, def.tile, scale)
    cache.set(key, c)
    return c
  }
  return null
}

export function drawPackMob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  kind: PackMobKind,
  phase: number,
  flip = false,
  alpha = 1,
  scale = 3,
) {
  const spr = spriteFor(kind, scale)
  if (!spr) return false
  const frame = Array.isArray(spr)
    ? spr[((phase * 6) | 0) % spr.length]
    : spr
  const hop =
    kind === 'bat' || kind === 'imp'
      ? Math.abs(Math.sin(phase * 8)) * 5
      : Math.abs(Math.sin(phase * 4)) * 2
  const flap = kind === 'bat' ? 1 + Math.sin(phase * 10) * 0.08 : 1

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(cx | 0, (cy + hop) | 0)
  ctx.scale((flip ? -1 : 1) * flap, 2 - flap)
  ctx.drawImage(frame, -frame.width / 2, -frame.height / 2)
  ctx.restore()
  return true
}

export const PACK_MOB_KINDS: PackMobKind[] = [
  'bat',
  'slime',
  'snake',
  'ghost',
  'squid',
  'golem',
  'imp',
  'skull',
  'brute',
]
