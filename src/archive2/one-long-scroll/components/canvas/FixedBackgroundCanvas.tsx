'use client';

import React, { Suspense, useEffect, useRef } from 'react';

import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { registerKeyLight, COLOR_CURVE, INTENSITY_CURVE } from '@/archive2/components/LightingSystem';
import HanokStaticModel from './HanokStaticModel';

// ─────────────────────────────────────────
// 고정 카메라
// ─────────────────────────────────────────

const CAMERA_POS: [number, number, number] = [-11.2, 2.5, 9.8];
const CAMERA_TARGET: [number, number, number] = [-0.8, 3.0, 0.0];
const CAMERA_FOV = 46;

/**
 * 카메라 고정. 스크롤에 전혀 반응하지 않는다.
 * 리사이즈 때만 세로 화면에서 모델이 잘리지 않도록 FOV를 다시 잡는다.
 */
function FixedCamera() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  useEffect(() => {
    const aspect = size.width / size.height;

    camera.position.set(...CAMERA_POS);
    camera.lookAt(...CAMERA_TARGET);
    camera.fov = CAMERA_FOV * (aspect < 1.2 ? Math.min(1.75, 1.5 / Math.max(0.45, aspect)) : 1);
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}

// ─────────────────────────────────────────
// 조명
// ─────────────────────────────────────────

/**
 * 조명 리그.
 *
 * 주광만 LightingSystem에 등록해 스크롤 진행도를 따라간다
 * (세기 0.3 → 2.8 → 0.3, 색 주홍 → 황금 → 백색 → 코발트).
 * 보조광과 위치·그림자 설정은 스크롤과 무관하므로 여기서만 관리한다.
 *
 * 초기 intensity/color는 곡선의 progress 0 지점을 그대로 쓴다.
 * 값을 따로 적어두면 캔버스가 늦게 올라올 때 첫 프레임이 밝게 번쩍인다.
 */
function LightRig() {
  const keyLightRef = useRef<THREE.DirectionalLight>(null);

  useEffect(() => registerKeyLight(keyLightRef.current), []);

  return (
    <>
      {/* 주광 — intensity/color는 LightingSystem이 갱신한다 */}
      <directionalLight
        ref={keyLightRef}
        position={[-12, 8, 10]}
        intensity={INTENSITY_CURVE[0].value}
        color={COLOR_CURVE[0].color}
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

      {/* 림라이트 */}
      <directionalLight position={[-9, 13, -14]} intensity={1.1} color="#FFD9A8" />

      {/* 보조광 */}
      <directionalLight position={[-14, 5, 9]} intensity={0.45} color="#CBD8E8" />

      <ambientLight intensity={0.3} color="#FFF6EA" />
      <hemisphereLight args={['#FFF3E4', '#241F1A', 0.5]} />
    </>
  );
}

/**
 * 절차적 스튜디오 환경맵. three 내장 RoomEnvironment를 PMREM으로 한 번만 구워
 * scene.environment에 물린다. 외부 HDRI 요청 없이 재질에 스페큘러를 실어
 * 검은 기와가 무광 회색 판으로 보이는 문제를 막는다.
 */
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

// ─────────────────────────────────────────
// FixedBackgroundCanvas
// ─────────────────────────────────────────

/**
 * 화면 전체를 덮는 고정 배경 캔버스.
 */
export default function FixedBackgroundCanvas() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        background: 'transparent',
      }}
    >
      <Canvas
        camera={{ position: CAMERA_POS, fov: CAMERA_FOV, near: 0.1, far: 200 }}
        dpr={[1, 2]}
        shadows
        gl={{
          alpha: true,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <FixedCamera />
        <LightRig />
        <StudioEnvironment />


        <Suspense fallback={null}>
          <HanokStaticModel />
        </Suspense>

        <ContactShadows
          position={[0, 0, 0]}
          scale={45}
          blur={2.5}
          opacity={0.45}
          far={12}
          resolution={512}
          color="#1C1A17"
        />
      </Canvas>
    </div>
  );
}
