import * as three from 'three'
import GUI from 'lil-gui'

const gui = new GUI()

const geometry = new three.SphereGeometry()
const material = new three.MeshPhysicalMaterial({
  sheen: 1
})

export const createSphere = (texture: three.Texture, position: [number, number, number], name: string) => {
  // have to clone the same material instance to reuse
  const sphere = new three.Mesh(geometry, material.clone());
  sphere.material.map = texture;
  sphere.position.set(...position);

  // GUI Tweaks
  const folder = gui.addFolder(name);
  (['x', 'y', 'z'] as const).forEach(axis =>
    folder.add(sphere.position, axis, -20, 20, 0.5)
  );

  return sphere;
};