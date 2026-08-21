import { useEffect, useRef } from 'react'

/** Lightweight rotating wireframe icosahedron — no Three.js, pauses off-screen. */
export default function Scene3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let visible = true
    let raf = 0
    let t = 0

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    // Icosahedron vertices (unit sphere)
    const phi = (1 + Math.sqrt(5)) / 2
    const raw: [number, number, number][] = [
      [-1, phi, 0],
      [1, phi, 0],
      [-1, -phi, 0],
      [1, -phi, 0],
      [0, -1, phi],
      [0, 1, phi],
      [0, -1, -phi],
      [0, 1, -phi],
      [phi, 0, -1],
      [phi, 0, 1],
      [-phi, 0, -1],
      [-phi, 0, 1],
    ]
    const len = Math.hypot(...raw[0])
    const verts = raw.map(([x, y, z]) => [x / len, y / len, z / len] as [number, number, number])

    const faces: [number, number, number][] = [
      [0, 11, 5],
      [0, 5, 1],
      [0, 1, 7],
      [0, 7, 10],
      [0, 10, 11],
      [1, 5, 9],
      [5, 11, 4],
      [11, 10, 2],
      [10, 7, 6],
      [7, 1, 8],
      [3, 9, 4],
      [3, 4, 2],
      [3, 2, 6],
      [3, 6, 8],
      [3, 8, 9],
      [4, 9, 5],
      [2, 4, 11],
      [6, 2, 10],
      [8, 6, 7],
      [9, 8, 1],
    ]

    const edges = new Set<string>()
    for (const [a, b, c] of faces) {
      for (const [i, j] of [
        [a, b],
        [b, c],
        [c, a],
      ] as const) {
        edges.add(i < j ? `${i}-${j}` : `${j}-${i}`)
      }
    }
    const edgeList = [...edges].map((e) => e.split('-').map(Number) as [number, number])

    const rot = (v: [number, number, number], ax: number, ay: number): [number, number, number] => {
      let [x, y, z] = v
      const cosY = Math.cos(ay)
      const sinY = Math.sin(ay)
      let x1 = x * cosY + z * sinY
      let z1 = -x * sinY + z * cosY
      const cosX = Math.cos(ax)
      const sinX = Math.sin(ax)
      const y1 = y * cosX - z1 * sinX
      z1 = y * sinX + z1 * cosX
      return [x1, y1, z1]
    }

    const draw = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)

      const cx = w * 0.5
      const cy = h * 0.52
      const scale = Math.min(w, h) * 0.36
      const ax = 0.42 + t * 0.35
      const ay = t * 0.55

      const projected = verts.map((v) => {
        const [x, y, z] = rot(v, ax, ay)
        const depth = z + 2.4
        const s = scale / depth
        return { x: cx + x * s, y: cy + y * s, z }
      })

      // Soft depth glow
      const g = ctx.createRadialGradient(cx, cy, 8, cx, cy, scale * 1.35)
      g.addColorStop(0, 'rgba(61, 155, 143, 0.14)')
      g.addColorStop(1, 'rgba(61, 155, 143, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, scale * 1.35, 0, Math.PI * 2)
      ctx.fill()

      ctx.lineCap = 'round'
      for (const [i, j] of edgeList) {
        const a = projected[i]
        const b = projected[j]
        const depth = (a.z + b.z) * 0.5
        const alpha = 0.22 + (depth + 1) * 0.28
        ctx.strokeStyle = `rgba(196, 214, 210, ${alpha.toFixed(3)})`
        ctx.lineWidth = 1.15
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }

      for (const p of projected) {
        const alpha = 0.35 + (p.z + 1) * 0.3
        ctx.fillStyle = `rgba(94, 196, 180, ${alpha.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const tick = () => {
      if (visible && !reduceMotion) t += 0.008
      draw()
      if (!reduceMotion && visible) raf = requestAnimationFrame(tick)
    }

    draw()
    if (!reduceMotion) raf = requestAnimationFrame(tick)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible && !reduceMotion) {
          cancelAnimationFrame(raf)
          raf = requestAnimationFrame(tick)
        }
      },
      { threshold: 0.05 },
    )
    io.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return (
    <div className="scene3d" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}
