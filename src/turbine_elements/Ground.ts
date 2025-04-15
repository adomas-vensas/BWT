import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/Addons';

export default class Ground extends THREE.Mesh {

    private _simplex: SimplexNoise = new SimplexNoise;
    private _sideSize: number;

    constructor(options: { sideSize: number; resolution: number }) {
        super();
        
        this._sideSize = options.sideSize;

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

        const position = this.geometry.attributes.position as THREE.BufferAttribute;

        for (let i = 0; i < position.count; ++i) {
            const x = position.getX(i);
            const y = position.getY(i);
            const z = this.getElevation(x, y);
            position.setZ(i, z);
        }

        position.needsUpdate = true;
        this.geometry.computeVertexNormals()
    }

    public getElevation(x:number, y:number) : number
    {
        if( x*x > this._sideSize * this._sideSize ) return -1;
        if( y*y > this._sideSize * this._sideSize ) return -1;

        var major = 0.6 * this._simplex.noise( 0.1*x, 0.1*y );
        var minor = 0.2 * this._simplex.noise( 0.3*x, 0.3*y );
    
        return major + minor;
    }
}
  