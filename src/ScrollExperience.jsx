'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import { surface } from '@/design-system/tokens';

import HanokModel, { MODEL_URL } from '@/components/HanokModel';
import { progressIn } from '@/scroll-beats/BeatFrame';
import Beat1_Intro from '@/scroll-beats/Beat1_Intro';
import Beat2_Reveal, {
  Fallback3DWireframe,
  getBeat2Scene,
} from '@/scroll-beats/Beat2_Reveal';
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

const CAMERA_FOV = 46;

/**
 * 방위각. 90°가 정면(+z), 180°가 좌측면이다.
 *
 * 정면에서 틀어 측면을 조금 보여준다. 부재가 겹쳐 보이는 각도여야
 * 골격 구간에서 짜임이 선으로 읽힌다.
 */
const VIEW_AZIMUTH_DEG = 118;

/** 눈높이. 올려다보지 않고 거의 수평으로 본다. */
const VIEW_ELEVATION_DEG = 3;

/** 한옥 하단이 놓이는 화면 높이 (0 = 바닥, 1 = 천장) */
const BASE_SCREEN_Y = 0.12;

/**
 * 지붕 끝이 놓이는 화면 높이.
 *
 * 하단 0.12와 함께 한옥이 세로 58%만 차지하게 만든다.
 * 위로 남는 30vh가 텍스트 자리다.
 */
const ROOF_SCREEN_Y = 0.7;

/** 가로로 한옥이 차지하는 최대 비율. 좁은 화면에서 잘리지 않게 물러선다. */
const WIDTH_FILL = 0.82;

const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * 모델 크기에서 카메라 구도를 역산한다.
 *
 * 화면에서 y가 놓이는 높이는  p = 0.5 + 0.5 * (y - targetY) / halfExtent  이다.
 * 하단(y=0)과 지붕(y=height)을 원하는 p에 앉히도록 halfExtent와 targetY를 풀고,
 * 거기서 카메라 거리를 얻는다. 가로가 모자라면 그만큼 더 물러선다.
 *
 * 이렇게 두면 화면 비율이 바뀌어도 한옥이 늘 같은 자리에 선다.
 */
function frameCamera({ height, radius }, aspect, dolly) {
  const forHeight = (0.5 * height) / (ROOF_SCREEN_Y - BASE_SCREEN_Y);
  const forWidth = radius / (WIDTH_FILL * Math.max(aspect, 0.1));
  const halfExtent = Math.max(forHeight, forWidth);

  const targetY = 2 * halfExtent * (0.5 - BASE_SCREEN_Y);
  const distance = Math.max(halfExtent / Math.tan(toRad(CAMERA_FOV) / 2) + dolly, 1);

  const azimuth = toRad(VIEW_AZIMUTH_DEG);
  const elevation = toRad(VIEW_ELEVATION_DEG);
  const ground = distance * Math.cos(elevation);

  // 타깃의 x·z가 0이라 한옥이 화면 가로 중앙에 선다
  const target = [0, targetY, 0];
  const position = [
    Math.cos(azimuth) * ground,
    targetY - distance * Math.sin(elevation),
    Math.sin(azimuth) * ground,
  ];

  /*
    회전까지 여기서 뽑아 카메라에 prop으로 넘긴다.

    효과에서 lookAt을 부르면 R3F가 position prop을 적용하는 시점과 엇갈려
    회전이 씹힌다. 더미로 한 번 바라보게 해서 오일러각을 얻으면
    위치와 회전이 같은 렌더에서 함께 적용된다.
  */
  const dummy = new THREE.Object3D();
  dummy.position.set(...position);
  dummy.lookAt(...target);

  return {
    target,
    position,
    rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z],

    /*
      near·far도 거리에서 뽑는다.

      GLB의 단위가 무엇인지는 알 수 없다. 미터가 아니라 센티미터로 나온 모델이면
      카메라가 수백 단위 밖에 서게 되고, far를 상수로 박아두면 장면 전체가
      잘려 캔버스가 텅 빈다.
    */
    near: Math.max(0.01, distance / 200),
    far: distance * 6,
  };
}

/**
 * 카메라를 구도값에 맞춘다.
 *
 * 위치와 회전을 전부 prop으로 넘긴다. 효과에서 손대면 R3F가 prop을 적용하는
 * 시점과 엇갈려 한 프레임씩 어긋나거나 아예 씹힌다.
 */
function FramedCamera({ position, rotation, near, far }) {
  return (
    <PerspectiveCamera
      makeDefault
      position={position}
      rotation={rotation}
      fov={CAMERA_FOV}
      near={near}
      far={far}
    />
  );
}

/**
 * 3D 한옥 표시 여부.
 *
 * false면 캔버스를 아예 올리지 않아 WebGL 컨텍스트도 뜨지 않고 배경 단색만 남는다.
 * 텍스트 연출만 손볼 때 꺼두면 모델이 시선을 끌지 않는다.
 */
const SHOW_HANOK = true;

/**
 * 캔버스가 차오르는 구간. Beat1의 영상이 걷히는 창과 같은 자리다.
 * 두 값을 맞춰야 영상이 사라지는 만큼 캔버스가 차오르는 교차 페이드가 된다.
 *
 * 이 창이 닫힌 뒤 골격이 선으로 그려진다 (Beat2가 그 곡선을 갖는다).
 */
const CANVAS_FADE_IN = [0.065, 0.08];

/** 역광 위치. 모델 높이의 배수라 크기가 달라져도 각도가 유지된다. */
const RIM_DIR = [1.15, 1.6, -1.3]; // 후면 상단 — 지붕 윤곽만 떠올리는 역광

/**
 * 그림자 맵 해상도. 처마선과 문살 격자가 선으로 읽혀야 하므로 높게 잡는다.
 * 낮추면 격자가 뭉개져 그냥 검은 덩어리가 된다.
 */
const SHADOW_MAP = 2048;

/** 그림자 아티팩트(자기 그림자 줄무늬) 방지 */
const SHADOW_BIAS = -0.0005;

/**
 * 한옥 장면 한 벌. 구도를 잡으려면 모델 치수가 필요해서
 * 캔버스 안에서 bounding box를 한 번 재고 카메라·조명을 함께 배치한다.
 */
function HanokScene({ stage }) {
  const { scene } = useGLTF(MODEL_URL);
  const size = useThree((s) => s.size);
  const three = useThree();
  useEffect(() => { window.__r3f = three; console.log('[dbg] HanokScene mounted'); }, [three]);
  console.log('[dbg] HanokScene render');

  const model = useMemo(() => {
    const extent = new THREE.Vector3();
    new THREE.Box3().setFromObject(scene).getSize(extent);

    return {
      height: extent.y,
      // 어느 방위에서 봐도 안 잘리도록 가로 반지름은 대각선으로 잡는다
      radius: Math.hypot(extent.x, extent.z) / 2,
      // 지면에 닿는 넓이. 그림자 평면 크기의 기준이 된다.
      footprint: Math.max(extent.x, extent.z),
    };
  }, [scene]);

  const view = useMemo(
    () => frameCamera(model, size.width / size.height, stage.cameraDolly),
    [model, size.width, size.height, stage.cameraDolly],
  );

  const scale = model.height;
  const footprint = model.footprint;

  return (
    <>
      <FramedCamera
        position={view.position}
        rotation={view.rotation}
        near={view.near}
        far={view.far}
      />

      <ambientLight intensity={stage.ambientIntensity} />

      {/*
        주광. 이 빛 하나가 그림자를 만든다.

        그림자 카메라는 직교라 기본 ±5로는 한옥이 프러스텀을 넘어 그림자가 잘린다.
        발자국 기준으로 넉넉히 벌려야 처마 끝까지 벽에 맺힌다.
      */}
      <directionalLight
        position={stage.keyPosition.map((v) => v * scale)}
        intensity={stage.keyIntensity}
        color={stage.keyColor}
        castShadow
        shadow-mapSize-width={SHADOW_MAP}
        shadow-mapSize-height={SHADOW_MAP}
        shadow-bias={SHADOW_BIAS}
      >
        {/*
          그림자 카메라를 자식으로 붙여 args로 만든다.

          shadow-camera-left 같은 prop으로 주면 값은 들어가지만
          updateProjectionMatrix가 불리지 않아 직교 프러스텀이 기본 ±5에 머문다.
          모델이 그보다 크면 그림자가 조용히 프레임을 빗나간다.
        */}
        <orthographicCamera
          attach="shadow-camera"
          args={[
            -footprint * 1.6,
            footprint * 1.6,
            footprint * 1.6,
            -footprint * 1.6,
            0.5,
            scale * 20,
          ]}
        />
      </directionalLight>

      <directionalLight
        position={RIM_DIR.map((v) => v * scale)}
        intensity={stage.rimIntensity}
        color={stage.rimColor}
      />

      <HanokModel wireframe={stage.wireframe} />

      {/*
        접지 그림자. 이게 없이는 한옥이 배경 위에 떠 있는 것처럼 보인다.

        HanokModel이 바닥을 y=0에 맞추므로 평면도 정확히 0에 둔다.
        scale은 발자국의 약 두 배까지만 준다. 넓게 벌리면 같은 그림자가
        큰 텍스처에 옅게 퍼져 화면에서 사라진다.
        far는 모델 높이를 덮어야 지붕까지 깊이에 잡힌다.

        골격 구간에서는 stage가 0을 넘긴다 — 먹빛 배경 위 선에는 접지가 없다.
      */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={stage.shadowOpacity}
        scale={footprint * 2}
        blur={2.2}
        far={scale * 1.2}
        resolution={1024}
        color={stage.shadowColor}
      />
    </>
  );
}

/**
 * 화면 전체를 덮는 고정 무대. 배경과 한옥을 따로 깔고 그 위에 Beat 텍스트가 온다.
 *
 *   z 0 — 배경색
 *   z 1 — 한옥
 *   z 2 — Beat 텍스트 (ScrollExperience가 그린다)
 *
 * 배경색은 캔버스가 아니라 아래 div가 갖는다.
 * Canvas는 alpha: true로 투명하게 두고 scene.background도 비운다.
 *
 * 조명·카메라·배경값은 Beat이 넘긴 것을 적용하기만 한다.
 * 어느 구간에서 무엇이 어떻게 변하는지는 각 Beat 파일이 갖는다.
 */
function FixedStage({ progress }) {
  const stage = getBeat2Scene(progress);

  /*
    캔버스 레이어의 투명도는 Beat1 영상이 걷히는 만큼만 차오른다.

    골격이 그려지는 연출은 레이어가 아니라 재질이 맡는다 (stage.wireframe.drawn).
  */
  const canvasOpacity = progressIn(progress, ...CANVAS_FADE_IN);

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: stage.background,
        }}
      />

      {SHOW_HANOK && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
            opacity: canvasOpacity,
          }}
        >
          <Canvas
            dpr={[1, 2]}
            /* 그림자 맵이 이 연출의 전부다. 이 플래그 없이는 벽이 비어 있다. */
            shadows
            gl={{ alpha: true, antialias: true }}
            style={{ position: 'absolute', inset: 0, background: 'transparent' }}
          >
            {/*
              GLB가 오기 전에는 박스로 짠 임시 골격이 같은 황금빛으로 서 있는다.
              구도 역산에 모델 치수가 필요해 카메라도 함께 매달려 있으므로
              폴백은 R3F 기본 카메라 아래서 그려진다.
            */}
            <Suspense fallback={<Fallback3DWireframe />}>
              <HanokScene stage={stage} />
            </Suspense>
          </Canvas>
        </div>
      )}
    </>
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

      <FixedStage progress={progress} />

      {/* 배경(z 0)·한옥(z 1) 위. 텍스트가 무엇에도 가리지 않는다. */}
      <div style={{ position: 'relative', zIndex: 2 }}>
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
