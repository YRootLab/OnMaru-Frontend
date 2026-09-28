'use client';

 

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { AnimatePresence, motion } from 'framer-motion';



import { STAGES } from './stages';
import { MODEL_URL } from './constants';
useGLTF.preload(MODEL_URL);
import { assemblyProgress, useSceneStore } from './sceneStore';
import { meok, lightPalette } from '@/design-system/tokens';
import { clamp01 } from './motion';

const FONT = 'var(--font-hanok)';
const EASE = [0.22, 1, 0.36, 1];

const smoothstep = (edge0, edge1, x) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};









export const STAGE_WINDOWS = [
  [0.01, 0.12],
  [0.12, 0.23],
  [0.23, 0.35],
  [0.35, 0.47],
  [0.47, 0.59],
  [0.59, 0.71],
  [0.71, 0.83],
];

export const RESULT_AT = 0.83;


export const activeStageOf = (local) => {
  let index = -1;
  for (let i = 0; i < STAGE_WINDOWS.length; i += 1) {
    if (local >= STAGE_WINDOWS[i][0]) index = i;
  }
  return index;
};




















export function AssemblyModel() {
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




  useFrame(() => {
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









  });

  return (
    <group position={offset}>
      <primitive object={root} />
    </group>
  );
}





const Stage = styled.section`
  position: absolute;
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

    padding-bottom: 76px;
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

const titleGradient = `linear-gradient(135deg, ${meok[900]} 0%, ${meok[700]} 34%, ${lightPalette.juhong[700]} 72%, ${lightPalette.hwanggeum[700]} 100%)`;
const titleGradientDark = `linear-gradient(135deg, ${meok[100]} 0%, ${meok[400]} 34%, ${lightPalette.juhong[400]} 72%, ${lightPalette.hwanggeum[400]} 100%)`;

const TitleLine = styled.h2`
  margin: 0;
  display: flex;
  align-items: baseline;
  font-size: clamp(36px, 4vw, 56px);
  font-weight: 100;
  letter-spacing: -0.015em;
  line-height: 1.05;
  background: ${titleGradient};
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${goldShimmer} 6s ease-in-out infinite;

  [data-theme='dark'] & {
    background: ${titleGradientDark};
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const StepNumber = styled.span`
  margin-right: 16px;
  font-size: 0.6em;
  font-weight: 500;
  background: ${titleGradient};
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${goldShimmer} 6s ease-in-out infinite;

  [data-theme='dark'] & {
    background: ${titleGradientDark};
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
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
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1.35;
  background: ${titleGradient};
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  word-break: keep-all;
  animation: ${goldShimmer} 6s ease-in-out infinite;

  &:hover {
    animation-duration: 2.5s;
  }

  [data-theme='dark'] & {
    background: ${titleGradientDark};
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;





export default function HanokAssemblyPanel({ local }) {
  const setAssembling = useSceneStore((s) => s.setAssembling);


  assemblyProgress.current = clamp01(local);


  useEffect(() => {
    setAssembling(true);
    return () => useSceneStore.getState().setAssembling(false);
  }, [setAssembling]);

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
              </Layer>
            )}
          </AnimatePresence>
        </TextStack>
      </Left>
    </Stage>
  );
}

useGLTF.preload(MODEL_URL);
