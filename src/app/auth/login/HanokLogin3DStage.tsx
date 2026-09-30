'use client';

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

import { useOnmaruTheme } from '@/design-system/ThemeProvider';

const MODEL_URL = '/anchae.glb';
useGLTF.preload(MODEL_URL);

function StaticHanok3D({ isDark }: { isDark: boolean }) {
  const { scene } = useGLTF(MODEL_URL);

  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const isRoof = mesh.name.toLowerCase().includes('roof');
        if (isRoof && isDark && mesh.material) {
          const originalMat = mesh.material as THREE.MeshStandardMaterial;
          const mat = originalMat.clone();
          if (mat.color) {
            mat.color = mat.color.clone().multiplyScalar(1.45);
          }
          mat.roughness = 0.5;
          mesh.material = mat;
        }
      }
    });
    return cloned;
  }, [scene, isDark]);

  return (
    <group rotation={[0, 0.78, 0]} position={[0, 0.05, 0]}>
      <Center>
        <primitive object={clonedScene} scale={1.68} />
      </Center>
    </group>
  );
}

export default function HanokLogin3DStage() {
  const { mode } = useOnmaruTheme();
  const isDark = mode === 'dark';

  return (
    <div
      style={{
        position: 'absolute',
        top: '-30px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '580px',
        height: '360px',
        zIndex: 1,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [14, 11, 22], fov: 38 }}
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
        }}
      >
        <ambientLight intensity={isDark ? 2.4 : 1.6} color={isDark ? '#f1f5f9' : '#ffffff'} />
        <directionalLight position={[15, 25, 20]} intensity={isDark ? 2.2 : 2.0} color="#ffffff" />
        {isDark && (
          <>
            {/* 지붕 상단을 직접 환하게 비추는 탑 라이트 */}
            <directionalLight position={[0, 35, 10]} intensity={2.8} color="#ffffff" />
            {/* 어두운 배경과 지붕 능선(용마루/처마선)을 선명하게 분리하는 후방 림라이트 */}
            <directionalLight position={[5, 28, -25]} intensity={3.8} color="#e0f2fe" />
          </>
        )}
        <directionalLight position={[-15, 12, -10]} intensity={isDark ? 1.4 : 0.8} color="#ffe5c2" />
        <React.Suspense fallback={null}>
          <StaticHanok3D isDark={isDark} />
        </React.Suspense>
      </Canvas>
    </div>
  );
}
