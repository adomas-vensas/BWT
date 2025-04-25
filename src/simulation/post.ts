import * as tf from '@tensorflow/tfjs';
/**
 * Compute ∂uₓ/∂y − ∂uᵧ/∂x (“curl”) of a 2‑component velocity field.
 *
 * @param u Tensor3D<[2,NX,NY]>  velocity [uₓ; uᵧ]
 * @returns Tensor2D<[NX,NY]>    curl = ∂uₓ/∂y − ∂uᵧ/∂x
 */
export function calculateCurl(u: tf.Tensor3D): tf.Tensor2D {
    const [u0, u1] = tf.unstack(u, 0) as [tf.Tensor2D, tf.Tensor2D];
    const [NX, NY] = u0.shape;
  
    // ∂uₓ/∂y via central differences, one‑sided at edges
    const ux_rollF = tf.pad(tf.slice(u0, [0, 1], [NX, NY - 1]), [[0, 0], [0, 1]]);
    const ux_rollB = tf.pad(tf.slice(u0, [0, 0], [NX, NY - 1]), [[0, 0], [1, 0]]);
    const ux_y = ux_rollF.sub(ux_rollB).div(2);
  
    // ∂uᵧ/∂x via central differences, one‑sided at edges
    const uy_rollF = tf.pad(tf.slice(u1, [1, 0], [NX - 1, NY]), [[0, 1], [0, 0]]);
    const uy_rollB = tf.pad(tf.slice(u1, [0, 0], [NX - 1, NY]), [[1, 0], [0, 0]]);
    const uy_x = uy_rollF.sub(uy_rollB).div(2);
  
    return ux_y.sub(uy_x) as tf.Tensor2D;
  }