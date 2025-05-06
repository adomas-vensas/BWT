import React, { useRef, useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Ground from './objects/Ground'
import Mast, { MastHandle } from './objects/Mast'
import VortexShedding from './objects/VortexShedding'
import GetConstraintParameters from './API/GetConstraintParameters'
import { PostSimulationParams } from './API/PostSimulationParams'



const Scene: React.FC = () => {
    const [constraints, setConstraints] = useState<GetConstraintParameters | null>(null)
    const [initialSimParams, setInitialSimParams] = useState<PostSimulationParams | null>(null)
    const mastRef = useRef<MastHandle>(null!)
    const vortexRef = useRef<any>(null!)
    const swayData = useRef<{ x: number; z: number }>({ x: 0, z: 0 })
    const sideSize = 20;

    const { scene } = useThree()

    useEffect(() =>{
        scene.background = new THREE.Color('deepskyblue')
    }, [scene])
    useEffect(() => {
        const fetchData = async () => {
          try {
            const res1 = await fetch('http://localhost:7910/params', { method: "GET" });

            const data1: GetConstraintParameters = await res1.json();
            setConstraints(data1);

            const init = {
                windSpeed: data1.maxWindSpeed / 2,
                cylinderDiameter: data1.maxDiameter / 2,
                reynoldsNumber: 150,
                reducedVelocity: 5,
                massRatio: 10,
                dampingRatio: 0
            }

            setInitialSimParams(init)
          } catch (error) {
            console.error("Error during chained API calls:", error);
          }
        };
        fetchData();
      }, []);

    useEffect(() => {
        if (!constraints || !initialSimParams) return
        console.log(initialSimParams)
        const ws = new WebSocket('ws://localhost:7910/stream/calculate')
        ws.binaryType = 'arraybuffer'
        ws.onopen = () => {
            console.log('WS connected')
            
            ws.send(JSON.stringify({
                type: "init_params",
                body: initialSimParams
            }))
        } 
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
    }, [constraints, initialSimParams])

    // 3) Animation loop: apply sway to mast each frame
    useFrame((_) => {
        const { x, z } = swayData.current
        mastRef.current?.sway({ x: 0, z: 0 }, { z, x }, 1)
    })

    if (!constraints || !initialSimParams) return null // or a loading spinner

    const height = 3

    return (
        <>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <axesHelper args={[5]} />

        <OrbitControls enableDamping />

        <Ground sideSize={sideSize} resolutionZ={constraints.NX} resolutionX={constraints.NY} />
        <Mast
            ref={mastRef}
            position={[0, height / 2, 0]}
            radius={0.5 / 2}
            height={height}
            lowerFrac={0.1}
        />
        <VortexShedding
            ref={vortexRef}
            width={sideSize}
            height={sideSize}
            resolutionZ={constraints.NX}
            resolutionX={constraints.NY}
            rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        />
        </>
    )
}

export default Scene
