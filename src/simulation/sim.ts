
//Solves the poisson equation, using the Jacobi method.
export function solveStreamFunction(
    omega: Float32Array, psi: Float32Array,
    nx: number, ny: number,
    dx: number, dy: number,
    iterations: number)
{
    const psi_new = new Float32Array(psi);

    for(let k = 0; k < iterations; ++k)
    {
        for(let j = 1; j < ny - 1; ++j)
        {
            for(let i = 1; i < nx - 1; ++i)
            {
                const idx = i + j * nx;

                const left = psi[idx - 1];
                const right = psi[idx + 1];
                const up = psi[idx + nx];
                const down = psi[idx - nx];

                psi_new[idx] = 0.25 * (left + right + up + down + dx * dx * omega[idx]);
            }
        }
        psi.set(psi_new);
    }
}

export function updateVelocityFromPsi(
    psi: Float32Array,
    u: Float32Array, v: Float32Array,
    nx: number, ny: number,
    dx: number, dy: number)
{
    for(let j = 1; j < ny - 1; ++j)
    {
        for(let i = 1; i < nx - 1; ++i)
        {
            const idx = i + j * nx;

            u[idx] = (psi[idx + nx] - psi[idx - nx]) / (2 * dy);  // ∂ψ/∂y
            v[idx] = -(psi[idx + 1] - psi[idx - 1]) / (2 * dx);   // -∂ψ/∂x
        }    
    }   
}

export function updateVorticity(
    omega: Float32Array,
    u: Float32Array, v: Float32Array,
    nx: number, ny: number,
    dx: number, dy: number, dt: number,
    nu: number) {
    const omega_new = new Float32Array(omega);
  
    for (let j = 1; j < ny - 1; j++) {
      for (let i = 1; i < nx - 1; i++) {
        const idx = i + j * nx;
  
        const omegax = (omega[idx + 1] - omega[idx - 1]) / (2 * dx);
        const omegay = (omega[idx + nx] - omega[idx - nx]) / (2 * dy);
        const laplace = (
          (omega[idx + 1] - 2 * omega[idx] + omega[idx - 1]) / (dx * dx) +
          (omega[idx + nx] - 2 * omega[idx] + omega[idx - nx]) / (dy * dy)
        );
  
        const convection = u[idx] * omegax + v[idx] * omegay;
        const diffusion = nu * laplace;
  
        omega_new[idx] = omega[idx] + dt * (-convection + diffusion);
      }
    }
  
    omega.set(omega_new);
  }
  
  