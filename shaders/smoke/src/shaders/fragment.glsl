varying vec2 vUv;

uniform sampler2D uPerlinTexture;
uniform float uTime;

void main() {

    vec2 smokeUv = vUv;
    smokeUv.y += uTime;

    float smoke = texture(uPerlinTexture, smokeUv).r;
    gl_FragColor = vec4(vec3(vUv, 1.0), smoke);


}