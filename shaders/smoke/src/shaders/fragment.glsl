varying vec2 vUv;

uniform sampler2D uPerlinTexture;

void main() {

    float smoke = texture(uPerlinTexture, vUv).r;

    gl_FragColor = vec4(vec3(vUv, 1.0), smoke);


}