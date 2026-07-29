'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, useProgress, OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useHanokViewerStore } from '../../store/useHanokViewerStore';
import HanokModel from './HanokModel';
import HanokCameraRig, { FramingOffset, type OrbitControlsRef } from './HanokCameraRig';

function Loader() {
  const { progress } = useProgress();
  const setIsLoaded = useHanokViewerStore((s) => s.setIsLoaded);

  useEffect(() => {
    if (progress >= 100) {
      setIsLoaded(true);
    }
  }, [progress, setIsLoaded]);

  return (
    <Html center>
      <div
        style={{
          color: '#1C1A17',
          fontFamily: 'sans-serif',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          background: 'rgba(247, 245, 240, 0.88)',
          padding: '16px 28px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            width: '180px',
            height: '3px',
            background: 'rgba(28, 26, 23, 0.12)',
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
        안채를 불러오는 중 🇰🇷 {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

const HERO_SPLIT = 0.12;

// 스크롤 연동 3D 배경 및 조명 보간 컨트롤러
function EnvironmentController() {
  const { scene } = useThree();

  const heroBgColor = useRef(new THREE.Color('#FAF8F3'));
  const darkBgColor = useRef(new THREE.Color('#1C1A17'));
  const heroFogColor = useRef(new THREE.Color('#E9E3D8'));
  const darkFogColor = useRef(new THREE.Color('#1C1A17'));

  // 히어로 주광 위치 (좌측 45도) / 조립 섹션 주광 위치
  const heroKeyPos = useRef(new THREE.Vector3(-12, 8, 10));
  const assemblyKeyPos = useRef(new THREE.Vector3(13, 17, 11));

  const keyRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);

  useFrame(() => {
    const { activeSectionId, heroProgress, isReducedMotion } = useHanokViewerStore.getState();
    const lerp = THREE.MathUtils.lerp;

    if (activeSectionId === 'hero') {
      if (isReducedMotion) {
        if (keyRef.current) {
          keyRef.current.intensity = 2.5;
          keyRef.current.color.set('#FFD9A8');
        }
        scene.background = new THREE.Color('#F7F2E9');
        if (scene.fog) scene.fog.color = new THREE.Color('#EDE4D6');
      } else {
        // [0.20 ~ 0.45] directionalLight intensity 0 -> 2.5 (해질녘 톤 #FFD9A8)
        let keyIntensity = 0;
        if (heroProgress <= 0.20) {
          keyIntensity = 0;
        } else if (heroProgress <= 0.45) {
          const t = (heroProgress - 0.20) / 0.25;
          keyIntensity = lerp(0, 2.5, t);
        } else {
          keyIntensity = 2.5;
        }

        if (keyRef.current) {
          keyRef.current.intensity = keyIntensity;
          keyRef.current.color.set('#FFD9A8');
        }

        // [0.45 ~ 0.55] 배경색 #0A0908 -> #F7F2E9 lerp 전환
        let bgProgress = 0;
        if (heroProgress <= 0.45) {
          bgProgress = 0;
        } else if (heroProgress <= 0.55) {
          bgProgress = (heroProgress - 0.45) / 0.10;
        } else {
          bgProgress = 1;
        }

        const darkBg = new THREE.Color('#0A0908');
        const brightBg = new THREE.Color('#F7F2E9');
        scene.background = new THREE.Color().lerpColors(darkBg, brightBg, bgProgress);

        if (scene.fog) {
          const darkFog = new THREE.Color('#0A0908');
          const brightFog = new THREE.Color('#EDE4D6');
          scene.fog.color = new THREE.Color().lerpColors(darkFog, brightFog, bgProgress);
        }
      }
    } else {
      // 기타 섹션 (조립, 부재탐색 등) 기본 조명 밸런스 유지
      if (keyRef.current) {
        keyRef.current.intensity = 2.8;
        keyRef.current.color.set('#FFEFD8');
      }
      scene.background = new THREE.Color('#FAF8F3');
      if (scene.fog) scene.fog.color = new THREE.Color('#EDE4D6');
    }
  });

  return (
    <>
      {/* 주광(Key Light) 설정 — #FFD9A8 해질녘 톤 지원 */}
      <directionalLight
        ref={keyRef}
        position={[-12, 8, 10]}
        intensity={0}
        color="#FFD9A8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={55}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-normalBias={0.02}
        shadow-bias={-0.00015}
      />

      {/* 림라이트(Rim Light) 설정 */}
      <directionalLight ref={rimRef} position={[-9, 13, -14]} intensity={1.1} color="#FFD9A8" />

      {/* 보조광(Fill Light) 설정 */}
      <directionalLight ref={fillRef} position={[-14, 5, 9]} intensity={0.45} color="#CBD8E8" />

      <ambientLight ref={ambientRef} intensity={0.3} color="#FFF6EA" />
      <hemisphereLight ref={hemiRef} args={['#FFF3E4', '#241F1A', 0.5]} />

      <StudioEnvironment />
    </>
  );
}


// 절차적 스튜디오 환경맵. three 내장 RoomEnvironment를 PMREM으로 한 번만 구워
// scene.environment에 물린다. 외부 HDRI를 받지 않으므로 오프라인 시연에서도 안전하고,
// 재질에 스페큘러를 실어 검은 기와가 회색 판으로 보이는 문제를 해결한다.
function StudioEnvironment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const rt = pmrem.fromScene(room, 0.04);

    scene.environment = rt.texture;
    scene.environmentIntensity = 0.55;

    return () => {
      scene.environment = null;
      rt.dispose();
      pmrem.dispose();
      room.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) mesh.geometry?.dispose();
      });
    };
  }, [gl, scene]);

  return null;
}

export default function HanokCanvas() {
  const controlsRef = useRef<OrbitControlsRef | null>(null);
  const isOrbitEnabled = useHanokViewerStore((s) => s.isOrbitEnabled);
  const activeSectionId = useHanokViewerStore((s) => s.activeSectionId);
  const introProgress = useHanokViewerStore((s) => s.introProgress);

  const isHero = useHanokViewerStore((s) => s.scrollProgress < HERO_SPLIT);

  const canvasOpacity =
    activeSectionId === 'intro'
      ? Math.max(0, Math.min(1, (introProgress - 0.85) / 0.15))
      : 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        opacity: canvasOpacity,
        background: isHero
          ? 'linear-gradient(180deg, #FAF8F3 0%, #E9E3D8 100%)'
          : '#1C1A17',
        transition: 'opacity 0.2s ease-out, background 0.4s ease-out',
        pointerEvents: isOrbitEnabled ? 'auto' : 'none',
      }}
    >

      <Canvas
        camera={{ position: [0.0, 1.2, 9.5], fov: 52, near: 0.1, far: 200 }}
        dpr={[1, 2]}
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <color attach="background" args={['#FAF8F3']} />
        <fog attach="fog" args={['#EDE4D6', 25, 70]} />

        <EnvironmentController />

        <React.Suspense fallback={<Loader />}>
          <HanokModel />
        </React.Suspense>

        {/* 건물 하단 접지 그림자 (ContactShadows) */}
        <ContactShadows
          position={[0, 0, 0]}
          scale={45}
          blur={2.5}
          opacity={0.45}
          far={12}
          resolution={512}
          color="#1C1A17"
        />

        {isOrbitEnabled && <OrbitControls ref={controlsRef} makeDefault />}

        <HanokCameraRig controlsRef={controlsRef} />
        <FramingOffset />
      </Canvas>
    </div>
  );
}
