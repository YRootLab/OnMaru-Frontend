'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import Lenis from 'lenis';

import { surface } from '@/design-system/tokens';
import { MODEL_URL, SCROLL_HEIGHT } from '@/scroll-core/constants';
import { frameCamera, toRad } from '@/scroll-core/cameraUtils';

import HanokModel from '@/components/HanokModel';
import GlobalBackground from '@/scroll-core/GlobalBackground';
import { sunNow, useSceneStore } from '@/scroll-core/sceneStore';
import { progressIn } from '@/scroll-beats/BeatFrame';
import Beat1_Intro from '@/scroll-beats/Beat1_Intro';
import Beat3_Season from '@/scroll-beats/Beat3_Season';
import Beat4_Assembly, { AssemblyModel } from '@/scroll-beats/Beat4_Assembly';
import Beat5_Silence from '@/scroll-beats/Beat5_Silence';
import Beat6_Invite from '@/scroll-beats/Beat6_Invite';

/**
 * 전체 스크롤 길이. 9개 Beat이 나눠 쓴다.
 *
 * 읽는 속도를 정하는 유일한 손잡이다. 실제로 굴러가는 거리는 여기서 화면 한 장을 뺀 값이고,
 * 각 Beat이 갖는 거리는 (자기 구간 폭 × 그 값)이다.
 *
 *   2000vh → 굴림 1900vh → Beat5(0.70~0.82, 폭 0.12)는 228vh
 *            그 안에서 문장 하나가 머무는 창(local 0.08)은 약 18vh
 *
 * 800vh 시절엔 같은 창이 7vh였다 — 휠 한 틱에 문장이 떠서 지워졌다.
 */
// SCROLL_HEIGHT 상수는 @/scroll-core/constants 에서 제공합니다.

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
 *
 * scroll 이벤트가 아니라 매 프레임 위치를 직접 읽는다.
 * Lenis가 붙으면 html에 overflow: clip 이 걸려 documentElement가 스크롤 컨테이너에서
 * 빠지고, window의 scroll 이벤트가 한 번도 뜨지 않는다 — 위치는 멀쩡히 움직이는데
 * 진행도만 0에 얼어붙어 Beat이 전부 안 뜬다. 위치를 직접 읽으면 누가 스크롤을
 * 굴리든 상관이 없다.
 *
 * 값이 그대로면 React가 리렌더를 건너뛰므로, 멈춰 있을 때 드는 비용은 읽기 한 번이다.
 */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let animId = 0;

    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const next = scrollable > 0 ? window.scrollY / scrollable : 0;
      const clamped = Math.min(1, Math.max(0, next));

      setProgress((prev) => (Math.abs(prev - clamped) > 0.0001 ? clamped : prev));
      animId = requestAnimationFrame(updateProgress);
    };

    animId = requestAnimationFrame(updateProgress);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return progress;
}

/**
 * 관성 스크롤.
 *
 * 휠은 한 틱에 100px씩 뚝뚝 끊어 뛴다. 글자가 한 장씩 떠오르는 연출은 그 사이 프레임이
 * 있어야 파도로 읽히므로, 목표 지점까지 걸어가는 구간을 Lenis에게 맡긴다.
 * (스타일시트는 app/layout.tsx가 이미 불러온다 — 인스턴스만 없었다.)
 *
 * 네이티브 스크롤 위치를 그대로 밀기 때문에 useScrollProgress는 손댈 것이 없다.
 */
function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.4 });

    let frame = requestAnimationFrame(function step(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(step);
    });

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);
}

// ─────────────────────────────────────────
// 고정 캔버스
// ─────────────────────────────────────────

const CAMERA_FOV = 46;

/**
 * 섹션별 구도.
 *
 * 카메라가 스크롤을 따라 한옥 주위를 돈다. 예전에는 방위각·고도가 상수 하나씩이고
 * dolly가 리터럴 0이라 전 구간 같은 자리에 서 있었다 — 한옥이 한 장의 그림처럼 보인 이유다.
 *
 * 방위각 90°가 정면(+z), 180°가 좌측면이다. 원래 잡아둔 118°를 가운데 두고 ±25° 안에서만
 * 움직인다 — 더 돌리면 장식 없는 뒷면이 정면으로 온다.
 * dolly는 양수가 뒤로 물러남이고, 기준 거리가 약 20이라 ±6이면 30% 안쪽의 이동이다.
 */
