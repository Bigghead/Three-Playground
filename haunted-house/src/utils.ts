import * as three from "three";

export function createBushes(): three.Mesh[] {
  const bushGeometry = new three.SphereGeometry(1, 16);
  const bushMaterial = new three.MeshStandardMaterial();

  const bushes: three.Mesh[] = [
    { scale: 0.5, position: [0.8, 0.2, 2.2] },
    { scale: 0.25, position: [1.4, 0.1, 2.1] },
    { scale: 0.4, position: [-0.8, 0.1, 2.2] },
    { scale: 0.15, position: [-1, 0.05, 2.6] },
  ].map(({ scale, position }) => {
    const bush = new three.Mesh(bushGeometry, bushMaterial);
    bush.scale.set(scale, scale, scale);
    bush.position.set(...position);
    return bush;
  });
  return bushes;
}

export function createGraves(
  graveAmount: number
): three.Group<three.Object3DEventMap> {
  const graveGroup = new three.Group();
  const graveGeo = new three.BoxGeometry(0.6, 0.8, 0.2);
  const graveMaterial = new three.MeshStandardMaterial();

  for (let i = 0; i <= graveAmount; i++) {
    const graveMesh = new three.Mesh(graveGeo, graveMaterial);
    graveMesh.position.set(
      (Math.random() - 0.5) * 20,
      0.8 / 2,
      (Math.random() - 0.5) * 20
    );
    graveGroup.add(graveMesh);
  }
  return graveGroup;
}
