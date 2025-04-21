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


const RIGHT_DIRS = tf.tensor1d([1, 5, 8], 'int32');
const LEFT_DIRS  = tf.tensor1d([3, 7, 6], 'int32');
const UP_DIRS    = tf.tensor1d([2, 5, 6], 'int32');
const DOWN_DIRS  = tf.tensor1d([4, 7, 8], 'int32');
const ALL_DIRS   = tf.tensor1d([0, 1, 2, 3, 4, 5, 6, 7, 8], 'int32');
const OPP_DIRS   = tf.tensor1d([0, 3, 4, 1, 2, 7, 8, 5, 6], 'int32');

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

/**
 * Calculate the macroscopic density and velocity from the distribution function.
 * @param f tf.Tensor3D of shape [9, NX, NY] - distribution function
 * @returns { rho: tf.Tensor2D, u: tf.Tensor3D [2, NX, NY] } - macroscopic properties
 */
export function getMacroscopic(
    f: tf.Tensor3D
  ): { rho: tf.Tensor2D, u: tf.Tensor3D } {
    return tf.tidy(() => {
      // Density: sum over all directions (axis 0)
      const rho = tf.sum(f, 0) as tf.Tensor2D; // shape [NX, NY]
  
      // Velocity components
      const u_x = tf.divNoNan(
        tf.sub(tf.sum(tf.gather(f, RIGHT_DIRS), 0), tf.sum(tf.gather(f, LEFT_DIRS), 0)),
        rho
      ); // [NX, NY]
  
      const u_y = tf.divNoNan(
        tf.sub(tf.sum(tf.gather(f, UP_DIRS), 0), tf.sum(tf.gather(f, DOWN_DIRS), 0)),
        rho
      ); // [NX, NY]
  
      // Stack into velocity tensor [2, NX, NY]
      const u = tf.stack([u_x, u_y], 0); // shape [2, NX, NY]
  
      return { rho, u: u as tf.Tensor3D };
    });
}

/**
 * Discretize external force density into lattice forcing term via Guo’s scheme.
 *
 * @param g Tensor3D<[2,NX,NY]> external force density
 * @param u Tensor3D<[2,NX,NY]> fluid velocity
 * @returns   Tensor3D<[9,NX,NY]> discretized force term
 */
export function getDiscretizedForce(
  g: tf.Tensor3D,
  u: tf.Tensor3D
): tf.Tensor3D {
  return tf.tidy(() => {
    // unpack velocity and force components: each is Tensor2D<[NX,NY]>
    const [u0, u1] = tf.unstack(u, 0) as [tf.Tensor2D, tf.Tensor2D];
    const [g0, g1] = tf.unstack(g, 0) as [tf.Tensor2D, tf.Tensor2D];

    // pull out direction vectors & weights, reshape to [9,1,1]
    const vx = VELOCITIES.slice([0, 0], [9, 1]).reshape([9, 1, 1]);
    const vy = VELOCITIES.slice([0, 1], [9, 1]).reshape([9, 1, 1]);
    const w9 = WEIGHTS.reshape([9, 1, 1]);

    // lift u0,u1,g0,g1 to 3D: [1,NX,NY] → broadcastable against [9,NX,NY]
    const u0e = u0.expandDims(0);
    const u1e = u1.expandDims(0);
    const g0e = g0.expandDims(0);
    const g1e = g1.expandDims(0);

    // projection u·e for each direction: uc[d,x,y] = u0[x,y]*vx[d] + u1[x,y]*vy[d]
    const uc = u0e.mul(vx).add(u1e.mul(vy));

    // build the two bracketed terms:
    //   A = 3*(e_x − u) + 9*(uc * e_x)    modulated by g0
    //   B = 3*(e_y − u) + 9*(uc * e_y)    modulated by g1
    const A = vx.sub(u0e).mul(3).add(uc.mul(vx).mul(9)).mul(g0e);
    const B = vy.sub(u1e).mul(3).add(uc.mul(vy).mul(9)).mul(g1e);

    // combine and weight
    return w9.mul(A.add(B)) as tf.Tensor3D;
  });
}