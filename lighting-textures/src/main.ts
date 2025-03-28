import * as three from 'three'

const canvas = document.querySelector('.webgl') as HTMLCanvasElement

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

const scene = new three.Scene()


/**
 * Camera
 */
const camera = new three.PerspectiveCamera(75, sizes.width / sizes.height)
scene.add(camera)



/**
 * Renderer
 */
const renderer = new three.WebGLRenderer({
  canvas
})
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
console.log('test')
renderer.render(scene, camera)

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

