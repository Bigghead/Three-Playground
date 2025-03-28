import * as three from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from 'lil-gui'


const canvas = document.querySelector('.webgl') as HTMLCanvasElement
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}
const scene = new three.Scene()
const gui = new GUI()
gui.add(document, 'title')

const debugGui = {}

/**
 * Utils
 */
const axes = new three.AxesHelper(5)
scene.add(axes)


/**
 * Camera
 */
const camera = new three.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.set(1, 1, 3)
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

const pointLightTweaks = gui.addFolder('Point Light')
pointLightTweaks.add(pointLight, 'intensity', 0, 150, 5)
pointLightTweaks.add(pointLight.position, 'x', -20, 20, 0.5)
pointLightTweaks.add(pointLight.position, 'y', -20, 20, 0.5)
pointLightTweaks.add(pointLight.position, 'z', -20, 20, 0.5)


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
  sheen: 10
})
const metalSphere = new three.Mesh(geometry, material)
metalSphere.material.map = textureMap.blue_metal
metalSphere.position.set(-2, 2, 0)
const metalSphereTweaks = gui.addFolder('Metal Sphere')
metalSphereTweaks.add(metalSphere.position, 'x', -20, 20, 0.5)
metalSphereTweaks.add(metalSphere.position, 'y', -20, 20, 0.5)
metalSphereTweaks.add(metalSphere.position, 'z', -20, 20, 0.5)

// have to clone the same material instance to reuse
const rockSphere = new three.Mesh(geometry, material.clone())
rockSphere.material.map = textureMap.rock_wall
rockSphere.position.set(-2, -1, 0)
const rockSphereTweaks = gui.addFolder('Rock Sphere')
rockSphereTweaks.add(rockSphere.position, 'x', -20, 20, 0.5)
rockSphereTweaks.add(rockSphere.position, 'y', -20, 20, 0.5)
rockSphereTweaks.add(rockSphere.position, 'z', -20, 20, 0.5)


scene.add(metalSphere, rockSphere)


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

