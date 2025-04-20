precision mediump float;

varying vec2 vUv;

void main() {
    float t = smoothstep(0.0, 0.5, vUv.x) * (1.0 - smoothstep(0.5, 1.0, vUv.x));
    vec3 color = mix(vec3(1.0), vec3(0.0, 0.0, 1.0), t);  // white → blue → white
    gl_FragColor = vec4(color, 1.0);
}