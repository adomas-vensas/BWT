import React, { useMemo } from 'react'
import * as THREE from 'three'
// import { useLoader } from '@react-three/fiber'
import { SimplexNoise } from 'three/examples/jsm/Addons'

export interface GroundProps {
  sideSize: number
  resolutionZ: number
  resolutionX: number
}

export default function Ground({
  sideSize,
  resolutionZ,
  resolutionX
}: GroundProps) {
    const heightMap = new THREE.TextureLoader().load('../src/textures/hill_height_map.png')
    const textureMap = new THREE.TextureLoader().load('../src/textures/hills_bitmap.png')

    const geometry = useMemo(() => {
      const simplex = new SimplexNoise()

      // plane in X/Y, we’ll rotate it down into X/Z
      const geo = new THREE.PlaneGeometry(
        sideSize,
        sideSize,
        resolutionZ,
        resolutionX
      )

      const posAttr = geo.attributes.position as THREE.BufferAttribute
      const arr = posAttr.array as Float32Array
      const halfSize = sideSize / 2

      // helper for elevation
      function getElevation(x: number, y: number) {
        if (Math.abs(x) > halfSize || Math.abs(y) > halfSize) return -1
        const major = 0.6 * simplex.noise(0.1 * x, 0.1 * y)
        const minor = 0.2 * simplex.noise(0.3 * x, 0.3 * y)
        return major + minor
      }

      // displace each vertex’s Z component
      for (let i = 0; i < posAttr.count; i++) {
        const ix = 3 * i
        const x = arr[ix + 0]
        const y = arr[ix + 1]
        arr[ix + 2] = getElevation(x, y)
      }

      posAttr.needsUpdate = true
      geo.computeVertexNormals()
      return geo
  }, [sideSize, resolutionZ, resolutionX])

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}   /* rotate from XY into XZ */
      receiveShadow
      castShadow
    >
      <meshStandardMaterial
        displacementMap={heightMap}
        // map={textureMap}
        wireframe={true}
      />
    </mesh>
  )
}
