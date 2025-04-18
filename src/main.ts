import './style.css'

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Ground from './turbine_elements/Ground';
import Mast from './objects/Mast';
import Wind from './objects/Wind';
import WindLine from './objects/WindLine';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg') as HTMLCanvasElement,
});

window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

camera.position.setZ(30);
camera.position.setY(10);


const axesHelper = new THREE.AxesHelper( 25 );
scene.add(axesHelper);

const ambientLight = new THREE.AmbientLight(0xFFFFFF);
scene.add(ambientLight);

const sideSize : number = 20;

const ground = new Ground({ sideSize: sideSize, resolution: 512 });
scene.add(ground);

const windLines = new Wind(sideSize, sideSize).generateWindLines(100, 10);
scene.add(...windLines)

const height = 3;
const mast = new Mast({ x: 0, z: sideSize / 4, y: height / 2, height: height });
scene.add(mast);

scene.background = new THREE.Color( 'deepskyblue' );

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

function animate(t: number) {

  for( var line of windLines ) flowLine( t, line );

  controls.update();
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );

function flowLine( time:number, line: WindLine )
{
  const rowLength = (line.geometry as THREE.PlaneGeometry).parameters.widthSegments + 1;
  const totalPoints = line.pos.count;

		time = time/6000;
		for( var i=0; i < totalPoints; i++ )
		{
				var t = time + (i % rowLength) / 60;
				var x = (sideSize / 2) * Math.sin( 5 * line.rnda * t + 6 * line.rndb );
				var z = (sideSize / 2) * Math.cos( 5 * line.rndc * t + 6 * line.rndd );
				var y = ground.getElevation(x, -z) + 0.5 + 0.04 * (i > rowLength - 1 ? 1 : -1) * Math.cos((i % rowLength - 10) /8);

				line.pos.setXYZ(i, x, y, z);
		}
		line.pos.needsUpdate = true;
}