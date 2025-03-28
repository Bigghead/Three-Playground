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
const pointLight = new three.PointLight(0xffffff, 50)
pointLight.position.set(2, 3, 4)
scene.add(ambientLight, pointLight)


/**
 * Textures
 */
const textureLoader = new three.TextureLoader()
const textureMap = {
  door: textureLoader.load('/textures/color.jpg'),
  metal_sheet: textureLoader.load('/textures/metal_sheet.jpg'),
  blue_metal: textureLoader.load('/textures/blue_metal.jpg'),
  coast_land: textureLoader.load('/textures/coast_land.jpg'),
  rock_wall: textureLoader.load('/textures/rock_wall.jpg'),
}
textureMap.door.colorSpace = three.SRGBColorSpace
textureMap.metal_sheet.colorSpace = three.SRGBColorSpace
// textureMap.metal_sheet.magFilter = three.NearestFilter;
// textureMap.metal_sheet.minFilter = three.LinearMipMapLinearFilter;
textureMap.blue_metal.colorSpace = three.SRGBColorSpace
textureMap.coast_land.colorSpace = three.SRGBColorSpace
textureMap.rock_wall.colorSpace = three.SRGBColorSpace



/**
 * Objects
 */
const geometry = new three.SphereGeometry(1, 64)

// need lighting?
const material = new three.MeshPhysicalMaterial({
  // color: 'red'
  map: textureMap.metal_sheet,
  sheen: 1
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

