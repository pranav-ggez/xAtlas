import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function GalaxyView({ tools }) {
  const mountRef = useRef(null)

  useEffect(() => {
    if (!mountRef.current || tools.length === 0) return

    // 1. Scene Setup
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x000000, 0.02)

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 15

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    // Ensure canvas doesn't capture pointer events if we want clicks to pass through (optional)
    renderer.domElement.style.pointerEvents = 'none' 
    mountRef.current.appendChild(renderer.domElement)

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2)
    scene.add(ambientLight)
    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(10, 10, 10)
    scene.add(pointLight)

    // 5. Create Planets (Tools) + Labels + Glow
    tools.forEach((tool, i) => {
      // --- Determine Color ---
      const color = tool.category === 'network' ? 0x3b82f6 : 
                    tool.category === 'remote' ? 0x10b981 : 0xf59e0b
      
      // --- Create Planet Sphere ---
      const geometry = new THREE.SphereGeometry(1.2, 32, 32)
      const material = new THREE.MeshStandardMaterial({ 
        color: color,
        emissive: color,
        emissiveIntensity: 0.2,
        roughness: 0.4,
        metalness: 0.6
      })
      const planet = new THREE.Mesh(geometry, material)
      
      // Positioning (Circle layout)
      const angle = (i / tools.length) * Math.PI * 2
      planet.position.x = Math.cos(angle) * 6
      planet.position.y = Math.sin(angle) * 3
      
      scene.add(planet)

      // --- Add Glow Effect ---
      const glowGeo = new THREE.SphereGeometry(1.8, 32, 32) // Slightly larger than planet
      const glowMat = new THREE.MeshBasicMaterial({ 
        color: color, 
        transparent: true, 
        opacity: 0.15,
        side: THREE.BackSide, // Render on inside to create halo effect
        blending: THREE.AdditiveBlending
      })
      const glow = new THREE.Mesh(glowGeo, glowMat)
      planet.add(glow) // Attach glow to planet so it moves together

      // --- Create Text Label ---
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = 512
      canvas.height = 128
      
      // Clear canvas first
      context.clearRect(0, 0, canvas.width, canvas.height)
      
      // Style the text
      context.fillStyle = 'rgba(255, 255, 255, 0.95)'
      context.font = 'Bold 48px Inter, Arial, sans-serif'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      // Add a slight shadow to text for readability
      context.shadowColor = "rgba(0,0,0,0.8)";
      context.shadowBlur = 4;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      
      context.fillText(tool.name, 256, 64)
      
      // Create Texture from Canvas
      const texture = new THREE.CanvasTexture(canvas)
      texture.needsUpdate = true
      
      const labelMaterial = new THREE.SpriteMaterial({ 
        map: texture, 
        transparent: true, 
        opacity: 0.9,
        depthTest: false // Always render labels on top
      })
      const label = new THREE.Sprite(labelMaterial)
      
      // Position label above the planet
      label.position.set(planet.position.x, planet.position.y + 2.8, planet.position.z)
      label.scale.set(5, 1.2, 1) // Adjust size based on canvas aspect
      
      scene.add(label)
    })

    // 6. Animation Loop
    function animate() {
      requestAnimationFrame(animate)
      
      // Slow, smooth rotation of the whole galaxy
      scene.rotation.y += 0.0015
      
      // Optional: Make planets rotate on their own axis
      scene.children.forEach(child => {
        if (child.type === 'Mesh' && child.geometry.type === 'SphereGeometry') {
           child.rotation.y += 0.005
        }
      })

      renderer.render(scene, camera)
    }
    animate()

    // 7. Handle Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      // Dispose geometries and materials to prevent memory leaks
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose()
        if (object.material) object.material.dispose()
      })
    }
  }, [tools])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}   