import './style.css'

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Ground from './turbine_elements/Ground';
import Mast from './objects/Mast';
import Wind from './objects/Wind';
import * as tf from '@tensorflow/tfjs'
import VIVSimulation from './simulation/VIVSimulation';
import '@tensorflow/tfjs-backend-webgpu';
import { GeometryCompressionUtils } from 'three/examples/jsm/Addons';

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

const heightSegments = (mast.geometry as THREE.CylinderGeometry).parameters.heightSegments;
const radialSegments = (mast.geometry as THREE.CylinderGeometry).parameters.radialSegments;

const numRings = heightSegments + 1
const vertsPerRing = radialSegments + 1;

const positions = mast.geometry.attributes.position;
const restPositions  = positions.array.slice(); // Float32Array copy

const halfH          = height / 2;

const swayAmp = 0.5;
const swayFreq= 1.0;


const β = 1.875104071;  
const A = (Math.cosh(β) + Math.cos(β)) / (Math.sinh(β) + Math.sin(β));
const denom = Math.cosh(β) - Math.cos(β) - A * (Math.sinh(β) - Math.sin(β));

function cantileverMode(s: number) {
  const num = Math.cosh(β * s) - Math.cos(β * s)
            - A * (Math.sinh(β * s) - Math.sin(β * s));
  return num / denom;
}

async function animate(t: number) {

  const bendVal = 0.2 * Math.sin(t/500);

  for (let i = 0; i < positions.count; i++) {
    const ix    = 3*i + 0;
    const iy    = 3*i + 1;
    const iz    = 3*i + 2;

    const restX = restPositions[ix];
    const restY = restPositions[iy];
    const restZ = restPositions[iz];

    if (restY > 0) {
      const s = restY / halfH;
      const w = cantileverMode(s);
      // const bendVal = swayAmp * Math.sin(2*Math.PI*swayFreq * t);
      // apply bending only to X (for example)
      positions.array[iz] = restZ + bendVal * w;
    } else {
      // leave the bottom half exactly as it was
      positions.array[iz] = restZ;
    }
  
    // we leave Y and Z alone
    positions.array[ix] = restX;
    positions.array[iy] = restY;
  }

  positions.needsUpdate = true;
  mast.geometry.computeVertexNormals();

  // if(t - lastTime > 500)
  // {
  //   lastTime = t;
  //   let [newX, newY] = await sim.updateAsync();

  //   mast.position.set(newY, height/2, newX);
  //   tf.nextFrame()
  // }

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