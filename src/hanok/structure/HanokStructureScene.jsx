'use client';

/*
  한옥도감 구조 섹션의 3D 무대.

  원래는 랜딩(src/temp/landing/LandingExperience.jsx)이 화면 전체를 덮는 고정 Canvas 하나로
  전 구간을 그렸다. 도감은 본문 사이에 끼는 섹션이라, 그 중 절기 그림자와 7단계 조립에
  필요한 만큼만 떼어와 섹션 로컬 진행도(0~1)를 받도록 다시 묶었다.
*/

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import { MODEL_URL, SHADOW_RANGE, ASSEMBLY_RANGE } from './constants';
import { frameCamera, toRad } from './cameraUtils';
import { progressIn, easeInOutCubic } from './motion';
import { sunNow, useSceneStore } from './sceneStore';
import HanokModel from './HanokModel';
import { AssemblyModel } from './HanokAssemblyPanel';

useGLTF.preload(MODEL_URL);

const CAMERA_FOV = 46;

/**
 * 섹션별 구도. p는 섹션 로컬 진행도다.
 *
 * 방위각 90°가 정면(+z), 180°가 좌측면이다. 118°를 가운데 두고 ±25° 안에서만 움직인다 —
 * 더 돌리면 장식 없는 뒷면이 정면으로 온다. dolly는 양수가 뒤로 물러남이다.
 */
const SHOTS = [
  { p: 0.0, azimuthDeg: 104, elevationDeg: 9, dolly: 6 }, // 섹션 진입 — 멀찍이서 떠오른다
  { p: SHADOW_RANGE[0] + 0.04, season: true }, // 그림자 구간 진입
  { p: SHADOW_RANGE[1], season: true }, // 그림자 구간 내내 붙박이. 움직이는 건 그림자뿐이다
  { p: ASSEMBLY_RANGE[0] + 0.04, azimuthDeg: 142, elevationDeg: 20, dolly: 3 }, // 조립 — 3/4 아이소메트릭
  { p: ASSEMBLY_RANGE[1], azimuthDeg: 134, elevationDeg: 14, dolly: -1 }, // 조립 완성 — 눈높이
  { p: 1.0, azimuthDeg: 118, elevationDeg: 12, dolly: 6 }, // 섹션 퇴장 — 다시 멀어진다
];

/**
 * 그림자 구간 전용 구도.
 *
 * 그림자 길이 변화가 이 구간의 전부라, 물러나 내려다보면서 그림자가 뻗을 바닥을 비워둔다.
 * 시선(target)을 왼쪽 지면에 두어 그림자가 뻗는 쪽에 여백이 생긴다.
 *
 * fit은 모델을 감싸는 구가 화면에서 차지하는 비율이다. 1이면 딱 맞고, 낮출수록 물러선다.
 */
const SEASON_VIEWS = [
  { minWidth: 1280, dir: [14, 18, 32], target: [-2, 6.0, 0], fov: 36, fit: 0.84 },
  { minWidth: 768, dir: [14, 19, 38], target: [-2, 5.5, 0], fov: 40, fit: 0.86 },
  { minWidth: 0, dir: [10, 20, 48], target: [-1, 5.0, 0], fov: 46, fit: 0.88 },
];

const lerp = (from, to, t) => from + (to - from) * t;

/**
 * 한옥이 서는 세로 띠 (0 = 바닥, 1 = 천장).
 *
 * 랜딩은 위쪽 30%가 글 자리라 0.12~0.7로 눌러 세웠다. 모달은 글이 놓이는 자리가
 * 화면 폭에 따라 달라서 띠도 갈라진다.
 *   넓은 화면 — 글이 왼쪽. 아래 조작 바와 그 위 그림자만 피하면 된다.
 *   좁은 화면 — 글이 아래 45%(조립 패널의 column-reverse). 한옥은 위로 붙어야 한다.
 */
