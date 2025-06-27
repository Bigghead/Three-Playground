import * as three from "three";

export const positionNeighbors = (x: number, y: number): three.Vector3 => {
  return new three.Vector3((x + (y % 2) * 0.5) * 1.85, 0, y * 1.6);
};

const getSprite = ({
  hasFog,
  color,
  opacity,
  map,
  pos,
  size,
}: {
  hasFog: boolean;
  color: three.ColorRepresentation;
  opacity: number;
  map: three.Texture;
  pos: three.Vector3;
  size: number;
}): three.Sprite => {
  const spriteMat = new three.SpriteMaterial({
    color,
    fog: hasFog,
    map,
    transparent: true,
    opacity,
  });
  spriteMat.color.offsetHSL(0, 0, Math.random() * 0.2 - 0.1);
  const sprite = new three.Sprite(spriteMat);

  sprite.position.set(pos.x, -pos.y, pos.z);
  size += Math.random() - 0.5;
  sprite.scale.set(size, size, size);
  sprite.material.rotation = 0;
  return sprite;
};

export const getLayer = ({
  hasFog = true,
  hue = 0.0,
  numSprites = 10,
  opacity = 1,
  radius = 1,
  sat = 0.5,
  size = 1,
  z = 0,
  map,
}: {
  hasFog?: boolean;
  hue?: number;
  numSprites?: number;
  opacity?: number;
  radius?: number;
  sat?: number;
  size?: number;
  z?: number;
  map: three.Texture;
}): three.Group => {
  const layerGroup = new three.Group();

  for (let i = 0; i < numSprites; i += 1) {
    let angle = (i / numSprites) * Math.PI * 2;
    const pos = new three.Vector3(
      Math.cos(angle) * Math.random() * radius,
      Math.sin(angle) * Math.random() * radius,
      z + Math.random()
    );

    let color = new three.Color().setHSL(hue, 1, sat);
    const sprite = getSprite({ hasFog, color, opacity, map, pos, size });
    layerGroup.add(sprite);
  }
  return layerGroup;
};
