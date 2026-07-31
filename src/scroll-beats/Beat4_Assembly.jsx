'use client';

/*
  eslint-disable react-hooks/immutability --
  R3F는 씬 그래프를 명령형으로 다룬다. useFrame이 mesh·material을 직접 쓰는 것이
  이 라이브러리의 정상 패턴이고, 여기서 만지는 것은 이 컴포넌트가 clone한 자기 사본이다.
*/

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';

// 읽기 전용 아카이브의 단계 정의. 실제 경로는 .../data/hanok.data
// (브리프 경로에서 /data/ 세그먼트가 빠져 있었다). hanok.data.ts는 수정하지 않는다.
import { STAGES } from '@/archive/hanok-viewer/data/hanok.data';
import { MODEL_URL, BEAT_RANGES } from '@/scroll-core/constants';
import { clamp01, easeOut as easeOutCubic } from './BeatFrame';

const FONT = "'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif";
const EASE = [0.22, 1, 0.36, 1];

const smoothstep = (edge0, edge1, x) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

// ─────────────────────────────────────────
// 구간 — 전역 progress 0.45 ~ 0.70
// ─────────────────────────────────────────

export const RANGE = BEAT_RANGES.BEAT4;

const [RANGE_START, RANGE_END] = RANGE;

/** localProgress(0~1)를 7단계에 나눠 담는 창. 앞 0.06 진입, 뒤 0.06 완성 여운. */
const STAGE_WINDOWS = [
  [0.06, 0.19], // 01 기단
  [0.19, 0.32], // 02 댓돌
  [0.32, 0.45], // 03 초석과 기둥
  [0.45, 0.58], // 04 마루
  [0.58, 0.71], // 05 벽
  [0.71, 0.84], // 06 창호
  [0.84, 0.94], // 07 기와
];

const RESULT_AT = 0.94;

/** 진행 중이거나 방금 끝난 단계. 진입 구간에서는 -1. */
const activeStageOf = (local) => {
  let index = -1;
  for (let i = 0; i < STAGE_WINDOWS.length; i += 1) {
    if (local >= STAGE_WINDOWS[i][0]) index = i;
  }
  return index;
};

const statusOf = (local, i) => {
  const [start, end] = STAGE_WINDOWS[i];
  if (local >= end) return 'done';
  if (local >= start) return 'current';
  return 'wait';
};

// ─────────────────────────────────────────
// 3D — 아카이브 조립 로직 이식
// ─────────────────────────────────────────

/**
 * 조립할 한옥 한 벌.
 *
 * useGLTF가 돌려주는 scene은 캐시된 한 덩어리다. HanokModel(상시 마운트)과 Beat5도
 * 같은 것을 쥐고 있어서, 여기서 직접 mesh.material을 갈아끼우면 서로의 재질을 덮어쓴다.
 * 실제로 그 탓에 부재가 visible=true 인 채 opacity 0 에 묶여 화면에서 통째로 사라졌다.
 *
 * 그래서 자기 사본 위에서만 작업한다. clone(true)는 노드 계층만 복제하고
 * geometry·material은 참조로 공유하므로 부재 107개라도 비용이 거의 없다.
 * 남의 것을 만지지 않으니 언마운트 때 되돌릴 것도 없다.
 */
function AssemblyModel({ localRef }) {
  const { scene } = useGLTF(MODEL_URL);

  const { parts, offset, root } = useMemo(() => {
    const cloned = scene.clone(true);

    const meshes = [];
    cloned.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      meshes.push(object);
    });

    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const yMin = box.min.y;
    const ySpan = Math.max(0.001, box.max.y - yMin);

    const built = meshes.map((mesh) => {
      const name = `${mesh.name} ${mesh.parent?.name ?? ''}`.toLowerCase();

      let stage = STAGES.findIndex((s) =>
        s.meshKeywords.some((keyword) => name.includes(keyword.toLowerCase())),
      );

      if (stage === -1) {
        const meshCenter = new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3());
        const bucket = Math.floor(((meshCenter.y - yMin) / ySpan) * STAGES.length);
        stage = Math.min(STAGES.length - 1, Math.max(0, bucket));
      }

      /*
        재질도 제 것으로 복제한다.
        clone(true)가 재질을 참조로 공유하므로, 이걸 빼먹으면 opacity 애니메이션이
        원본 재질에 그대로 새어 나가 다른 Beat의 한옥까지 함께 지워진다.
      */
      const isRoof = stage === STAGES.length - 1; // 기와 단계
      const materials = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map(
        (source) => {
          const material = source.clone();
          material.transparent = true;
          material.opacity = 0;

          // 기와는 구운 점토라 은은한 광택이 있다. 거칠기를 낮춰
          // 어두운 배경에서도 주광이 능선을 훑고 지나가게 한다.
          if (isRoof && material.isMeshStandardMaterial) {
            material.roughness = Math.min(material.roughness, 0.42);
          }
          return material;
        },
      );
      mesh.material = materials.length === 1 ? materials[0] : materials;
      mesh.visible = false;

      return {
        mesh,
        materials,
        origin: mesh.position.clone(),
        from: new THREE.Vector3(...STAGES[stage].from),
        stage,
      };
    });

    return { parts: built, offset: [-center.x, -yMin, -center.z], root: cloned };
  }, [scene]);

  /*
    매 프레임 107개를 전부 다시 계산한다.

    "정착한 부재는 건너뛴다"는 최적화가 있었지만, 부재마다 상태 플래그를 들고
    되감기까지 챙겨야 해서 계산량보다 그 관리가 더 비쌌다. 곱셈 몇 번이 전부다.
  */
  useFrame(() => {
    const local = localRef.current;

    for (const part of parts) {
      const [start, end] = STAGE_WINDOWS[part.stage];

      const t = clamp01((local - start) / (end - start));
      const e = easeOutCubic(t);

      part.mesh.position.set(
        part.origin.x + part.from.x * (1 - e),
        part.origin.y + part.from.y * (1 - e),
        part.origin.z + part.from.z * (1 - e),
      );

      const opacity = smoothstep(0, 0.4, t);
      const visible = opacity > 0.004;
      part.mesh.visible = visible;

      if (visible) {
        const opaque = opacity > 0.995;
        for (const material of part.materials) {
          material.opacity = opacity;

          // transparent를 바꾸면 셰이더를 다시 짜야 한다. 바뀔 때만 알린다.
          if (material.transparent === opaque) {
            material.transparent = !opaque;
            material.needsUpdate = true;
          }
        }
      }
    }
  });

  return (
    <group position={offset}>
      <primitive object={root} />
    </group>
  );
}

/**
 * 카메라를 모델 치수와 화면 비율에서 역산한다.
 *
 * 상수 좌표는 넓은 창에서 잡아둔 값이라, 캔버스가 세로로 길어지면(모바일에서는
 * 3D가 위 60%만 차지한다) 한옥이 프레임 밖으로 밀려 화면이 텅 빈다.
 * 방향만 원래 값에서 그대로 가져오고 거리는 매번 푼다.
 */
const VIEW_DIR = [-11, 6, 14]; // 타깃 → 카메라. 원래 상수 좌표가 보던 방향 그대로.
const FOV = 45;

/*
  부재가 STAGES[].from 만큼 떨어진 자리에서 날아오므로 완성 크기보다 넉넉히 잡는다.
  꽉 채우면 조립 중 부재가 프레임 밖에서 나타난다.
*/
const FILL_H = 0.72;
const FILL_V = 0.6;

const LOOK_Y = 0.45; // 시선이 닿는 높이 (모델 높이 배수)

const toRad = (deg) => (deg * Math.PI) / 180;

function AssemblyCamera() {
  const { scene } = useGLTF(MODEL_URL);
  const size = useThree((s) => s.size);

  const extent = useMemo(
    () => new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3()),
    [scene],
  );

  const view = useMemo(() => {
    const aspect = Math.max(size.width / size.height, 0.1);
    const radius = Math.hypot(extent.x, extent.z) / 2;

    const halfV = Math.max(extent.y / (2 * FILL_V), radius / (FILL_H * aspect));
    const distance = halfV / Math.tan(toRad(FOV) / 2);

    const targetY = extent.y * LOOK_Y;
    const length = Math.hypot(...VIEW_DIR);
    const position = VIEW_DIR.map((v) => (v / length) * distance);
    position[1] += targetY;

    /*
      회전을 여기서 뽑아 prop으로 넘긴다. 효과에서 lookAt을 부르면 R3F가 position을
      적용하는 시점과 엇갈려 회전이 씹힌다. 더미는 반드시 카메라여야 한다 —
      평범한 Object3D는 eye/target을 뒤집어 맞춰 카메라가 반대편을 본다.
    */
    const dummy = new THREE.PerspectiveCamera();
    dummy.position.set(...position);
    dummy.lookAt(0, targetY, 0);

    return {
      position,
      rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z],
      // GLB 단위를 모르므로 near·far도 거리에서 뽑는다
      near: Math.max(0.01, distance / 200),
      far: distance * 6,
    };
  }, [extent, size.width, size.height]);

  return (
    <PerspectiveCamera
      makeDefault
      position={view.position}
      rotation={view.rotation}
      fov={FOV}
      near={view.near}
      far={view.far}
    />
  );
}

function Scene({ localRef }) {
  return (
    <>
      {/*
        useGLTF를 부르므로 반드시 Suspense 안에 있어야 한다.
        밖에 두면 모델을 기다리는 동안 Canvas 전체가 suspend되어 DOM에서 통째로 빠진다.
      */}
      <Suspense fallback={null}>
        <AssemblyCamera />
      </Suspense>

      {/*
        환경광.

        전에는 22MB HDRI가 이 자리를 맡았지만 배경으로 쓰지 않고 빛만 뽑아 쓰는 터라
        화면에 남는 차이가 거의 없었다. 단색으로 바꿔 첫 로딩에서 그 무게를 덜어냈다.
      */}
      <ambientLight intensity={1.6} color="#EAE2D4" />

      {/*
        주광 — 그림자 담당. 카메라(-x, +z)와 같은 쪽에 둬 카메라가 보는 면이 밝게 서도록.
        (원래 +x 쪽이라 카메라가 그늘진 뒷면을 봐서 한옥이 통째로 어두웠다.)
        어두운 배경이라 성능 위해 그림자 맵은 1024로.
      */}
      <directionalLight
        position={[-9, 16, 14]}
        intensity={3.4}
        color="#FFF4DC"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0005}
      />

      {/* 림라이트 — 후면에서 윤곽을 살려 어두운 배경에서 한옥이 떠오르게 한다. */}
      <directionalLight position={[-6, 8, -10]} intensity={1.6} color="#F5A623" />

      {/* 그림자만 받는 투명 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial opacity={0.5} />
      </mesh>

      <Suspense fallback={null}>
        <AssemblyModel localRef={localRef} />
      </Suspense>
    </>
  );
}

// ─────────────────────────────────────────
// 스타일
// ─────────────────────────────────────────

const Stage = styled.section`
  position: fixed;
  inset: 0;
  z-index: 5;
  display: flex;
  pointer-events: none;
  font-family: ${FONT};
  /* 배경은 GlobalBackground가 전담한다 (Canvas는 alpha:true 라 그대로 비친다). */

  @media (max-width: 768px) {
    flex-direction: column-reverse; /* 위 3D, 아래 텍스트 */
  }
`;

const Left = styled.div`
  flex: 0 0 40%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 6vw;
  padding-right: 24px;

  @media (max-width: 768px) {
    flex: 0 0 40%;
    padding: 0 20px 36px;
    justify-content: flex-end;
  }
`;

const Right = styled.div`
  flex: 0 0 60%;
  position: relative;

  @media (max-width: 768px) {
    flex: 0 0 60%;
  }
`;

const TextStack = styled.div`
  position: relative;
  min-height: 320px;

  @media (max-width: 768px) {
    min-height: 180px;
  }
`;

const Layer = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
`;

const TitleLine = styled.h2`
  margin: 0;
  display: flex;
  align-items: baseline;
  font-size: clamp(48px, 5.5vw, 76px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.05;
  color: #fafafa;
`;

const StepNumber = styled.span`
  margin-right: 16px;
  color: #fafafa;
`;

const Description = styled(motion.p)`
  margin: 24px 0 0;
  max-width: 480px;
  font-size: clamp(14px, 1.1vw, 17px);
  font-weight: 400;
  line-height: 1.75;
  letter-spacing: -0.015em;
  color: rgba(250, 250, 250, 0.72);
`;

const Result = styled(motion.p)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  margin: 0;
  font-size: clamp(28px, 3.2vw, 44px);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #f5a623;
`;

const Bars = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 40px;
`;

const Bar = styled.span`
  height: 2px;
  border-radius: 1px;
  transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    background-color 0.4s ease-out;

  width: ${(props) => (props.status === 'current' ? '44px' : '28px')};
  background: ${(props) =>
    props.status === 'current'
      ? '#F5A623'
      : props.status === 'done'
        ? 'rgba(250, 250, 250, 0.35)'
        : 'rgba(250, 250, 250, 0.15)'};
`;

// ─────────────────────────────────────────
// Beat4_Assembly
// ─────────────────────────────────────────

export default function Beat4_Assembly({ progress }) {
  const localRef = useRef(0);

  const active = progress >= RANGE_START && progress < RANGE_END;
  const local = active ? (progress - RANGE_START) / (RANGE_END - RANGE_START) : 0;

  // 조립 루프가 읽어갈 진행도. 렌더 중에 ref를 쓰면 React가 막으므로 커밋 뒤에 넘긴다.
  useEffect(() => {
    localRef.current = local;
  }, [local]);

  if (!active) return null;

  const activeIndex = activeStageOf(local);
  const displayIndex = Math.max(0, activeIndex); // 진입 구간에서는 첫 단계 텍스트를 보여둔다
  const stage = STAGES[displayIndex];
  const showResult = local >= RESULT_AT;

  return (
    <Stage aria-label="한옥 7단계 조립 과정">
      <Left>
        <TextStack>
          <AnimatePresence initial={false} mode="popLayout">
            {showResult ? (
              <Result
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                부재 107개. 못 0개.
              </Result>
            ) : (
              <Layer
                key={stage.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <TitleLine>
                  <StepNumber>{String(stage.step).padStart(2, '0')}</StepNumber>
                  {stage.nameKo}
                </TitleLine>

                {/* 설명문은 제목보다 살짝 늦게 (0.08s) 올라온다 */}
                <Description
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE, delay: 0.08 }}
                >
                  {stage.desc}
                </Description>
              </Layer>
            )}
          </AnimatePresence>
        </TextStack>

        <Bars
          role="progressbar"
          aria-label="한옥 7단계 조립 진행 상태"
          aria-valuemin={1}
          aria-valuemax={7}
          aria-valuenow={Math.max(1, activeIndex + 1)}
          aria-valuetext={activeIndex >= 0 ? `${activeIndex + 1}단계 ${STAGES[activeIndex]?.nameKo || ''}` : '조립 준비'}
        >
          {STAGES.map((s, i) => (
            <Bar key={s.id} status={statusOf(local, i)} />
          ))}
        </Bars>
      </Left>
    </Stage>
  );
}

useGLTF.preload(MODEL_URL);
