'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';

import { surface } from '@/design-system/tokens';

import HanokModel from '@/components/HanokModel';
import Beat1_Intro from '@/scroll-beats/Beat1_Intro';
import Beat2_Reveal from '@/scroll-beats/Beat2_Reveal';
import Beat3a_Earthquake from '@/scroll-beats/Beat3a_Earthquake';
import Beat3b_Season from '@/scroll-beats/Beat3b_Season';
import Beat3c_CrossSection from '@/scroll-beats/Beat3c_CrossSection';
import Beat3d_Deuleoyeolgae from '@/scroll-beats/Beat3d_Deuleoyeolgae';
import Beat4_Assembly from '@/scroll-beats/Beat4_Assembly';
import Beat5_Silence from '@/scroll-beats/Beat5_Silence';
import Beat6_Invite from '@/scroll-beats/Beat6_Invite';

/** 전체 스크롤 길이. 9개 Beat이 나눠 쓴다. */
const SCROLL_HEIGHT = '800vh';

/**
 * 캔버스 기본 배경 — 전통 먹빛 마루.
 *
 * 스토리가 Beat1~2의 어둠에서 시작해 밝아지므로 시작색을 그대로 기본값으로 잡는다.
 * BackgroundSystem을 다시 붙일 때 이 값 위에서 progress를 따라 바뀌면 되고,
 * Beat 위에 스크림을 따로 까는 방식과 달리 레이어가 겹치지 않는다.
 */
const CANVAS_BASE_COLOR = surface.dark.app;

// ─────────────────────────────────────────
// 전역 진행도
// ─────────────────────────────────────────

/**
 * 문서 전체를 하나의 구간으로 보고 0~1 진행도를 돌려준다.
 * scroll 이벤트는 프레임당 여러 번 들어올 수 있어 rAF 한 번으로 합쳐 읽는다.
 */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const read = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const next = scrollable > 0 ? window.scrollY / scrollable : 0;
      setProgress(Math.min(1, Math.max(0, next)));
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return progress;
}

// ─────────────────────────────────────────
// 고정 캔버스
// ─────────────────────────────────────────

const CAMERA_POS = [-11.2, 2.5, 9.8];
const CAMERA_TARGET = [-0.8, 3.0, 0.0];
const CAMERA_FOV = 46;

/**
 * 카메라 고정. 세로 화면에서 모델이 잘리지 않도록 리사이즈 때만 FOV를 다시 잡는다.
 *
 * useThree가 준 카메라를 직접 손대면 훅 반환값 수정으로 걸리므로,
 * 카메라 자체를 이 컴포넌트가 ref로 들고 makeDefault로 넘긴다.
 */
function FixedCamera() {
  const cameraRef = useRef(null);
  const size = useThree((s) => s.size);

  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    const aspect = size.width / size.height;

    camera.position.set(...CAMERA_POS);
    camera.lookAt(...CAMERA_TARGET);
    camera.fov = CAMERA_FOV * (aspect < 1.2 ? Math.min(1.75, 1.5 / Math.max(0.45, aspect)) : 1);
    camera.updateProjectionMatrix();
  }, [size]);

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={CAMERA_POS}
      fov={CAMERA_FOV}
      near={0.1}
      far={200}
    />
  );
}

/**
 * 3D 한옥 표시 여부.
 *
 * Beat 텍스트 연출을 잡는 동안에는 모델이 시선을 끌어 방해가 된다.
 * false면 캔버스를 아예 올리지 않아 WebGL 컨텍스트도 뜨지 않고,
 * 배경 단색만 남는다. 모델 작업으로 돌아올 때 true로 되돌리면 된다.
 */
const SHOW_HANOK = false;

/**
 * 화면 전체를 덮는 고정 3D 캔버스.
 *
 * 배경은 어둠에서 출발하는 단색 한 장이고 조명도 형태만 보이는 최소 구성이다.
 * 시간대별 배경·조명 연출은 Beat 작업이 끝난 뒤 다시 얹는다.
 */
function FixedCanvas() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: CANVAS_BASE_COLOR,
      }}
    >
      {SHOW_HANOK && (
        <Canvas
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <FixedCamera />

          {/* 형태 확인용 기본 조명 */}
          <ambientLight intensity={1.2} />
          <directionalLight position={[-12, 8, 10]} intensity={1.6} />

          <Suspense fallback={null}>
            <HanokModel />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// ScrollExperience
// ─────────────────────────────────────────

export default function ScrollExperience() {
  const progress = useScrollProgress();

  // main에도 같은 색을 깔아둔다. 고정 캔버스가 가리지 못하는 오버스크롤 구간에서
  // 밝은 body 배경이 비치는 것을 막는다.
  return (
    <main style={{ position: 'relative', width: '100%', background: CANVAS_BASE_COLOR }}>
      {/* 스크롤 길이만 만드는 spacer */}
      <div style={{ height: SCROLL_HEIGHT }} />

      <FixedCanvas />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Beat1_Intro progress={progress} />
        <Beat2_Reveal progress={progress} />
        <Beat3a_Earthquake progress={progress} />
        <Beat3b_Season progress={progress} />
        <Beat3c_CrossSection progress={progress} />
        <Beat3d_Deuleoyeolgae progress={progress} />
        <Beat4_Assembly progress={progress} />
        <Beat5_Silence progress={progress} />
        <Beat6_Invite progress={progress} />
      </div>
    </main>
  );
}
