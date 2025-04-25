import * as THREE from 'three';

export default class Mast extends THREE.Mesh {

    radialSegments: number;
    heightSegments: number;

    constructor(position: { x: number, y: number, z: number, radius:number, height: number}){
        super()

        this.radialSegments = 32;
        this.heightSegments = 64;

        this.geometry = new THREE.CylinderGeometry(position.radius, position.radius, position.height, 32, 64, undefined);
        this.material = new THREE.MeshBasicMaterial({color: 0xFFFFFF, wireframe: true});
        this.position.x = position.x;
        this.position.y = position.y;
        this.position.z = position.z;
    }
}