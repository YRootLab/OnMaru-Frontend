'use client';

/*
  eslint-disable react-hooks/immutability --
  R3F는 씬 그래프를 명령형으로 다룬다. useFrame이 mesh·material을 직접 쓰는 것이
  이 라이브러리의 정상 패턴이고, 여기서 만지는 것은 이 컴포넌트가 clone한 자기 사본이다.
*/

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';

// 읽기 전용 아카이브의 단계 정의. 실제 경로는 .../data/hanok.data
// (브리프 경로에서 /data/ 세그먼트가 빠져 있었다). hanok.data.ts는 수정하지 않는다.
import { STAGES } from '@/archive/hanok-viewer/data/hanok.data';
import { MODEL_URL, BEAT_RANGES } from '@/scroll-core/constants';
import { assemblyProgress, useSceneStore } from '@/scroll-core/sceneStore';
import { clamp01, easeOut as easeOutCubic, usePrefersReducedMotion } from './BeatFrame';

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
  [0.01, 0.12], // 01 기단
  [0.12, 0.23], // 02 댓돌
  [0.23, 0.35], // 03 초석과 기둥
  [0.35, 0.47], // 04 마루
  [0.47, 0.59], // 05 벽
  [0.59, 0.71], // 06 창호
  [0.71, 0.83], // 07 기와 (0.83 완공)
];

const RESULT_AT = 0.83;

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
 * ScrollExperience의 HanokScene이 Beat4 구간에서 완성된 한옥 대신 이것을 세운다.
 * 예전에는 이 파일이 자기 Canvas를 들고 있었지만 그 Canvas가 JSX에 놓인 적이 없어
 * 조립이 한 번도 돌지 않았다 — 그래서 텍스트만 넘어가고 한옥은 그대로였다.
 *
 * useGLTF가 돌려주는 scene은 캐시된 한 덩어리다. HanokModel과 Beat5도 같은 것을 쥐고
 * 있어서, 여기서 직접 mesh.material을 갈아끼우면 서로의 재질을 덮어쓴다.
 * 실제로 그 탓에 부재가 visible=true 인 채 opacity 0 에 묶여 화면에서 통째로 사라졌다.
 *
 * 그래서 자기 사본 위에서만 작업한다. clone(true)는 노드 계층만 복제하고
 * geometry·material은 참조로 공유하므로 부재 107개라도 비용이 거의 없다.
 * 남의 것을 만지지 않으니 언마운트 때 되돌릴 것도 없다.
 */
