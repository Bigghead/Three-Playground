varying vec2 vUv;

uniform float uTime;
uniform float uFlapSpeed;
uniform float uFlapMagnitude;


void main () {

    vec3 newPosition = position;


    // kinda working flapping, but only does downward and looks robotic
    float wave = sin(uTime * uFlapSpeed);
    float influence = pow(abs(uv.x - 0.5) * 2.0, 2.0);
    float zOffset = wave * influence * uFlapMagnitude;
    newPosition.z += zOffset;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    vUv = uv;
}