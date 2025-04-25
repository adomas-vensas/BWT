import * as THREE from 'three';

export default class Mast extends THREE.Mesh {

    radialSegments: number;
    heightSegments: number;

    readonly β = 1.875104071;  
    readonly A = (Math.cosh(this.β) + Math.cos(this.β)) / (Math.sinh(this.β) + Math.sin(this.β));
    readonly denom = Math.cosh(this.β) - Math.cos(this.β) - this.A * (Math.sinh(this.β) - Math.sin(this.β));

    height: number;
    halfH: number;
    lowerFrac: number;               
    readonly y0: number;

    positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
    restPositions: Float32Array;

    constructor(position: { x: number, y: number, z: number, radius:number, height: number, lowerFrac: number}){
        super()

        this.radialSegments = 32;
        this.heightSegments = 64;
        
        this.height = position.height;
        this.halfH = position.height / 2;
        this.lowerFrac = position.lowerFrac;
        this.y0 = -this.halfH + this.lowerFrac * this.height;

        
        this.geometry = new THREE.CylinderGeometry(position.radius, position.radius, position.height, 32, 64, undefined);
        this.material = new THREE.MeshBasicMaterial({color: 0xFFFFFF, wireframe: true});
        this.position.x = position.x;
        this.position.y = position.y;
        this.position.z = position.z;

        this.positions = this.geometry.attributes.position;
        this.restPositions  = this.positions.array.slice() as Float32Array;
    }

    public sway(lastPos: { z:number, x:number }, nextPos: { z:number, x:number }, interpT: number)
    {
        const interpX = THREE.MathUtils.lerp(lastPos.x, nextPos.x, interpT);
        const interpZ = THREE.MathUtils.lerp(lastPos.z, nextPos.z, interpT);
      
        for (let i = 0; i < this.positions.count; i++) {
          const ix    = 3*i + 0;
          const iy    = 3*i + 1;
          const iz    = 3*i + 2;
      
          const restX = this.restPositions[ix];
          const restY = this.restPositions[iy];
          const restZ = this.restPositions[iz];
      
          if (restY > this.y0) {
            const s = (restY - this.y0) / (this.halfH - this.y0);
            const w = this.cantileverMode(s);
      
            const newZ = interpZ * w;
            const newX = interpX * w;
      
            this.positions.array[iz] = restZ + newZ;
            this.positions.array[ix] = restX + newX;
          } else {
            this.positions.array[iz] = restZ;
            this.positions.array[ix] = restX;
          }
        
          this.positions.array[iy] = restY;
        }
      
        this.positions.needsUpdate = true;
        this.geometry.computeVertexNormals();
    }


    private cantileverMode(s: number) {
        const num = Math.cosh(this.β * s) - Math.cos(this.β * s)
                  - this.A * (Math.sinh(this.β * s) - Math.sin(this.β * s));
        return num / this.denom;
      }
}