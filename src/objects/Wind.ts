import * as THREE from 'three';
import WindLine from '../objects/WindLine';

export default class Wind extends THREE.Mesh{

    private _texture : THREE.CanvasTexture;

    constructor(planeWidth: number, planeHeight: number)
    {
        super()

        var canvas = document.createElement( 'CANVAS' ) as HTMLCanvasElement;
        canvas.width = planeWidth;
        canvas.height = planeHeight;
    
        var context = canvas.getContext( '2d' )!;
        
        var gradient = context.createLinearGradient( 0, 0, planeWidth, 0 );

        gradient.addColorStop( 0.0, 'rgba(255,255,255,0)' );
        gradient.addColorStop( 0.5, 'rgba(255,255,255,128)' );
        gradient.addColorStop( 1.0, 'rgba(255,255,255,0)' );

        context.fillStyle = gradient;
        context.fillRect( 0, 0, planeWidth, planeHeight );
        
        this._texture = new THREE.CanvasTexture( canvas );
    }

    public generateWindLines(amount: number) : Array<WindLine>
    {
		var lines = [];

        for(var i = 0; i < amount; ++i)
        {
            var line = new WindLine({ texture: this._texture });
            lines.push( line );
        }

        return lines;
    }
}