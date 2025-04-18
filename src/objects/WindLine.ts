import * as THREE from 'three';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
// import fragmentShader from '../shaders/Wind/fragment.glsl?raw';
// import vertexShader from '../shaders/Wind/vertex.glsl?raw';


export default class WindLine extends THREE.Mesh {
    rnda: number;
    rndb: number;
    rndc: number;
    rndd: number;
    geometry: MeshLineGeometry;
    
    constructor(options: {texture: THREE.CanvasTexture, resolution: number})
    {
        const geom = new MeshLineGeometry();
        
        super(geom)

        this.geometry = geom;

        this.rnda = Math.random();
        this.rndb = Math.random();
        this.rndc = Math.random();
        this.rndd = Math.random();
        
        this.material = new MeshLineMaterial({
            useMap: 1,
            lineWidth: 0.2,
            map: options.texture,
            resolution: new THREE.Vector2(options.resolution, 1)
        })

    }
}