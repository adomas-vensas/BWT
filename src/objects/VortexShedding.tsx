import React, { useRef, useMemo, useImperativeHandle, forwardRef } from 'react'
import * as THREE from 'three'
import { BufferGeometry, DataTexture, FloatType, RedFormat, ShaderMaterial } from 'three'
import { useFrame } from '@react-three/fiber'

export interface VortexProps {
  /** physical width (x-axis) of the plane */
  width: number
  /** physical height (y-axis) of the plane */
  height: number
  /** grid resolution along Z (columns) */
  resolutionZ: number
  /** grid resolution along X (rows) */
  resolutionX: number
  /** Euler angles [x,y,z] rotation */
  rotation?: [number, number, number]
}

/**
 * Imperative handle exposing `update(curl)` to parent
 */
export interface VortexHandle {
  /**
   * Push new curl data (Float32Array of length resolutionZ*resolutionX)
   */
  update(curl: Float32Array): void
}

/**
 * React-Three-Fiber component for visualizing a scalar curl field on a deformable plane.
 */
const VortexShedding = forwardRef<VortexHandle, VortexProps>(
  (
    { width, height, resolutionZ, resolutionX, rotation },
    ref
  ) => {
    // refs to store mesh, texture, and material
    const meshRef = useRef<THREE.Mesh>(null!)
    const textureRef = useRef<DataTexture | null>(null)
    const materialRef = useRef<ShaderMaterial | null>(null)

    // create geometry and initial DataTexture + ShaderMaterial
    const geometry = useMemo(() => {
      return new THREE.PlaneGeometry(
        width,
        height,
        resolutionZ,
        resolutionX
      ) as BufferGeometry
    }, [width, height, resolutionZ, resolutionX])

    useMemo(() => {
      // initialize curl texture with zeros
      const initialData = new Float32Array(resolutionZ * resolutionX).fill(0)
      const curlTexture = new DataTexture(
        initialData,
        resolutionZ,
        resolutionX,
        RedFormat,
        FloatType
      )
      curlTexture.wrapS = THREE.ClampToEdgeWrapping
      curlTexture.wrapT = THREE.ClampToEdgeWrapping
      curlTexture.minFilter = THREE.LinearFilter
      curlTexture.magFilter = THREE.LinearFilter
      curlTexture.needsUpdate = true
      textureRef.current = curlTexture

      // create shader material
      const mat = new ShaderMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        uniforms: {
          curlTexture: { value: curlTexture },
          bumpScale:    { value: 0.5 },
          colorScale:   { value: 20.0 }
        },
        vertexShader: /* glsl */`
          uniform sampler2D curlTexture;
          uniform float bumpScale;
          varying float vCurl;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vCurl = texture2D(curlTexture, uv).r;
            vec3 p = position + normal * vCurl * bumpScale;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: /* glsl */`
          precision highp float;
          uniform float colorScale;
          varying float vCurl;
          void main() {
            float c = vCurl * colorScale;
            float r = max(c, 0.0);
            float b = max(-c, 0.0);
            float a = clamp(r + b, 0.0, 1.0);
            gl_FragColor = vec4(r, 0.0, b, a);
          }
        `,
      })
      materialRef.current = mat
    }, [resolutionZ, resolutionX])

    // expose the update() method to parent
    useImperativeHandle(ref, () => ({
      update(curl: Float32Array) {
        const tex = textureRef.current!
        tex.image.data = curl
        tex.needsUpdate = true
      }
    }), [])

    return (
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={materialRef.current!}
        rotation={rotation}
      />
    )
  }
)

export default VortexShedding
