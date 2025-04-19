import * as THREE from 'three';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
// import fragmentShader from '../shaders/Wind/fragment.glsl?raw';
// import vertexShader from '../shaders/Wind/vertex.glsl?raw';
import { SimplexNoise } from 'three/examples/jsm/Addons';


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

    private _lastUpdated:number = 0;
    
    private _a:number = 1;
    private _lastA:number = this._a;
    private _angle:number = 45;
    private _lastAngle:number = this._angle;

    private _rotate:boolean = false;

    private _leftDomain: number;
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
        this._leftDomain = -options.planeWidth / 2;
        this._rightDomain = options.planeWidth / 2;

        this.space = 5
        this.d_x = Math.random() * this.space - this.space / 2 
        
        this.material = new MeshLineMaterial({
            useMap: 1,
            lineWidth: 0.7,
            map: options.texture,
            resolution: new THREE.Vector2(options.resolution, 1)
        })

    }

    
    public flowLine( time:number )
    {
        const rowLength = this.geometry.width.length;

        time /= 1000;

        const geometryPoints = []
        
        if(time - this._lastUpdated >= 10)
        {
            const angleInRad = Math.random() * 2 * Math.PI;
            
            this._lastAngle = this._angle;
            this._angle = angleInRad * (180 / Math.PI)

            this._lastA = this._a
            this._a = Math.tan(angleInRad);

            this._rotate = true;
            
            // console.log(this._a);
        //     this._lastA = this._a;
        //     const angleInRad = Math.random() * (Math.PI / 2)
        //     this._a = Math.tan(angleInRad);
        //     // console.log("    Rad: " + angleInRad)
        //     console.log("Degrees: " + angleInRad * (180 / Math.PI));
        //     // console.log("Last A: " + this._lastA)
        //     // console.log("     A: " + this._a)
            
            this._lastUpdated = time;
        }

        for(var i = 0; i <= this._rightDomain; i += 0.7)
        {
            var z = i;
            var x = this.getA() * i;

            if(Math.abs(z) > this._rightDomain || Math.abs(x) > this._rightDomain)
            {
                continue;
            }
            var y = 0.5 + this.getElevation(x, -z) * (Math.cos(time * 5) * Math.sin(time) + Math.cos(x * this.rnda));
            
            geometryPoints.push(new THREE.Vector3(x, y, z));
        }

        this.geometry.setPoints(geometryPoints);
    }

    private getA()
    {
        if(this._lastA > this._a)
        {
            this._lastA -= 0.0007;
            return this._lastA;
        }
        else
        {
            this._lastA += 0.0007;
        }
        
        return this._lastA;
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

        var major = 0.6 * this._simplex.noise( 0.1*x, 0.1*y );
        var minor = 0.2 * this._simplex.noise( 0.3*x, 0.3*y );
    
        return major + minor;
    }
}