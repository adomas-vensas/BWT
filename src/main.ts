import './style.css'

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Ground from './turbine_elements/Ground';
import Mast from './objects/Mast';
import Wind from './objects/Wind';
import * as tf from '@tensorflow/tfjs'
import VIVSimulation from './simulation/VIVSimulation';
import '@tensorflow/tfjs-backend-webgpu';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 30, 0); 
camera.up.set(1, 0, 0);    
camera.lookAt(0, 0, 0);   

await tf.setBackend('webgl');
await tf.ready();

camera.rotateY(-Math.PI/2);
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

const ground = new Ground({ sideSize: sideSize, resolution: 64 });
scene.add(ground);

const wind = new Wind({
  planeWidth: sideSize,
  lineAmount: 1,
  lineResolution: 10
});
scene.add(...wind.getWindLines());


scene.background = new THREE.Color( 'deepskyblue' );

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

let lastUpdated = 0;
let angleInDeg = 45;


const sim = new VIVSimulation();
const height = 3;
const mast = new Mast({ x: 0, z: 0, y: height / 2, radius: sim.D / 2, height: height });
scene.add(mast);

let lastTime = 0
async function animate(t: number) {

  if(t - lastTime > 500)
  {
    lastTime = t;
    let [newX, newY] = await sim.updateAsync();

    mast.position.set(newY, height/2, newX);
    tf.nextFrame()
  }

  // const dArr = await d.data() as Float32Array;
  // const dx = dArr[0], dy = dArr[1];
//   var time = t / 1000;
//   if(time - lastUpdated > 60)
//   {
//     angleInDeg = fetchAngle();
//     console.log(angleInDeg)
//     wind.setAngle(angleInDeg);
//     lastUpdated = time;
//   }

//   wind.flow(t);

  controls.update();
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );

// function fetchAngle(): number
// {
//   const receivedAngleInDeg = Math.floor(Math.random() * 360);
//   return receivedAngleInDeg;
// }