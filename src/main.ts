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


await tf.setBackend('webgl');
await tf.ready();
console.log(tf.getBackend())

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
const restPositions  = positions.array.slice(); // Float32Array copy

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

const reachThreshold = 0.99;
let awaitingUpdate = false;

const markers: THREE.Mesh[] = [];
const maxMarkers = 10;


function requestNextTarget() {
  awaitingUpdate = true;

  sim.updateAsync().then(([newZ, newX]) => {
    targetX = newX;
    targetZ = newZ;

    awaitingUpdate = false;

    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 16, 16),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(Math.random(), Math.random(), Math.random()) })
    );
    marker.position.set(targetX, 2.5, targetZ);
    scene.add(marker);
    markers.push(marker);

    if (markers.length > maxMarkers) {
      const old = markers.shift();
      scene.remove(old!);
    }
  });
}


let lastTime = 0;
let stepRatio = 0.001
let k = 1;

const domain = 2;


let targetZ:number = 0, targetX:number = 0;
let lastPosZ:number = targetZ, lastPosX:number = targetX;

await requestNextTarget();

async function animate(t: number) {
  const progress = Math.min(stepRatio, 1);

  const deltaX = targetX - lastPosX;
  const deltaZ = targetZ - lastPosZ;
  const interpX = lastPosX + deltaX * progress;
  const interpZ = lastPosZ + deltaZ * progress;

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

  if(t - lastTime > 15000 || stepRatio >= reachThreshold)
  {
    lastPosX = targetX;
    lastPosZ = targetZ;
    requestNextTarget();
    // lastPosZ = targetZ;
    // lastPosX = targetX;
    // targetZ = Math.random() * domain - domain/2;
    // targetX = Math.random() * domain - domain/2;
    // console.log(targetZ, targetX)

    lastTime = t;
    stepRatio = 0
  }

  stepRatio += 0.05

  controls.update();
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );