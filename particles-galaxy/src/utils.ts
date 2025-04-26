import GUI from "lil-gui";

export type GUIOptions = {
  count: number;
  size: number;
  radius?: number;
  branches?: number;
  spin?: number;
  axisRange?: number;
  randomnessPower?: number;
  centerColor?: string;
  branchEndColor?: string;
};

// Debug
const gui = new GUI({ width: 300 });

export function renderGuiChangeOptions(
  guiObj: GUIOptions,
  callbackFunc: () => void
): void {
  gui
    .add(guiObj, "count", 100, 100000, 100)
    .name("Particle Count")
    .onFinishChange(callbackFunc);
  gui
    .add(guiObj, "size", 0.001, 0.2, 0.001)
    .name("Galaxy Particles Size")
    .onFinishChange(callbackFunc);
  gui
    .add(guiObj, "radius", 0.02, 20, 0.02)
    .name("Galaxy Radius")
    .onFinishChange(callbackFunc);
  gui
    .add(guiObj, "branches", 1, 15, 1)
    .name("Galaxy Radius")
    .onFinishChange(callbackFunc);
  gui
    .add(guiObj, "axisRange", 0, 2, 0.001)
    .name("Axis Range")
    .onFinishChange(callbackFunc);
  gui
    .add(guiObj, "randomnessPower", 1, 10, 0.001)
    .name("Galaxy Star Randomness")
    .onFinishChange(callbackFunc);
  gui
    .addColor(guiObj, "centerColor")
    .name("Center Color")
    .onFinishChange(callbackFunc);
  gui
    .addColor(guiObj, "branchEndColor")
    .name("Branch End Color")
    .onFinishChange(callbackFunc);
}
