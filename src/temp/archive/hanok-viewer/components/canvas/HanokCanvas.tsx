'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, useProgress, OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useHanokViewerStore } from '@/temp/archive/hanok-viewer/store/useHanokViewerStore';
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

// ── 01 히어로 시퀀스 조명 상수 ──
const HERO_KEY_COLOR = '#FFD9A8'; // 해질녘 톤
const HERO_KEY_INTENSITY = 2.5;

// 각 보조 광원의 최종(완전 점등) 세기. 암전 구간에서는 이 값에 ramp를 곱한다.
const RIM_INTENSITY = 1.1;
const FILL_INTENSITY = 0.45;
const AMBIENT_INTENSITY = 0.3;
const HEMI_INTENSITY = 0.5;

const GROUND_SHADOW_OPACITY = 0.45;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

// [0.20 ~ 0.45] 조명 intensity 0 -> 최종값. 그림자도 이 램프를 함께 탄다.
const lightRamp = (p: number) => clamp01((p - 0.2) / 0.25);

// [0.45 ~ 0.55] 배경색 #0A0908 -> #F7F2E9
const bgRamp = (p: number) => clamp01((p - 0.45) / 0.1);

// 스크롤 연동 3D 배경 및 조명 보간 컨트롤러
function EnvironmentController() {
  const { scene } = useThree();

  // 매 프레임 new THREE.Color()를 만들면 GC가 계속 돈다. 스크래치 인스턴스를 재사용한다.
  const darkBg = useRef(new THREE.Color('#0A0908'));
  const brightBg = useRef(new THREE.Color('#F7F2E9'));
  const darkFog = useRef(new THREE.Color('#0A0908'));
  const brightFog = useRef(new THREE.Color('#EDE4D6'));
  const scratchBg = useRef(new THREE.Color());
  const scratchFog = useRef(new THREE.Color());

  const keyRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);

  useFrame(() => {
    const { activeSectionId, heroProgress, isReducedMotion } = useHanokViewerStore.getState();

    // 00 인트로는 완전 암전 상태로 끝나고, 01이 그 시작점을 그대로 이어받아 밝아진다.
    // 인트로를 여기서 함께 처리하지 않으면 캔버스가 페이드인하는 순간 이미 밝은 화면이
    // 나타나 "어둠 속에서 드러난다"는 연출 자체가 성립하지 않는다.
    if (activeSectionId === 'intro' || activeSectionId === 'hero') {
      const p = activeSectionId === 'intro' ? 0 : heroProgress;

      // [접근성] prefers-reduced-motion이면 페이드인 없이 즉시 최종 밝기
      const lit = isReducedMotion ? 1 : lightRamp(p);
      const bright = isReducedMotion ? 1 : bgRamp(p);

      if (keyRef.current) {
        keyRef.current.intensity = HERO_KEY_INTENSITY * lit;
        keyRef.current.color.set(HERO_KEY_COLOR);
      }
      // 보조광까지 같이 눌러야 암전 구간에 실루엣이 새어나오지 않는다.
      if (rimRef.current) rimRef.current.intensity = RIM_INTENSITY * lit;
      if (fillRef.current) fillRef.current.intensity = FILL_INTENSITY * lit;
      if (ambientRef.current) ambientRef.current.intensity = AMBIENT_INTENSITY * lit;
      if (hemiRef.current) hemiRef.current.intensity = HEMI_INTENSITY * lit;

      scene.environmentIntensity = 0.55 * lit;

      scene.background = scratchBg.current.lerpColors(darkBg.current, brightBg.current, bright);
      if (scene.fog) {
        scene.fog.color = scratchFog.current.lerpColors(darkFog.current, brightFog.current, bright);
      }
    } else {
      // 기타 섹션 (조립, 부재탐색 등) 기본 조명 밸런스로 복귀
      if (keyRef.current) {
        keyRef.current.intensity = 2.8;
        keyRef.current.color.set('#FFEFD8');
      }
      if (rimRef.current) rimRef.current.intensity = RIM_INTENSITY;
      if (fillRef.current) fillRef.current.intensity = FILL_INTENSITY;
      if (ambientRef.current) ambientRef.current.intensity = AMBIENT_INTENSITY;
      if (hemiRef.current) hemiRef.current.intensity = HEMI_INTENSITY;

      scene.environmentIntensity = 0.55;

      scene.background = scratchBg.current.set('#FAF8F3');
      if (scene.fog) scene.fog.color = scratchFog.current.set('#EDE4D6');
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

// 건물 하단 접지 그림자. 조명과 무관하게 항상 떠 있으면 암전 구간에 바닥 그림자만
// 남아 형체가 드러나므로, 주광과 같은 램프를 태워 함께 짙어지게 한다.
function GroundShadow() {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.Material | null>(null);

  useFrame(() => {
    if (!matRef.current && groupRef.current) {
      groupRef.current.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && !matRef.current) {
          matRef.current = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        }
      });
    }

    const mat = matRef.current;
    if (!mat) return;

    const { activeSectionId, heroProgress, isReducedMotion } = useHanokViewerStore.getState();

    let k = 1;
    if (activeSectionId === 'intro') {
      k = isReducedMotion ? 1 : 0;
    } else if (activeSectionId === 'hero') {
      k = isReducedMotion ? 1 : lightRamp(heroProgress);
    }

    mat.opacity = GROUND_SHADOW_OPACITY * k;
  });

  return (
    <group ref={groupRef}>
      <ContactShadows
        position={[0, 0, 0]}
        scale={45}
        blur={2.5}
        opacity={GROUND_SHADOW_OPACITY}
        far={12}
        resolution={512}
        color="#1C1A17"
      />
    </group>
  );
}

export default function HanokCanvas() {
  const controlsRef = useRef<OrbitControlsRef | null>(null);
  const isOrbitEnabled = useHanokViewerStore((s) => s.isOrbitEnabled);
  const activeSectionId = useHanokViewerStore((s) => s.activeSectionId);
  const introProgress = useHanokViewerStore((s) => s.introProgress);

  // 인트로/히어로 구간에서는 캔버스 뒤판도 암전색이어야 한다. 캔버스가 페이드인하는
  // 동안 이 배경이 그대로 비치기 때문에, 여기가 밝으면 암전이 깨진다.
  const isHeroLike = activeSectionId === 'intro' || activeSectionId === 'hero';

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
        background: isHeroLike ? '#0A0908' : '#FAF8F3',
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
        {/* 초기값은 암전색. 첫 프레임이 밝게 번쩍이지 않도록 00 시작 상태와 맞춘다. */}
        <color attach="background" args={['#0A0908']} />
        <fog attach="fog" args={['#0A0908', 25, 70]} />

        <EnvironmentController />

        <React.Suspense fallback={<Loader />}>
          <HanokModel />
        </React.Suspense>

        {/* 건물 하단 접지 그림자 (조명 램프 연동) */}
        <GroundShadow />

        {isOrbitEnabled && <OrbitControls ref={controlsRef} makeDefault />}

        <HanokCameraRig controlsRef={controlsRef} />
        <FramingOffset />
      </Canvas>
    </div>
  );
}
