import './style.css'

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Ground from './turbine_elements/Ground';
import Mast from './objects/Mast';
import Wind from './objects/Wind';
import VIVSimulation from './simulation/VIVSimulation';
import '@tensorflow/tfjs-backend-webgpu';
import FPSTracker from './utilities/FPSTracker';


const worker = new Worker(new URL('./simulation/simWorker.ts', import.meta.url), {
  type: 'module'
});

const coordQueue: { x: number; z: number }[] = [];
const maxBuffer = 20;

// whenever worker has new data, enqueue it
worker.onmessage = (ev) => {
  coordQueue.push(ev.data);
  // if we ever exceed our buffer, tell the worker to pause
  if (coordQueue.length >= maxBuffer) {
    worker.postMessage('pause');
  }
};

// whenever we consume one, tell the worker it can resume (if paused)
function shiftCoord() {
  if (coordQueue.length === 0) {
    return null;
  }
  const coord = coordQueue.shift()!;
  // inform worker we freed one slot
  worker.postMessage('dequeue');
  if (coordQueue.length < maxBuffer / 2) {
    worker.postMessage('resume');
  }
  return coord;
}

const fpsTracker = new FPSTracker();
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 30, 0); 
camera.up.set(1, 0, 0);    
camera.lookAt(0, 0, 0);

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

// const wind = new Wind({
//   planeWidth: sideSize,
//   lineAmount: 1,
//   lineResolution: 10
// });
// scene.add(...wind.getWindLines());


scene.background = new THREE.Color( 'deepskyblue' );

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const sim = new VIVSimulation();
const height = 3;
const mast = new Mast({ x: 0, z: 0, y: height / 2, radius: sim.D / 2, height: height, lowerFrac: 0.1 });
scene.add(mast);


let lastPos = { x: 0, z: 0 };
let nextPos = shiftCoord() || { x: 0, z: 0 };
let interpT  = 0;
const interpSpeed = 0.05;

fpsTracker.start();

async function animate(t: number) {
  interpT += interpSpeed;

  if (interpT >= 1) {
    lastPos = nextPos;
    const newCoord = shiftCoord();
    nextPos = newCoord || lastPos;
    interpT = 0;
  }

  mast.sway(lastPos, nextPos, interpT);

  fpsTracker.track();

  controls.update();
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );