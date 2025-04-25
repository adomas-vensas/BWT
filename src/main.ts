import './style.css'

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Ground from './turbine_elements/Ground';
import Mast from './objects/Mast';
import Wind from './objects/Wind';
import * as tf from '@tensorflow/tfjs'
import VIVSimulation from './simulation/VIVSimulation';
import '@tensorflow/tfjs-backend-webgpu';


// --- at top of your main file ---
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

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 30, 0); 
camera.up.set(1, 0, 0);    
camera.lookAt(0, 0, 0);   


let lastFpsUpdate = performance.now();
let frameCount = 0;
let fps = 0;

const fpsElem = document.createElement('div');
fpsElem.style.position = 'absolute';
fpsElem.style.top = '10px';
fpsElem.style.left = '10px';
fpsElem.style.color = 'white';
fpsElem.style.fontFamily = 'monospace';
fpsElem.style.fontSize = '16px';
fpsElem.style.backgroundColor = 'rgba(0,0,0,0.5)';
fpsElem.style.padding = '4px 8px';
fpsElem.style.borderRadius = '4px';
fpsElem.style.zIndex = '999';
fpsElem.innerText = 'FPS: ...';
document.body.appendChild(fpsElem);

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

const sim = new VIVSimulation();
const height = 3;
const mast = new Mast({ x: 0, z: 0, y: height / 2, radius: sim.D / 2, height: height });
scene.add(mast);

const positions = mast.geometry.attributes.position;
const restPositions  = positions.array.slice();

const halfH          = height / 2;

const β = 1.875104071;  
const A = (Math.cosh(β) + Math.cos(β)) / (Math.sinh(β) + Math.sin(β));
const denom = Math.cosh(β) - Math.cos(β) - A * (Math.sinh(β) - Math.sin(β));

function cantileverMode(s: number) {
  const num = Math.cosh(β * s) - Math.cos(β * s)
            - A * (Math.sinh(β * s) - Math.sin(β * s));
  return num / denom;
}

const lowerFrac = 0.1;               
const y0 = -halfH + lowerFrac * height;

let lastTime = 0;

let lastPos = { x: 0, z: 0 };
let nextPos = shiftCoord() || { x: 0, z: 0 };
let interpT  = 0;
const interpSpeed = 0.05;

async function animate(t: number) {
  interpT += interpSpeed;

  if (interpT >= 1) {
    lastPos = nextPos;
    const newCoord = shiftCoord();
    nextPos = newCoord || lastPos;
    interpT = 0;
  }

  const interpX = THREE.MathUtils.lerp(lastPos.x, nextPos.x, interpT);
  const interpZ = THREE.MathUtils.lerp(lastPos.z, nextPos.z, interpT);

  for (let i = 0; i < positions.count; i++) {
    const ix    = 3*i + 0;
    const iy    = 3*i + 1;
    const iz    = 3*i + 2;

    const restX = restPositions[ix];
    const restY = restPositions[iy];
    const restZ = restPositions[iz];

    if (restY > y0) {
      const s = (restY - y0) / (halfH - y0);
      const w = cantileverMode(s);

      const newZ = interpZ * w;
      const newX = interpX * w;

      positions.array[iz] = restZ + newZ;
      positions.array[ix] = restX + newX;
    } else {
      positions.array[iz] = restZ;
      positions.array[ix] = restX;
    }
  
    positions.array[iy] = restY;
  }

  positions.needsUpdate = true;
  mast.geometry.computeVertexNormals();

  frameCount++;
  const now = performance.now();

  if (now - lastFpsUpdate >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFpsUpdate = now;
    fpsElem.innerText = `FPS: ${fps}`;
  }

  controls.update();
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );