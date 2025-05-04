import './style.css'

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Ground from './turbine_elements/Ground';
import Mast from './objects/Mast';
import FPSTracker from './utilities/FPSTracker';
import VortexShedding from './objects/VortexShedding';

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

scene.background = new THREE.Color( 'deepskyblue' );

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const height = 3

interface Params { NX: number; NY: number; RE: number; UR: number; MR: number, DR: number, D_PHYSICAL: number }
const res = await fetch("http://localhost:8000/params");
const params = await res.json() as Params;
console.log(params)

const mast = new Mast({ x: 0, z: 0, y: height / 2, radius: params.D_PHYSICAL / 2, height: height, lowerFrac: 0.1 });
scene.add(mast);

const fpsTracker = new FPSTracker();
fpsTracker.start();

const vortexShedding = new VortexShedding(sideSize, sideSize, params.NX, params.NY);
vortexShedding.rotateX(-Math.PI / 2)
vortexShedding.rotateZ(-Math.PI / 2)
scene.add(vortexShedding);

async function animate(t: number) {
  fpsTracker.track();

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
  const buffer = event.data as ArrayBuffer;
  const view = new DataView(buffer)

  const newX = view.getFloat32(0, true)
  const newY = view.getFloat32(4, true)

  const curlBuffer = buffer.slice(8);
  const curl = new Float32Array(curlBuffer);

  vortexShedding.update(curl);

  requestAnimationFrame((t:number) =>{
    mast.sway({z: 0, x: 0}, {z: newX, x: newY }, 1)
  });
};
