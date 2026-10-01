'use client';

import React, { useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

import { useOnmaruTheme } from '@/design-system/ThemeProvider';

const MODEL_URL = '/anchae.glb';
useGLTF.preload(MODEL_URL);

class HanokStageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function StaticHanok3D({ isDark }: { isDark: boolean }) {
  const { size } = useThree();
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

  // 화면 너비(size.width)에 따라 모바일에서도 한옥의 처마 좌우 날개가 잘리지 않도록 반응형 스케일 및 위치 보정
  const { scale, position } = useMemo(() => {
    const width = size.width;
    if (width < 380) {
      // 375px 이하 초소형 스마트폰 (iPhone SE 등)
      return { scale: 0.95, position: [0, 0.32, 0] as [number, number, number] };
    }
    if (width < 500) {
      // 일반 모바일 (iPhone 14/15/16 등 390px~430px)
      return { scale: 1.12, position: [0, 0.25, 0] as [number, number, number] };
    }
    if (width < 768) {
      // 대형 모바일 / 태블릿
      return { scale: 1.35, position: [0, 0.15, 0] as [number, number, number] };
    }
    // 데스크톱
    return { scale: 1.68, position: [0, 0.05, 0] as [number, number, number] };
  }, [size.width]);

  return (
    <group rotation={[0, 0.78, 0]} position={position}>
      <Center>
        <primitive object={clonedScene} scale={scale} />
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
        top: '-40px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100vw',
        maxWidth: '800px',
        height: '380px',
        zIndex: 1,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <HanokStageErrorBoundary>
        <Canvas
          dpr={[1, 2]}
          frameloop="demand"
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
              <directionalLight position={[0, 35, 10]} intensity={2.8} color="#ffffff" />
              <directionalLight position={[5, 28, -25]} intensity={3.8} color="#e0f2fe" />
            </>
          )}
          <directionalLight position={[-15, 12, -10]} intensity={isDark ? 1.4 : 0.8} color="#ffe5c2" />
          <React.Suspense fallback={null}>
            <StaticHanok3D isDark={isDark} />
          </React.Suspense>
        </Canvas>
      </HanokStageErrorBoundary>
    </div>
  );
}