const SHOTS = [
  { p: 0.0, azimuthDeg: 104, elevationDeg: 9, dolly: 6 }, // Beat1 — 멀찍이서 떠오른다
  { p: 0.12, season: true }, // Beat3 진입 — 아래 SEASON_VIEWS 구도로 붙는다
  { p: 0.38, season: true }, // Beat3 — 구간 내내 붙박이. 움직이는 건 그림자뿐이다
  { p: 0.45, azimuthDeg: 142, elevationDeg: 20, dolly: 3 }, // Beat4 — 비스듬한 3/4 아이솔메트릭 입체 구도
  { p: 0.7, azimuthDeg: 134, elevationDeg: 14, dolly: -1 }, // Beat4 완성 — 눈높이와 입체감의 최적화
  { p: 1.0, azimuthDeg: 118, elevationDeg: 12, dolly: 6 }, // Beat5~ — 다시 멀어진다
];

/**
 * Beat3 전용 구도.
 *
 * 그림자 길이 변화가 이 구간의 전부라, 물러나 내려다보면서 그림자가 뻗을 바닥을 비워둔다.
 * 시선(target)을 왼쪽 지면에 두어 그림자가 뻗는 쪽에 여백이 생긴다.
 *
 * 방향과 화각만 고정하고 거리는 모델에서 푼다.
 * 처음에는 좌표를 그대로 박아뒀는데, 높이만 보고 계산한 값이라 화면에서 오른쪽 날개가
 * 잘려나갔다 — 이 한옥은 ㄱ자로 넓어서 세로가 아니라 가로가 거리를 정한다.
 *
 * fit은 모델을 감싸는 구가 화면에서 차지하는 비율이다. 1이면 딱 맞고, 낮출수록 물러선다.
 * frameCamera를 쓰지 않는 이유는 그쪽이 건물 중간을 겨누는 전제라
 * 지면을 내려다보는 이 구도를 표현하지 못하기 때문이다.
 */
const SEASON_VIEWS = [
  // target Y축을 26.0 / 24.0 / 22.0으로 획기적으로 끌어올려 한옥 3D 피사체와 마당 그림자 전체가 화면 위쪽 상단으로 껑충 떠올라 위치하도록 배치한다.
  { minWidth: 1280, dir: [14, 20, 34], target: [-2, 26.0, 0], fov: 34, fit: 0.86 },
  { minWidth: 768, dir: [14, 21, 38], target: [-2, 24.0, 0], fov: 38, fit: 0.88 },
  { minWidth: 0, dir: [10, 22, 46], target: [-1, 22.0, 0], fov: 44, fit: 0.90 },
];

const lerp = (from, to, t) => from + (to - from) * t;

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

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

/**
 * SHOTS를 실제 카메라 좌표로 푼다.
 *
 * 모델 치수와 화면 비율이 있어야 풀 수 있으므로 캔버스 안에서 한 번만 계산하고,
 * 매 프레임에는 이미 풀어둔 좌표 사이를 섞기만 한다.
 */
function resolveShots(model, size) {
  const view = SEASON_VIEWS.find((candidate) => size.width >= candidate.minWidth);

  return SHOTS.map((shot) => {
    if (shot.season) {
      /*
        타깃을 중심으로 모델 전체를 삼키는 구의 반지름.

        모델은 밑면이 원점에 붙어 있으므로 중심은 (0, height/2, 0)이다.
        타깃을 모델 중심보다 위에 두면 한옥이 화면 아래쪽으로 내려앉아 위가 글자 자리로 비고,
        그만큼 벌어진 거리를 반지름에 더해 두면 날개가 프레임 밖으로 나가지 않는다.
      */
      const center = [0, model.height / 2, 0];
      const gap = Math.hypot(...center.map((v, i) => v - view.target[i]));

      const spread = Math.hypot(model.radius, model.height / 2) + gap;

      const halfTan = Math.tan(toRad(view.fov) / 2);
      const aspect = Math.max(size.width / size.height, 0.1);

      // 세로·가로 중 더 물러나야 하는 쪽이 거리를 정한다 (가로 화면에서는 보통 세로).
      const distance = Math.max(
        spread / Math.sin(Math.atan(halfTan) * view.fit),
        spread / Math.sin(Math.atan(halfTan * aspect) * view.fit),
      );

      const length = Math.hypot(...view.dir);
      const position = view.dir.map((v, i) => view.target[i] + (v / length) * distance);

      return {
        p: shot.p,
        position,
        target: view.target,
        fov: view.fov,
        near: Math.max(0.01, distance / 200),
        far: distance * 6,
      };
    }

    const framed = frameCamera(model, size.width / size.height, {
      fov: CAMERA_FOV,
      baseScreenY: BASE_SCREEN_Y,
      roofScreenY: ROOF_SCREEN_Y,
      widthFill: WIDTH_FILL,
      azimuthDeg: shot.azimuthDeg,
      elevationDeg: shot.elevationDeg,
      dolly: shot.dolly,
    });

    return { p: shot.p, fov: CAMERA_FOV, ...framed };
  });
}

