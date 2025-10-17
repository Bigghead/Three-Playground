varying vec2 vUv;

uniform sampler2D uPerlinTexture;
uniform float uTime;

void main() {

    vec2 smokeUv = vUv;

    // cut to use only 1/3rd of x / y of perlin texture otherwise smoke looks very noisy
    smokeUv.x *= 0.5;
    smokeUv.y *= -0.3;


    smokeUv.y += uTime * 0.05;

    float smoke = texture(uPerlinTexture, smokeUv).r;

    // darken / smooth out the perlin noise
    smoke = smoothstep(0.4, 1.0, smoke);

    // fade out edges
    // cant use smokeUv cause we cut the uv x above^
    smoke *= smoothstep(0.0, 0.1, vUv.x);
    smoke *= smoothstep(1.0, 0.9, vUv.x);

    smoke *= smoothstep(0.0, 0.1, vUv.y);
    smoke *= smoothstep(1.0, 0.5, vUv.y);



    gl_FragColor = vec4(vec3(1.0), smoke);
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);



}