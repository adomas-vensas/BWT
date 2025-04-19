import * as THREE from 'three';
import WindLine from '../objects/WindLine';

export default class Wind extends THREE.Mesh{

    private _texture : THREE.CanvasTexture;
    private _windLines: Array<WindLine>
    
    private _windAngleInDeg: number = 45;
    private _rotationStep: number = 1;
    private _rotationMultiplier: number = 0.001;

    constructor(options: { planeWidth: number, lineAmount: number, lineResolution: number})
    {
        super()

        this._texture = this.createTexture(options.planeWidth);
        this._windLines = this.generateWindLines(options.lineAmount,
            options.lineResolution, options.planeWidth);
    }

    public setAngle(windAngleInDeg: number)
    {
        this._rotationStep = this.calculateRotationMultiplier(windAngleInDeg);
        console.log(windAngleInDeg, this._windAngleInDeg, this._rotationStep)
        this._windAngleInDeg = windAngleInDeg;
    }

    public getWindLines()
    {
        return this._windLines;
    }

    public flow(timeInMs: number)
    {
        for(var line of this._windLines)
        {
            line.flowLine(timeInMs, this._windAngleInDeg, this._rotationStep);
        }
    }

    private generateWindLines(amount: number, resolution: number, planeWidth: number) : Array<WindLine>
    {
		var lines = [];

        for(var i = 0; i < amount; ++i)
        {
            var randomResolution:number = THREE.MathUtils.randInt(1, resolution)
            var line = new WindLine({
                texture: this._texture,
                resolution: randomResolution,
                planeWidth: planeWidth
            });
            lines.push( line );
        }

        return lines;
    }

    private createTexture(planeWidth: number)
    {
        var canvas = document.createElement( 'CANVAS' ) as HTMLCanvasElement;
        canvas.width = planeWidth;
        canvas.height = planeWidth;

        var context = canvas.getContext( '2d' )!;
        
        var gradient = context.createLinearGradient( 0, 0, planeWidth, 0 );

        gradient.addColorStop( 0.0, 'rgba(255,255,255,0)' );
        gradient.addColorStop( 0.5, 'rgba(255,255,255,128)' );
        gradient.addColorStop( 1.0, 'rgba(255,255,255,0)' );

        context.fillStyle = gradient;
        context.fillRect(0, 0, planeWidth, planeWidth );
        return new THREE.CanvasTexture( canvas );
    }
    
    private calculateRotationMultiplier(windAngleInDeg: number): number
    {
        const shortest =
            (windAngleInDeg - this._windAngleInDeg + 540) % 360
            - 180;

        const direction = shortest < 0 ? -1 : 1;

        return direction * this._rotationMultiplier;
    }
}