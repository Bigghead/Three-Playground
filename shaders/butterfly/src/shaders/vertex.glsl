attribute float instanceOffset;

varying vec2 vUv;
varying vec3 vColor;

uniform float uTime;
uniform float uFlapSpeed;
uniform float uFlapMagnitude;


void main () {

    vec3 newPosition = position;

    float wave = sin(uTime * uFlapSpeed - (newPosition.y * 0.8) + instanceOffset);
    float influence = pow(abs(uv.x - 0.5) * 2.0, 2.0);
    float zOffset = wave * influence * uFlapMagnitude * 0.5;
    newPosition += normal * zOffset;

    vec4 modelPosition = instanceMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    vUv = uv;
    vColor = instanceColor;
}