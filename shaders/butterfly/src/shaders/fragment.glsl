varying vec2 vUv;

uniform sampler2D uTexture;
uniform float uTime;


void main() {

    vec4 butterflyTexture = texture(uTexture, vUv);
    vec2 uv = vUv;

    if(butterflyTexture.a < 0.1) {
        discard;
    }

    gl_FragColor = vec4(butterflyTexture);
}