/** progress를 감싸는 두 자리를 찾아 섞는다. 구간마다 이징이 걸려 섹션 끝에서 카메라가 선다. */
function cameraAt(shots, p) {
  let a = shots[0];
  let b = shots[shots.length - 1];

  for (let i = 0; i < shots.length - 1; i += 1) {
    if (p >= shots[i].p && p <= shots[i + 1].p) {
      a = shots[i];
      b = shots[i + 1];
      break;
    }
  }

  const k = easeInOutCubic(progressIn(p, a.p, b.p));

  return {
    position: a.position.map((v, i) => lerp(v, b.position[i], k)),
    target: a.target.map((v, i) => lerp(v, b.target[i], k)),
    fov: lerp(a.fov, b.fov, k),
    near: lerp(a.near, b.near, k),
    far: lerp(a.far, b.far, k),
  };
}

/**
 * 카메라를 구도값에 맞춘다.
 *
 * 위치와 회전을 전부 prop으로 넘긴다. 효과에서 손대면 R3F가 prop을 적용하는
 * 시점과 엇갈려 한 프레임씩 어긋나거나 아예 씹힌다.
 *
 * orbit이 켜져 있으면 손을 떼고 OrbitControls에게 카메라를 넘긴다 — 둘이 같은 카메라를
 * 매 프레임 다투면 화면이 떨린다.
 */
