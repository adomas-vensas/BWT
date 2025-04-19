import * as THREE from 'three';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
// import fragmentShader from '../shaders/Wind/fragment.glsl?raw';
// import vertexShader from '../shaders/Wind/vertex.glsl?raw';
import { SimplexNoise } from 'three/examples/jsm/Addons';
import * as mutils from '../utilities/MathUtils';


export default class WindLine extends THREE.Mesh {
    private readonly _simplex: SimplexNoise = new SimplexNoise;
    readonly rnda: number;
    readonly rndb: number;
    readonly rndc: number;
    readonly rndd: number;
    readonly geometry: MeshLineGeometry;
    readonly space: number;
    private _planeWidth:number;
    d_x: number;

    private _angleInDeg:number = 45;
    private _lastAngleInDeg:number = this._angleInDeg;
    
    private _angleInRad:number = Math.PI / 4;
    private _lastAngleInRad:number = this._angleInRad;
    
    private _lastMultiplier: number = 1;

    private _length:number;

    private _rightDomain: number;

    constructor(options: {texture: THREE.CanvasTexture, resolution: number, planeWidth: number})
    {
        const geom = new MeshLineGeometry();
        
        super(geom)

        this.geometry = geom;

        this.rnda = Math.random();
        this.rndb = Math.random();
        this.rndc = Math.random();
        this.rndd = Math.random();

        this._planeWidth = options.planeWidth;
        this._rightDomain = options.planeWidth / 2;

        this._length = Math.random() * 5;

        this.space = 5
        this.d_x = Math.random() * this.space - this.space / 2 
        
        this.material = new MeshLineMaterial({
            useMap: 1,
            lineWidth: 0.7,
            map: options.texture,
            resolution: new THREE.Vector2(options.resolution, 1)
        })

    }

    
    public flowLine( time:number, angleInDeg:number )
    {
        const rowLength = this.geometry.width.length;

        time /= 1000;

        const geometryPoints = []
        
        // this._lastAngleInDeg = this._angleInDeg;
        // this._angleInDeg = destinationAngle;

        // const shortest =
        //     (this._angleInDeg - this._lastAngleInDeg + 540) % 360
        //     - 180;

        // this._lastMultiplier = shortest < 0 ? -1 : 1;

        // this._lastAngleInRad = this._angleInRad
        // this._angleInRad = THREE.MathUtils.degToRad(this._angleInDeg);
        
        for(var i = 0; i <= this._length; i += 0.1)
        {
            var z = -this._planeWidth / 2 + i + time % this._planeWidth + this.d_x;
            var x = -this._planeWidth / 2 + i + time % this._planeWidth;
            
            [z, x] = this.rotateLine(z, x, this.getAngle() - Math.PI / 4)

            if(Math.abs(z) > this._rightDomain || Math.abs(x) > this._rightDomain)
            {
                continue;
            }

            var y = 0.5 + this.getElevation(x, -z) * (Math.cos(time * this.rnda) * Math.sin(time * this.rndb) + Math.cos(x * this.rndc));
            
            geometryPoints.push(new THREE.Vector3(x, y, z));
        }

        this.geometry.setPoints(geometryPoints);
    }

    private getAngle(): number {
        if (Math.abs(this._lastAngleInDeg - this._angleInDeg) > 1) {
            const step = this._lastMultiplier * 0.001;
            const newAngleInDeg = mutils.mod(this._lastAngleInDeg + step, 360);
            this._lastAngleInDeg = newAngleInDeg;
            this._lastAngleInRad = THREE.MathUtils.degToRad(newAngleInDeg);
        }
      
        return this._lastAngleInRad;
      }

    private rotateLine(z: number, x: number, angleInRad: number): [number, number] {
        const newZ = z * Math.cos(angleInRad) - x * Math.sin(angleInRad);
        const newX = z * Math.sin(angleInRad) + x * Math.cos(angleInRad);
      
        return [newZ, newX];
    }

    public getElevation(x:number, y:number) : number
    {
        if( x*x > this._planeWidth * this._planeWidth ) return -1;
        if( y*y > this._planeWidth * this._planeWidth ) return -1;

        var major = 0.6 * this._simplex.noise(0.1 * x, 0.1 * y);
        var minor = 0.2 * this._simplex.noise(0.3 * x, 0.3 * y);
    
        return major + minor;
    }
}