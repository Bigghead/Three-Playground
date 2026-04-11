varying vec2 vUv;
varying vec3 vColor;

uniform sampler2D uTexture;


void main() {

    vec4 butterflyTexture = texture(uTexture, vUv);

    if(butterflyTexture.a < 0.1) {
        discard;
    }

    gl_FragColor = vec4(butterflyTexture.rgb * vColor, butterflyTexture.a);
}