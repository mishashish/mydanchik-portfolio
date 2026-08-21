import { useEffect, useRef } from 'react'
import type { Material, Object3D } from 'three'

/** Low-poly brand sculpture via Three.js — loaded on demand, pauses off-screen. */
export default function Scene3D() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let disposed = false
    let raf = 0
    let visible = true
    let cleanupRenderer: (() => void) | undefined

    const boot = async () => {
      const THREE = await import('three')
      if (disposed || !hostRef.current) return

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40)
      camera.position.set(0, 0.35, 4.2)

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      })
      renderer.setClearColor(0x000000, 0)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15
      host.appendChild(renderer.domElement)

      const root = new THREE.Group()
      scene.add(root)

      const matMetal = new THREE.MeshStandardMaterial({
        color: 0xececec,
        metalness: 0.72,
        roughness: 0.28,
        flatShading: true,
      })
      const matDark = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.85,
        roughness: 0.35,
        flatShading: true,
      })
      const matAccent = new THREE.MeshStandardMaterial({
        color: 0x7dffa3,
        metalness: 0.55,
        roughness: 0.22,
        emissive: 0x7dffa3,
        emissiveIntensity: 0.45,
        flatShading: true,
      })
      const matRing = new THREE.MeshStandardMaterial({
        color: 0x9fffc0,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x1f4a32,
        emissiveIntensity: 0.7,
        flatShading: true,
      })

      const addBox = (
        parent: Object3D,
        w: number,
        h: number,
        d: number,
        x: number,
        y: number,
        z: number,
        mat: Material,
        rx = 0,
        ry = 0,
        rz = 0,
      ) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
        mesh.position.set(x, y, z)
        mesh.rotation.set(rx, ry, rz)
        parent.add(mesh)
        return mesh
      }

      const mark = new THREE.Group()
      addBox(mark, 0.24, 1.45, 0.24, -0.58, 0.05, 0, matMetal)
      addBox(mark, 0.24, 1.45, 0.24, 0.58, 0.05, 0, matMetal)
      addBox(mark, 0.2, 0.62, 0.2, -0.24, 0.22, 0, matMetal, 0, 0, 0.72)
      addBox(mark, 0.2, 0.62, 0.2, 0.24, 0.22, 0, matMetal, 0, 0, -0.72)
      addBox(mark, 0.2, 0.2, 0.2, 0, -0.05, 0, matAccent)
      root.add(mark)

      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), matAccent)
      root.add(core)

      const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.04, 6, 56), matRing)
      ringA.rotation.x = Math.PI / 2.35
      root.add(ringA)

      const ringB = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.028, 5, 48), matMetal)
      ringB.rotation.x = Math.PI / 1.65
      ringB.rotation.y = 0.55
      root.add(ringB)

      const ringC = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.018, 4, 64), matDark)
      ringC.rotation.x = Math.PI / 2.1
      ringC.rotation.z = 0.35
      root.add(ringC)

      const bits = new THREE.Group()
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2
        const bit = new THREE.Mesh(
          new THREE.BoxGeometry(0.09, 0.09, 0.09),
          i % 2 === 0 ? matAccent : matMetal,
        )
        bit.position.set(Math.cos(a) * 1.55, Math.sin(a * 1.7) * 0.35, Math.sin(a) * 1.55)
        bits.add(bit)
      }
      root.add(bits)

      const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.78, 0.1, 6), matDark)
      pedestal.position.y = -0.95
      root.add(pedestal)

      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.9, 0.03, 6),
        new THREE.MeshStandardMaterial({
          color: 0x101010,
          metalness: 0.9,
          roughness: 0.45,
          flatShading: true,
        }),
      )
      disc.position.y = -1.02
      root.add(disc)

      scene.add(new THREE.AmbientLight(0xffffff, 0.35))
      const key = new THREE.DirectionalLight(0xffffff, 1.15)
      key.position.set(3, 4, 5)
      scene.add(key)
      const fill = new THREE.DirectionalLight(0x7dffa3, 0.55)
      fill.position.set(-3, 1, -2)
      scene.add(fill)
      const rim = new THREE.PointLight(0x7dffa3, 1.4, 8)
      rim.position.set(0, 0.4, 1.2)
      scene.add(rim)

      const resize = () => {
        const w = host.clientWidth || 1
        const h = host.clientHeight || 1
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
        renderer.setSize(w, h, false)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      }
      resize()

      const clock = new THREE.Clock()
      const tick = () => {
        if (disposed) return
        const t = clock.getElapsedTime()

        if (visible && !reduceMotion) {
          root.rotation.y = t * 0.35
          mark.rotation.y = Math.sin(t * 0.4) * 0.08
          core.rotation.x = t * 0.9
          core.rotation.y = t * 1.1
          ringA.rotation.z = t * 0.55
          ringB.rotation.z = -t * 0.4
          ringC.rotation.y = t * 0.25
          bits.rotation.y = -t * 0.5
          bits.children.forEach((child, i) => {
            child.position.y = Math.sin(t * 1.4 + i) * 0.28
            child.rotation.x = t + i
            child.rotation.y = t * 0.7 + i
          })
          camera.position.x = Math.sin(t * 0.2) * 0.25
          camera.lookAt(0, 0.05, 0)
        }

        renderer.render(scene, camera)
        if (!reduceMotion && visible) raf = requestAnimationFrame(tick)
      }

      renderer.render(scene, camera)
      if (!reduceMotion) raf = requestAnimationFrame(tick)

      const ro = new ResizeObserver(resize)
      ro.observe(host)

      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting
          if (visible && !reduceMotion) {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(tick)
          }
        },
        { threshold: 0.08 },
      )
      io.observe(host)

      cleanupRenderer = () => {
        cancelAnimationFrame(raf)
        ro.disconnect()
        io.disconnect()
        renderer.dispose()
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose()
            const m = obj.material
            if (Array.isArray(m)) m.forEach((x) => x.dispose())
            else m.dispose()
          }
        })
        if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement)
      }
    }

    void boot()

    return () => {
      disposed = true
      cleanupRenderer?.()
    }
  }, [])

  return (
    <div className="scene3d" aria-hidden="true">
      <div className="scene3dHost" ref={hostRef} />
    </div>
  )
}
