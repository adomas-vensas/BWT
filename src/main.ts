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
import * as dyn from './simulation/dyn';
import * as post from './simulation/post';
import '@tensorflow/tfjs-backend-webgpu';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 30, 0); 
camera.up.set(1, 0, 0);    
camera.lookAt(0, 0, 0);   

await tf.setBackend('webgl');
await tf.ready();

// camera.rotateY(-Math.PI/2);
// const renderer = new THREE.WebGLRenderer({
//   canvas: document.querySelector('#bg') as HTMLCanvasElement,
// });

// window.addEventListener('resize', function () {
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
// });

// renderer.setPixelRatio(window.devicePixelRatio);
// renderer.setSize(window.innerWidth, window.innerHeight);

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

// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;

let lastUpdated = 0;
let angleInDeg = 45;


// await tf.setBackend('webgpu');
// await tf.ready();


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
let [MRT_COL_LEFT, MRT_SRC_LEFT] = mrt.precomputeLeftMatrices(OMEGA)

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

let d: tf.Tensor1D = tf.zeros([2], 'float32'); // displacement
let v: tf.Tensor1D = tf.zeros([2], 'float32'); // velocity
let a: tf.Tensor1D = tf.zeros([2], 'float32'); // acceleration
let h: tf.Tensor1D = tf.zeros([2], 'float32');


const u0 = tf.fill([NX, NY], U0); // u[0, :, :]
const u1 = tf.zeros([NX, NY], 'float32'); // u[1, :, :]


let u: tf.Tensor3D = tf.stack([u0, u1], 0) as tf.Tensor3D;
f = lbm.getEquilibrium(rho, u)
v = tf.tensor1d([d.arraySync()[0], 1e-2], 'float32');

const vMarkers = v.reshape([1, 2]).tile([N_MARKER, 1]);


const feq_init = f.slice([0, 0, 0], [9, 1, 1]).reshape([9]);

// runSimulation(1000)

async function runSimulation(steps: number = 10) {
  for (let t = 0; t < steps; t++) {
    [f, rho, u, d, v, a, h] = update(f, d, v, a, h);

    // 2) optionally plot
    // if (PLOT && t % PLOT_EVERY === 0 && t > PLOT_AFTER)
    {
      // const curl = post.calculateCurl(u).transpose();     // Tensor2D<[NY,NX]>
      // const curlData = curl.arraySync() as number[][];    // JS 2D array

      // const [dx, dy] = d.arraySync() as [number, number];
      // const cx = (X_OBJ + dx) / D;
      // const cy = (Y_OBJ + dy) / D;

      // drawCircle(cx, cy);

      // // give the browser a frame to render
      // await tf.nextFrame();
    }
    const [dx, dy] = d.arraySync() as [number, number];
    console.log(dx)
  }
}

export function drawCircle(
  normX: number,   // normalized x in [0,1]
  normY: number,   // normalized y in [0,1]
  radiusNorm = 0.05, // normalized radius (e.g. 0.05 of width)
  color = 'red',
  lineWidth = 2
) {
  console.log("asdasd")
  const canvas = document.getElementById('overlay') as HTMLCanvasElement;
  const ctx    = canvas.getContext('2d')!;
  const W      = canvas.width;
  const H      = canvas.height;

  // convert normalized to pixels
  const x = normX * W;
  const y = normY * H;
  const r = radiusNorm * W; // or H, depending on aspect

  // clear previous circle
  ctx.clearRect(0, 0, W, H);

  // draw new circle
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth   = lineWidth;
  ctx.stroke();
}



function update(f: tf.Tensor3D, d: tf.Tensor1D, v: tf.Tensor1D, a: tf.Tensor1D, h: tf.Tensor1D) :  [
  tf.Tensor3D,    // new f
  tf.Tensor2D,    // rho
  tf.Tensor3D,    // u
  tf.Tensor1D,    // d
  tf.Tensor1D,    // v
  tf.Tensor1D,    // a
  tf.Tensor1D     // h
]
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
  const s_slice = mrt.getSource(g_lattice, MRT_SRC_LEFT)

  const patch = fSlice.add(s_slice);
  const pads: Array<[number, number]> = [
    [0, 0],                        // no padding on the “direction” axis
    [ibx,  f.shape[1] - IB_SIZE - ibx],  // pad before and after in X
    [iby,  f.shape[2] - IB_SIZE - iby]   // pad before and after in Y
  ];
  const paddedPatch = patch.pad(pads);  // now shape [9,NX,NY]
  const regionMask = tf
    .ones([9, IB_SIZE, IB_SIZE], 'bool')
    .pad(pads);   // true inside the IB box, false elsewhere
  f = tf.where(regionMask, paddedPatch, f) as tf.Tensor3D;

  h = ib.getForceToObj(h_markers)
  const scale = (Math.PI * D * D) / 4;
  h = h.add(a.mul(scale)) as tf.Tensor1D;

  [a, v, d] = dyn.newmark2dof(a, v, d, h, MASS, STIFFNESS, DAMPING)

  f = lbm.streaming(f)

  const feqInitFull = feq_init
  .reshape([9, 1, 1])         // [9,1,1]
  .tile([1, NX, NY]) as tf.Tensor3D;  // [9,NX,NY]

  f = lbm.boundaryEquilibrium(f, feqInitFull, 'right');
  f = lbm.velocityBoundary(f, U0, 0, "left")

  return [f, rho, u, d, v, a, h]
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