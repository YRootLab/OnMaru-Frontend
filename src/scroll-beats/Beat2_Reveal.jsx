'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import styled from '@emotion/styled';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';
import { isInBeat } from './BeatFrame';

// ─────────────────────────────────────────
// 하위 호환성 및 무대 파라미터 Export
// ─────────────────────────────────────────

export const RANGE = [0.06, 0.19];
export const WALL_COLOR = '#F5E6D3';
export const WALL_ROUGHNESS = 0.95;
export const WALL_DISTANCE = 0.6;
export const WALL_SIZE = [10, 6.7];

export const WIRE_OPACITY = 0.85;
export const GLOW_OPACITY = 0.25;
export const GLOW_SCALE = 1.002;
export const TILT_MAX = 0.26;
export const TILT_LERP = 0.05;

export function getBeat2Scene(progress) {
  return {
    keyIntensity: 1.8,
    keyColor: '#FFF8F0',
    keyPosition: [-1.25, 1.75, 1.35],
    rimIntensity: 0.3,
    rimColor: '#C1502E',
    ambientIntensity: 0.5,
    shadowOpacity: 0.4,
    shadowColor: '#3A2E1F',
    background: '#141414',
    cameraDolly: 0,
    shadowOnly: false,
    wallOpacity: 0,
  };
}

