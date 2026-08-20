/** Procedural pixel mage BYTE — continuous phase, no tile swapping. */

export type ByteDrawOpts = {
  flip?: boolean
  /** continuous walk/idle phase in radians-ish */
  phase?: number
  moving?: boolean
  cast?: number // 0..1
  ember?: boolean
  alpha?: number
}

export type MobKind = 'slime' | 'bat' | 'skull'

const PX = [
  [0, 0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 2, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 0, 0, 0, 1, 0, 0],
]

const COLORS: Record<number, string> = {
  1: '#f4f0e6',
  2: '#1a1a1a',
}

function pset(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  c: string,
) {
  ctx.fillStyle = c
  ctx.fillRect(Math.round(x), Math.round(y), s, s)
}

/** Draw BYTE centered at (cx, cy). Unit size ~ 9*scale wide. */
export function drawByte(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  opts: ByteDrawOpts = {},
) {
  const phase = opts.phase ?? 0
  const moving = !!opts.moving
  const cast = Math.max(0, Math.min(1, opts.cast ?? 0))
  const flip = opts.flip ? -1 : 1
  const bob = moving ? Math.sin(phase) * scale * 0.55 : Math.sin(phase * 0.55) * scale * 0.28
  const lean = moving ? Math.sin(phase) * 0.08 : 0
  const cloak = moving ? Math.sin(phase + 0.4) * scale * 0.45 : Math.sin(phase * 0.5) * scale * 0.15
  const leg = moving ? Math.sin(phase) : 0
  const staffSwing = moving
    ? Math.sin(phase + 0.6) * scale * 0.7
    : Math.sin(phase * 0.4) * scale * 0.2
  const castLift = cast * scale * 2.2

  ctx.save()
  ctx.globalAlpha = opts.alpha ?? 1
  ctx.translate(cx, cy + bob)
  ctx.scale(flip, 1)
  ctx.rotate(lean)

  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.beginPath()
  ctx.ellipse(0, scale * 7.2, scale * 3.2, scale * 0.9, 0, 0, Math.PI * 2)
  ctx.fill()

  const s = Math.max(1, Math.round(scale))
  const ox = -4.5 * s
  const oy = -6 * s

  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(ox + s + cloak * 0.2, oy + s * 4, s * 7, s * 4)
  ctx.fillStyle = '#3a3a3a'
  ctx.fillRect(ox + s * 2 + cloak * 0.4, oy + s * 5, s * 5, s * 3)

  for (let row = 0; row < PX.length; row++) {
    for (let col = 0; col < PX[row].length; col++) {
      const v = PX[row][col]
      if (!v) continue
      pset(ctx, ox + col * s, oy + row * s, s, COLORS[v])
    }
  }

  pset(ctx, ox + s * 4, oy - s, s, '#f4f0e6')
  pset(ctx, ox + s * 3.5, oy - s * 2, s, '#cfc7a6')

  const ly = oy + s * 8
  ctx.fillStyle = '#d8d2c4'
  ctx.fillRect(ox + s * 2, ly + leg * s * 0.6, s * 2, s * 2)
  ctx.fillRect(ox + s * 5, ly - leg * s * 0.6, s * 2, s * 2)
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(ox + s * 2, ly + s * 1.6 + leg * s * 0.6, s * 2, s * 0.6)
  ctx.fillRect(ox + s * 5, ly + s * 1.6 - leg * s * 0.6, s * 2, s * 0.6)

  const sx = ox + s * 8 + staffSwing
  const sy = oy + s * 1 - castLift
  ctx.fillStyle = '#6a4a28'
  ctx.fillRect(sx, sy, s, s * 8)
  ctx.fillStyle = '#8a6a3a'
  ctx.fillRect(sx, sy, Math.max(1, s / 2), s * 8)
  ctx.fillStyle = '#6a4a28'
  ctx.fillRect(sx - s * 2, sy, s * 2, s)
  ctx.fillRect(sx - s * 2, sy, s, s * 2)

  if (opts.ember !== false) {
    const ex = sx + s * 0.2
    const ey = sy + s * 0.2 - cast * s
    const pulse = 0.65 + Math.sin(phase * 3) * 0.35
    ctx.globalAlpha = (opts.alpha ?? 1) * (0.35 * pulse + cast * 0.4)
    ctx.fillStyle = '#ff6a2a'
    ctx.beginPath()
    ctx.arc(ex + s * 0.5, ey + s * 0.5, s * (1.6 + cast), 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = opts.alpha ?? 1
    pset(ctx, ex, ey, s, '#ffb347')
    pset(ctx, ex + s * 0.3, ey + s * 0.3, Math.max(1, s / 2), '#fff3a0')
  }

  ctx.restore()
}

export function drawMob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  kind: MobKind,
  phase: number,
  flip = false,
  alpha = 1,
) {
  const s = Math.max(1, Math.round(scale))
  const bob = Math.sin(phase * (kind === 'bat' ? 8 : 4)) * (kind === 'bat' ? s * 1.2 : s * 0.4)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(cx, cy + bob)
  ctx.scale(flip ? -1 : 1, 1)

  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.beginPath()
  ctx.ellipse(0, s * 4, s * 2.4, s * 0.7, 0, 0, Math.PI * 2)
  ctx.fill()

  if (kind === 'slime') {
    ctx.fillStyle = '#5dff9a'
    ctx.fillRect(-s * 3, -s * 2, s * 6, s * 5)
    ctx.fillStyle = '#2a8a55'
    ctx.fillRect(-s * 2, -s, s, s)
    ctx.fillRect(s, -s, s, s)
    ctx.fillStyle = '#fff'
    ctx.fillRect(-s * 2, -s, Math.max(1, s / 2), Math.max(1, s / 2))
    ctx.fillRect(s, -s, Math.max(1, s / 2), Math.max(1, s / 2))
  } else if (kind === 'bat') {
    const wing = Math.sin(phase * 10) * s * 1.5
    ctx.fillStyle = '#c8c8d8'
    ctx.fillRect(-s * 5 - wing, -s, s * 3, s * 2)
    ctx.fillRect(s * 2 + wing, -s, s * 3, s * 2)
    ctx.fillStyle = '#a0a0b8'
    ctx.fillRect(-s * 2, -s * 2, s * 4, s * 4)
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(-s, -s, s, s)
    ctx.fillRect(s * 0.5, -s, s, s)
  } else {
    ctx.fillStyle = '#e8e0d0'
    ctx.fillRect(-s * 3, -s * 3, s * 6, s * 6)
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(-s * 2, -s, s, s * 2)
    ctx.fillRect(s, -s, s, s * 2)
    ctx.fillRect(-s, s * 1.5, s * 3, s)
  }

  ctx.restore()
}

export function drawFireball(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  life: number,
) {
  const s = Math.max(1, Math.round(scale))
  ctx.save()
  ctx.globalAlpha = Math.min(1, life * 1.4)
  ctx.fillStyle = 'rgba(255,90,40,0.35)'
  ctx.beginPath()
  ctx.arc(x, y, s * 2.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ff5a2a'
  ctx.fillRect(x - s, y - s, s * 2, s * 2)
  ctx.fillStyle = '#ffb347'
  ctx.fillRect(x - s * 0.5, y - s * 0.5, s, s)
  ctx.fillStyle = '#fff3a0'
  ctx.fillRect(x - s * 0.25, y - s * 0.25, Math.max(1, s / 2), Math.max(1, s / 2))
  ctx.restore()
}

export function bakeByteSprite(
  scale = 3,
  opts: ByteDrawOpts = {},
): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = 16 * scale
  c.height = 18 * scale
  const g = c.getContext('2d')!
  g.imageSmoothingEnabled = false
  drawByte(g, c.width / 2, c.height / 2 + scale, scale, opts)
  return c
}
