import './style.css'

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Ground from './turbine_elements/Ground';
import Mast from './objects/Mast';
import Wind from './objects/Wind';
import * as lbm from './simulation/lbm';
import * as tf from '@tensorflow/tfjs'
import * as mrt from './simulation/mrt';
import * as ib from './simulation/ib';

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

// structural parameters
const FN = U0 / (UR * D)                                          // Natural frequency
const MASS = Math.PI * (D / 2) ** 2 * MR                          // Mass of the cylinder
const STIFFNESS = (FN * 2 * Math.PI) ** 2 * MASS * (1 + 1 / MR)   // Stiffness of the spring
const DAMPING = 2 * Math.sqrt(STIFFNESS * MASS) * DR              // Damping of the spring

// fluid parameters
const NU = U0 * D / RE                                            // Kinematic viscosity
const TAU = 3 * NU + 0.5                                          // Relaxation time
const OMEGA = 1 / TAU                                             // Relaxation parameter
let [MRT_COL_LEFT, _] = mrt.precomputeLeftMatrices(OMEGA)

const xr = tf.range(0, NX, 1, 'int32');
const yr = tf.range(0, NY, 1, 'int32');

const X = xr.reshape([NX, 1]).tile([1, NY]);  // Tensor2D<[NX,NY]>
const Y = yr.reshape([1, NY]).tile([NX, 1]);

const THETA_MARKERS = tf.range(0, N_MARKER, 1, 'float32')
const X_MARKERS = THETA_MARKERS.cos().mul(0.5 * D).add(X_OBJ) as tf.Tensor1D;
const Y_MARKERS = THETA_MARKERS.sin().mul(0.5 * D).add(Y_OBJ) as tf.Tensor1D;
const L_ARC = D * Math.PI / N_MARKER

const IB_START_X = Math.floor(X_OBJ - 0.5 * D - IB_MARGIN)
const IB_START_Y = Math.floor(Y_OBJ - 0.5 * D - IB_MARGIN)
const IB_SIZE = D + IB_MARGIN * 2


let rho: tf.Tensor2D = tf.ones([NX, NY], 'float32');
let f: tf.Tensor3D = tf.zeros([9, NX, NY], 'float32');
let feq: tf.Tensor3D = tf.zeros([9, NX, NY], 'float32');

const d: tf.Tensor1D = tf.zeros([2], 'float32'); // displacement
let v: tf.Tensor1D = tf.zeros([2], 'float32'); // velocity
const a: tf.Tensor1D = tf.zeros([2], 'float32'); // acceleration
const h: tf.Tensor1D = tf.zeros([2], 'float32');


const u0 = tf.fill([NX, NY], U0); // u[0, :, :]
const u1 = tf.zeros([NX, NY], 'float32'); // u[1, :, :]


let u: tf.Tensor3D = tf.stack([u0, u1], 0) as tf.Tensor3D;
f = lbm.getEquilibrium(rho, u)
v = tf.tensor1d([d.arraySync()[0], 1e-2], 'float32');

const vMarkers = v.reshape([1, 2]).tile([N_MARKER, 1]);


const feq_init = f.slice([0, 0, 0], [9, 1, 1]).reshape([9]);

update(f, d, v, a, h)

// console.log(feq_init.print())
// console.log(lbm.getEquilibrium(rho, u).print())
console.log(tf.getBackend());

function update(f: tf.Tensor3D, d: tf.Tensor1D, v: tf.Tensor1D, a: tf.Tensor1D, h: tf.Tensor1D)
{
  const macro = lbm.getMacroscopic(f);
  rho = macro.rho;
  u = macro.u;

  feq = lbm.getEquilibrium(rho, u);
  f = mrt.collision(f, feq, MRT_COL_LEFT)

  let [x_markers, y_markers] = ib.getMarkersCoords2dof(X_MARKERS, Y_MARKERS, d)

  const ibStartX = d.gather(0).add(IB_START_X).floor().toInt();
  const ibStartY = d.gather(1).add(IB_START_Y).floor().toInt();

  const ibx = ibStartX.dataSync()[0];
  const iby = ibStartY.dataSync()[0];

  const uSlice = u.slice(
    [0,   ibx,   iby],    // begin at (0, ibx, iby)
    [2,   IB_SIZE, IB_SIZE] // size (2, IB_SIZE, IB_SIZE)
  );
  
  const XSlice = X.slice(
    [ibx,   iby],         // begin at (ibx, iby)
    [IB_SIZE, IB_SIZE]    // size (IB_SIZE, IB_SIZE)
  ) as tf.Tensor2D;
  
  const YSlice = Y.slice(
    [ibx,   iby], 
    [IB_SIZE, IB_SIZE]
  ) as tf.Tensor2D;
  
  const fSlice = f.slice(
    [0,   ibx,   iby], 
    [9,   IB_SIZE, IB_SIZE]
  );

  const vMarkers = v.reshape([1,2]).tile([N_MARKER,1]) as tf.Tensor2D;
  let [g_slice, h_markers] = ib.multiDirectForcing(uSlice, XSlice, YSlice,
    vMarkers, x_markers, y_markers, N_MARKER, L_ARC, N_ITER_MDF, ib.kernelRange4);
    
  const g_lattice = lbm.getDiscretizedForce(g_slice, uSlice)
  console.log(g_lattice.print())

}









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