function FramedCamera({ position, target, fov, near, far, orbit }) {
  const camera = useThree((state) => state.camera);

  /*
    R3F는 씬 그래프를 명령형으로 다룬다. useThree가 돌려주는 카메라를 직접 겨누는 것이
    이 라이브러리의 정상 패턴이고, 여기서 만지는 것은 이 Canvas가 소유한 카메라다.
  */
  useEffect(() => {
    if (camera && position && target && !orbit) {
      camera.position.set(...position);
      camera.lookAt(target[0], target[1], target[2]);
      // eslint-disable-next-line react-hooks/immutability
      camera.near = near;
      camera.far = far;
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, position, target, fov, near, far, orbit]);

  return (
    <PerspectiveCamera makeDefault position={position} fov={fov} near={near} far={far} />
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
 * 고정 캔버스가 차오르는 구간 — Beat1이 끝나갈 즈음(0.06~0.12)부터 부드럽게 밝아진다.
 */
const CANVAS_FADE_IN = [0.06, 0.12];

/**
 * 그림자 맵 해상도. 처마선과 문살 격자가 선으로 읽혀야 하므로 높게 잡는다.
 * 낮추면 격자가 뭉개져 그냥 검은 덩어리가 된다.
 */
const SHADOW_MAP = 2048;

/** 그림자 아티팩트(자기 그림자 줄무늬) 방지 */
const SHADOW_BIAS = -0.0004;

/**
 * 그림자를 담는 상자.
 *
 * 겨울 볕은 낮게 기울어 그림자가 건물 길이의 몇 배로 뻗는다. 이 범위가 좁으면
 * 그림자가 중간에서 잘려 "계절이 바뀌어도 길이가 그대로"인 것처럼 보인다.
 */
const SHADOW_EXTENT = 45;
const SHADOW_FAR = 120;

/** 평소의 주광 — Beat3 밖에서는 계절과 무관하게 여기 서 있다. */
const KEY_POSITION = [-15, 25, 20];
const KEY_COLOR = '#FFF4DC';

/**
 * Beat3의 절기 볕.
 *
 * 방위는 고정하고 고도만 절기를 따라 움직인다. 광원이 지면과 이루는 각이 그대로
 * 남중고도이므로 바닥에 지는 그림자 길이가 정확히 (높이 / tan(고도))로 떨어진다 —
 * 하지 75.8°면 0.25배, 동지 29.0°면 1.80배. 화면의 그림자가 곧 데이터다.
 *
 * 방위를 오른쪽 앞(+x, +z)에 둬서 그림자는 왼쪽 뒤로 뻗는다.
 */
const SUN_AZIMUTH = [0.894, 0.447]; // (x, z) 단위벡터
const SUN_DISTANCE = 40;

/* 매 프레임 문자열을 파싱하지 않도록 색은 미리 만들어 둔다. */
const REST_TINT = new THREE.Color(KEY_COLOR);
const SUMMER_TINT = new THREE.Color('#FFF9E8');
const WINTER_TINT = new THREE.Color('#FFD9A8');

function sunPositionAt(altitude) {
  const radians = toRad(altitude);
  const ground = Math.cos(radians) * SUN_DISTANCE;

  return [SUN_AZIMUTH[0] * ground, Math.sin(radians) * SUN_DISTANCE, SUN_AZIMUTH[1] * ground];
}

/**
 * 주광을 매 프레임 sunNow에 맞춘다.
 *
 * 값이 프레임마다 바뀌므로 prop으로 내려보내면 그때마다 React가 다시 그린다.
 * 광원 하나를 직접 겨누는 편이 훨씬 싸고, R3F에서는 이쪽이 정상 패턴이다.
 */
function SunDriver({ lightRef }) {
  useFrame(() => {
    const light = lightRef.current;
    if (!light) return;

    // Beat3 밖 — 평소 자리로 돌려놓는다.
    if (sunNow.altitude === null) {
      light.position.set(...KEY_POSITION);
      light.color.copy(REST_TINT);
      return;
    }

    light.position.set(...sunPositionAt(sunNow.altitude));
    light.color.copy(SUMMER_TINT).lerp(WINTER_TINT, sunNow.value);
  });

  return null;
}

/**
 * 한옥 장면 한 벌. 구도를 잡으려면 모델 치수가 필요해서
 * 캔버스 안에서 bounding box를 한 번 재고 카메라·조명을 함께 배치한다.
 */
function HanokScene({ stage }) {
  const { scene } = useGLTF(MODEL_URL);
  const size = useThree((s) => s.size);

  const assembling = useSceneStore((s) => s.assembling);

  // 주광은 SunDriver가 매 프레임 직접 겨눈다. 여기서는 자리만 잡아준다.
  const keyLight = useRef(null);

  const model = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const extent = new THREE.Vector3();
    box.getSize(extent);

    // 모델의 원본 높이가 극단적이어도 화면에 알맞도록 10단위로 스케일 정규화 기준 산출
    const rawHeight = Math.max(extent.y, 0.001);
    const normalizedScale = 10 / rawHeight;

    return {
      height: 10,
      radius: (Math.hypot(extent.x, extent.z) / 2) * normalizedScale,
      footprint: Math.max(extent.x, extent.z) * normalizedScale,
      normalizedScale,
    };
  }, [scene]);

  // 모델 치수와 화면 비율이 바뀔 때만 다시 푼다. 스크롤 중에는 섞기만 한다.
  const shots = useMemo(() => resolveShots(model, size), [model, size]);
  const view = cameraAt(shots, stage.progress);

  const scale = model.height;
  const footprint = model.footprint;

  return (
    <>
      <FramedCamera
        position={view.position}
        target={view.target}
        fov={view.fov}
        near={view.near}
        far={view.far}
        orbit={stage.orbit}
      />

      {/* 각도를 눈으로 찾을 때만. ?orbit=1 로 켠다 — 켜지는 순간 스크롤 카메라는 손을 뗀다. */}
      {stage.orbit && (
        <>
          <OrbitControls makeDefault enableZoom={false} enablePan={false} target={view.target} />
          <CameraProbe target={view.target} sun={sun.position} />
        </>
      )}

      <ambientLight intensity={stage.ambientIntensity} color="#FFFDF7" />

      <SunDriver lightRef={keyLight} />

      <directionalLight
        ref={keyLight}
        position={KEY_POSITION}
        intensity={stage.keyIntensity}
        color={KEY_COLOR}
        castShadow
        shadow-mapSize-width={SHADOW_MAP}
        shadow-mapSize-height={SHADOW_MAP}
        shadow-bias={SHADOW_BIAS}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[
            -SHADOW_EXTENT,
            SHADOW_EXTENT,
            SHADOW_EXTENT,
            -SHADOW_EXTENT,
            0.5,
            SHADOW_FAR,
          ]}
        />
      </directionalLight>

      <directionalLight
        position={[15, 20, -15]}
        intensity={stage.rimIntensity}
        color="#FFCC77"
      />

      {/*
        Beat4 구간에서는 완성된 한옥이 물러나고 부재 107개가 날아와 쌓인다.
        조립본은 같은 스케일 안에서 자기 사본만 만지므로 서로의 재질을 덮지 않는다.
      */}
      <group scale={model.normalizedScale}>
        {assembling ? <AssemblyModel /> : <HanokModel />}
      </group>

      {/*
        그림자를 받는 바닥.

        이 면이 없으면 주광이 드리운 그림자가 떨어질 자리가 없어, 태양 고도를 아무리
        움직여도 화면에 아무 변화가 없다. 처마가 볕을 어디까지 막는지가 이 연출의 전부다.
        (ContactShadows는 접지 얼룩이라 광원 각도를 따르지 않는다 — 둘 다 필요하다.)
      */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <shadowMaterial opacity={stage.shadowOpacity} transparent />
      </mesh>

      <ContactShadows
        position={[0, 0, 0]}
        opacity={stage.shadowOpacity * 0.6}
        scale={footprint * 2.5}
        blur={2.0}
        far={scale * 2}
        resolution={1024}
        color={stage.shadowColor}
      />
    </>
  );
}

/** Beat5 한옥 퇴장 — 구간 진입 후 로컬 18% 동안 옅어진다. */
const BEAT5_START = 0.7;
const BEAT5_EXIT_END = 0.7216; // 0.70 + (0.82 - 0.70) × 0.18

/**
 * 조명 세기 한 벌.
 *
 * 조립 중에는 부재 하나하나가 따로 서야 해서 주광을 세우고 역광을 올린다.
 * (Beat4가 자기 Canvas에 쓰려고 잡아둔 값 그대로 가져왔다.)
 */
const REST_LIGHT = { key: 2.5, rim: 1.5, ambient: 1.2 };
const ASSEMBLY_LIGHT = { key: 3.4, rim: 1.6, ambient: 1.6 };

/**
 * 고정 무대의 조명값 한 벌.
 *
 * 여기서 내는 값이 곧 화면이다 — 예전에는 소비하는 쪽이 Math.max로 바닥을 깔아둬서
 * 이 함수가 무슨 값을 내든 결과가 같았다. Beat5 퇴장에서 조명이 안 꺼진 것도 그 탓이다.
 */
function getStage(progress, assembling, orbit) {
  // 한옥 등장 — Beat1이 끝나갈 즈음 배경에서 떠오른다.
  const enter = progressIn(progress, CANVAS_FADE_IN[0], CANVAS_FADE_IN[1]);

  const exit = easeInOutCubic(progressIn(progress, BEAT5_START, BEAT5_EXIT_END));

  const light = assembling ? ASSEMBLY_LIGHT : REST_LIGHT;
  const lit = 1 - exit;

  return {
    progress,
    orbit,
    keyIntensity: light.key * lit,
    rimIntensity: light.rim * lit,
    ambientIntensity: light.ambient * lit,
    // 0.42 — 더 진하면 무겁고, 더 옅으면 계절에 따른 길이 변화가 눈에 안 들어온다
    shadowOpacity: 0.42 * lit,
    shadowColor: '#3A2E1F',
    // FixedStage가 읽어 캔버스 레이어 전체 opacity를 조절한다
    canvasOpacity: enter * (1 - exit),
  };
}

// ─────────────────────────────────────────
// 구도를 눈으로 찾는 도구 — ?orbit=1 (개발 빌드에서만)
//
// 각도가 맞았다 싶으면 HUD가 읽어주는 position/target/fov를 SEASON_VIEWS에 옮겨 적고
// 이 블록(useOrbitFlag · CameraHud · cameraReadout)과 OrbitControls를 지운다.
// ─────────────────────────────────────────

/** HUD가 읽어갈 최신 값. 매 프레임 바뀌므로 state가 아니라 상자에 담는다. */
const cameraReadout = { position: [0, 0, 0], target: [0, 0, 0], fov: 0, sun: [0, 0, 0] };

function useOrbitFlag() {
  return useMemo(() => {
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('orbit') === '1';
  }, []);
}

function CameraHud() {
  const solar = useSceneStore((s) => s.sun);
  const [, tick] = useState(0);

  // 200ms마다 한 번만 읽는다. 매 프레임 다시 그리면 HUD가 곧 부하가 된다.
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 200);
    return () => clearInterval(timer);
  }, []);

  const round = (values) => `[${values.map((v) => v.toFixed(1)).join(', ')}]`;

  return (
    <pre
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 99,
        margin: 0,
        padding: '10px 12px',
        borderRadius: 8,
        background: 'rgba(16, 14, 12, 0.82)',
        color: '#F5A623',
        font: '11px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace',
        pointerEvents: 'none',
      }}
    >
      {`position ${round(cameraReadout.position)}
target   ${round(cameraReadout.target)}
fov      ${cameraReadout.fov.toFixed(1)}
고도     ${solar ? `${solar.altitude.toFixed(1)}° · 그림자 ${(1 / Math.tan(toRad(solar.altitude))).toFixed(2)}배` : '—'}
sun      ${round(cameraReadout.sun)}`}
    </pre>
  );
}

