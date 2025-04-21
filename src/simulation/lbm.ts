import * as tf from '@tensorflow/tfjs';


const VELOCITIES = tf.tensor2d([
    [0, 0],   // rest
    [1, 0],   // east
    [0, 1],   // north
    [-1, 0],  // west
    [0, -1],  // south
    [1, 1],   // northeast
    [-1, 1],  // northwest
    [-1, -1], // southwest
    [1, -1],  // southeast
  ]);

const WEIGHTS = tf.tensor([4/9, 1/9, 1/9, 1/9, 1/9, 1/36, 1/36, 1/36, 1/36])

/**
 * Compute the equilibrium distribution function feq.
 * 
 * @param rho tf.Tensor2D of shape [NX, NY]
 * @param u tf.Tensor3D of shape [2, NX, NY]
 * @returns feq tf.Tensor3D of shape [9, NX, NY]
 */
export function getEquilibrium(rho: tf.Tensor2D, u: tf.Tensor3D): tf.Tensor3D {
  return tf.tidy(() => {
    // u[0], u[1]: shape [NX, NY]
    const u0 = u.slice([0, 0, 0], [1, -1, -1]).squeeze(); // u[0, :, :]
    const u1 = u.slice([1, 0, 0], [1, -1, -1]).squeeze(); // u[1, :, :]

    // VELOCITIES: [9, 2]
    const ex = VELOCITIES.slice([0, 0], [-1, 1]).reshape([9, 1, 1]); // [9, 1, 1]
    const ey = VELOCITIES.slice([0, 1], [-1, 1]).reshape([9, 1, 1]); // [9, 1, 1]

    // Compute dot product u · e: uc = u_x * e_x + u_y * e_y
    const uc = tf.add(tf.mul(u0, ex), tf.mul(u1, ey)); // [9, NX, NY]

    // u^2 = u0^2 + u1^2
    const uSqr = tf.add(tf.square(u0), tf.square(u1)); // [NX, NY]
    const uSqrExpanded = uSqr.expandDims(0); // [1, NX, NY]

    const rhoExpanded = rho.expandDims(0); // [1, NX, NY]
    const weightsExpanded = WEIGHTS.reshape([9, 1, 1]); // [9, 1, 1]

    // Compute feq
    const feq = tf.mul(
      tf.mul(rhoExpanded, weightsExpanded), // [9, NX, NY]
      tf.add(
        tf.add(
          tf.add(tf.scalar(1), tf.mul(tf.scalar(3), uc)),
          tf.mul(tf.scalar(4.5), tf.square(uc))
        ),
        tf.mul(tf.scalar(-1.5), uSqrExpanded)
      )
    );

    return feq as tf.Tensor3D;
  });
}
