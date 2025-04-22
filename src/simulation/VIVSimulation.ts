import * as lbm from './lbm';
import * as tf from '@tensorflow/tfjs'
import * as mrt from './mrt';
import * as ib from './ib';
import * as dyn from './dyn';
import * as post from './post';

export default class VIVSimulation{

    D = 1
    U0 = 0.1

    NX = 20 * this.D
    NY = 10 * this.D

    // Cylinder position
    X_OBJ = 8 * this.D          // Cylinder x position
    Y_OBJ = 5 * this.D          // Cylinder y position

    // IB method parameters
    N_MARKER = 4 * this.D       // Number of markers on cylinder
    N_ITER_MDF = 3         // Multi-direct forcing iterations
    IB_MARGIN = 2          // Margin of the IB region to the cylinder

    // Physical parameters
    RE = 200               // Reynolds number
    UR = 5                 // Reduced velocity
    MR = 10                // Mass ratio
    DR = 0                 // Damping ratio

    // structural parameters
    FN = this.U0 / (this.UR * this.D)                                          // Natural frequency
    MASS = Math.PI * (this.D / 2) ** 2 * this.MR                               // Mass of the cylinder
    STIFFNESS = (this.FN * 2 * Math.PI) ** 2 * this.MASS * (1 + 1 / this.MR)   // Stiffness of the spring
    DAMPING = 2 * Math.sqrt(this.STIFFNESS * this.MASS) * this.DR              // Damping of the spring

    // fluid parameters
    NU = this.U0 * this.D / this.RE                                            // Kinematic viscosity
    TAU = 3 * this.NU + 0.5                                                    // Relaxation time
    OMEGA = 1 / this.TAU                                                       // Relaxation parameter
    
    rho: tf.Tensor2D = tf.ones([this.NX, this.NY], 'float32');
    f: tf.Tensor3D = tf.zeros([9, this.NX, this.NY], 'float32');
    feq: tf.Tensor3D = tf.zeros([9, this.NX, this.NY], 'float32');
    
    d: tf.Tensor1D = tf.zeros([2], 'float32'); // displacement
    v: tf.Tensor1D = tf.zeros([2], 'float32'); // velocity
    a: tf.Tensor1D = tf.zeros([2], 'float32'); // acceleration
    h: tf.Tensor1D = tf.zeros([2], 'float32');
    
    
    u0 = tf.fill([this.NX, this.NY], this.U0); // u[0, :, :]
    u1 = tf.zeros([this.NX, this.NY], 'float32'); // u[1, :, :]

    u: tf.Tensor3D = tf.stack([this.u0, this.u1], 0) as tf.Tensor3D;
    
    IB_SIZE: number;
    IB_START_X: number;
    IB_START_Y: number;

    X: tf.Tensor2D;
    Y: tf.Tensor2D;

    X_MARKERS: tf.Tensor1D;
    Y_MARKERS: tf.Tensor1D;

    MRT_COL_LEFT: tf.Tensor2D;
    MRT_SRC_LEFT: tf.Tensor2D;

    L_ARC: number;
    
    feq_init: tf.Tensor3D;

    constructor()
    {
        [this.MRT_COL_LEFT, this.MRT_SRC_LEFT] = mrt.precomputeLeftMatrices(this.OMEGA)
        const xr = tf.range(0, this.NX, 1, 'int32');
        const yr = tf.range(0, this.NY, 1, 'int32');
        
        this.X = xr.reshape([this.NX, 1]).tile([1, this.NY]);  // Tensor2D<[NX,NY]>
        this.Y = yr.reshape([1, this.NY]).tile([this.NX, 1]);
        
        const THETA_MARKERS = tf.range(0, this.N_MARKER, 1, 'float32')
        this.X_MARKERS = THETA_MARKERS.cos().mul(0.5 * this.D).add(this.X_OBJ) as tf.Tensor1D;
        this.Y_MARKERS = THETA_MARKERS.sin().mul(0.5 * this.D).add(this.Y_OBJ) as tf.Tensor1D;
        this.L_ARC = this.D * Math.PI / this.N_MARKER
        
        this.IB_START_X = Math.floor(this.X_OBJ - 0.5 * this.D - this.IB_MARGIN)
        this.IB_START_Y = Math.floor(this.Y_OBJ - 0.5 * this.D - this.IB_MARGIN)
        this.IB_SIZE = this.D + this.IB_MARGIN * 2
        
        this.f = lbm.getEquilibrium(this.rho, this.u)
        this.v = tf.tensor1d([this.d.arraySync()[0], 1e-2], 'float32');

        const vMarkers = this.v.reshape([1, 2]).tile([this.N_MARKER, 1]);
        this.feq_init = this.f.slice([0, 0, 0], [9, 1, 1]).reshape([9]);
    }

