import * as three from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";


const canvas = document.querySelector('.webgl') as HTMLCanvasElement

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

const scene = new three.Scene()

/**
 * Utils
 */
const axes = new three.AxesHelper(5)
scene.add(axes)


/**
 * Camera
 */
const camera = new three.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.set(1, 1, 2)
scene.add(camera)

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true;


/**
 * Lighting
 */
const ambientLight = new three.AmbientLight()
scene.add(ambientLight)


/**
 * Objects
 */
const geometry = new three.SphereGeometry()

// need lighting?
const material = new three.MeshPhysicalMaterial({
  color: 'red'
})
scene.add(new three.Mesh(geometry, material))
console.log(scene)


/**
 * Renderer
 */
const renderer = new three.WebGLRenderer({
  canvas
})
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));


(function animate() {
  controls.update()
  renderer.render(scene, camera);
  requestAnimationFrame(animate)
})()

/**
 * Browser Events
 */
window.addEventListener('resize', () => {
  // resize canvas, update camera field of view, re-render
  const { innerHeight: height, innerWidth: width } = window
  sizes.height = height
  sizes.width = width
  console.log(sizes)

  camera.aspect = width / height
  camera.updateProjectionMatrix()

  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
})

