import * as three from "three";

(function init() {
  // create a scene, that will hold all our elements such as objects, cameras and lights.
  const scene = new three.Scene();
  // create a camera, which defines where we're looking at
  const camera = new three.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  // tell the camera where to look
  camera.position.set(0, 0, 10);
  // create a render and set the size
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  const renderer = new three.WebGLRenderer();
  renderer.setSize(sizes.width, sizes.height);
  // add the output of the render function to the HTML
  document.body.appendChild(renderer.domElement);
  // function for re-rendering/animating the scene
  function tick() {
    requestAnimationFrame(tick);
    renderer.render(scene, camera);
  }
  tick();
})();
