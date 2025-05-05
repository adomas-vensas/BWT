import React, { useRef, useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import * as THREE from 'three'
import Ground from './objects/Ground'
import Mast, { MastHandle } from './objects/Mast'
import VortexShedding from './objects/VortexShedding'

interface Params {
  NX: number
  NY: number
  RE: number
  UR: number
  MR: number
  DR: number
  D_PHYSICAL: number
}

const Scene: React.FC = () => {
    const [params, setParams] = useState<Params | null>(null)
    const mastRef = useRef<MastHandle>(null!)
    const vortexRef = useRef<any>(null!)
    const swayData = useRef<{ x: number; z: number }>({ x: 0, z: 0 })

    const sideSize = 20;

    const { scene } = useThree()

    useEffect(() =>{
        scene.background = new THREE.Color('deepskyblue')
    }, [scene])

    useEffect(() => {
        fetch('http://localhost:8000/params')
        .then((res) => res.json())
        .then((data: Params) => setParams(data))
        .catch(console.error)
    }, [])

    useEffect(() => {
        if (!params) return
        const ws = new WebSocket('ws://localhost:8000/stream/calculate')
        ws.binaryType = 'arraybuffer'
        ws.onopen = () => console.log('WS connected')
        ws.onmessage = (evt) => {
            const buf = evt.data as ArrayBuffer
            const view = new DataView(buf)
            const dz = view.getFloat32(0, true)
            const dx = view.getFloat32(4, true)
            swayData.current = { z: dz, x: dx }
            const curlArray = new Float32Array(buf.slice(8))
            vortexRef.current?.update(curlArray)
        }
        ws.onerror = console.error
        return () => ws.close()
    }, [params])

    // 3) Animation loop: apply sway to mast each frame
    useFrame((_, delta) => {
        const { x, z } = swayData.current
        mastRef.current?.sway({ x: 0, z: 0 }, { z, x }, 1)
    })

    if (!params) return null // or a loading spinner

    return (
        <>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <axesHelper args={[5]} />

        <OrbitControls enableDamping />

        <Ground sideSize={sideSize} resolutionZ={params.NX} resolutionX={params.NY} />
        <Mast
            ref={mastRef}
            position={[0, params.D_PHYSICAL * 1.5, 0]}
            radius={params.D_PHYSICAL / 2}
            height={3}
            lowerFrac={0.1}
        />
        <VortexShedding
            ref={vortexRef}
            width={sideSize}
            height={sideSize}
            resolutionZ={params.NX}
            resolutionX={params.NY}
            rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        />
        </>
    )
}

export default Scene
