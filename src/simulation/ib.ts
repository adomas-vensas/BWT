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

/**
 * Generate a stack of kernels for all the markers. The kernels are to be
 * used in future interpolation and spreading operations.
 *
 * @param xMarkers   Tensor1D of shape [N_MARKER] – the x‐coordinates of markers
 * @param yMarkers   Tensor1D of shape [N_MARKER] – the y‐coordinates of markers
 * @param xLattice   Tensor2D of shape [NX, NY] – the x‐coordinates of the lattice
 * @param yLattice   Tensor2D of shape [NX, NY] – the y‐coordinates of the lattice
 * @param kernelFunc A function mapping a Tensor3D → Tensor3D (e.g. your range‑2/3/4 kernel)
 * @returns          Tensor3D of shape [N_MARKER, NX, NY]
 */
export function getKernels(
    xMarkers: tf.Tensor1D,
    yMarkers: tf.Tensor1D,
    xLattice: tf.Tensor2D,
    yLattice: tf.Tensor2D,
    kernelFn: (d: tf.Tensor3D) => tf.Tensor3D
  ): tf.Tensor3D {
    // make xLattice, yLattice into shape [1,NX,NY]
    const xLat3 = xLattice.expandDims(0);
    const yLat3 = yLattice.expandDims(0);
  
    // make xMarkers, yMarkers into shape [N_MARKER,1,1]
    const xM3 = xMarkers.reshape([-1, 1, 1]);
    const yM3 = yMarkers.reshape([-1, 1, 1]);
  
    // compute and broadcast kernel
    const kx = kernelFn(xLat3.sub(xM3));  // [N_MARKER,NX,NY]
    const ky = kernelFn(yLat3.sub(yM3));  // [N_MARKER,NX,NY]
  
    return kx.mul(ky) as tf.Tensor3D;
  }


/**
 * Multi‑direct forcing to enforce no‑slip at markers.
 *
 * @param uInit           Tensor3D<[2,NX,NY]>  initial fluid velocity
 * @param xLattice        Tensor2D<[NX,NY]>    lattice X coords
 * @param yLattice        Tensor2D<[NX,NY]>    lattice Y coords
 * @param vMarkers        Tensor2D<[N_MARKER,2]> marker velocities (n,d)
 * @param xMarkers        Tensor1D<[N_MARKER]>   x coords of markers
 * @param yMarkers        Tensor1D<[N_MARKER]>   y coords of markers
 * @param nMarker         number of markers
 * @param markerDistance  scalar distance between markers
 * @param nIter           number of iterations (default 5)
 * @param kernelFunc      (δ: Tensor3D<[N_MARKER,NX,NY]>) ⇒ Tensor3D<[N_MARKER,NX,NY]>
 * @returns [g, hMarkers]:
 *   - g: Tensor3D<[2,NX,NY]> force density applied to fluid  
 *   - hMarkers: Tensor2D<[N_MARKER,2]> forces applied to markers
 */
export function multiDirectForcing(
    uInit: tf.Tensor3D,
    xLattice: tf.Tensor2D,
    yLattice: tf.Tensor2D,
    vMarkers: tf.Tensor2D,
    xMarkers: tf.Tensor1D,
    yMarkers: tf.Tensor1D,
    nMarker: number,
    markerDistance: number,
    nIter: number,
    kernelFn: (d: tf.Tensor3D) => tf.Tensor3D
  ): [tf.Tensor3D, tf.Tensor2D] {
    return tf.tidy(() => {
      let u = uInit;
      let g = tf.zerosLike(u);
      let hMarkers = tf.zeros([nMarker, 2], 'float32') as tf.Tensor2D;
  
      const kernels = getKernels(xMarkers, yMarkers, xLattice, yLattice, kernelFn);
  
      for (let i = 0; i < nIter; i++) {
        // --- interpolate fluid to markers: u_markers [N,2]
        const uProd = u
          .expandDims(1)             // [2,1,NX,NY]
          .mul(kernels.expandDims(0)); // [2,N,NX,NY]
        const uSum = uProd.sum([2, 3])    // [2,N]
          .transpose() as tf.Tensor2D;    // → [N,2]
  
        // --- hydrodynamic force on markers
        const deltaUM = vMarkers.sub(uSum);               // [N,2]
        hMarkers = hMarkers.sub(deltaUM.mul(markerDistance));
  
        // --- spread force back to fluid
        const spread = deltaUM
          .transpose()               // [2,N]
          .expandDims(2).expandDims(3) // [2,N,1,1]
          .mul(kernels.expandDims(0));  // [2,N,NX,NY]
        const deltaU = spread
          .sum(1)                    // [2,NX,NY]
          .mul(markerDistance) as tf.Tensor3D;
  
        // --- accumulate
        g = g.add(deltaU.mul(2));
        u = u.add(deltaU);
      }
  
      return [g, hMarkers];
    });
}  

export function kernelRange4(d: tf.Tensor3D): tf.Tensor3D {
    const a = d.abs();
    const i = a.mul(-2).add(3).add(a.mul(4).add(1).sub(a.square().mul(4)).sqrt()).div(8);
    const o = a.mul(-2).add(5).sub(a.mul(12).sub(a.square().mul(4)).add(-7).sqrt()).div(8);
    return tf.where(a.greater(2), tf.zerosLike(a), tf.where(a.less(1), i, o)) as tf.Tensor3D;
}

/**
 * Compute the total hydrodynamic force on the object by summing marker forces.
 *
 * @param forceAtMarkers Tensor2D<[N_MARKER,2]>  – forces on each marker
 * @returns              Tensor1D<[2]>           – total force [Fx, Fy]
 */
export function getForceToObj(forceAtMarkers: tf.Tensor2D): tf.Tensor1D {
    return forceAtMarkers.sum(0) as tf.Tensor1D;
  }