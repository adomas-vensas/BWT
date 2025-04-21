import * as tf from '@tensorflow/tfjs';

/**
 * Update the real‑time position of the markers (without rotation).
 *
 * @param xMarkersInit  Tensor1D of initial x‑coordinates (shape [N_MARKER])
 * @param yMarkersInit  Tensor1D of initial y‑coordinates (shape [N_MARKER])
 * @param d             Tensor1D of displacements, must have at least 2 elements
 * @returns A tuple [xMarkers, yMarkers], each a Tensor1D of updated coords
 */
export function getMarkersCoords2dof(
    xMarkersInit: tf.Tensor1D,
    yMarkersInit: tf.Tensor1D,
    d: tf.Tensor1D
  ): [tf.Tensor1D, tf.Tensor1D] {
    // extract dx = d[0], dy = d[1] (each a scalar Tensor)
    const dx = d.gather(0);
    const dy = d.gather(1);
  
    // broadcast‑add scalar to each element of the 1‑D tensor
    const xMarkers = xMarkersInit.add(dx) as tf.Tensor1D;
    const yMarkers = yMarkersInit.add(dy) as tf.Tensor1D;
  
    return [xMarkers, yMarkers];
  }