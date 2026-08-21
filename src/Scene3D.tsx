import { useEffect, useRef, useState } from 'react'
import type { Material, MeshStandardMaterial, Object3D, Texture } from 'three'

/** 3D BYTE mage (game silhouette) with pixel-colored textures. Drag to orbit. */
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
        const textures: Texture[] = []

        const makePixelTex = (
          draw: (ctx: CanvasRenderingContext2D, size: number) => void,
          size = 32,
        ) => {
          const c = document.createElement('canvas')
          c.width = size
          c.height = size
          const ctx = c.getContext('2d')!
          ctx.imageSmoothingEnabled = false
          draw(ctx, size)
          const tex = new THREE.CanvasTexture(c)
          tex.magFilter = THREE.NearestFilter
          tex.minFilter = THREE.NearestFilter
          tex.colorSpace = THREE.SRGBColorSpace
          tex.needsUpdate = true
          textures.push(tex)
          return tex
        }

        const skinTex = makePixelTex((ctx, n) => {
          ctx.fillStyle = '#f4f0e6'
          ctx.fillRect(0, 0, n, n)
          ctx.fillStyle = '#e8e0d0'
          for (let y = 0; y < n; y += 4) {
            for (let x = (y / 4) % 2 === 0 ? 0 : 2; x < n; x += 4) {
              ctx.fillRect(x, y, 2, 2)
            }
          }
          ctx.fillStyle = '#cfc7a6'
          ctx.fillRect(n * 0.15, n * 0.7, n * 0.7, n * 0.2)
        })

        const cloakTex = makePixelTex((ctx, n) => {
          ctx.fillStyle = '#2a2a2a'
          ctx.fillRect(0, 0, n, n)
          ctx.fillStyle = '#3a3a3a'
          for (let i = 0; i < 8; i++) {
            ctx.fillRect(i * 4, (i % 3) * 6, 3, n)
          }
          ctx.fillStyle = '#1f1f1f'
          ctx.fillRect(0, n * 0.75, n, n * 0.25)
          ctx.fillStyle = '#4a6a58'
          ctx.fillRect(n * 0.35, n * 0.12, n * 0.3, n * 0.08)
        })

        const woodTex = makePixelTex((ctx, n) => {
          ctx.fillStyle = '#6a4a28'
          ctx.fillRect(0, 0, n, n)
          ctx.fillStyle = '#8a6a3a'
          for (let x = 2; x < n; x += 5) ctx.fillRect(x, 0, 2, n)
          ctx.fillStyle = '#4a3018'
          ctx.fillRect(0, 0, 2, n)
          ctx.fillRect(n - 3, n * 0.2, 2, n * 0.6)
        })

        const fireTex = makePixelTex((ctx, n) => {
          const g = ctx.createRadialGradient(n / 2, n / 2, 2, n / 2, n / 2, n / 2)
          g.addColorStop(0, '#fff3a0')
          g.addColorStop(0.35, '#ffb347')
          g.addColorStop(0.7, '#ff6a2a')
          g.addColorStop(1, '#c03010')
          ctx.fillStyle = g
          ctx.fillRect(0, 0, n, n)
          ctx.fillStyle = '#ff8a3a'
          ctx.fillRect(n * 0.2, n * 0.15, 4, 4)
          ctx.fillStyle = '#fff3a0'
          ctx.fillRect(n * 0.45, n * 0.4, 3, 3)
        })

        const bootTex = makePixelTex((ctx, n) => {
          ctx.fillStyle = '#1a1a1a'
          ctx.fillRect(0, 0, n, n)
          ctx.fillStyle = '#2e2e2e'
          ctx.fillRect(0, 0, n, n * 0.35)
          ctx.fillStyle = '#7dffa3'
          ctx.fillRect(n * 0.2, n * 0.55, n * 0.6, 2)
        })

        const mat = (
          map: Texture,
          extras: Partial<ConstructorParameters<typeof THREE.MeshStandardMaterial>[0]> = {},
        ) =>
          new THREE.MeshStandardMaterial({
            map,
            metalness: 0.05,
            roughness: 0.72,
            flatShading: true,
            ...extras,
          })

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50)
        camera.position.set(2.6, 1.7, 3.8)

        const renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
        })
        if (!renderer.getContext()) {
          setStatus('error')
          return
        }
        renderer.setClearColor(0x000000, 0)
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.25
        renderer.domElement.style.cssText =
          'display:block;width:100%;height:100%;touch-action:none;cursor:grab;image-rendering:pixelated'
        host.appendChild(renderer.domElement)

        const root = new THREE.Group()
        scene.add(root)

        const mage = new THREE.Group()
        mage.position.y = -0.15
        root.add(mage)

        const box = (
          parent: Object3D,
          w: number,
          h: number,
          d: number,
          x: number,
          y: number,
          z: number,
          material: Material,
          rx = 0,
          ry = 0,
          rz = 0,
        ) => {
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
          mesh.position.set(x, y, z)
          mesh.rotation.set(rx, ry, rz)
          parent.add(mesh)
          return mesh
        }

        const skin = mat(skinTex)
        const cloak = mat(cloakTex)
        const cloakHi = mat(cloakTex, { color: 0xb0b0b0 })
        const wood = mat(woodTex)
        const woodHi = mat(woodTex, { color: 0xd4b48a })
        const fire = mat(fireTex, {
          emissive: 0xff6a2a,
          emissiveIntensity: 1.1,
          emissiveMap: fireTex,
          roughness: 0.4,
        })
        const boots = mat(bootTex)
        const eye = new THREE.MeshStandardMaterial({
          color: 0x1a1a1a,
          metalness: 0.1,
          roughness: 0.6,
          flatShading: true,
        })
        const hatTip = mat(skinTex, { color: 0xcfc7a6 })

        // Head (cream BYTE face)
        const head = new THREE.Group()
        head.position.set(0, 0.95, 0)
        mage.add(head)
        box(head, 0.72, 0.62, 0.55, 0, 0, 0, skin)
        box(head, 0.22, 0.22, 0.12, 0.08, 0.06, 0.28, eye) // eye
        box(head, 0.18, 0.18, 0.18, 0.05, 0.42, -0.05, skin) // top bump
        box(head, 0.16, 0.16, 0.16, -0.08, 0.55, -0.02, hatTip) // hat tip

        // Cloak / robe
        const robe = new THREE.Group()
        robe.position.set(0, 0.15, 0)
        mage.add(robe)
        box(robe, 0.95, 0.85, 0.7, 0, 0.15, -0.02, cloak)
        box(robe, 1.05, 0.55, 0.55, 0, -0.25, -0.08, cloakHi)
        box(robe, 0.35, 0.55, 0.25, -0.55, 0.2, 0, cloak) // sleeve L
        box(robe, 0.35, 0.55, 0.25, 0.55, 0.2, 0, cloak) // sleeve R

        // Legs
        const legs = new THREE.Group()
        legs.position.set(0, -0.55, 0)
        mage.add(legs)
        const legL = box(legs, 0.28, 0.45, 0.28, -0.22, 0, 0.05, skin)
        const legR = box(legs, 0.28, 0.45, 0.28, 0.22, 0, 0.05, skin)
        box(legs, 0.3, 0.14, 0.34, -0.22, -0.28, 0.06, boots)
        box(legs, 0.3, 0.14, 0.34, 0.22, -0.28, 0.06, boots)

        // Staff + fireball
        const staff = new THREE.Group()
        staff.position.set(0.85, 0.55, 0.1)
        mage.add(staff)
        box(staff, 0.12, 1.55, 0.12, 0, 0, 0, wood)
        box(staff, 0.06, 1.55, 0.12, -0.03, 0, 0.01, woodHi)
        box(staff, 0.45, 0.12, 0.12, -0.2, 0.72, 0, wood) // crossbar
        box(staff, 0.12, 0.35, 0.12, -0.35, 0.6, 0, wood)
        const ember = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), fire)
        ember.position.set(-0.35, 0.85, 0)
        staff.add(ember)
        const glow = new THREE.PointLight(0xff6a2a, 1.8, 4.5)
        glow.position.copy(ember.position)
        staff.add(glow)

        // Soft ground disc
        const ground = new THREE.Mesh(
          new THREE.CylinderGeometry(1.1, 1.2, 0.06, 8),
          new THREE.MeshStandardMaterial({
            color: 0x121412,
            metalness: 0.1,
            roughness: 0.9,
            flatShading: true,
          }),
        )
        ground.position.y = -1.05
        root.add(ground)

        // Orbiting fire sparks (tiny cubes)
        const sparks = new THREE.Group()
        root.add(sparks)
        for (let i = 0; i < 6; i++) {
          const sp = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), fire.clone())
          sparks.add(sp)
        }

        scene.add(new THREE.AmbientLight(0xffffff, 0.75))
        scene.add(new THREE.HemisphereLight(0xfff5e6, 0x1a2218, 0.85))
        const key = new THREE.DirectionalLight(0xffffff, 1.35)
        key.position.set(3, 5, 4)
        scene.add(key)
        const fill = new THREE.DirectionalLight(0x7dffa3, 0.45)
        fill.position.set(-3, 2, -2)
        scene.add(fill)

        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.08
        controls.enablePan = false
        controls.minDistance = 2.4
        controls.maxDistance = 7
        controls.minPolarAngle = 0.4
        controls.maxPolarAngle = Math.PI / 1.6
        controls.autoRotate = !reduceMotion
        controls.autoRotateSpeed = 0.9
        controls.target.set(0, 0.2, 0)
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
          }, 1600)
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
            const bob = Math.sin(t * 2.2) * 0.04
            mage.position.y = -0.15 + bob
            robe.rotation.y = Math.sin(t * 1.1) * 0.06
            legL.position.z = 0.05 + Math.sin(t * 2.4) * 0.04
            legR.position.z = 0.05 - Math.sin(t * 2.4) * 0.04
            staff.rotation.z = Math.sin(t * 1.3) * 0.08
            staff.rotation.x = Math.sin(t * 0.9) * 0.05
            ember.rotation.x = t * 2.2
            ember.rotation.y = t * 1.7
            const pulse = 0.75 + Math.sin(t * 5) * 0.35
            glow.intensity = 1.4 * pulse
            ;(ember.material as MeshStandardMaterial).emissiveIntensity = 0.85 + pulse * 0.4

            sparks.children.forEach((child, i) => {
              const a = t * 0.8 + (i / 6) * Math.PI * 2
              child.position.set(Math.cos(a) * 1.45, 0.35 + Math.sin(t * 2 + i) * 0.35, Math.sin(a) * 1.45)
              child.rotation.x = t + i
              child.rotation.y = t * 0.7
            })

            if (!userDrag) {
              // subtle idle lean
              mage.rotation.y = Math.sin(t * 0.35) * 0.15
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
          textures.forEach((tex) => tex.dispose())
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
      {status === 'loading' && <span className="scene3dHint">loading mage…</span>}
      {status === 'error' && <span className="scene3dHint">3d unavailable</span>}
      {status === 'ready' && <span className="scene3dHint scene3dHint--idle">drag to spin</span>}
    </div>
  )
}