// frameCamera에서 크기는 widthFill이, 화면상 높이는 base가 정한다
// (targetY = 2 × halfExtent × (0.5 - base) — base가 0.5에 가까울수록 위로 붙는다).
// offsetX는 카메라 조준점만 옆으로 옮긴다 (target.x = -offsetX).
// 음수라야 한옥이 화면 오른쪽으로 간다 — 넓은 화면은 왼쪽 42%가 글 자리라 비켜준다.
const SCREEN_BANDS = [
  // 모달이 최대 폭(1180)에 가까워지면 한옥이 세로에 맞춰져 더는 줄지 않는다.
  // 글 자리(왼쪽 42%)는 그대로 넓어지므로 그만큼 더 비켜준다.
  { minWidth: 1100, base: 0.44, roof: 0.94, widthFill: 0.5, offsetX: -13 },
  { minWidth: 769, base: 0.44, roof: 0.94, widthFill: 0.55, offsetX: -8 },
  { minWidth: 0, base: 0.5, roof: 0.97, widthFill: 0.76, offsetX: 0 },
];

/**
 * SHOTS를 실제 카메라 좌표로 푼다.
 *
 * 모델 치수와 화면 비율이 있어야 풀 수 있으므로 캔버스 안에서 한 번만 계산하고,
 * 매 프레임에는 이미 풀어둔 좌표 사이를 섞기만 한다.
 */
function resolveShots(model, size) {
  const view = SEASON_VIEWS.find((candidate) => size.width >= candidate.minWidth);
  const band = SCREEN_BANDS.find((candidate) => size.width >= candidate.minWidth);

  return SHOTS.map((shot) => {
    if (shot.season) {
      /*
        타깃을 중심으로 모델 전체를 삼키는 구의 반지름.
        모델은 밑면이 원점에 붙어 있으므로 중심은 (0, height/2, 0)이다.
      */
      const center = [0, model.height / 2, 0];
      const gap = Math.hypot(...center.map((v, i) => v - view.target[i]));

      const spread = Math.hypot(model.radius, model.height / 2) + gap;
      const halfTan = Math.tan(toRad(view.fov) / 2);
      const aspect = Math.max(size.width / size.height, 0.1);

      // 세로·가로 중 더 물러나야 하는 쪽이 거리를 정한다.
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
      baseScreenY: band.base,
      roofScreenY: band.roof,
      widthFill: band.widthFill,
      offsetX: band.offsetX,
      azimuthDeg: shot.azimuthDeg,
      elevationDeg: shot.elevationDeg,
      dolly: shot.dolly,
    });

    return { p: shot.p, fov: CAMERA_FOV, ...framed };
  });
}

/** progress를 감싸는 두 자리를 찾아 섞는다. 구간마다 이징이 걸려 장면 끝에서 카메라가 선다. */
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
 */
function FramedCamera({ position, target, fov, near, far }) {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    if (camera && position && target) {
      camera.position.set(...position);
      camera.lookAt(target[0], target[1], target[2]);
      // eslint-disable-next-line react-hooks/immutability
      camera.near = near;
      camera.far = far;
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, position, target, fov, near, far]);

  return <PerspectiveCamera makeDefault position={position} fov={fov} near={near} far={far} />;
}

/**
 * 그림자를 담는 상자.
 *
 * 겨울 볕은 낮게 기울어 그림자가 건물 길이의 몇 배로 뻗는다. 이 범위가 좁으면
 * 그림자가 중간에서 잘려 "계절이 바뀌어도 길이가 그대로"인 것처럼 보인다.
 */
const SHADOW_EXTENT = 45;
const SHADOW_FAR = 120;

/** 평소의 주광 — 그림자 구간 밖에서는 계절과 무관하게 여기 서 있다. */
const KEY_POSITION = [-15, 25, 20];
const KEY_COLOR = '#FFF4DC';

/**
 * 절기 볕.
 *
 * 방위는 고정하고 고도만 절기를 따라 움직인다. 광원이 지면과 이루는 각이 그대로
 * 남중고도이므로 바닥에 지는 그림자 길이가 정확히 (높이 / tan(고도))로 떨어진다 —
 * 하지 75.8°면 0.25배, 동지 29.0°면 1.80배. 화면의 그림자가 곧 데이터다.
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

    // 그림자 구간 밖 — 평소 자리로 돌려놓는다.
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
 * 조명 세기 한 벌.
 *
 * 조립 중에는 부재 하나하나가 따로 서야 해서 주광을 세우고 역광을 올린다.
 */
const REST_LIGHT = { key: 2.5, rim: 1.5, ambient: 1.2 };
const ASSEMBLY_LIGHT = { key: 3.4, rim: 1.6, ambient: 1.6 };

