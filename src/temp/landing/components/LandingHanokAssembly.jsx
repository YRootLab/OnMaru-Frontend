'use client';

/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { AnimatePresence, motion } from 'framer-motion';



import { STAGES } from '@/temp/archive/hanok-viewer/data/hanok.data';
import { MODEL_URL, BEAT_RANGES } from '../scroll-core/constants';
useGLTF.preload(MODEL_URL);
import { assemblyProgress, useSceneStore } from '../scroll-core/sceneStore';
import { meok } from '@/design-system/tokens';
import { clamp01, easeOut as easeOutCubic, usePrefersReducedMotion } from './LandingSectionFrame';

const FONT = "'Spoqa Han Sans Neo', -apple-system, BlinkMacSystemFont, sans-serif";
const EASE = [0.22, 1, 0.36, 1];

const smoothstep = (edge0, edge1, x) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};





export const RANGE = BEAT_RANGES.BEAT4;

const [RANGE_START, RANGE_END] = RANGE;


const STAGE_WINDOWS = [
  [0.01, 0.12],
  [0.12, 0.23],
  [0.23, 0.35],
  [0.35, 0.47],
  [0.47, 0.59],
  [0.59, 0.71],
  [0.71, 0.83],
];

const RESULT_AT = 0.83;


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






      const isRoof = stage === STAGES.length - 1;
      const materials = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map(
        (source) => {
          const material = source.clone();
          material.transparent = true;
          material.opacity = 0;



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




  useFrame(({ camera, size }) => {
    const local = assemblyProgress.current;


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


    const activeStage = local >= RESULT_AT ? STAGES.length - 1 : activeStageOf(local);
    if (activeStage >= 0 && activeStage < STAGES.length) {
      const i = activeStage;
      const isCompleted = local >= RESULT_AT;

      const cur = STAGES[i];
      const next = STAGES[Math.min(i + 1, STAGES.length - 1)];

      const [start, end] = STAGE_WINDOWS[i];
      const stageLocalProgress = isCompleted ? 1 : clamp01((local - start) / (end - start));


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


      const lerpedPos = new THREE.Vector3().lerpVectors(curPos, nextPos, t);
      const lerpedTarget = new THREE.Vector3().lerpVectors(curTargetVec, nextTargetVec, t);


      if (!isMobile) {
        lerpedTarget.x -= 2.2;
        lerpedPos.x -= 2.2;
      }


      if (!reduced && stageLocalProgress <= 0.15) {
        const punch = Math.sin((stageLocalProgress / 0.15) * Math.PI) * 0.4;
        const dirFromTarget = lerpedPos.clone().sub(lerpedTarget);
        dirFromTarget.multiplyScalar(1 - punch * 0.012);
        lerpedPos.copy(lerpedTarget).add(dirFromTarget);
      }


      let distanceScale = 1;
      if (size.width < 768) distanceScale = 1.55;
      else if (size.width < 1280) distanceScale = 1.2;

      const dir = lerpedPos.clone().sub(lerpedTarget).normalize();
      const dist = lerpedPos.distanceTo(lerpedTarget) * distanceScale;
      const finalPos = lerpedTarget.clone().add(dir.multiplyScalar(dist));

      camera.position.copy(finalPos);
      camera.lookAt(lerpedTarget);


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





const Stage = styled.section`
  position: fixed;
  inset: 0;
  z-index: 5;
  display: flex;
  pointer-events: none;
  font-family: ${FONT};

  @media (max-width: 768px) {
    flex-direction: column-reverse;
  }
`;

const Left = styled.div`
  flex: 0 0 42%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 6vw;
  padding-right: 36px;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    flex: 0 0 45%;
    padding: 20px;
    justify-content: flex-end;
  }
`;



const TextStack = styled.div`
  position: relative;
  min-height: 320px;

  @media (max-width: 768px) {
    min-height: 180px;
  }
`;

const goldShimmer = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
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
  background: linear-gradient(135deg, #ffffff 0%, #f7e3be 45%, #d4af37 85%, #f5a623 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${goldShimmer} 6s ease-in-out infinite;
`;

const StepNumber = styled.span`
  margin-right: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f7e3be 45%, #d4af37 85%, #f5a623 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${goldShimmer} 6s ease-in-out infinite;
`;

const Description = styled(motion.p)`
  margin: 24px 0 0;
  max-width: 480px;
  font-size: clamp(14px, 1.1vw, 17px);
  font-weight: 400;
  line-height: 1.75;
  letter-spacing: -0.015em;
  color: ${meok[100]};
`;

const ResultWrapper = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  margin: 0;
  pointer-events: auto;
  cursor: pointer;
`;

const Result = styled(motion.p)`
  margin: 0;
  font-size: clamp(26px, 3.0vw, 42px);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.35;
  background: linear-gradient(135deg, #ffffff 0%, #f7e3be 45%, #d4af37 85%, #f5a623 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  word-break: keep-all;
  animation: ${goldShimmer} 6s ease-in-out infinite;

  &:hover {
    animation-duration: 2.5s;
  }
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
      ? '#ffffff'
      : props.status === 'done'
        ? 'rgba(255, 255, 255, 0.45)'
        : 'rgba(255, 255, 255, 0.18)'};
`;





export default function LandingHanokAssembly({ progress }) {
  const setAssembling = useSceneStore((s) => s.setAssembling);

  const active = progress >= RANGE_START && progress < RANGE_END;
  const local = clamp01((progress - RANGE_START) / (RANGE_END - RANGE_START));


  assemblyProgress.current = local;


  useEffect(() => {
    setAssembling(active);
  }, [active, setAssembling]);

  useEffect(() => () => useSceneStore.getState().setAssembling(false), []);

  if (!active) return null;

  const activeIndex = activeStageOf(local);
  const displayIndex = Math.max(0, activeIndex);
  const stage = STAGES[displayIndex];
  const showResult = local >= RESULT_AT;

  return (
    <Stage aria-label="한옥 7단계 조립 과정">
      <Left>
        <TextStack>
          <AnimatePresence initial={false} mode="popLayout">
            {showResult ? (
              <ResultWrapper
                key="result"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <Result>
                하나의 쇠못 없이 맞물려,<br /> 천 년을 지탱하는 <br />견고한 뼈대입니다.
                </Result>
              </ResultWrapper>
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

                {}
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
