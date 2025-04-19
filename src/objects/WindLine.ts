import * as THREE from 'three';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
// import fragmentShader from '../shaders/Wind/fragment.glsl?raw';
// import vertexShader from '../shaders/Wind/vertex.glsl?raw';


export default class WindLine extends THREE.Mesh {
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

    private _domain:number;
    
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
        this._domain = options.planeWidth / 2;

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
            this._lastA = this._a;
            const angleInRad = Math.random() * (Math.PI / 2)
            this._a = Math.tan(angleInRad);
            // console.log("    Rad: " + angleInRad)
            console.log("Degrees: " + angleInRad * (180 / Math.PI));
            // console.log("Last A: " + this._lastA)
            // console.log("     A: " + this._a)
            
            this._domain = this.calculateDomain(this._a);

            this._lastUpdated = time;
        }

        let i = -1.0;
        while(i < this._domain)
        {
            i = this.interate(i);
            // console.log(i)
            // console.log(i)
            // var t = time + (i % rowLength) / 60;
            var z = i;
            
            var x = this.getA() * i;
            var y = 0 // ground.getElevation(x, -z) + 0.5 + 0.04 * (i > rowLength - 1 ? 1 : -1) * Math.cos((i % rowLength - 10) /8);
            
            geometryPoints.push(new THREE.Vector3(x, y, z));
        }

        this.geometry.setPoints(geometryPoints);
    }


    private interate(i:number)
    {
        if(i + 1 <= this._domain)
        {
            return i + 1;
        }

        return this._domain;
    }

    private getA()
    {
        if(this._lastA > this._a)
        {
            this._lastA -= 0.0007;
        }
        else
        {
            this._lastA += 0.0007;
        }

        return this._lastA;
    }

    private calculateDomain(a:number)
    {
        const side = this._planeWidth / 2;

        if(0 <= a && a <= 1)
        {
            return side;
        }
        else if(1 < a)
        {
            return side / a;
        }

        return side;
    }

}