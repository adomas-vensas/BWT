import * as THREE from 'three';

export default class VortexShedding extends THREE.Mesh
{
    private width: number;
    private height: number;
    private resolutionZ: number;
    private resolutionX: number;
    curlTexture: THREE.DataTexture | undefined = undefined;
    
    constructor(width: number, height: number, resolutionZ:number, resolutionX: number)
    {
        super();

        this.width = width;
        this.height = height;
        this.resolutionZ = resolutionZ;
        this.resolutionX = resolutionX;
    }

    public update(curl: Float32Array)
    {
        if(this.curlTexture == undefined)
        {
            this.curlTexture = new THREE.DataTexture(
                curl,           // your data
                this.resolutionZ,
                this.resolutionX,     // grid dims
                THREE.RedFormat,
                THREE.FloatType    // 32-bit float
            );
            this.curlTexture.wrapS = THREE.ClampToEdgeWrapping;
            this.curlTexture.wrapT = THREE.ClampToEdgeWrapping;
            this.curlTexture.minFilter = THREE.LinearFilter;
            this.curlTexture.magFilter = THREE.LinearFilter;
            this.curlTexture.needsUpdate = true;

            this.createShaderMaterial();
            this.geometry = new THREE.PlaneGeometry(this.width, this.height, this.resolutionZ, this.resolutionX);
        }
        
        this.curlTexture.image.data = curl;
        this.curlTexture.needsUpdate = true;
    }
    
    private createShaderMaterial() {
        this.material = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            transparent: true,
            blending:    THREE.NormalBlending,
            depthWrite:  false,
            uniforms: {
                curlTexture: { value: this.curlTexture! },
                bumpScale:    { value: 0.5 },
                colorScale:   { value: 20.0 }
            },
            vertexShader: /* glsl */`
              uniform sampler2D curlTexture;
              uniform float bumpScale;
              varying float vCurl;
              varying vec2  vUv;
              void main() {
                vUv   = uv;
                vCurl = texture2D(curlTexture, uv).r;
                vec3 p = position + normal * vCurl * bumpScale;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
              }
            `,
            fragmentShader: /* glsl */`
                precision highp float;
                uniform float colorScale;
                varying float vCurl;
            
                void main() {
                    float c = vCurl * colorScale;
                    // red if positive, blue if negative
                    float r = max(c, 0.0);
                    float b = max(-c, 0.0);
                    // alpha = how “strong” the curl is (zero → fully transparent)
                    float a = clamp(r + b, 0.0, 1.0);
                    
                    // optionally, throw away really tiny values:
                    // if(a < 0.01) discard;
                
                    gl_FragColor = vec4(r, 0.0, b, a);
                }
            `,
          });
      }

}

