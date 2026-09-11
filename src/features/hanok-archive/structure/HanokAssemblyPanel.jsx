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
import { keyframes } from '@emotion/react';
import { AnimatePresence, motion } from 'framer-motion';

// 읽기 전용 아카이브의 단계 정의. 실제 경로는 .../data/hanok.data
// (브리프 경로에서 /data/ 세그먼트가 빠져 있었다). hanok.data.ts는 수정하지 않는다.
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

// ─────────────────────────────────────────
// 단계 창
//
// 예전에는 전역 스크롤 구간을 잘라 local을 만들었지만, 지금은 모달이 단계 버튼으로
// local을 직접 몰아준다. 창의 경계값은 그대로 두어 조립 순서와 카메라가 그대로 산다.
// ─────────────────────────────────────────

/** local(0~1)을 7단계에 나눠 담는 창. 앞 0.01 진입, 뒤 0.17 완성 여운. */
export const STAGE_WINDOWS = [
  [0.01, 0.12], // 01 기단
  [0.12, 0.23], // 02 댓돌
  [0.23, 0.35], // 03 초석과 기둥
  [0.35, 0.47], // 04 마루
  [0.47, 0.59], // 05 벽
  [0.59, 0.71], // 06 창호
  [0.71, 0.83], // 07 기와 (0.83 완공)
];

export const RESULT_AT = 0.83;

/** 진행 중이거나 방금 끝난 단계. 진입 구간에서는 -1. */
export const activeStageOf = (local) => {
  let index = -1;
  for (let i = 0; i < STAGE_WINDOWS.length; i += 1) {
    if (local >= STAGE_WINDOWS[i][0]) index = i;
  }
  return index;
};

// ─────────────────────────────────────────
// 3D — 아카이브 조립 로직 이식
// ─────────────────────────────────────────

/**
 * 조립할 한옥 한 벌.
 *
 * LandingExperience의 HanokScene이 Beat4 구간에서 완성된 한옥 대신 이것을 세운다.
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
    매 프레임 107개 부재 및 STAGES 데이터 기반 카메라를 보간 계산한다.
  */
  useFrame(() => {
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

    /*
      카메라는 씬(HanokStructureScene)의 FramedCamera가 잡는다.

      원래 여기서 STAGES의 단계별 cameraPos로 부재를 하나씩 클로즈업했는데, 그 좌표는
      전체화면 뷰어 시절 값이라 모달에서는 앞 단계가 돌덩이로 화면을 가득 채우거나
      아예 프레임 밖으로 나갔다. 한 자리에 서서 일곱 켜가 쌓이는 걸 보는 편이
      "일곱 켜로 선다"는 이야기에도 맞다.
    */
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
    /* 글이 아래로 내려오므로 단계 조작 바(한 줄, 약 64px) 높이만큼 비운다. */
    padding-bottom: 76px;
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

// ─────────────────────────────────────────
// LandingHanokAssembly
// ─────────────────────────────────────────

export default function HanokAssemblyPanel({ local }) {
  const setAssembling = useSceneStore((s) => s.setAssembling);

  // 렌더링 단계에서 즉시 동기화 (useEffect 1프레임 딜레이 및 되감기 리셋 방지)
  assemblyProgress.current = clamp01(local);

  // 캔버스에 "지금은 조립 중"이라고 알린다. 완성된 한옥이 물러나고 부재가 날아온다.
  useEffect(() => {
    setAssembling(true);
    return () => useSceneStore.getState().setAssembling(false);
  }, [setAssembling]);

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
