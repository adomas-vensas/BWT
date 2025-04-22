import * as tf from '@tensorflow/tfjs';
import { inv as mathInverse } from 'mathjs';

/**
 * Perform the collision step using the MRT model.
 * @param f tf.Tensor3D [9, NX, NY] - current distribution function
 * @param feq tf.Tensor3D [9, NX, NY] - equilibrium distribution
 * @param leftMatrix tf.Tensor2D [9, 9] - precomputed collision matrix
 * @returns tf.Tensor3D [9, NX, NY] - updated distribution after collision
 */
export function collision(
  f: tf.Tensor3D,
  feq: tf.Tensor3D,
  leftMatrix: tf.Tensor2D
): tf.Tensor3D {
  return tf.tidy(() => {
    const delta = tf.sub(feq, f); // [9, NX, NY]

    const [_, NX, NY] = delta.shape;

    // delta: [9, NX, NY] → [9, NX * NY]
    const deltaFlat = delta.reshape([9, NX * NY]); // shape [9, NX*NY]

    // leftMatrix: [9, 9]
    const resultFlat = tf.matMul(leftMatrix, deltaFlat); // shape [9, NX*NY]

    // reshape result back to [9, NX, NY]
    const collisionTerm = resultFlat.reshape([9, NX, NY]);
    
    const fNew = tf.add(collisionTerm, f); // [9, NX, NY]
    return fNew as tf.Tensor3D;
  });
}

/**
 * Pre-compute the constant left matrix for the MRT collision model:
 *    M⁻¹ · S · M
 *
 * @param M 9×9 transformation matrix (Tensor2D)
 * @param S 9×9 relaxation matrix     (Tensor2D)
 * @returns 9×9 left‑collision matrix (Tensor2D)
 */
export function getCollisionLeftMatrix(
  M: tf.Tensor2D,
  S: tf.Tensor2D
) {
  // extract M into a nested JS array, invert with math.js, then re-tensor
  const Marr = (M.arraySync() as number[][]);
  const MinvArr = mathInverse(Marr) as number[][];
  const Minv = tf.tensor2d(MinvArr, [9, 9]);
  return Minv.matMul(S).matMul(M);
}

export function getSourceLeftMatrix(
  M: tf.Tensor2D,
  S: tf.Tensor2D
): tf.Tensor2D {
  // 1) invert M with mathjs
  const Marr = M.arraySync() as number[][];
  const MinvArr = mathInverse(Marr) as number[][];
  const Minv = tf.tensor2d(MinvArr, [9, 9]);

  // 2) I – 0.5 S, then assert it's 2D so TS knows:
  const factor = tf.eye(9).sub(S.mul(0.5)) as tf.Tensor2D;

  // 3) use static tf.matMul(a: Tensor2D, b: Tensor2D) → Tensor2D
  const tmp = tf.matMul(Minv, factor);
  return tf.matMul(tmp, M);
}


/**
 * Get the relaxation matrix for the MRT collision model
 * according to the given relaxation parameter omega.
 *
 * @param omega Relaxation parameter
 * @returns A 9×9 diagonal relaxation matrix
 */
export function getRelaxMatrix(omega: number): tf.Tensor2D {
  const diagValues = tf.tensor1d([1, 1.4, 1.4, 1, 1.2, 1, 1.2, omega, omega]);
  // <-- note: use tf.linalg.diag, not tf.diag
  return tf.diag(diagValues) as tf.Tensor2D;
}

/**
 * Get the transformation matrix for the MRT collision model.
 *
 * @returns A 9×9 transformation matrix (Tensor2D)
 */
export function getTransMatrix(): tf.Tensor2D {
  // Define the 9×9 matrix as a nested array
  const values: number[][] = [
    [ 1,  1,  1,  1,  1,  1,  1,  1,  1],
    [-4, -1, -1, -1, -1,  2,  2,  2,  2],
    [ 4, -2, -2, -2, -2,  1,  1,  1,  1],
    [ 0,  1,  0, -1,  0,  1, -1, -1,  1],
    [ 0, -2,  0,  2,  0,  1, -1, -1,  1],
    [ 0,  0,  1,  0, -1,  1,  1, -1, -1],
    [ 0,  0, -2,  0,  2,  1,  1, -1, -1],
    [ 0,  1, -1,  1, -1,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  1, -1,  1, -1],
  ];

  // Create and return a 9×9 Tensor2D
  return tf.tensor2d(values, [9, 9]);
}

export function precomputeLeftMatrices(omega: number)
{
  const relax = getRelaxMatrix(omega)
  const trans = getTransMatrix()
  const collisionLeft = getCollisionLeftMatrix(trans, relax);
  const sourcingLeft = getSourceLeftMatrix(trans, relax)

  return [collisionLeft as tf.Tensor2D, sourcingLeft]
}

/**
 * Compute the source term without using tensordot:
 *   source[i,x,y] = sum_j leftMatrix[i,j] * forcing[j,x,y]
 *
 * @param leftMatrix Tensor2D<[9,9]>  precomputed M⁻¹·(I–0.5 S)·M
 * @param forcing    Tensor3D<[9,NX,NY]>  forcing term per direction
 * @returns           Tensor3D<[9,NX,NY]> the source term
 */
export function getSource(
  forcing: tf.Tensor3D,
  leftMatrix: tf.Tensor2D
): tf.Tensor3D {
  // flatten the spatial dims so we can do a matMul
  const [ , nx, ny] = forcing.shape;
  const flatForcing = forcing.reshape([9, nx * ny]);       // [9, NX*NY]
  const flatSource  = leftMatrix.matMul(flatForcing);      // [9, NX*NY]
  return flatSource.reshape([9, nx, ny]) as tf.Tensor3D;   // [9, NX, NY]
}