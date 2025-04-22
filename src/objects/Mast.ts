import * as THREE from 'three';

export default class Mast extends THREE.Mesh {

    constructor(position: { x: number, y: number, z: number, radius:number, height: number}){
        super()

        this.geometry = new THREE.CylinderGeometry(position.radius, position.radius, position.height, 32, 64, undefined);
        this.material = new THREE.MeshBasicMaterial({color: 0xFFFFFF, wireframe: true});
        this.position.x = position.x;
        this.position.y = position.y;
        this.position.z = position.z;
    }
}