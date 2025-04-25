declare module '../utilities/THREE.MeshLine.js' {
    import * as THREE from 'three';
  
    export class MeshLine extends THREE.BufferGeometry {
      constructor();
      setPoints(points: THREE.Vector3[] | number[]): void;
      setGeometry(geometry: THREE.BufferGeometry): void;
    }
  
    export class MeshLineMaterial extends THREE.ShaderMaterial {
      constructor(parameters?: any);
    }
  }