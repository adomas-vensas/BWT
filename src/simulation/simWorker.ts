// simWorker.js
import * as tf from '@tensorflow/tfjs';
import VIVSimulation from './VIVSimulation';

let sim: VIVSimulation;
let paused = false;
const maxBuffer = 30;            // upper‐limit on how many coords to hold
let queueLength = 0;

// Initialize TF backend & sim
async function init() {
  await tf.setBackend('webgl');
  await tf.ready();
  console.log(tf.getBackend())
  sim = new VIVSimulation();
  computeLoop();
}

async function computeLoop() {
  if (paused) {
    // simple back‐off
    return setTimeout(computeLoop, 100);
  }
  // run one step
  const [z, x] = await sim.updateAsync();
  postMessage({ x, z });
  queueLength++;
  // immediately schedule next
  computeLoop();
}

// receive messages from main thread
onmessage = (ev) => {
  if (ev.data === 'pause') {
    paused = true;
  } else if (ev.data === 'resume') {
    paused = false;
    if (sim) computeLoop();
  } else if (ev.data === 'dequeue') {
    queueLength = Math.max(0, queueLength - 1);
  }
};

init();
