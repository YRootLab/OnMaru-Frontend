'use client';

import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, useProgress, ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { STAGES } from '../../data/hanok.data';
import { surface, darkPalette } from '@/design-system/tokens';
import { useHanokViewerStore } from '../../store/useHanokViewerStore';
import HanokModel from './HanokModel';
import HanokCameraRig, { FramingOffset } from './HanokCameraRig';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div
        style={{
          color: 'rgba(255,255,255,0.9)',
          fontFamily: 'sans-serif',
          fontSize: '13px',
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '160px',
            height: '2px',
            background: 'rgba(255,255,255,0.14)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#d4af37',
              transition: 'width 0.2s ease-out',
            }}
          />
        </div>
        안채를 불러오는 중 {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

export default function HanokCanvas() {
  const controlsRef = useRef<any>(null);
  const isOrbitEnabled = useHanokViewerStore((s) => s.isOrbitEnabled);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: isOrbitEnabled ? 'auto' : 'none',
      }}
    >
      <Canvas
        camera={{ position: STAGES[0].cameraPos, fov: STAGES[0].fov, near: 0.1, far: 200 }}
        dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* 1. 배경색 및 안개 */}
        <color attach="background" args={[surface.dark.app]} />
        <fog attach="fog" args={[surface.dark.app, 38, 88]} />

        {/* 2. 조명 시스템 */}
        <hemisphereLight args={['#e8f2ff', '#1f1b16', 1.6]} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[15, 25, 15]} intensity={2.6} castShadow />
        <directionalLight position={[0, 40, 10]} intensity={3.2} color="#e0eeff" />
        <directionalLight position={[0, 30, -20]} intensity={2.4} color={darkPalette.kobalt[200]} />
        <directionalLight position={[-15, 10, -10]} intensity={1.2} color={darkPalette.kobalt[100]} />

        {/* 3. 그림자 (ContactShadows) */}
        <React.Suspense fallback={<Loader />}>
          <HanokModel />
          <ContactShadows
            position={[0, 0.01, 0]}
            scale={34}
            resolution={1024}
            blur={2.6}
            opacity={0.5}
            far={14}
          />
        </React.Suspense>

        {isOrbitEnabled && <OrbitControls ref={controlsRef} makeDefault />}

        <HanokCameraRig controlsRef={controlsRef} />
        <FramingOffset />
      </Canvas>
    </div>
  );
}
