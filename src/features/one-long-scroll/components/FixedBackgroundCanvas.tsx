'use client';

import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { getScrollProgress } from '../store/scrollProgress';
import { sampleColorStops, type Rgb } from '../utils/lerpColor';
import { BACKGROUND_STOPS, BACKGROUND_START_HEX } from '../data/scrollPalette';
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
// 배경색 (테스트용 progress 보간)
// ─────────────────────────────────────────

/**
 * 진행도에 따라 씬 배경색과 포그 색을 갈아끼운다.
 * 스토어를 구독하지 않고 useFrame 안에서 전역 변수를 직접 읽으므로 리렌더가 없다.
 */
function ScrollBackground() {
  const scene = useThree((s) => s.scene);

  // 매 프레임 배열/THREE.Color를 새로 만들지 않도록 스크래치를 재사용한다.
  const rgb = useRef<Rgb>([0, 0, 0]);
  const color = useRef(new THREE.Color());

  useFrame(() => {
    sampleColorStops(BACKGROUND_STOPS, getScrollProgress(), rgb.current);

    const [r, g, b] = rgb.current;
    color.current.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);

    scene.background = color.current;
    if (scene.fog) scene.fog.color.copy(color.current);
  });

  return null;
}

// ─────────────────────────────────────────
// 고정 조명 (아직 연출 없음)
// ─────────────────────────────────────────

/**
 * 스크롤과 무관한 고정 조명 리그. 조명 연출은 아직 붙이지 않는다.
 */
function StaticLights() {
  return (
    <>
      {/* 주광 */}
      <directionalLight
        position={[-12, 8, 10]}
        intensity={2.8}
        color="#FFEFD8"
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
 *
 * z-index: -1이므로 본문 콘텐츠는 별도 z-index 없이도 항상 위에 놓인다.
 * 대신 이 캔버스를 감싸는 어떤 조상도 스태킹 컨텍스트를 만들면 안 되고
 * (transform / opacity / filter 금지), 본문 래퍼에 불투명 배경을 깔면 안 된다.
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
        // 캔버스가 올라오기 전 한 프레임 동안 비칠 색
        background: BACKGROUND_START_HEX,
      }}
    >
      <Canvas
        camera={{ position: CAMERA_POS, fov: CAMERA_FOV, near: 0.1, far: 200 }}
        dpr={[1, 2]}
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* 첫 프레임 색. 이후는 ScrollBackground가 매 프레임 덮어쓴다. */}
        <color attach="background" args={[BACKGROUND_START_HEX]} />
        <fog attach="fog" args={[BACKGROUND_START_HEX, 25, 70]} />

        <ScrollBackground />
        <FixedCamera />
        <StaticLights />
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
