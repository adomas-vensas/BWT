import * as THREE from 'three';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

export default class WindLine extends THREE.Mesh {
    rnda: number;
    rndb: number;
    rndc: number;
    rndd: number;
    
    constructor(options: {texture: THREE.CanvasTexture, widthSegments: number})
    {
        super()
        
        this.geometry = new MeshLineGeometry();

        this.rnda = Math.random();
        this.rndb = Math.random();
        this.rndc = Math.random();
        this.rndd = Math.random();
        
        this.material = new MeshLineMaterial({
            useMap: 1,
            lineWidth: 0.2,
            map: options.texture,
            resolution: new THREE.Vector2(options.widthSegments, 1)
        })
    }
}