export function AssemblyModel() {
  const { scene } = useGLTF(MODEL_URL);
  const reduced = usePrefersReducedMotion();

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

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const lerp = (a, b, t) => a + (b - a) * t;

  /*
    매 프레임 107개 부재 및 STAGES 데이터 기반 카메라를 보간 계산한다.
  */
  useFrame(({ camera, size }) => {
    const local = assemblyProgress.current;

    // 1. 107개 부재 조립 애니메이션
    for (const part of parts) {
      const [start, end] = STAGE_WINDOWS[part.stage];

      const t = clamp01((local - start) / (end - start));
      const e = 1 - (1 - t) ** 3;

      part.mesh.position.set(
        part.origin.x + part.from.x * (1 - e),
        part.origin.y + part.from.y * (1 - e),
        part.origin.z + part.from.z * (1 - e),
      );

      const opacity = smoothstep(0, 0.18, t);
      const visible = opacity > 0.004;
      part.mesh.visible = visible;

      if (visible) {
        const opaque = opacity > 0.995;
        for (const material of part.materials) {
          material.opacity = opacity;

          if (material.transparent === opaque) {
            material.transparent = !opaque;
            material.needsUpdate = true;
          }
        }
      }
    }

    // 2. STAGES 데이터 기반 단계별 카메라 보간 애니메이션
    const activeStage = local >= RESULT_AT ? STAGES.length - 1 : activeStageOf(local);
    if (activeStage >= 0 && activeStage < STAGES.length) {
      const i = activeStage;
      const isCompleted = local >= RESULT_AT;

      const cur = STAGES[i];
      const next = STAGES[Math.min(i + 1, STAGES.length - 1)];

      const [start, end] = STAGE_WINDOWS[i];
      const stageLocalProgress = isCompleted ? 1 : clamp01((local - start) / (end - start));

      // [6] 접근성 (prefers-reduced-motion): reduced인 경우 linear, 아니면 easeInOutCubic
      const t = reduced ? stageLocalProgress : easeInOutCubic(stageLocalProgress);

      const isMobile = size.width < 768;

      const curPos = new THREE.Vector3(...cur.cameraPos);
      const nextPos = new THREE.Vector3(...next.cameraPos);

      const curTargetVec = new THREE.Vector3(
        ...(isMobile && cur.mobileCameraTarget ? cur.mobileCameraTarget : cur.cameraTarget),
      );
      const nextTargetVec = new THREE.Vector3(
        ...(isMobile && next.mobileCameraTarget ? next.mobileCameraTarget : next.cameraTarget),
      );

      // position 및 target 보간
      const lerpedPos = new THREE.Vector3().lerpVectors(curPos, nextPos, t);
      const lerpedTarget = new THREE.Vector3().lerpVectors(curTargetVec, nextTargetVec, t);

      // [3] 단계 진입 시 미세한 무게감 강조 모션 (Punch Effect)
      if (!reduced && stageLocalProgress <= 0.15) {
        const punch = Math.sin((stageLocalProgress / 0.15) * Math.PI) * 0.4;
        const dirFromTarget = lerpedPos.clone().sub(lerpedTarget);
        dirFromTarget.multiplyScalar(1 - punch * 0.012);
        lerpedPos.copy(lerpedTarget).add(dirFromTarget);
      }

      // [4] 반응형 카메라 보정 (모바일 1.55x, 태블릿 1.2x 거리 늘림 및 fov +6)
      let distanceScale = 1;
      if (size.width < 768) distanceScale = 1.55;
      else if (size.width < 1280) distanceScale = 1.2;

      const dir = lerpedPos.clone().sub(lerpedTarget).normalize();
      const dist = lerpedPos.distanceTo(lerpedTarget) * distanceScale;
      const finalPos = lerpedTarget.clone().add(dir.multiplyScalar(dist));

      camera.position.copy(finalPos);
      camera.lookAt(lerpedTarget);

      // fov 보간
      const baseFov = lerp(cur.fov ?? 45, next.fov ?? 45, t);
      const finalFov = isMobile ? baseFov + 6 : baseFov;

      if (Math.abs(camera.fov - finalFov) > 0.01) {
        camera.fov = finalFov;
        camera.updateProjectionMatrix();
      }
    }
  });

  return (
    <group position={offset}>
      <primitive object={root} />
    </group>
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

/* 오른쪽 60%는 비워둔다. 그 자리에 고정 캔버스의 한옥이 조립된다. */

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
  const setAssembling = useSceneStore((s) => s.setAssembling);

  const active = progress >= RANGE_START && progress < RANGE_END;
  const local = clamp01((progress - RANGE_START) / (RANGE_END - RANGE_START));

  // 렌더링 단계에서 즉시 동기화 (useEffect 1프레임 딜레이 및 역방향 스크롤 리셋 방지)
  assemblyProgress.current = local;

  // 고정 캔버스에 "지금은 조립 중"이라고 알린다. 완성된 한옥이 물러나고 부재가 날아온다.
  useEffect(() => {
    setAssembling(active);
  }, [active, setAssembling]);

  useEffect(() => () => useSceneStore.getState().setAssembling(false), []);

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
                쇠못 하나 없이 맞물려, 천 년의 숨을 쉬는 보금자리.
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
