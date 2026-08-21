import { useEffect, useRef, useState } from 'react'
import type { Material, Object3D } from 'three'

/** Interactive low-poly brand sculpture — drag to orbit. */
export default function Scene3D() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let disposed = false
    let raf = 0
    let cleanup: (() => void) | undefined

    const boot = async () => {
      try {
        const THREE = await import('three')
        const { OrbitControls } = await import('three/addons/controls/OrbitControls.js')
        if (disposed || !hostRef.current) return

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50)
        camera.position.set(2.4, 1.4, 3.6)

        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        })
        if (!renderer.getContext()) {
          setStatus('error')
          return
        }

        renderer.setClearColor(0x000000, 0)
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.35
        renderer.domElement.style.display = 'block'
        renderer.domElement.style.width = '100%'
        renderer.domElement.style.height = '100%'
        renderer.domElement.style.touchAction = 'none'
        renderer.domElement.style.cursor = 'grab'
        host.appendChild(renderer.domElement)

        const root = new THREE.Group()
        scene.add(root)

        // Low metalness so meshes stay visible without an HDRI env map
        const matMetal = new THREE.MeshStandardMaterial({
          color: 0xf2f2f2,
          metalness: 0.18,
          roughness: 0.42,
          flatShading: true,
        })
        const matDark = new THREE.MeshStandardMaterial({
          color: 0x2a2a2a,
          metalness: 0.25,
          roughness: 0.55,
          flatShading: true,
        })
        const matAccent = new THREE.MeshStandardMaterial({
          color: 0x7dffa3,
          metalness: 0.12,
          roughness: 0.35,
          emissive: 0x3d9b6e,
          emissiveIntensity: 0.85,
          flatShading: true,
        })
        const matRing = new THREE.MeshStandardMaterial({
          color: 0xb8ffd0,
          metalness: 0.2,
          roughness: 0.3,
          emissive: 0x2a6b48,
          emissiveIntensity: 0.75,
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
        addBox(mark, 0.22, 0.22, 0.22, 0, -0.05, 0, matAccent)
        root.add(mark)

        const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), matAccent)
        root.add(core)

        const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.05, 8, 56), matRing)
        ringA.rotation.x = Math.PI / 2.35
        root.add(ringA)

        const ringB = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.035, 6, 48), matMetal)
        ringB.rotation.x = Math.PI / 1.65
        ringB.rotation.y = 0.55
        root.add(ringB)

        const ringC = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.022, 5, 64), matDark)
        ringC.rotation.x = Math.PI / 2.1
        ringC.rotation.z = 0.35
        root.add(ringC)

        const bits = new THREE.Group()
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2
          const bit = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 0.1),
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
            color: 0x1c1c1c,
            metalness: 0.2,
            roughness: 0.6,
            flatShading: true,
          }),
        )
        disc.position.y = -1.02
        root.add(disc)

        scene.add(new THREE.AmbientLight(0xffffff, 0.85))
        scene.add(new THREE.HemisphereLight(0xffffff, 0x1a2a22, 0.9))
        const key = new THREE.DirectionalLight(0xffffff, 1.6)
        key.position.set(3.5, 5, 4)
        scene.add(key)
        const fill = new THREE.DirectionalLight(0x7dffa3, 0.9)
        fill.position.set(-4, 2, -2)
        scene.add(fill)
        const rim = new THREE.PointLight(0x7dffa3, 2.2, 10)
        rim.position.set(0, 0.6, 2)
        scene.add(rim)

        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.08
        controls.enablePan = false
        controls.minDistance = 2.2
        controls.maxDistance = 6.5
        controls.minPolarAngle = 0.35
        controls.maxPolarAngle = Math.PI / 1.55
        controls.autoRotate = !reduceMotion
        controls.autoRotateSpeed = 1.1
        controls.target.set(0, 0.05, 0)
        controls.update()

        let userDrag = false
        controls.addEventListener('start', () => {
          userDrag = true
          controls.autoRotate = false
          renderer.domElement.style.cursor = 'grabbing'
        })
        controls.addEventListener('end', () => {
          renderer.domElement.style.cursor = 'grab'
          window.setTimeout(() => {
            if (!disposed && !reduceMotion) controls.autoRotate = true
            userDrag = false
          }, 1800)
        })

        const resize = () => {
          const w = Math.max(1, host.clientWidth)
          const h = Math.max(1, host.clientHeight)
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
          renderer.setSize(w, h, false)
          camera.aspect = w / h
          camera.updateProjectionMatrix()
          renderer.render(scene, camera)
        }
        resize()

        const clock = new THREE.Clock()
        let visible = true

        const tick = () => {
          if (disposed) return
          const t = clock.getElapsedTime()

          if (visible) {
            if (!userDrag) {
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
            }
            controls.update()
            renderer.render(scene, camera)
          }

          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)

        const ro = new ResizeObserver(resize)
        ro.observe(host)

        const io = new IntersectionObserver(
          ([entry]) => {
            visible = entry.isIntersecting
            controls.autoRotate = visible && !reduceMotion && !userDrag
          },
          { threshold: 0.05 },
        )
        io.observe(host)

        setStatus('ready')

        cleanup = () => {
          cancelAnimationFrame(raf)
          ro.disconnect()
          io.disconnect()
          controls.dispose()
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
      } catch (err) {
        console.error('Scene3D failed', err)
        if (!disposed) setStatus('error')
      }
    }

    void boot()

    return () => {
      disposed = true
      cleanup?.()
    }
  }, [])

  return (
    <div className="scene3d">
      <div className="scene3dHost" ref={hostRef} />
      {status === 'loading' && <span className="scene3dHint">loading 3d…</span>}
      {status === 'error' && <span className="scene3dHint">3d unavailable</span>}
      {status === 'ready' && <span className="scene3dHint scene3dHint--idle">drag to spin</span>}
    </div>
  )
}