export function createWireframeMaterials() {
  return {
    line: new THREE.MeshBasicMaterial({
      color: '#F5A623',
      wireframe: true,
      transparent: true,
      opacity: WIRE_OPACITY,
    }),
    glow: new THREE.MeshBasicMaterial({
      color: '#FFCC40',
      wireframe: true,
      transparent: true,
      opacity: GLOW_OPACITY,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  };
}

// ─────────────────────────────────────────
// Emotion Styled Components
// ─────────────────────────────────────────

const SectionContainer = styled.section`
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: transparent;
  overflow: hidden;
  pointer-events: auto;
  will-change: opacity, transform;
`;

const ViewportContainer = styled.div`
  position: relative;
  width: 98vw;
  max-width: 1600px;
  height: 75vh;
  max-height: 640px;
  background: transparent;
  border: none;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: visible;
`;

const CardHeader = styled.div`
  z-index: 2;
  margin-bottom: 12px;
  text-align: center;
  width: 100%;
  padding: 0 16px;
`;

const SingleLineTitle = styled.h2`
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: clamp(22px, 3.2vw, 48px);
  font-weight: 700;
  color: #f4efe4;
  margin: 0;
  white-space: nowrap;
  letter-spacing: -0.03em;
  text-shadow: 0 4px 28px rgba(0, 0, 0, 0.95);

  @media (max-width: 768px) {
    white-space: normal;
    word-break: keep-all;
  }
`;

const CanvasWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  max-height: 520px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// ─────────────────────────────────────────
// Three.js 3D GLB Model Wireframe
// ─────────────────────────────────────────

function HanokR185ModelWireframe({ rx, ry }) {
  const { scene } = useGLTF('/anchae.glb');
  const groupRef = useRef(null);

  const goldWireframeScene = useMemo(() => {
    const cloned = scene.clone(true);
    const wireframeMat = new THREE.MeshStandardMaterial({
      color: '#D4AF37',
      wireframe: true,
      emissive: '#4A3B10',
      roughness: 0.25,
      metalness: 0.8,
    });

    cloned.traverse((child) => {
      if (child.isMesh) {
        child.material = wireframeMat;
      }
    });

    return cloned;
  }, [scene]);

  useFrame(() => {
    if (groupRef.current) {
      const targetRx = (rx * Math.PI) / 180;
      const targetRy = (ry * Math.PI) / 180;

      groupRef.current.rotation.x += (targetRx - groupRef.current.rotation.x) * 0.08;
      groupRef.current.rotation.y += (targetRy - groupRef.current.rotation.y) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <Center position={[-0.7, 0.3, 0]}>
        <primitive object={goldWireframeScene} scale={0.48} />
      </Center>
    </group>
  );
}

export function Fallback3DWireframe({ rx = 0, ry = 0 }) {
  const groupRef = useRef(null);

  useFrame(() => {
    if (groupRef.current) {
      const targetRx = (rx * Math.PI) / 180;
      const targetRy = (ry * Math.PI) / 180;

      groupRef.current.rotation.x += (targetRx - groupRef.current.rotation.x) * 0.08;
      groupRef.current.rotation.y += (targetRy - groupRef.current.rotation.y) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <group position={[-0.7, 0.3, 0]}>
        <mesh position={[0, -0.5, 0]}>
          <boxGeometry args={[4.5, 0.45, 3.5]} />
          <meshStandardMaterial color="#D4AF37" wireframe />
        </mesh>
        {[-1.8, 1.8].map((x, i) =>
          [-1.3, 1.3].map((z, j) => (
            <mesh key={`${i}-${j}`} position={[x, 0.9, z]}>
              <cylinderGeometry args={[0.13, 0.13, 2.5, 8]} />
              <meshStandardMaterial color="#D4AF37" wireframe />
            </mesh>
          ))
        )}
        <mesh position={[0, 2.6, 0]}>
          <coneGeometry args={[3.6, 1.5, 4]} />
          <meshStandardMaterial color="#C1502E" wireframe />
        </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────
// Beat2_Reveal 메인 컴포넌트 (부드러운 스크롤 교차 페이드)
// ─────────────────────────────────────────

export default function Beat2_Reveal({ progress = 0.12 }) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (typeof progress === 'number' && !isInBeat(progress, 0.05, 0.21)) {
    return null;
  }

  // Beat1 -> Beat2 진입 교차 페이드 (0.06 ~ 0.09)
  const fadeIn = Math.max(0, Math.min(1, (progress - 0.06) / (0.09 - 0.06)));
  // Beat2 -> Beat3 퇴장 교차 페이드 (0.16 ~ 0.19)
  const fadeOut = Math.max(0, Math.min(1, (0.19 - progress) / (0.19 - 0.16)));

  const smoothFadeIn = Math.sin(fadeIn * Math.PI * 0.5);
  const smoothFadeOut = Math.sin(fadeOut * Math.PI * 0.5);
  const smoothOpacity = smoothFadeIn * smoothFadeOut;

  // 부드러운 수직 부상 애니메이션 (16px -> 0px)
  const translateY = (1 - smoothFadeIn) * 16;

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normX = (e.clientX - centerX) / (rect.width / 2);
    const normY = (e.clientY - centerY) / (rect.height / 2);

    const ry = Math.max(-15, Math.min(15, normX * 15));
    const rx = Math.max(-15, Math.min(15, -normY * 15));

    setTilt({ rx, ry });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  return (
    <SectionContainer
      style={{
        opacity: smoothOpacity,
        transform: `translate3d(0, ${translateY}px, 0)`,
        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
      }}
    >
      <ViewportContainer
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <CardHeader>
          <SingleLineTitle>
            형태를 지워낸 자리, 치밀하게 맞물린 설계 데이터가 드러납니다.
          </SingleLineTitle>
        </CardHeader>

        <CanvasWrapper>
          {mounted && (
            <Canvas
              camera={{ position: [0, 1.8, 7.2], fov: 42 }}
              style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
            >
              <ambientLight intensity={0.7} />
              <directionalLight position={[10, 15, 10]} intensity={2.0} color="#FFF8F0" />
              <directionalLight position={[-10, -5, -10]} intensity={0.6} color="#D4AF37" />

              <Suspense fallback={<Fallback3DWireframe rx={tilt.rx} ry={tilt.ry} />}>
                <HanokR185ModelWireframe rx={tilt.rx} ry={tilt.ry} />
              </Suspense>
            </Canvas>
          )}
        </CanvasWrapper>
      </ViewportContainer>
    </SectionContainer>
  );
}
