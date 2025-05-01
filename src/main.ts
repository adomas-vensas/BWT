import './style.css'

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Ground from './turbine_elements/Ground';
import Mast from './objects/Mast';
import FPSTracker from './utilities/FPSTracker';
import VortexShedding from './objects/VortexShedding';


const worker = new Worker(new URL('./simulation/simWorker.ts', import.meta.url), {
  type: 'module'
});

const coordQueue: { x: number; z: number; curl: Float32Array }[] = [];
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
function shiftCoord(): [{x: number; z: number}, Float32Array] | null {
  if (coordQueue.length === 0) return null;

  const data = coordQueue.shift()!;
  // tell the worker it can push more
  worker.postMessage('dequeue');
  if (coordQueue.length < maxBuffer / 2) {
    worker.postMessage('resume');
  }
  return [{ x: data.x, z: data.z }, data.curl];
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

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const axesHelper = new THREE.AxesHelper( 25 );
scene.add(axesHelper);

const ambientLight = new THREE.AmbientLight(0xFFFFFF);
scene.add(ambientLight);

const sideSize : number = 20;
const resolution: number = 64;

// const ground = new Ground({ sideSize: sideSize, resolution: resolution });
// scene.add(ground);

scene.background = new THREE.Color( 'deepskyblue' );

let vortexShedding = new VortexShedding(20, 10, 2048);
scene.add(vortexShedding);


const diameter = 1;
const height = 3;
const mast = new Mast({ x: 0, z: 0, y: height / 2, radius: diameter / 2, height: height, lowerFrac: 0.1 });
vortexShedding.rotateX(-Math.PI/2)
vortexShedding.rotateZ(-Math.PI/2)
scene.add(mast);


let lastPos  = { x: 0, z: 0 };
let nextPos  = { x: 0, z: 0 };
let nextCurl = new Float32Array(resolution*resolution)
const primed = shiftCoord();
if (primed) {
  [nextPos, nextCurl] = primed;
}
let interpT  = 0;
const interpSpeed = 0.05;

fpsTracker.start();

async function animate(t: number) {
  interpT += interpSpeed;

  if (interpT >= 1) {
    lastPos = nextPos;
    const fresh = shiftCoord();
    if (fresh) {
      [nextPos, nextCurl] = fresh;
    }
    interpT = 0;
  }

  mast.sway(lastPos, nextPos, interpT);
  vortexShedding.update(nextCurl, new THREE.Vector3(nextPos.x, 0, nextPos.z))

  fpsTracker.track();

  controls.update();
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );