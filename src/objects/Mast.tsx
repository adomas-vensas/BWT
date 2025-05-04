import React, { useRef, useMemo, useImperativeHandle, forwardRef } from 'react'
import * as THREE from 'three'
import { BufferAttribute } from 'three'
import { useFrame } from '@react-three/fiber'

export interface MastProps {
  position: [number, number, number]
  radius: number
  height: number
  lowerFrac: number
}

/**
 * Imperative handle to call sway() from parent
 */
export interface MastHandle {
  sway(
    lastPos: { x: number; z: number },
    nextPos: { x: number; z: number },
    interpT: number
  ): void
}

/**
 * React-Three-Fiber component for a cantilevered cylinder (mast)
 */
const Mast = forwardRef<MastHandle, MastProps>(
  ({ position, radius, height, lowerFrac }, ref) => {
    const meshRef = useRef<THREE.Mesh>(null!)

    // Precompute geometry & rest positions, cantilever constants
    const { geometry, restPositions, beta, A, denom, halfH, y0 } = useMemo(() => {
      const β = 1.875104071
      const A = (Math.cosh(β) + Math.cos(β)) / (Math.sinh(β) + Math.sin(β))
      const denom =
        Math.cosh(β) - Math.cos(β) - A * (Math.sinh(β) - Math.sin(β))
      const halfH = height / 2
      const y0 = -halfH + lowerFrac * height

      const geo = new THREE.CylinderGeometry(
        radius,
        radius,
        height,
        32,
        64
      )
      const posAttr = geo.attributes.position as BufferAttribute
      const rest = (posAttr.array as Float32Array).slice()

      return { geometry: geo, restPositions: rest, beta: β, A, denom, halfH, y0 }
    }, [radius, height, lowerFrac])

    // Expose sway() to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        sway(lastPos, nextPos, interpT) {
          const posAttr = geometry.attributes.position as BufferAttribute
          const array = posAttr.array as Float32Array
          const rest = restPositions

          const interpX = THREE.MathUtils.lerp(lastPos.x, nextPos.x, interpT)
          const interpZ = THREE.MathUtils.lerp(lastPos.z, nextPos.z, interpT)

          const { beta: β, A: aConst, denom: dConst, halfH: hh, y0: yStart } = {
            beta,
            A,
            denom,
            halfH,
            y0
          }

          for (let i = 0; i < posAttr.count; i++) {
            const ix = 3 * i
            const iy = ix + 1
            const iz = ix + 2

            const rx = rest[ix]
            const ry = rest[iy]
            const rz = rest[iz]

            if (ry > yStart) {
              const s = (ry - yStart) / (hh - yStart)
              const num =
                Math.cosh(β * s) - Math.cos(β * s) -
                aConst * (Math.sinh(β * s) - Math.sin(β * s))
              const w = num / dConst

              array[iz] = rz + interpZ * w
              array[ix] = rx + interpX * w
            } else {
              array[iz] = rz
              array[ix] = rx
            }

            array[iy] = ry
          }

          posAttr.needsUpdate = true
          geometry.computeVertexNormals()
        }
      }),
      [geometry, restPositions, beta, A, denom, halfH, y0]
    )

    return (
      <mesh ref={meshRef} geometry={geometry} position={position}>
        <meshBasicMaterial color="white" wireframe />
      </mesh>
    )
  }
)

export default Mast
