import * as THREE from 'three';
import WindLine from '../objects/WindLine';

export default class Wind extends THREE.Mesh{

    private _texture : THREE.CanvasTexture;
    private _windLines: Array<WindLine>

    constructor(options: { planeWidth: number, lineAmount: number, lineResolution: number})
    {
        super()

        this._texture = this.createTexture(options.planeWidth);
        this._windLines = this.generateWindLines(options.lineAmount,
            options.lineResolution, options.planeWidth);
    }

    public getWindLines()
    {
        return this._windLines;
    }

    public flow(t: number)
    {
        for(var line of this._windLines)
        {
            line.flowLine(t, 45);
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
}