/**
 * 정규화된 높이 10 위에 얹는 여유 배율. 랜딩의 튜너 기본값을 그대로 물려받았고,
 * 조립 모달의 카메라 거리(MODAL_FIT)가 이 값을 전제로 맞춰져 있다.
 */
const MODEL_SCALE = 1.35;

/** 0.42 — 더 진하면 무겁고, 더 옅으면 계절에 따른 길이 변화가 눈에 안 들어온다 */
const SHADOW_OPACITY = 0.42;
const SHADOW_COLOR = '#3A2E1F';

/**
 * 한옥 장면 한 벌. 구도를 잡으려면 모델 치수가 필요해서
 * 캔버스 안에서 bounding box를 한 번 재고 카메라·조명을 함께 배치한다.
 */
export default function HanokStructureScene({ progress }) {
  const { scene } = useGLTF(MODEL_URL);
  const size = useThree((s) => s.size);

  const assembling = useSceneStore((s) => s.assembling);

  // 주광은 SunDriver가 매 프레임 직접 겨눈다. 여기서는 자리만 잡아준다.
  const keyLight = useRef(null);

  const model = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const extent = new THREE.Vector3();
    box.getSize(extent);

    // 모델의 원본 높이가 극단적이어도 화면에 알맞도록 10단위로 스케일 정규화
    const rawHeight = Math.max(extent.y, 0.001);
    const normalizedScale = 10 / rawHeight;

    /*
      치수는 화면에 실제로 서는 크기여야 한다.

      그룹이 normalizedScale × MODEL_SCALE로 렌더되는데 여기서 정규화 높이만 넘기면,
      구도 역산은 실물보다 35% 작은 한옥을 기준으로 카메라를 세운다 — 그래서 한옥이
      프레임 아래로 밀리고 잘렸다. 배율을 치수에 함께 반영한다.
    */
    const worldScale = normalizedScale * MODEL_SCALE;

    return {
      height: 10 * MODEL_SCALE,
      radius: (Math.hypot(extent.x, extent.z) / 2) * worldScale,
      footprint: Math.max(extent.x, extent.z) * worldScale,
      normalizedScale,
    };
  }, [scene]);

  // 모델 치수와 화면 비율이 바뀔 때만 다시 푼다. 스크롤 중에는 섞기만 한다.
  const shots = useMemo(() => resolveShots(model, size), [model, size]);
  const view = cameraAt(shots, progress);

  const light = assembling ? ASSEMBLY_LIGHT : REST_LIGHT;

  return (
    <>
      <FramedCamera
        position={view.position}
        target={view.target}
        fov={view.fov}
        near={view.near}
        far={view.far}
      />

      <ambientLight intensity={light.ambient} color="#FFFDF7" />

      <hemisphereLight skyColor="#FFF9EE" groundColor="#E8DFD0" intensity={0.4} />

      <SunDriver lightRef={keyLight} />

      <directionalLight
        ref={keyLight}
        position={KEY_POSITION}
        intensity={light.key}
        color={KEY_COLOR}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
        shadow-radius={4}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-SHADOW_EXTENT, SHADOW_EXTENT, SHADOW_EXTENT, -SHADOW_EXTENT, 0.5, SHADOW_FAR]}
        />
      </directionalLight>

      <directionalLight position={[15, 20, -15]} intensity={light.rim} color="#FFCC77" />

      {/*
        모델은 원점에 세운다. 랜딩에는 개발용 튜너(devTuner)가 밀어놓은 z 오프셋이
        있었지만, 구도 역산(resolveShots)은 모델이 원점에 있다는 전제라 그대로 두면
        절기 구도에서 한옥이 프레임 밖으로 나간다.
      */}
      <group>
        <group scale={model.normalizedScale * MODEL_SCALE}>
          {assembling ? <AssemblyModel /> : <HanokModel />}
        </group>

        {/* 그림자를 받는 바닥 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[120, 120]} />
          <shadowMaterial opacity={SHADOW_OPACITY} transparent />
        </mesh>

        <ContactShadows
          position={[0, 0, 0]}
          opacity={SHADOW_OPACITY * 0.6}
          scale={model.footprint * 2.5}
          blur={2.0}
          far={model.height * 2}
          resolution={1024}
          color={SHADOW_COLOR}
        />
      </group>
    </>
  );
}
