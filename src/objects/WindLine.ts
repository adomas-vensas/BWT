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
    
    private _length:number;

    private _rightDomain: number;

    private _rotationStepInDeg: number = 1;

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

    public rotateLine(destinationAngleInDeg: number, rotationStepInDeg: number)
    {
        this._lastAngleInDeg = this._angleInDeg;
        this._angleInDeg = destinationAngleInDeg;
        
        this._lastAngleInRad = this._angleInRad
        this._angleInRad = THREE.MathUtils.degToRad(this._angleInDeg);

        this._rotationStepInDeg = rotationStepInDeg;
    }

    public flowLine( timeInMs:number)
    {
        var timeInS = timeInMs / 1000;

        const rowLength = this.geometry.width.length;
        const geometryPoints = []
        
        for(var i = 0; i <= this._length; i += 0.1)
        {
            var t = timeInS + (i % rowLength) / 60;

            var z = -this._planeWidth / 2 + i + timeInS % this._planeWidth + this.d_x;
            var x = -this._planeWidth / 2 + i + timeInS % this._planeWidth;
            
            [z, x] = this.rotate(z, x, this.getAngle() - Math.PI / 4)

            if(Math.abs(z) > this._rightDomain || Math.abs(x) > this._rightDomain)
            {
                continue;
            }

            var y = 0.5 + this.getElevation(x, -z) * (Math.cos(t * this.rnda) * Math.sin(t * this.rndb) + Math.cos(t * this.rndc));
            
            geometryPoints.push(new THREE.Vector3(x, y, z));
        }

        this.geometry.setPoints(geometryPoints);
    }

    private getAngle(): number {

        if (Math.abs(this._lastAngleInDeg - this._angleInDeg) > 1) {
            const newAngleInDeg = mutils.mod(this._lastAngleInDeg + this._rotationStepInDeg, 360);

            this._lastAngleInDeg = newAngleInDeg;
            this._lastAngleInRad = THREE.MathUtils.degToRad(newAngleInDeg);
        }
      
        return this._lastAngleInRad;
    }

    private rotate(z: number, x: number, angleInRad: number): [number, number] {
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