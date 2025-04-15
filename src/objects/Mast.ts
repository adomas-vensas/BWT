import * as THREE from 'three';

export default class Mast extends THREE.Mesh {

    constructor(position: { x: number, y: number, z: number, height: number}){
        super()

        this.geometry = new THREE.CylinderGeometry(0.5, 0.5, 4);
        this.material = new THREE.MeshBasicMaterial({color: 0xFFFFFF, wireframe: true});
        this.position.x = position.x;
        this.position.y = position.y;
        this.position.z = position.z;
    }
}