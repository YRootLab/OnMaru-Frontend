'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import { lightPalette, meok } from '@/design-system/tokens';
import { easeOut, progressIn, usePrefersReducedMotion } from './BeatFrame';

// ─────────────────────────────────────────
// 구간 (Beat2: 0.09 ~ 0.20)
// ─────────────────────────────────────────

export const RANGE = [0.09, 0.2];

const [RANGE_START, RANGE_END] = RANGE;

export const MODEL_URL = '/anchae.glb';

/**
 * Beat3가 실체로 되돌릴 원본 재질.
 *
 * 골격 재질로 갈아끼우기 직전에 { mesh, material } 로 적어둔다.
 * useEffect로 미루면 이미 갈아끼운 뒤라 황금빛 wireframe이 백업된다 —
 * 백업은 반드시 교체와 같은 자리에서 일어나야 한다.
 */
export const originalMaterialsRef = { current: [] };

// ─────────────────────────────────────────
// 등장 시퀀스 (모두 로컬 진행도 0~1 기준)
// ─────────────────────────────────────────

const APPEAR = [0.15, 0.45]; // 떠오름 — 0.15 이전은 완전한 어둠(Beat1 페이드아웃과 겹치는 침묵)
const GLOW_OUT = [0.85, 1.0]; // 글로우만 걷힌다. 선은 Beat3까지 남는다.
const TILT_FROM = 0.45; // 등장 애니메이션이 끝난 뒤에만 마우스를 받는다

const WIRE_OPACITY = 0.85;
const GLOW_OPACITY = 0.25;
const GLOW_SCALE = 1.003;

const RISE = -0.13; // 아래에서 떠오르는 거리 (모델 높이 배수 — GLB 단위와 무관하게 같아 보인다)
const SCALE_FROM = 0.94;

const TILT_MAX = 0.26; // ±15°
const TILT_LERP = 0.05;

// ─────────────────────────────────────────
// 구도 — bounding box에서 카메라 거리를 역산한다
//
// GLB 단위가 미터인지 센티미터인지 알 수 없어(수백 단위일 수 있다) 카메라 거리를
// 상수로 박으면 한옥이 화면 밖으로 잘리거나 점으로 사라진다.
// 아래 세 비율만 만지면 화면 비율이 바뀌어도 구도가 유지된다.
// ─────────────────────────────────────────

const FOV = 42;
/*
  bbox 기준 채움 비율. 원근 때문에 카메라에 가까운 앞면(툇마루·기단)이 bbox보다 크게
  투영되므로, 값을 낮춰 실제 화면에서 처마·기단이 잘리지 않게 여유를 둔다.
  세로가 짧은 노트북(넓은 종횡비)에서 특히 세로가 binding이라 FILL_V가 프레이밍을 정한다.
*/
const FILL_V = 0.45; // 한옥이 차지하는 화면 세로 비율 — 위아래 여백
const FILL_H = 0.7; // 가로 비율 — 좁은 화면에서 좌우가 잘리지 않게 물러선다
const TOP_MARGIN = 0.31; // 지붕 위 여백 — 한옥을 세로 중앙에 앉힌다(윗글자와 살짝 겹쳐도 됨)

/**
 * 모델 치수와 화면 비율에서 카메라를 푼다.
 *
 * 세로·가로 중 더 많이 물러나야 하는 쪽을 택해 한옥이 어느 방향으로도 잘리지 않게 한다.
 * 화면에서 y가 놓이는 높이는  p = 0.5 + (y - targetY) / (2 * halfV)  이므로,
 * 지붕(y = height)을 p = 1 - TOP_MARGIN 에 앉히도록 targetY를 역산한다.
 */
function frameCamera(height, radius, aspect) {
  const halfV = Math.max(height / (2 * FILL_V), radius / (FILL_H * Math.max(aspect, 0.1)));
  const distance = halfV / Math.tan((FOV * Math.PI) / 360);

  // 카메라가 수평이라 회전이 0이다 — lookAt을 따로 부를 것이 없다.
  const targetY = height - (0.5 - TOP_MARGIN) * 2 * halfV;

  return {
    position: [0, targetY, distance],
    near: Math.max(0.01, distance / 200),
    far: distance * 6,
  };
}

// ─────────────────────────────────────────
// 3D 골격
// ─────────────────────────────────────────

/*
  골격 재질 두 장.

  스크롤이 매 프레임 opacity를 밀어 올리는 값이라 훅이 쥐고 있으면 안 된다
  (렌더 결과를 나중에 고치는 셈이 된다). 한옥은 화면에 하나뿐이므로
  모듈 수준에 한 벌 두고 본체와 글로우 클론이 나눠 쓴다.
*/
const wire = {
  line: new THREE.MeshBasicMaterial({
    color: lightPalette.hwanggeum[400],
    wireframe: true,
    transparent: true,
    opacity: 0,
  }),
  glow: new THREE.MeshBasicMaterial({
    color: lightPalette.hwanggeum[200],
    wireframe: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
};

function Skeleton({ local, pointer, reduced }) {
  const { scene } = useGLTF(MODEL_URL);
  const size = useThree((s) => s.size);
  const groupRef = useRef(null);

  const { root, glow, backup, offset, height, radius } = useMemo(() => {
    const cloned = scene.clone(true);

    /*
      글로우용 껍질 한 겹.
      선 한 겹만 그리면 wireframe이 얇고 죽은 격자로 보인다.
      아주 조금 큰 클론을 가산 합성으로 겹쳐 선 주변을 번지게 한다.
    */
    const shell = cloned.clone(true);
    shell.traverse((o) => {
      if (o.isMesh) o.material = wire.glow;
    });

    const originals = [];
    cloned.traverse((o) => {
      if (!o.isMesh) return;
      originals.push({ mesh: o, material: o.material });
      o.material = wire.line;
    });

    const box = new THREE.Box3().setFromObject(cloned);
    const extent = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    return {
      root: cloned,
      glow: shell,
      backup: originals,
      // 중심을 원점에 맞춰야 마우스 틸팅이 건물 한가운데를 축으로 돈다
      offset: [-center.x, -center.y, -center.z],
      height: extent.y,
      // 어느 각도로 틸팅해도 안 잘리도록 가로 반지름은 대각선으로 잡는다
      radius: Math.hypot(extent.x, extent.z) / 2,
    };
  }, [scene]);

  // GLB 로드 직후 1회. backup은 clone과 함께 만들어지므로 참조가 바뀌지 않는다.
  useEffect(() => {
    originalMaterialsRef.current = backup;
  }, [backup]);

  const view = useMemo(
    () => frameCamera(height, radius, size.width / size.height),
    [height, radius, size.width, size.height],
  );


  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const appear = easeOut(progressIn(local, ...APPEAR));

    wire.line.opacity = WIRE_OPACITY * appear;
    wire.glow.opacity = GLOW_OPACITY * appear * (1 - progressIn(local, ...GLOW_OUT));

    // 중심이 height/2 에 있어야 한옥 밑동이 y=0 에 선다
    group.position.y = height / 2 + height * RISE * (1 - appear);
    group.scale.setScalar(SCALE_FROM + (1 - SCALE_FROM) * appear);

    // 카메라는 고정. 회전은 모델 group만 갖는다.
    const active = !reduced && local >= TILT_FROM;
    const targetY = active ? pointer.current.x * TILT_MAX : 0;
    const targetX = active ? -pointer.current.y * TILT_MAX : 0;

    group.rotation.y += (targetY - group.rotation.y) * TILT_LERP;
    group.rotation.x += (targetX - group.rotation.x) * TILT_LERP;
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={view.position}
        fov={FOV}
        near={view.near}
        far={view.far}
      />

      <group ref={groupRef}>
        <group position={offset}>
          <primitive object={root} />
          <primitive object={glow} scale={GLOW_SCALE} />
        </group>
      </group>
    </>
  );
}

// ─────────────────────────────────────────
// 텍스트
// ─────────────────────────────────────────

const EYEBROW_IN = [0.2, 0.28];
const HEADLINE_IN = [0.25, 0.33];
const HINT_IN = [0.45, 0.55];

const FONT = "'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif";

// ─────────────────────────────────────────
// Beat2_Reveal
// ─────────────────────────────────────────

export default function Beat2_Reveal({ progress }) {
  const reduced = usePrefersReducedMotion();
  const pointer = useRef({ x: 0, y: 0 });

  const inRange = progress >= RANGE_START && progress < RANGE_END;
  const local = inRange ? (progress - RANGE_START) / (RANGE_END - RANGE_START) : 0;

  /*
    캔버스 레이어는 pointer-events가 끊겨 있어 R3F의 포인터가 갱신되지 않는다.
    화면 전체를 기준으로 직접 정규화해서 읽는다 (-1 ~ 1).
  */
  const armed = local >= TILT_FROM;

  useEffect(() => {
    if (reduced || !armed) return undefined;

    const read = (event) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener('pointermove', read, { passive: true });
    return () => window.removeEventListener('pointermove', read);
  }, [reduced, armed]);

  if (!inRange) return null;

  const headline = progressIn(local, ...HEADLINE_IN);
  const hint = progressIn(local, ...HINT_IN);

  return (
    <section style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
      {/* 배경은 GlobalBackground가 전담한다. */}

      {/* z 1 — 골격 (alpha: true 로 전역 배경이 그대로 비친다) */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 1 }}>
        <Canvas
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
          style={{ position: 'absolute', inset: 0, background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <Skeleton local={local} pointer={pointer} reduced={reduced} />
          </Suspense>
        </Canvas>
      </div>

      {/* z 2 — 텍스트. 한옥 와이어프레임 지붕 상단과 겹치지 않도록 여백(Negative space) 확보 */}
      <div
        style={{
          position: 'fixed',
          top: 'clamp(5vh, 6.5vh, 8vh)',
          left: 0,
          right: 0,
          zIndex: 2,
          padding: '0 24px',
          textAlign: 'center',
          fontFamily: FONT,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 'clamp(28px, 4.2vw, 54px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            wordBreak: 'keep-all',
            color: meok[100],
            opacity: headline,
            transform: `translateY(${12 * (1 - headline)}px)`,
          }}
        >
          형태를 지우면, 설계가 남습니다.
        </h2>

        <p
          style={{
            margin: '14px 0 0',
            fontSize: 'clamp(13px, 1.4vw, 15px)',
            fontWeight: 400,
            color: meok[500],
            opacity: hint,
            transition: 'opacity 0.4s ease-out',
          }}
        >
          마우스를 움직여 각도를 바꿔보십시오.
        </p>
      </div>
    </section>
  );
}

useGLTF.preload(MODEL_URL);
