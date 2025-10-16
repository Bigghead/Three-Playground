varying vec2 vUv;
uniform float uTime;


vec2 rotate2d(vec2 value, float angle) {
    float sinAngle = sin(angle);
    float cosAngle = cos(angle);
    mat2 matrix = mat2(cosAngle, sinAngle, -sinAngle, cosAngle);
    return matrix * value;
}

void main () {

    vec3 newPosition = position;
    newPosition.xz = rotate2d(newPosition.xz, 2.0 * newPosition.y);

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    vUv = uv;
}