    private async update() : Promise<[
      tf.Tensor3D,    // new f
      tf.Tensor2D,    // rho
      tf.Tensor3D,    // u
      tf.Tensor1D,    // d
      tf.Tensor1D,    // v
      tf.Tensor1D,    // a
      tf.Tensor1D     // h
    ]>
    {
      const macro = lbm.getMacroscopic(this.f);
      this.rho = macro.rho;
      this.rho = macro.rho;
      this.u = macro.u;
    
      this.feq = lbm.getEquilibrium(this.rho, this.u);
      this.f = mrt.collision(this.f, this.feq, this.MRT_COL_LEFT)
    
      let [x_markers, y_markers] = ib.getMarkersCoords2dof(this.X_MARKERS, this.Y_MARKERS, this.d)
    
      const ibStartX = this.d.gather(0).add(this.IB_START_X).floor().toInt();
      const ibStartY = this.d.gather(1).add(this.IB_START_Y).floor().toInt();
    
      const ibxArr = await ibStartX.data() as Int32Array;
      const ibyArr = await ibStartY.data() as Int32Array;
      const ibx    = ibxArr[0];
      const iby    = ibyArr[0];
    
      const uSlice = this.u.slice(
        [0,   ibx,   iby],    // begin at (0, ibx, iby)
        [2,   this.IB_SIZE, this.IB_SIZE] // size (2, IB_SIZE, IB_SIZE)
      );
      
      const XSlice = this.X.slice(
        [ibx,   iby],         // begin at (ibx, iby)
        [this.IB_SIZE, this.IB_SIZE]    // size (IB_SIZE, IB_SIZE)
      ) as tf.Tensor2D;
      
      const YSlice = this.Y.slice(
        [ibx,   iby], 
        [this.IB_SIZE, this.IB_SIZE]
      ) as tf.Tensor2D;
      
      const fSlice = this.f.slice(
        [0,   ibx,   iby], 
        [9,   this.IB_SIZE, this.IB_SIZE]
      );
    
      const vMarkers = this.v.reshape([1,2]).tile([this.N_MARKER,1]) as tf.Tensor2D;
      let [g_slice, h_markers] = ib.multiDirectForcing(uSlice, XSlice, YSlice,
        vMarkers, x_markers, y_markers, this.N_MARKER, this.L_ARC, this.N_ITER_MDF, ib.kernelRange4);
        
      const g_lattice = lbm.getDiscretizedForce(g_slice, uSlice)
      const s_slice = mrt.getSource(g_lattice, this.MRT_SRC_LEFT)
    
      const patch = fSlice.add(s_slice);
      const pads: Array<[number, number]> = [
        [0, 0],                        // no padding on the “direction” axis
        [ibx,  this.f.shape[1] - this.IB_SIZE - ibx],  // pad before and after in X
        [iby,  this.f.shape[2] - this.IB_SIZE - iby]   // pad before and after in Y
      ];
      const paddedPatch = patch.pad(pads);  // now shape [9,NX,NY]
      const regionMask = tf
        .ones([9, this.IB_SIZE, this.IB_SIZE], 'bool')
        .pad(pads);   // true inside the IB box, false elsewhere
      this.f = tf.where(regionMask, paddedPatch, this.f) as tf.Tensor3D;
    
      this.h = ib.getForceToObj(h_markers)
      const scale = (Math.PI * this.D * this.D) / 4;
      this.h = this.h.add(this.a.mul(scale)) as tf.Tensor1D;
    
      [this.a, this.v, this.d] = dyn.newmark2dof(this.a, this.v, this.d, this.h, this.MASS, this.STIFFNESS, this.DAMPING)
    
      this.f = lbm.streaming(this.f)
    
      // const feqInitFull = this.feq_init
      // .reshape([9, 1, 1])         // [9,1,1]this.
      // .tile([1, this.NX, this.NY]) as tf.Tensor3D;  // [9,NX,NY]
    
      // this.f = lbm.boundaryEquilibrium(this.f, feqInitFull, 'right');
      // this.f = lbm.velocityBoundary(this.f, this.U0, 0, "left")
    
      return [this.f, this.rho, this.u, this.d, this.v, this.a, this.h]
    }


    public async updateAsync() : Promise<[number, number]>
    {
        [this.f, this.rho, this.u, this.d, this.v, this.a, this.h] = await this.update();
        
        const dArr = await this.d.data() as Float32Array;
        const dx = dArr[0], dy = dArr[1];
        console.log(dx, dy)
        const newX = (0 + dx) / this.D;
        const newY = (0 + dy) / this.D;

        return [newX, newY]
    }
}