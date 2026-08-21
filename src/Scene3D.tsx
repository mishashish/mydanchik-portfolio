import { useEffect, useRef, useState } from 'react'
import type { Material, Mesh, MeshStandardMaterial, Object3D, Texture } from 'three'

/** Detailed voxel BYTE sitting by a pixel campfire — staff on the ground. */
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
        const matsToDispose: Material[] = []

        const makePixelTex = (
          draw: (ctx: CanvasRenderingContext2D, size: number) => void,
          size = 16,
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
          ctx.fillStyle = '#e4dcc8'
          for (let y = 0; y < n; y += 2)
            for (let x = (y / 2) % 2; x < n; x += 2) ctx.fillRect(x, y, 1, 1)
          ctx.fillStyle = '#cfc7a6'
          ctx.fillRect(0, n - 3, n, 3)
        }, 12)

        const cloakTex = makePixelTex((ctx, n) => {
          ctx.fillStyle = '#1e1e1e'
          ctx.fillRect(0, 0, n, n)
          ctx.fillStyle = '#2c2c2c'
          for (let x = 0; x < n; x += 2) ctx.fillRect(x, 0, 1, n)
          ctx.fillStyle = '#141414'
          ctx.fillRect(0, n - 4, n, 4)
          ctx.fillStyle = '#3a5a48'
          ctx.fillRect(2, 2, n - 4, 2)
          ctx.fillStyle = '#5dff9a'
          ctx.fillRect(4, 3, n - 8, 1)
        }, 16)

        const woodTex = makePixelTex((ctx, n) => {
          ctx.fillStyle = '#6a4a28'
          ctx.fillRect(0, 0, n, n)
          ctx.fillStyle = '#8a6a3a'
          ctx.fillRect(2, 0, 1, n)
          ctx.fillRect(5, 0, 1, n)
          ctx.fillRect(9, 0, 1, n)
          ctx.fillStyle = '#4a3018'
          ctx.fillRect(0, 0, 1, n)
          ctx.fillRect(n - 1, 1, 1, n - 2)
          ctx.fillStyle = '#a07848'
          ctx.fillRect(3, 2, 1, n - 4)
        }, 12)

        const barkTex = makePixelTex((ctx, n) => {
          ctx.fillStyle = '#3a2818'
          ctx.fillRect(0, 0, n, n)
          ctx.fillStyle = '#5a3c22'
          for (let y = 0; y < n; y += 3) ctx.fillRect(0, y, n, 1)
          ctx.fillStyle = '#2a1a10'
          ctx.fillRect(1, 0, 1, n)
          ctx.fillRect(n - 2, 0, 1, n)
          ctx.fillStyle = '#7a5230'
          ctx.fillRect(4, 2, 2, 2)
          ctx.fillRect(8, 7, 2, 2)
        }, 12)

        const fireTex = makePixelTex((ctx, n) => {
          ctx.fillStyle = '#ff4a18'
          ctx.fillRect(0, 0, n, n)
          ctx.fillStyle = '#ff8a2a'
          ctx.fillRect(1, 1, n - 3, n - 3)
          ctx.fillStyle = '#ffb347'
          ctx.fillRect(2, 2, n - 5, n - 5)
          ctx.fillStyle = '#fff3a0'
          ctx.fillRect(3, 3, 3, 3)
          ctx.fillStyle = '#c02008'
          ctx.fillRect(0, n - 2, n, 2)
        }, 10)

        const emberTex = makePixelTex((ctx, n) => {
          ctx.fillStyle = '#ff6a2a'
          ctx.fillRect(0, 0, n, n)
          ctx.fillStyle = '#ffb347'
          ctx.fillRect(1, 1, n - 2, n - 2)
          ctx.fillStyle = '#fff3a0'
          ctx.fillRect(2, 2, 2, 2)
        }, 6)

        const ashTex = makePixelTex((ctx, n) => {
          ctx.fillStyle = '#2a2a2a'
          ctx.fillRect(0, 0, n, n)
          ctx.fillStyle = '#3a3a3a'
          for (let i = 0; i < 20; i++)
            ctx.fillRect((i * 3) % n, (i * 5) % n, 1, 1)
          ctx.fillStyle = '#1a1a1a'
          ctx.fillRect(2, 2, n - 4, n - 4)
          ctx.fillStyle = '#4a3828'
          ctx.fillRect(3, 4, 2, 1)
          ctx.fillRect(7, 6, 2, 1)
        }, 12)

        const groundTex = makePixelTex((ctx, n) => {
          ctx.fillStyle = '#121412'
          ctx.fillRect(0, 0, n, n)
          ctx.fillStyle = '#1a1c18'
          for (let y = 0; y < n; y += 2)
            for (let x = (y / 2) % 2; x < n; x += 2) ctx.fillRect(x, y, 1, 1)
          ctx.fillStyle = '#0e100e'
          ctx.fillRect(0, 0, n, 1)
        }, 16)

        const bootTex = makePixelTex((ctx, n) => {
          ctx.fillStyle = '#1a1a1a'
          ctx.fillRect(0, 0, n, n)
          ctx.fillStyle = '#2a2a2a'
          ctx.fillRect(0, 0, n, 3)
          ctx.fillStyle = '#5dff9a'
          ctx.fillRect(1, n - 3, n - 2, 2)
        }, 8)

        const mat = (
          map: Texture,
          extras: Partial<ConstructorParameters<typeof THREE.MeshStandardMaterial>[0]> = {},
        ) => {
          const m = new THREE.MeshStandardMaterial({
            map,
            metalness: 0.02,
            roughness: 0.82,
            flatShading: true,
            ...extras,
          })
          matsToDispose.push(m)
          return m
        }

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50)
        camera.position.set(3.1, 2.05, 3.8)

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
        renderer.toneMapping = THREE.NoToneMapping
        renderer.domElement.style.cssText =
          'display:block;width:100%;height:100%;touch-action:none;cursor:grab;image-rendering:pixelated'
        host.appendChild(renderer.domElement)

        const root = new THREE.Group()
        root.position.y = -0.35
        scene.add(root)

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
        const wood = mat(woodTex)
        const bark = mat(barkTex)
        const fire = mat(fireTex, {
          emissive: 0xff4a18,
          emissiveMap: fireTex,
          emissiveIntensity: 1.5,
          roughness: 0.4,
        })
        const ember = mat(emberTex, {
          emissive: 0xff8a2a,
          emissiveMap: emberTex,
          emissiveIntensity: 1.3,
          roughness: 0.45,
        })
        const ash = mat(ashTex)
        const groundM = mat(groundTex)
        const boots = mat(bootTex)
        const eye = new THREE.MeshStandardMaterial({
          color: 0x111111,
          roughness: 0.5,
          flatShading: true,
        })
        matsToDispose.push(eye)
        const tip = mat(skinTex, { color: 0xcfc7a6 })
        const coal = mat(ashTex, { color: 0x0a0a0a, emissive: 0xff2a00, emissiveIntensity: 0.35 })

        // —— GROUND PAD ——
        box(root, 3.4, 0.1, 3.4, 0, -0.05, 0, groundM)
        // stones around fire
        for (const [x, z, s] of [
          [-0.55, 0.35, 0.18],
          [-0.2, 0.55, 0.16],
          [0.25, 0.5, 0.2],
          [0.55, 0.2, 0.15],
          [0.45, -0.15, 0.17],
          [0.1, -0.4, 0.16],
          [-0.3, -0.35, 0.18],
          [-0.55, -0.05, 0.15],
        ] as const) {
          box(root, s, s * 0.7, s, x, s * 0.3, z, ash)
        }

        // —— CAMPFIRE ——
        const camp = new THREE.Group()
        camp.position.set(0.15, 0, 0.15)
        root.add(camp)

        // ash pile
        box(camp, 0.7, 0.12, 0.7, 0, 0.06, 0, ash)
        box(camp, 0.5, 0.1, 0.5, 0, 0.12, 0, coal)

        // crossed logs
        box(camp, 0.95, 0.16, 0.18, 0, 0.22, 0, bark, 0, 0.4, 0.15)
        box(camp, 0.9, 0.16, 0.18, 0, 0.28, 0, bark, 0, -0.55, -0.1)
        box(camp, 0.55, 0.14, 0.14, 0.05, 0.36, -0.05, bark, 0, 0.9, 0.2)
        // log ends (rings)
        box(camp, 0.16, 0.16, 0.06, -0.48, 0.22, 0.08, wood)
        box(camp, 0.16, 0.16, 0.06, 0.45, 0.28, -0.12, wood)

        // flame voxels — layered
        const flames = new THREE.Group()
        flames.position.set(0, 0.42, 0)
        camp.add(flames)
        const flameParts: { mesh: Mesh; baseY: number; amp: number; speed: number }[] = []
        const addFlame = (w: number, h: number, d: number, x: number, y: number, z: number, m: Material, amp: number, speed: number) => {
          const mesh = box(flames, w, h, d, x, y, z, m)
          flameParts.push({ mesh, baseY: y, amp, speed })
        }
        addFlame(0.28, 0.35, 0.28, 0, 0.1, 0, fire, 0.04, 7)
        addFlame(0.2, 0.4, 0.2, 0.1, 0.22, 0.05, fire, 0.06, 8.5)
        addFlame(0.18, 0.38, 0.18, -0.1, 0.2, -0.06, ember, 0.05, 9)
        addFlame(0.14, 0.32, 0.14, 0.02, 0.38, 0.02, ember, 0.07, 10)
        addFlame(0.1, 0.22, 0.1, -0.04, 0.48, 0.04, ember, 0.08, 11)
        addFlame(0.08, 0.16, 0.08, 0.06, 0.55, -0.02, ember, 0.09, 12)
        // outer sparks
        addFlame(0.07, 0.07, 0.07, 0.22, 0.35, 0.12, ember, 0.1, 6)
        addFlame(0.06, 0.06, 0.06, -0.2, 0.4, -0.1, ember, 0.11, 7.5)

        const fireLight = new THREE.PointLight(0xff6a2a, 3.2, 7)
        fireLight.position.set(0, 0.55, 0)
        camp.add(fireLight)
        const fireGlow = new THREE.PointLight(0xffb347, 1.4, 4)
        fireGlow.position.set(0, 0.35, 0.2)
        camp.add(fireGlow)

        // —— SITTING MAGE (facing the fire) ——
        const mage = new THREE.Group()
        // sit to the left of the fire, facing it
        mage.position.set(-0.95, 0, 0.05)
        mage.rotation.y = Math.PI * 0.42
        root.add(mage)

        // hips / seated pelvis
        box(mage, 0.55, 0.28, 0.45, 0, 0.28, 0.05, cloak)

        // torso upright
        const torso = new THREE.Group()
        torso.position.set(0, 0.55, 0)
        mage.add(torso)
        box(torso, 0.72, 0.7, 0.5, 0, 0.15, 0, cloak)
        // cloak folds / detail layers
        box(torso, 0.8, 0.35, 0.22, 0, -0.05, -0.22, cloak)
        box(torso, 0.28, 0.55, 0.22, -0.42, 0.1, 0.05, cloak) // upper arm L
        box(torso, 0.28, 0.55, 0.22, 0.42, 0.1, 0.05, cloak) // upper arm R
        // forearms resting on knees / toward fire
        box(torso, 0.22, 0.22, 0.45, -0.38, -0.15, 0.28, cloak)
        box(torso, 0.22, 0.22, 0.45, 0.38, -0.15, 0.28, cloak)
        // hands (cream)
        box(torso, 0.18, 0.16, 0.18, -0.38, -0.2, 0.52, skin)
        box(torso, 0.18, 0.16, 0.18, 0.38, -0.2, 0.52, skin)
        // hood / collar
        box(torso, 0.78, 0.18, 0.4, 0, 0.48, -0.05, cloak)
        box(torso, 0.55, 0.2, 0.2, 0, 0.55, -0.22, cloak)

        // head
        const head = new THREE.Group()
        head.position.set(0, 1.05, 0.08)
        mage.add(head)
        box(head, 0.58, 0.52, 0.52, 0, 0, 0, skin)
        // face detail — cheeks / jaw
        box(head, 0.62, 0.18, 0.2, 0, -0.2, 0.18, skin)
        // eye (looking toward fire / +Z relative to mage)
        box(head, 0.16, 0.16, 0.08, 0.08, 0.04, 0.28, eye)
        // brow
        box(head, 0.22, 0.06, 0.06, 0.08, 0.16, 0.27, tip)
        // hat tip
        box(head, 0.18, 0.16, 0.18, -0.05, 0.32, -0.05, tip)
        box(head, 0.12, 0.12, 0.12, -0.02, 0.42, -0.02, tip)

        // legs — sitting: thighs forward, shins down
        const legs = new THREE.Group()
        legs.position.set(0, 0.22, 0)
        mage.add(legs)
        // thighs (horizontal-ish toward fire)
        box(legs, 0.26, 0.24, 0.55, -0.2, 0.08, 0.35, skin)
        box(legs, 0.26, 0.24, 0.55, 0.2, 0.08, 0.35, skin)
        // knees
        box(legs, 0.28, 0.26, 0.26, -0.2, 0.05, 0.62, skin)
        box(legs, 0.28, 0.26, 0.26, 0.2, 0.05, 0.62, skin)
        // shins down
        box(legs, 0.24, 0.4, 0.24, -0.2, -0.2, 0.72, skin)
        box(legs, 0.24, 0.4, 0.24, 0.2, -0.2, 0.72, skin)
        // boots on ground
        box(legs, 0.28, 0.14, 0.36, -0.2, -0.42, 0.78, boots)
        box(legs, 0.28, 0.14, 0.36, 0.2, -0.42, 0.78, boots)

        // robe drape over legs
        box(mage, 0.85, 0.2, 0.7, 0, 0.18, 0.35, cloak)
        box(mage, 0.7, 0.35, 0.25, 0, 0.05, 0.55, cloak)

        // —— STAFF LYING ON THE GROUND (beside mage) ——
        const staff = new THREE.Group()
        staff.position.set(-1.55, 0.08, 0.55)
        staff.rotation.set(0.05, 0.35, 1.45) // flat on ground
        root.add(staff)
        box(staff, 0.11, 1.7, 0.11, 0, 0, 0, wood)
        box(staff, 0.05, 1.7, 0.11, -0.03, 0, 0.01, wood)
        // cross piece near tip
        box(staff, 0.4, 0.1, 0.1, 0, 0.72, 0, wood)
        box(staff, 0.1, 0.28, 0.1, -0.15, 0.62, 0, wood)
        // dormant ember on tip (dimmer — resting)
        box(staff, 0.16, 0.16, 0.16, -0.15, 0.82, 0, ember)
        box(staff, 0.1, 0.1, 0.1, -0.08, 0.9, 0.05, ember)

        // floating ash / sparks from fire
        const sparks = new THREE.Group()
        root.add(sparks)
        for (let i = 0; i < 10; i++) {
          const sp = new THREE.Mesh(
            new THREE.BoxGeometry(0.05 + (i % 3) * 0.02, 0.05 + (i % 2) * 0.02, 0.05),
            i % 2 ? ember : fire,
          )
          sparks.add(sp)
        }

        // Lights
        scene.add(new THREE.AmbientLight(0xffffff, 0.35))
        scene.add(new THREE.HemisphereLight(0xffe8d0, 0x0a100c, 0.45))
        const key = new THREE.DirectionalLight(0xffd0b0, 0.55)
        key.position.set(2, 4, 3)
        scene.add(key)
        const fill = new THREE.DirectionalLight(0x4a6a58, 0.25)
        fill.position.set(-3, 2, -2)
        scene.add(fill)

        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.07
        controls.enablePan = false
        controls.minDistance = 2.8
        controls.maxDistance = 7.5
        controls.minPolarAngle = 0.35
        controls.maxPolarAngle = Math.PI / 1.7
        controls.autoRotate = !reduceMotion
        controls.autoRotateSpeed = 0.55
        controls.target.set(-0.2, 0.55, 0.15)
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
            // fire flicker
            flameParts.forEach((f, i) => {
              const y = f.baseY + Math.sin(t * f.speed + i) * f.amp
              f.mesh.position.y = y
              f.mesh.scale.y = 1 + Math.sin(t * f.speed * 1.3 + i) * 0.12
              f.mesh.scale.x = 1 + Math.sin(t * f.speed + i * 0.7) * 0.08
            })
            const pulse = 0.75 + Math.sin(t * 9) * 0.2 + Math.sin(t * 17) * 0.1
            fireLight.intensity = 2.6 * pulse
            fireGlow.intensity = 1.1 * pulse

            // mage idle: breathing + slight head turn toward fire
            torso.position.y = 0.55 + Math.sin(t * 1.6) * 0.012
            head.rotation.y = Math.sin(t * 0.7) * 0.08
            head.rotation.x = -0.08 + Math.sin(t * 0.9) * 0.03

            sparks.children.forEach((child, i) => {
              const life = (t * 0.35 + i * 0.17) % 1
              const a = i * 0.9
              child.position.set(
                camp.position.x + Math.cos(a + t * 0.4) * (0.15 + life * 0.35),
                0.5 + life * 1.4,
                camp.position.z + Math.sin(a + t * 0.4) * (0.15 + life * 0.35),
              )
              const s = 1 - life
              child.scale.setScalar(Math.max(0.15, s))
              child.rotation.x = t + i
              child.rotation.z = t * 0.7
              const m = (child as Mesh).material as MeshStandardMaterial
              if (m.opacity != null) {
                m.transparent = true
                m.opacity = s
              }
            })

            void userDrag
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
          matsToDispose.forEach((m) => m.dispose())
          scene.traverse((obj) => {
            if (obj instanceof THREE.Mesh) obj.geometry.dispose()
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
      {status === 'loading' && <span className="scene3dHint">loading camp…</span>}
      {status === 'error' && <span className="scene3dHint">3d unavailable</span>}
      {status === 'ready' && <span className="scene3dHint scene3dHint--idle">drag to spin</span>}
    </div>
  )
}
