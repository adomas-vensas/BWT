import * as tf from '@tensorflow/tfjs';

/**
 * Newmark‑beta integration for a 2‑DOF oscillator.
 *
 * @param a      Tensor1D<[2]>  acceleration at time t
 * @param v      Tensor1D<[2]>  velocity at time t
 * @param d      Tensor1D<[2]>  displacement at time t
 * @param h      Tensor1D<[2]>  external force at time t
 * @param m      number          mass
 * @param k      number          stiffness
 * @param c      number          damping
 * @param dt     number          time step (default 1)
 * @param gamma  number          Newmark‑gamma (default 0.5)
 * @param beta   number          Newmark‑beta  (default 0.25)
 * @returns      [aNext, vNext, dNext] all Tensor1D<[2]> at time t+1
 */
export function newmark2dof(
  a:     tf.Tensor1D,
  v:     tf.Tensor1D,
  d:     tf.Tensor1D,
  h:     tf.Tensor1D,
  m:     number,
  k:     number,
  c:     number,
  dt:    number    = 1,
  gamma: number    = 0.5,
  beta:  number    = 0.25
): [tf.Tensor1D, tf.Tensor1D, tf.Tensor1D] {
  return tf.tidy(() => {
    // constants
    const c1 = gamma * dt;
    const c2 = beta * dt * dt;

    // v1 = v + dt*(1-gamma)*a
    const v1  = v.add(a.mul(dt * (1 - gamma)));

    // v2 = d + dt*v + dt^2*(0.5 - beta)*a
    const v2  = d
      .add(v.mul(dt))
      .add(a.mul(dt * dt * (0.5 - beta)));

    // denom = m + c1*c + c2*k  (a scalar)
    const denom = m + c1 * c + c2 * k;

    // aNext = (h - c*v1 - k*v2) / denom
    const aNext = h
      .sub(v1.mul(c))
      .sub(v2.mul(k))
      .div(denom) as tf.Tensor1D;

    // vNext = v1 + c1*aNext
    const vNext = v1.add(aNext.mul(c1)) as tf.Tensor1D;

    // dNext = v2 + c2*aNext
    const dNext = v2.add(aNext.mul(c2)) as tf.Tensor1D;

    return [aNext, vNext, dNext];
  });
}