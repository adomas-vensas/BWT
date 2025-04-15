import * as THREE from 'three';

export default class Ground extends THREE.Mesh {
    constructor(options: { sideSize: number; resolution: number }) {
        super();
        
        const displacementMap = new THREE.TextureLoader().load('../src/images/hill_height_map.png');
        const hillsTexture = new THREE.TextureLoader().load('../src/images/hills_bitmap.png');

        this.material = new THREE.MeshStandardMaterial({
            displacementMap : displacementMap,
            map: hillsTexture,
        });
        this.geometry = new THREE.PlaneGeometry(
            options.sideSize,
            options.sideSize,
            options.resolution,
            options.resolution
        );
        this.rotation.x = -Math.PI / 2;

        this.geometry.computeVertexNormals( );
    }

}
  