precision mediump float;

varying vec2 vUv;

void main() {
    float alpha = smoothstep(0.0, 0.5, vUv.x) * (1.0 - smoothstep(0.5, 1.0, vUv.x));
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
}
