import './style.css'

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Ground from './turbine_elements/Ground';
import Mast from './objects/Mast';
import Wind from './objects/Wind';
import * as lbm from './simulation/lbm';
import * as tf from '@tensorflow/tfjs'

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

const ground = new Ground({ sideSize: sideSize, resolution: 64 });
scene.add(ground);

const wind = new Wind({
  planeWidth: sideSize,
  lineAmount: 1,
  lineResolution: 10
});
scene.add(...wind.getWindLines());

const height = 3;
// const mast = new Mast({ x: 0, z: 0, y: height / 2, height: height });
// scene.add(mast);

scene.background = new THREE.Color( 'deepskyblue' );

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

let lastUpdated = 0;
let angleInDeg = 45;





const PLOT = false;
const PLOT_EVERY = 1000;
const PLOT_AFTER = 0;

const D = 30
const U0 = 0.1
const TM = 60000

const NX = 20 * D
const NY = 10 * D

// Cylinder position
const X_OBJ = 8 * D          // Cylinder x position
const Y_OBJ = 5 * D          // Cylinder y position

// IB method parameters
const N_MARKER = 4 * D       // Number of markers on cylinder
const N_ITER_MDF = 3         // Multi-direct forcing iterations
const IB_MARGIN = 2          // Margin of the IB region to the cylinder

// Physical parameters
const RE = 200               // Reynolds number
const UR = 5                 // Reduced velocity
const MR = 10                // Mass ratio
const DR = 0                 // Damping ratio



const rho: tf.Tensor2D = tf.ones([NX, NY], 'float32');
let f: tf.Tensor3D = tf.zeros([9, NX, NY], 'float32');
const feq: tf.Tensor3D = tf.zeros([9, NX, NY], 'float32');

const d: tf.Tensor1D = tf.zeros([2], 'float32'); // displacement
let v: tf.Tensor1D = tf.zeros([2], 'float32'); // velocity
const a: tf.Tensor1D = tf.zeros([2], 'float32'); // acceleration
const h: tf.Tensor1D = tf.zeros([2], 'float32');


const u0 = tf.fill([NX, NY], U0); // u[0, :, :]
const u1 = tf.zeros([NX, NY], 'float32'); // u[1, :, :]


const u: tf.Tensor3D = tf.stack([u0, u1], 0) as tf.Tensor3D;
f = lbm.getEquilibrium(rho, u)
v = tf.tensor1d([d.arraySync()[0], 1e-2], 'float32');

const feq_init = f.slice([0, 0, 0], [9, 1, 1]).reshape([9]);
// console.log(feq_init.print())
// console.log(lbm.getEquilibrium(rho, u).print())








// async function animate(t: number) {

//   var time = t / 1000;
//   if(time - lastUpdated > 60)
//   {
//     angleInDeg = fetchAngle();
//     console.log(angleInDeg)
//     wind.setAngle(angleInDeg);
//     lastUpdated = time;
//   }

//   wind.flow(t);

//   // controls.update();
//   renderer.render( scene, camera );
// }
// renderer.setAnimationLoop( animate );

// function fetchAngle(): number
// {
//   const receivedAngleInDeg = Math.floor(Math.random() * 360);
//   return receivedAngleInDeg;
// }