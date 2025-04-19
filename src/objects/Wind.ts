import * as THREE from 'three';
import WindLine from '../objects/WindLine';

export default class Wind extends THREE.Mesh{

    private _texture : THREE.CanvasTexture;
    private _planeWidth: number;

    constructor(planeWidth: number)
    {
        super()

        var canvas = document.createElement( 'CANVAS' ) as HTMLCanvasElement;
        canvas.width = planeWidth;
        canvas.height = planeWidth;

        this._planeWidth = planeWidth;
    
        var context = canvas.getContext( '2d' )!;
        
        var gradient = context.createLinearGradient( 0, 0, planeWidth, 0 );

        gradient.addColorStop( 0.0, 'rgba(255,255,255,0)' );
        gradient.addColorStop( 0.5, 'rgba(255,255,255,128)' );
        gradient.addColorStop( 1.0, 'rgba(255,255,255,0)' );

        context.fillStyle = gradient;
        context.fillRect(0, 0, planeWidth, planeWidth );
        
        this._texture = new THREE.CanvasTexture( canvas );
    }

    public generateWindLines(amount: number, resolution: number) : Array<WindLine>
    {
		var lines = [];

        for(var i = 0; i < amount; ++i)
        {
            var randomWidth:number = THREE.MathUtils.randInt(1, resolution)
            var line = new WindLine({ texture: this._texture, resolution: randomWidth, planeWidth: this._planeWidth });
            lines.push( line );
        }

        return lines;
    }
}