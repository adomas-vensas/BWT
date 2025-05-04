import './style.css'

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Ground from './turbine_elements/Ground';
import Mast from './objects/Mast';
import * as tf from '@tensorflow/tfjs'
import VIVSimulation from './simulation/VIVSimulation';
import '@tensorflow/tfjs-backend-webgpu';
import FPSTracker from './utilities/FPSTracker';
import VortexShedding from './objects/VortexShedding';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 30, 0); 
camera.up.set(1, 0, 0);    
camera.lookAt(0, 0, 0);   

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

scene.background = new THREE.Color( 'deepskyblue' );

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const sim = new VIVSimulation();
const height = 3;
const mast = new Mast({ x: 0, z: 0, y: height / 2, radius: sim.D_PHYSICAL / 2, height: height, lowerFrac: 0.1 });
scene.add(mast);

const reachThreshold = 0.95;

const markers: THREE.Mesh[] = [];
const maxMarkers = 10;


function requestNextTarget() {
  sim.updateAsync().then(([newZ, newX, newCurl]) => {
    targetX = newX;
    targetZ = newZ;
    curl = newCurl;

    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16),
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


let targetZ:number = 0, targetX:number = 0;
let curl:Float32Array = new Float32Array();
let lastPosZ:number = targetZ, lastPosX:number = targetX;

// await requestNextTarget();

const fpsTracker = new FPSTracker();
fpsTracker.start();

const vortexShedding = new VortexShedding(sideSize, sideSize, sim.NX, sim.NY);
vortexShedding.rotateX(-Math.PI / 2)
vortexShedding.rotateZ(-Math.PI / 2)
scene.add(vortexShedding);

async function animate(t: number) {
  stepRatio += 0.4


  if(stepRatio >= reachThreshold)
  {
    lastPosZ = targetZ;
    lastPosX = targetX;
    // requestNextTarget();
    
    lastTime = t;
    stepRatio = 0
  }
  
  fpsTracker.track();
  // mast.sway({z: lastPosZ, x: lastPosX}, {z: lastPosZ, x: lastPosX}, stepRatio);
  // vortexShedding.update(curl);

  controls.update();
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );

const url = "ws://localhost:8000/ws/stream"
const ws = new WebSocket(url);
ws.binaryType = "arraybuffer";

ws.onopen = () => {
  console.log("WebSocket connected to", url);
};

ws.onmessage = (event: MessageEvent) => {
  // 4. event.data is an ArrayBuffer of 2 * NX * NY float32 values
  const buffer = event.data as ArrayBuffer;
  const view = new DataView(buffer)

  const newX = view.getFloat32(0, true) 
  const newY = view.getFloat32(4, true) 

  const curlBuffer = buffer.slice(8);
  const curl = new Float32Array(curlBuffer);

  vortexShedding.update(curl);
};