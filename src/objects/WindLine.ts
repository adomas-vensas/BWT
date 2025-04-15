import * as THREE from 'three';

export default class WindLine extends THREE.Mesh {
    rnda: number;
    rndb: number;
    rndc: number;
    rndd: number;
    pos: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
    
    constructor(options: {texture: THREE.CanvasTexture})
    {
        super()

        this.geometry = new THREE.PlaneGeometry( 1, 1, 20, 1 ),
        this.pos = this.geometry.getAttribute('position');
        this.rnda = Math.random();
        this.rndb = Math.random();
        this.rndc = Math.random();
        this.rndd = Math.random();
        
        this.material = new THREE.MeshBasicMaterial({
            map: options.texture,
            side:THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
        })
    }
}