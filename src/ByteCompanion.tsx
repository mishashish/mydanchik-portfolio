import { useEffect, useRef } from 'react'
import { drawByte, drawFireball } from './byte/drawByte'
import {
  drawPackMob,
  PACK_MOB_KINDS,
  whenSpritesReady,
  type PackMobKind,
} from './byte/gameSprites'
import './ByteCompanion.css'

type Props = {
  label?: string
  /** When true: BYTE walks into the play stage, then dungeon layer hides. */
  playing?: boolean
}

type Rect = { x: number; y: number; w: number; h: number }
type Mob = {
  id: number
  kind: PackMobKind
  x: number
  y: number
  hp: number
  phase: number
  flip: boolean
  tx: number
  ty: number
  hurt: number
}
type Shot = { x: number; y: number; vx: number; vy: number; life: number }
type Fx = { x: number; y: number; life: number; color: string }

export function ByteCompanion({ label = 'BYTE · dungeon', playing = false }: Props) {
  const layerRef = useRef<HTMLCanvasElement>(null)
  const hitRef = useRef<HTMLDivElement>(null)
  const playingRef = useRef(playing)

  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  useEffect(() => {
    const canvas = layerRef.current
    const hit = hitRef.current
    if (!canvas || !hit) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let dpr = Math.min(2, window.devicePixelRatio || 1)
    let W = window.innerWidth
    let H = window.innerHeight

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      W = window.innerWidth
      H = window.innerHeight
      canvas!.width = W * dpr
      canvas!.height = H * dpr
      canvas!.style.width = `${W}px`
      canvas!.style.height = `${H}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.imageSmoothingEnabled = false
    }
    resize()

    let x = W - 100
    let y = H - 120
    let tx = x
    let ty = y
    let phase = 0
    let flip = true
    let moving = false
    let cast = 0
    let mode: 'wander' | 'hunt' | 'rest' | 'behind' | 'enter' | 'gone' = 'wander'
    let modeT = 2
    let behind = false
    let cd = 0
    let kills = 0
    let mobId = 1
    let fade = 1
    let stuckT = 0
    let last = performance.now()
    let raf = 0
    let paused = document.hidden
    let blocks: Rect[] = []
    let walls: Rect[] = []
    let blockScan = 0
    const mobs: Mob[] = []
    const shots: Shot[] = []
    const fx: Fx[] = []
    const KINDS = PACK_MOB_KINDS

    // never steal scroll / clicks from the page
    hit.style.pointerEvents = 'none'

    function scanBlocks() {
      const panelSel = [
        '.panel',
        '.stackCard',
        '.projectCard',
        '.serviceCard',
        '.playStage',
        '.heroContent',
        '.blockHead',
        '.topbar',
        'footer',
      ]
      // Hard walls only for chrome — colliding with every card caused snap/teleports.
      const wallSel = ['.topbar']
      const collect = (sel: string[]) => {
        const out: Rect[] = []
        document.querySelectorAll<HTMLElement>(sel.join(',')).forEach((el) => {
          const r = el.getBoundingClientRect()
          if (r.width < 40 || r.height < 40) return
          if (r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) return
          const pad = 4
          out.push({
            x: r.left + pad,
            y: r.top + pad,
            w: Math.max(20, r.width - pad * 2),
            h: Math.max(20, r.height - pad * 2),
          })
        })
        return out
      }
      blocks = collect(panelSel)
      walls = collect(wallSel)
    }

    function playCenter() {
      const el = document.querySelector('.playStage') as HTMLElement | null
      if (!el) return { x: W / 2, y: H / 2 }
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height * 0.55 }
    }

    function pointInRect(px: number, py: number, r: Rect, inset = 10) {
      return (
        px > r.x + inset &&
        px < r.x + r.w - inset &&
        py > r.y + inset &&
        py < r.y + r.h - inset
      )
    }

    function collide(nx: number, ny: number, rad = 10) {
      const play = document.querySelector('.playStage') as HTMLElement | null
      const pr = play?.getBoundingClientRect()
      for (const r of walls) {
        if ((mode === 'enter' || mode === 'gone') && pr) {
          if (
            r.x < pr.right &&
            r.x + r.w > pr.left &&
            r.y < pr.bottom &&
            r.y + r.h > pr.top &&
            Math.abs(r.w - (pr.width - 12)) < 40
          ) {
            continue
          }
        }
        const cx = Math.max(r.x, Math.min(nx, r.x + r.w))
        const cy = Math.max(r.y, Math.min(ny, r.y + r.h))
        if (Math.hypot(nx - cx, ny - cy) < rad) return r
      }
      return null
    }

    function steer(fromX: number, fromY: number, toX: number, toY: number, speed: number, dt: number) {
      let dx = toX - fromX
      let dy = toY - fromY
      const dist = Math.hypot(dx, dy) || 1
      // arrive softly — no overshoot jumps
      const step = Math.min(speed * dt, dist)
      dx = (dx / dist) * step
      dy = (dy / dist) * step
      let nx = fromX + dx
      let ny = fromY + dy
      if (collide(nx, ny)) {
        if (!collide(fromX + dx, fromY)) {
          nx = fromX + dx
          ny = fromY
        } else if (!collide(fromX, fromY + dy)) {
          nx = fromX
          ny = fromY + dy
        } else {
          // blocked — stay put (never snap around walls)
          nx = fromX
          ny = fromY
        }
      }
      return { x: nx, y: ny, moving: Math.hypot(nx - fromX, ny - fromY) > 0.35 }
    }

    function clampPos(px: number, py: number) {
      return {
        x: Math.max(36, Math.min(W - 36, px)),
        y: Math.max(70, Math.min(H - 36, py)),
      }
    }

    function pickCorridorTarget() {
      for (let i = 0; i < 18; i++) {
        const px = 48 + Math.random() * Math.max(40, W - 96)
        const py = 90 + Math.random() * Math.max(40, H - 150)
        const blocked = blocks.some((r) => pointInRect(px, py, r, 4))
        if (!blocked) return clampPos(px, py)
      }
      if (blocks.length) {
        const r = blocks[(Math.random() * blocks.length) | 0]
        const side = (Math.random() * 4) | 0
        if (side === 0) return clampPos(r.x - 24, r.y + r.h * Math.random())
        if (side === 1) return clampPos(r.x + r.w + 24, r.y + r.h * Math.random())
        if (side === 2) return clampPos(r.x + r.w * Math.random(), r.y - 24)
        return clampPos(r.x + r.w * Math.random(), r.y + r.h + 24)
      }
      return clampPos(40 + Math.random() * (W - 80), 80 + Math.random() * (H - 140))
    }

    function spawnMob() {
      if (mobs.length >= 5 || reduce || mode === 'enter' || mode === 'gone') return
      const kind = KINDS[(Math.random() * KINDS.length) | 0]
      let sx = 60 + Math.random() * (W - 120)
      let sy = 90 + Math.random() * (H - 160)
      if (blocks.length && Math.random() < 0.7) {
        const r = blocks[(Math.random() * blocks.length) | 0]
        const edge = (Math.random() * 4) | 0
        if (edge === 0) {
          sx = r.x - 20
          sy = r.y + Math.random() * r.h
        } else if (edge === 1) {
          sx = r.x + r.w + 20
          sy = r.y + Math.random() * r.h
        } else if (edge === 2) {
          sx = r.x + Math.random() * r.w
          sy = r.y - 20
        } else {
          sx = r.x + Math.random() * r.w
          sy = r.y + r.h + 20
        }
      }
      const p = clampPos(sx, sy)
      mobs.push({
        id: mobId++,
        kind,
        x: p.x,
        y: p.y,
        hp: kind === 'golem' || kind === 'brute' || kind === 'skull' ? 3 : 2,
        phase: Math.random() * 10,
        flip: Math.random() < 0.5,
        tx: p.x,
        ty: p.y,
        hurt: 0,
      })
    }

    function nearestMob(range: number) {
      let best: Mob | null = null
      let bd = range
      for (const m of mobs) {
        const d = Math.hypot(m.x - x, m.y - y)
        if (d < bd) {
          bd = d
          best = m
        }
      }
      return best
    }

    function castFire(target: Mob) {
      if (cd > 0) return
      cd = 0.55
      cast = 1
      const dx = target.x - x
      const dy = target.y - y
      const d = Math.hypot(dx, dy) || 1
      shots.push({
        x: x + (dx / d) * 14,
        y: y + (dy / d) * 8,
        vx: (dx / d) * 280,
        vy: (dy / d) * 280,
        life: 0.9,
      })
    }

    function burst(px: number, py: number, color: string) {
      for (let i = 0; i < 5; i++) {
        fx.push({
          x: px + (Math.random() - 0.5) * 16,
          y: py + (Math.random() - 0.5) * 16,
          life: 0.35 + Math.random() * 0.25,
          color,
        })
      }
    }

    function beginEnter() {
      if (mode === 'enter' || mode === 'gone') return
      mode = 'enter'
      modeT = 8
      const p = playCenter()
      tx = p.x
      ty = p.y
      mobs.length = 0
      shots.length = 0
      // do NOT scroll the page — user already started play
    }

    scanBlocks()
    const t0 = pickCorridorTarget()
    tx = t0.x
    ty = t0.y
    whenSpritesReady(() => {
      if (!reduce) {
        spawnMob()
        spawnMob()
        spawnMob()
      }
    })
    if (playingRef.current) beginEnter()

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (paused) return
      let dt = (now - last) / 1000
      last = now
      if (dt > 0.05) dt = 0.05

      if (playingRef.current && mode !== 'enter' && mode !== 'gone') beginEnter()
      if (!playingRef.current && (mode === 'gone' || mode === 'enter')) {
        mode = 'wander'
        fade = 1
        canvas.style.opacity = ''
        hit.style.opacity = ''
        modeT = 1
        const p = pickCorridorTarget()
        tx = p.x
        ty = p.y
        spawnMob()
      }

      blockScan += dt
      if (blockScan > 0.45) {
        blockScan = 0
        scanBlocks()
        if (mode === 'enter') {
          const p = playCenter()
          tx = p.x
          ty = p.y
        }
      }

      cd = Math.max(0, cd - dt)
      cast = Math.max(0, cast - dt * 2.2)
      modeT -= dt

      if (mode === 'gone') {
        ctx.clearRect(0, 0, W, H)
        canvas.style.opacity = '0'
        hit.style.opacity = '0'
        return
      }

      if (mode === 'enter') {
        fade = Math.max(0, fade - dt * 0.35)
        const speed = 160
        const stepped = steer(x, y, tx, ty, speed, dt)
        x = stepped.x
        y = stepped.y
        moving = stepped.moving
        if (moving) {
          if (Math.abs(tx - x) > 2) flip = tx < x
          phase += dt * 12
        } else phase += dt * 3
        cast = Math.max(cast, 0.4)
        const dist = Math.hypot(tx - x, ty - y)
        behind = true
        if (dist < 28 || fade <= 0.05) {
          mode = 'gone'
          burst(x, y, '#ffb347')
        }
      } else {
        if (!reduce && mobs.length < 4 && Math.random() < dt * 0.22) spawnMob()

        const prey = nearestMob(180)
        if (!reduce && prey && Math.hypot(prey.x - x, prey.y - y) < 160) {
          mode = 'hunt'
          tx = prey.x
          ty = prey.y
          if (cd <= 0 && Math.hypot(prey.x - x, prey.y - y) < 130) castFire(prey)
        } else if (modeT <= 0) {
          const roll = Math.random()
          if (roll < 0.28) {
            mode = 'rest'
            modeT = 1.2 + Math.random() * 1.8
          } else if (roll < 0.42) {
            // walk toward a card edge (still continuous), not a hard warp inside
            mode = 'behind'
            modeT = 2 + Math.random() * 2
            if (blocks.length) {
              const r = blocks[(Math.random() * blocks.length) | 0]
              const side = (Math.random() * 4) | 0
              if (side === 0) {
                tx = r.x - 20
                ty = r.y + r.h * (0.3 + Math.random() * 0.4)
              } else if (side === 1) {
                tx = r.x + r.w + 20
                ty = r.y + r.h * (0.3 + Math.random() * 0.4)
              } else if (side === 2) {
                tx = r.x + r.w * Math.random()
                ty = r.y - 20
              } else {
                tx = r.x + r.w * Math.random()
                ty = r.y + r.h + 20
              }
              const c = clampPos(tx, ty)
              tx = c.x
              ty = c.y
            } else {
              const p = pickCorridorTarget()
              tx = p.x
              ty = p.y
            }
          } else {
            // stay in gutters / empty space only
            mode = 'wander'
            modeT = 2.5 + Math.random() * 3.5
            const p = pickCorridorTarget()
            tx = p.x
            ty = p.y
          }
        }

        const speed = mode === 'rest' ? 0 : mode === 'hunt' ? 130 : mode === 'behind' ? 90 : 105
        if (speed > 0) {
          const stepped = steer(x, y, tx, ty, speed, dt)
          x = stepped.x
          y = stepped.y
          moving = stepped.moving
          if (moving) {
            if (Math.abs(tx - x) > 2) flip = tx < x
            phase += dt * (mode === 'hunt' ? 11 : 8)
          } else phase += dt * 2.2
        } else {
          moving = false
          phase += dt * 2
        }
        behind = blocks.some((r) => pointInRect(x, y, r, 12))

        if (moving) stuckT = 0
        else stuckT += dt
        if (stuckT > 1.4) {
          // only pick a new walk target — never teleport the sprite
          stuckT = 0
          const p = pickCorridorTarget()
          tx = p.x
          ty = p.y
          mode = 'wander'
          modeT = 2.5
        }
      }

      const cpos = clampPos(x, y)
      x = cpos.x
      y = cpos.y

      // always under UI cards — never steal attention
      canvas.style.zIndex = '0'
      hit.style.zIndex = '0'
      hit.style.transform = `translate3d(${x - 28}px, ${y - 28}px, 0)`
      if (mode === 'enter') canvas.style.opacity = String(Math.max(0.12, fade * 0.5))
      else canvas.style.opacity = ''

      if (mode !== 'enter') {
        for (const m of mobs) {
          m.phase += dt
          m.hurt = Math.max(0, m.hurt - dt)
          if (Math.random() < dt * 0.4) {
            const p = pickCorridorTarget()
            m.tx = p.x
            m.ty = p.y
          }
          const dB = Math.hypot(m.x - x, m.y - y)
          if (dB < 90) {
            m.tx = m.x + (m.x - x) * 0.4
            m.ty = m.y + (m.y - y) * 0.4
          }
          const sp = m.kind === 'bat' || m.kind === 'imp' || m.kind === 'skull' ? 70 : 42
          const st = steer(m.x, m.y, m.tx, m.ty, sp, dt)
          m.x = st.x
          m.y = st.y
          if (st.moving && Math.abs(m.tx - m.x) > 1) m.flip = m.tx < m.x
          const cp = clampPos(m.x, m.y)
          m.x = cp.x
          m.y = cp.y
        }

        for (let i = shots.length - 1; i >= 0; i--) {
          const s = shots[i]
          s.x += s.vx * dt
          s.y += s.vy * dt
          s.life -= dt
          let dead = s.life <= 0
          for (let j = mobs.length - 1; j >= 0; j--) {
            const m = mobs[j]
            if (Math.hypot(m.x - s.x, m.y - s.y) < 18) {
              m.hp -= 1
              m.hurt = 0.25
              burst(m.x, m.y, '#ff8a3a')
              dead = true
              if (m.hp <= 0) {
                burst(m.x, m.y, '#5dff9a')
                mobs.splice(j, 1)
                kills++
              }
              break
            }
          }
          if (dead) shots.splice(i, 1)
        }
      }

      for (let i = fx.length - 1; i >= 0; i--) {
        fx[i].life -= dt
        if (fx[i].life <= 0) fx.splice(i, 1)
      }

      ctx.clearRect(0, 0, W, H)
      ctx.globalAlpha = mode === 'enter' ? fade : 1

      for (const m of mobs) {
        const ok = drawPackMob(
          ctx,
          m.x,
          m.y,
          m.kind,
          m.phase,
          m.flip,
          (behind ? 0.45 : 0.7) * (m.hurt > 0 ? 0.55 : 1),
          2.6,
        )
        if (!ok) {
          ctx.globalAlpha = 0.25
          ctx.fillStyle = '#9fe7b4'
          ctx.fillRect(m.x - 3, m.y - 3, 6, 6)
          ctx.globalAlpha = mode === 'enter' ? fade : 1
        }
      }
      for (const s of shots) drawFireball(ctx, s.x, s.y, 1.8, s.life)
      for (const p of fx) {
        ctx.globalAlpha = Math.max(0, p.life * 1.5) * (mode === 'enter' ? fade : 0.7)
        ctx.fillStyle = p.color
        ctx.fillRect(p.x, p.y, 2, 2)
      }
      ctx.globalAlpha = mode === 'enter' ? fade : 1

      drawByte(ctx, x, y, 2.7, {
        flip,
        phase,
        moving,
        cast,
        ember: true,
        alpha: (behind ? 0.4 : 0.75) * (mode === 'enter' ? Math.max(0.2, fade) : 1),
      })
    }

    raf = requestAnimationFrame(tick)

    const onVis = () => {
      paused = document.hidden
    }
    const onResize = () => resize()
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('scroll', scanBlocks, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('scroll', scanBlocks)
    }
  }, [])

  return (
    <>
      <canvas ref={layerRef} className="byteDungeon" aria-hidden="true" />
      <div ref={hitRef} className="byteHit" aria-hidden="true" title={label}>
        <span className="byteTag">BYTE</span>
      </div>
    </>
  )
}
