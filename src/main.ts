import './style.css'

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Ground from './turbine_elements/Ground';
import Mast from './objects/Mast';
import Wind from './objects/Wind';
import WindLine from './objects/WindLine';
import { MeshLineGeometry } from 'meshline';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 30, 0); 
camera.up.set(1, 0, 0);    
camera.lookAt(0, 0, 0);   

// camera.rotateY(-Math.PI/2);
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

const axesHelper = new THREE.AxesHelper( 25 );
scene.add(axesHelper);

const ambientLight = new THREE.AmbientLight(0xFFFFFF);
scene.add(ambientLight);

const sideSize : number = 20;

// const geometry = new THREE.SphereGeometry( 0.5, 32, 16 ); 
// const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); 
// const sphere = new THREE.Mesh( geometry, material );
// sphere.position.set(sideSize/2, 0, sideSize/2);
// scene.add( sphere );

const ground = new Ground({ sideSize: sideSize, resolution: 64 });
scene.add(ground);

const wind = new Wind(sideSize);
const windLines = wind.generateWindLines(10, 10);
scene.add(...windLines)

const height = 3;
// const mast = new Mast({ x: 0, z: sideSize / 4, y: height / 2, height: height });
// scene.add(mast);

scene.background = new THREE.Color( 'deepskyblue' );

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

async function animate(t: number) {

  for( var line of windLines ){
    line.flowLine(t);
  }

  // controls.update();
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );