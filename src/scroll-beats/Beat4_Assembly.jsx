'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';

// 읽기 전용 아카이브의 단계 정의. 실제 경로는 .../data/hanok.data
// (브리프 경로에서 /data/ 세그먼트가 빠져 있었다). hanok.data.ts는 수정하지 않는다.
import { STAGES } from '@/archive/hanok-viewer/data/hanok.data';
import { clamp01, easeOut as easeOutCubic } from './BeatFrame';

const MODEL_URL = '/anchae.glb';

const FONT = "'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif";
const EASE = [0.22, 1, 0.36, 1];

const IS_DEV = process.env.NODE_ENV === 'development';

const lerp = (from, to, t) => from + (to - from) * t;

const smoothstep = (edge0, edge1, x) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

// ─────────────────────────────────────────
// 구간 — 전역 progress 0.45 ~ 0.70 (Beat1~3과 같은 props 방식)
// ─────────────────────────────────────────

export const RANGE = [0.45, 0.7];

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
 * 성능: scene.clone(true)를 쓰지 않는다.
 * mesh.material만 clone하고 geometry는 공유한다 (부재 107개 × 지오메트리 복제를 피한다).
 * 공유 scene을 직접 만지므로, 언마운트 때 위치·재질을 원상 복구해 Beat2·3로 되돌아갈 때
 * 부재가 흩어진 채로 남지 않게 한다.
 */
function AssemblyModel({ localRef }) {
  const { scene } = useGLTF(MODEL_URL);

  const { parts, offset } = useMemo(() => {
    const meshes = [];
    scene.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      meshes.push(object);
    });

    const box = new THREE.Box3().setFromObject(scene);
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

      // 재질만 clone. 원본 참조는 백업해 언마운트 때 되돌린다.
      const originalMaterial = mesh.material;
      const isRoof = stage === STAGES.length - 1; // 기와 단계
      const materials = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map(
        (source) => {
          const material = source.clone();
          material.transparent = true;
          material.opacity = 0;
          // 환경맵 반사 세기 — 이게 없으면 검은 기와가 배경에 묻혀 안 보인다.
          material.envMapIntensity = 0.9;
          // 기와는 구운 점토라 은은한 광택이 있다. 반사를 살려 어두운 배경에서 능선을 드러낸다.
          if (isRoof && material.isMeshStandardMaterial) {
            material.roughness = Math.min(material.roughness, 0.42);
            material.envMapIntensity = 1.8;
          }
          return material;
        },
      );
      mesh.material = materials.length === 1 ? materials[0] : materials;
      mesh.visible = false;

      return {
        mesh,
        materials,
        originalMaterial,
        origin: mesh.position.clone(),
        from: new THREE.Vector3(...STAGES[stage].from),
        stage,
        settled: false,
      };
    });

    return { parts: built, offset: [-center.x, -yMin, -center.z] };
  }, [scene]);

  // 언마운트 시 공유 scene을 조립 완료(제자리·원본 재질) 상태로 복구한다.
  useEffect(
    () => () => {
      parts.forEach((part) => {
        part.mesh.position.copy(part.origin);
        part.mesh.material = part.originalMaterial;
        part.mesh.visible = true;
        part.materials.forEach((m) => m.dispose());
      });
    },
    [parts],
  );

  useFrame(() => {
    const local = localRef.current;

    for (const part of parts) {
      const [start, end] = STAGE_WINDOWS[part.stage];

      // 이미 정착한 부재는 계산을 건너뛴다. 되감아 창 안으로 들어오면 다시 계산한다.
      if (part.settled) {
        if (local >= end) continue;
        part.settled = false;
      }

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
          material.transparent = !opaque;
        }
        if (t >= 1) part.settled = true; // 정착: 다음 프레임부터 스킵
      }
    }
  });

  return (
    <group position={offset}>
      <primitive object={scene} />
    </group>
  );
}

/** 개발 중에만 켤 수 있는 카메라 탐색기. 켜면 OrbitControls로 돌리며 좌표를 콘솔에 찍는다. */
function DevCamera({ enabled }) {
  if (!enabled) return null;
  return (
    <OrbitControls
      makeDefault
      target={[0, 4, 0]}
      onChange={(event) => {
        const cam = event?.target?.object;
        if (!cam) return;
        console.log(
          '[Beat4 cam] position',
          cam.position.toArray().map((n) => +n.toFixed(2)),
        );
      }}
    />
  );
}

function Scene({ localRef, devCam }) {
  // QA 임시 프로브 — 확인 끝나면 제거
  const three = useThree();
  useEffect(() => { window.__b4 = three; }, [three]);

  return (
    <>
      {/*
        빛만 담당하는 HDRI (background 없음 → 다크 radial 배경은 그대로).
        검은 기와가 반사로 살아나게 하는 게 핵심 — 재질의 envMapIntensity가 이걸 받는다.
      */}
      <Suspense fallback={null}>
        <Environment files="/hdri/sunset_meadow_path_4k.exr" environmentIntensity={1.2} />
      </Suspense>

      <ambientLight intensity={1.4} />

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

      <DevCamera enabled={devCam} />
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

const DevButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 30;
  pointer-events: auto;
  padding: 6px 12px;
  border: 1px solid rgba(250, 250, 250, 0.3);
  border-radius: 6px;
  background: ${(props) => (props.active ? '#F5A623' : 'rgba(0,0,0,0.4)')};
  color: ${(props) => (props.active ? '#131211' : 'rgba(250,250,250,0.7)')};
  font-family: ${FONT};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  cursor: pointer;
`;

// ─────────────────────────────────────────
// Beat4_Assembly
// ─────────────────────────────────────────

export default function Beat4_Assembly({ progress }) {
  const localRef = useRef(0);
  const [devCam, setDevCam] = useState(false);

  const active = progress >= RANGE_START && progress < RANGE_END;
  const local = active ? (progress - RANGE_START) / (RANGE_END - RANGE_START) : 0;
  localRef.current = local;

  if (!active) return null;

  const activeIndex = activeStageOf(local);
  const displayIndex = Math.max(0, activeIndex); // 진입 구간에서는 첫 단계 텍스트를 보여둔다
  const stage = STAGES[displayIndex];
  const showResult = local >= RESULT_AT;

  return (
    <Stage aria-hidden="true">
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

        <Bars aria-hidden="true">
          {STAGES.map((s, i) => (
            <Bar key={s.id} status={statusOf(local, i)} />
          ))}
        </Bars>
      </Left>

      <Right>
        <Canvas
          shadows
          camera={{ position: [-11, 10, 14], fov: 45 }}
          gl={{ alpha: true, antialias: true }}
          onCreated={({ camera }) => camera.lookAt(0, 3, 0)}
          style={{ position: 'absolute', inset: 0 }}
        >
          <Scene localRef={localRef} devCam={devCam} />
        </Canvas>

        {IS_DEV && (
          <DevButton
            type="button"
            active={devCam}
            onClick={() => setDevCam((v) => !v)}
          >
            DEV CAM {devCam ? 'ON' : 'OFF'}
          </DevButton>
        )}
      </Right>
    </Stage>
  );
}

useGLTF.preload(MODEL_URL);
