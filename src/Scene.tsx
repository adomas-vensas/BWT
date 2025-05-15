import React, { useRef, useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Ground from './objects/Ground'
import Mast, { MastHandle } from './objects/Mast'
import VortexShedding from './objects/VortexShedding'
import { SimulationParamsRequest } from './API/SimulationParamsRequest'
import { getSocket } from './utilities/WebSocketSingleton'
import { calculateDPhysical } from './utilities/constraints'


interface SceneProps{
    params: SimulationParamsRequest;
}

export default function Scene({params}: SceneProps) {
    const mastRef = useRef<MastHandle>(null!)
    const vortexRef = useRef<any>(null!)
    const swayData = useRef<{ x: number; z: number }>({ x: 0, z: 0 })
    const isFirst = useRef(true)
    const sideSize = 20;

    const { scene } = useThree()

    useEffect(() =>{
        scene.background = new THREE.Color('deepskyblue')
    }, [scene])

    useEffect(() => {
        const ws = getSocket()
    
        const onMessage = (evt: MessageEvent<ArrayBuffer>) => {
          const view = new DataView(evt.data)
          const dz = view.getFloat32(0, true)
          const dx = view.getFloat32(4, true)
          swayData.current = { z: dz, x: dx }
    
          const curlArray = new Float32Array(evt.data.slice(8))
          vortexRef.current?.update(curlArray)
        }
    
        ws.addEventListener('message', onMessage)
        ws.addEventListener('error', console.error)
    
        return () => {
          ws.removeEventListener('message', onMessage)
          ws.removeEventListener('error', console.error)
          ws.close()
        }
      }, [])
    
      // 3) whenever params changes, send either “init” (first time) or “update”
      useEffect(() => {
        const ws = getSocket()
        const messageType = isFirst.current ? 'init_params' : 'update_params'
        const payload = JSON.stringify({ type: messageType, body: params })
    
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload)
        } else {
          // queue it up if still connecting
          const onOpen = () => {
            ws.send(payload)
            ws.removeEventListener('open', onOpen)
          }
          ws.addEventListener('open', onOpen)
        }
    
        isFirst.current = false
      }, [params])

    // 3) Animation loop: apply sway to mast each frame
    useFrame(() => {
        const { x, z } = swayData.current
        mastRef.current?.sway({ x: 0, z: 0 }, { z, x }, 1)
    })

    const height = 3

    return (
        <>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        {/* <axesHelper args={[5]} /> */}

        <OrbitControls enableDamping />

        <Ground sideSize={sideSize} resolutionZ={params.nx} resolutionX={params.ny} />
        <Mast
            ref={mastRef}
            position={[0, height / 2, 0]}
            radius={calculateDPhysical(params.cylinderDiameter) / 2}
            height={height}
            lowerFrac={0.1}
        />
        <VortexShedding
            ref={vortexRef}
            width={sideSize}
            height={sideSize}
            resolutionZ={params.nx}
            resolutionX={params.ny}
            rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        />
        </>
    )
}