/** 캔버스 안에서 현재 카메라를 상자에 옮겨 담는다. */
function CameraProbe({ target, sun }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);

  useFrame(() => {
    cameraReadout.position = camera.position.toArray();
    cameraReadout.target = controls?.target ? controls.target.toArray() : target;
    cameraReadout.fov = camera.fov;
    cameraReadout.sun = sun;
  });

  return null;
}

/** GLB가 오기 전 자리를 지키는 임시 골격. 같은 황금빛으로 서 있는다. */
function Fallback3DWireframe() {
  return (
    <group position={[-0.7, 0.3, 0]}>
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[4.5, 0.45, 3.5]} />
        <meshStandardMaterial color="#D4AF37" wireframe />
      </mesh>

      {[-1.8, 1.8].map((x) =>
        [-1.3, 1.3].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.9, z]}>
            <cylinderGeometry args={[0.13, 0.13, 2.5, 8]} />
            <meshStandardMaterial color="#D4AF37" wireframe />
          </mesh>
        )),
      )}

      <mesh position={[0, 2.6, 0]}>
        <coneGeometry args={[3.6, 1.5, 4]} />
        <meshStandardMaterial color="#C1502E" wireframe />
      </mesh>
    </group>
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
  const assembling = useSceneStore((s) => s.assembling);
  const orbit = useOrbitFlag();

  const stage = getStage(progress, assembling, orbit);
  const canvasOpacity = stage.canvasOpacity;

  return (
    <>
      {/* 배경색 div는 GlobalBackground가 전담하므로 제거했다. */}

      {orbit && <CameraHud />}

      {SHOW_HANOK && canvasOpacity > 0 && (
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
            shadows={{ type: THREE.PCFShadowMap }}
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
  useSmoothScroll();
  const progress = useScrollProgress();

  // main에도 같은 색을 깔아둔다. 고정 캔버스가 가리지 못하는 오버스크롤 구간에서
  // 밝은 body 배경이 비치는 것을 막는다.
  return (
    <main style={{ position: 'relative', width: '100%', background: CANVAS_BASE_COLOR }}>
      {/* 모든 Beat보다 아래(z 0). 색·텍스처·비네트를 전담한다. */}
      <GlobalBackground progress={progress} />

      {/* 스크롤 길이만 만드는 spacer */}
      <div style={{ height: SCROLL_HEIGHT }} />

      <FixedStage progress={progress} />

      {/* 배경(z 0)·한옥(z 1) 위. 텍스트가 무엇에도 가리지 않는다. */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <Beat1_Intro progress={progress} />
        <Beat3_Season progress={progress} />
        <Beat4_Assembly progress={progress} />
        <Beat5_Silence progress={progress} />
        <Beat6_Invite progress={progress} />
      </div>
    </main>
  );
}
