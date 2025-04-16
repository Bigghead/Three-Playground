import * as three from "three";

// three.MathUtils.randFloatSpread does the same thing
// const getRandomVertex = (num: number) => (Math.random() - 0.5) * num;

type Position = {
  position: three.Vector3;
  // scale: number;
};
const positions: Position[] = [
  // don't cover the starting textgeometry
  {
    position: new three.Vector3(0, 0, 0),
  },
];

// Brute force check if each new geomtry is hitting a close neightbor
// gets slow though
function hasOverlapNeighbor(pos: three.Vector3, minDistance = 5) {
  for (let p of positions) {
    // Use threejs to count distance, slick
    const distance = pos.distanceTo(p.position);
    if (distance < minDistance) return true;
  }
  return false;
}

// Todo - collision detection / don't render if overlapping
export function renderRandomizedGeometry({
  amount,
  geometry,
  material,
}: {
  amount: number;
  geometry: three.BufferGeometry;
  material: three.Material;
}): three.Group {
  const geometryGroup = new three.Group();
  for (let i = 0; i <= amount; i++) {
    let position;
    // const randomScale = Math.floor(Math.random() * 2);
    const mesh = new three.Mesh(geometry, material);

    // Get new position if overlaps with neightbor
    // it is sloowww though
    do {
      position = new three.Vector3(
        three.MathUtils.randFloatSpread(50),
        three.MathUtils.randFloatSpread(50),
        three.MathUtils.randFloatSpread(50)
      );
    } while (
      // collides with neighbor
      hasOverlapNeighbor(position) ||
      // right in front of the camera
      (position.z > 0 && Math.abs(position.x / position.z) < 0.5)
    );
    mesh.position.copy(position);
    mesh.rotation.x = Math.PI * Math.random();
    mesh.rotation.y = Math.PI * Math.random();
    // mesh.scale.set(randomScale, randomScale, randomScale);
    positions.push({ position });

    geometryGroup.add(mesh);
  }
  return geometryGroup;
}

export function animateGroupChild(
  groupMesh: three.Group,
  animateType: "position" | "rotation" | "scale",
  animateDelta: [number, number, number]
): void {
  for (const child of groupMesh.children) {
    child[animateType].set(...animateDelta);
  }
}
