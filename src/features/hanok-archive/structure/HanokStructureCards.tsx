'use client';

/*
  한옥 건축의 비밀과 공간 과학 챕터 진입 카드 (2종)
  1. ☀️ 빛 (절기 일조량 & 남중고도 처마 시뮬레이션)
  2. 🪵 뼈대 (못 없는 짜맞춤 결구 & 7단계 부재 조립)

  3D 무거운 렌더러는 모달을 클릭할 때 비로소 로드하여 메인 스크롤 성능을 60fps로 보존하고,
  카드 자체에서 인터랙티브 프리뷰와 감성적인 에디토리얼 연출로 클릭할 명확한 동기를 부여합니다.
*/

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion } from 'framer-motion';
import {
  SunMedium,
  Layers,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

import { meok, palette, lightPalette, surface, fontSize, ringShadow } from '@/design-system/tokens';
import SectionHeader from '@/features/hanok-archive/components/SectionHeader';

const SolarShadowModal = dynamic(() => import('./SolarShadowModal'), { ssr: false });
const HanokAssemblyModal = dynamic(() => import('./HanokAssemblyModal'), { ssr: false });

type OpenModal = 'shadow' | 'assembly' | null;

const SectionWrapper = styled.section`
  position: relative;
  width: 100%;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(16px, 2.2vw, 28px);

  @media (max-width: 840px) {
    grid-template-columns: 1fr;
  }
`;

const CardContainer = styled.button<{ $accentColor: string }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0;
  border-radius: 28px;
  border: none;
  background: #ffffff;
  box-shadow: ${ringShadow.light.card};
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  overflow: hidden;
  transition:
    transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    transform: translateY(-5px);
    box-shadow: ${ringShadow.light.cardHoverGlow};
  }

  &:focus-visible {
    outline: 2px solid ${({ $accentColor }) => $accentColor};
    outline-offset: 4px;
  }

  [data-theme='dark'] & {
    background: ${surface.dark.card};
    box-shadow: ${ringShadow.dark.card};
  }

  [data-theme='dark'] &:hover {
    box-shadow: ${ringShadow.dark.cardHoverGlow};
  }
`;

const CardBody = styled.div`
  padding: clamp(22px, 2.6vw, 30px) clamp(24px, 2.8vw, 36px) clamp(24px, 2.8vw, 36px);
`;

const SectionLabel = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${fontSize.xs};
  font-weight: 700;
  letter-spacing: 0.04em;
  color: ${({ $color }) => $color};
  margin-bottom: 10px;
`;

const CardTitle = styled.h3`
  font-family: var(--font-hanok);
  font-size: clamp(19px, 1.8vw, 23px);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.35;
  color: ${meok[900]};
  margin: 0 0 10px;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const CardDesc = styled.p`
  font-size: ${fontSize.sm};
  font-weight: 400;
  line-height: 1.65;
  color: ${meok[700]};
  margin: 0 0 20px;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[300]};
  }
`;

/* =========================================================================
   인터랙티브 프리뷰 비주얼 영역 (빛: 태양 궤적 & 처마, 뼈대: 7켜 결구 상승)
   ========================================================================= */

const PreviewCanvas = styled.div<{ $bg: string }>`
  position: relative;
  width: 100%;
  height: clamp(160px, 20vw, 200px);
  background: ${({ $bg }) => $bg};
  overflow: hidden;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.06);
  }
`;

/* ☀️ 태양 궤적 & 처마 그림자 애니메이션 */
const sunOrbit = keyframes`
  0% { transform: translate(-40px, 30px); opacity: 0.8; }
  50% { transform: translate(0px, 0px); opacity: 1; }
  100% { transform: translate(40px, 20px); opacity: 0.8; }
`;

const shadowLengthen = keyframes`
  0% { transform: scaleX(0.7) skewX(-32deg); opacity: 0.75; }
  50% { transform: scaleX(1.15) skewX(-32deg); opacity: 0.95; }
  100% { transform: scaleX(0.7) skewX(-32deg); opacity: 0.75; }
`;

const SolarPreviewGraphic = styled.div`
  position: relative;
  width: 100%;
  height: 100%;

  /* 태양 궤적선 (Arc) */
  .sun-arc {
    position: absolute;
    top: 20%;
    left: 20%;
    right: 20%;
    height: 60px;
    border-top: 2px dashed rgba(217, 148, 0, 0.35);
    border-radius: 50% 50% 0 0;
  }

  /* 움직이는 태양 오브젝트 */
  .sun-orb {
    position: absolute;
    top: 18%;
    left: 48%;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: radial-gradient(circle, #ffd026 0%, #ff9800 100%);
    box-shadow: 0 0 16px rgba(255, 184, 0, 0.6);
    animation: ${sunOrbit} 4s ease-in-out infinite alternate;
  }

  /* 전통 처마선 (Eaves Roofline) */
  .roof-curve {
    position: absolute;
    top: 48%;
    left: 18%;
    width: 44%;
    height: 8px;
    background: ${meok[800]};
    border-radius: 3px 12px 3px 3px;
    transform: rotate(-4deg);

    [data-theme='dark'] & {
      background: #e5e5e3;
    }
  }

  /* 처마 밑으로 뻗는 계절 그림자 */
  .eaves-shadow {
    position: absolute;
    bottom: 24%;
    left: 36%;
    width: 46%;
    height: 10px;
    border-radius: 3px;
    background: linear-gradient(to right, rgba(58, 46, 31, 0.6), rgba(58, 46, 31, 0.08));
    transform-origin: left center;
    animation: ${shadowLengthen} 3.6s ease-in-out infinite;

    [data-theme='dark'] & {
      background: linear-gradient(to right, rgba(255, 208, 38, 0.35), rgba(255, 208, 38, 0.02));
    }
  }

  /* 절기 고도 텍스트 라벨 */
  .season-indicator {
    position: absolute;
    bottom: 10px;
    right: 14px;
    font-size: 11px;
    font-weight: 600;
    color: ${lightPalette.hwanggeum[700]};
    display: flex;
    align-items: center;
    gap: 4px;

    [data-theme='dark'] & {
      color: ${palette.hwanggeum[400]};
    }
  }
`;

/* 🪵 7단계 결구 조립 부재 애니메이션 */
const layerRise = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`;

const AssemblyPreviewGraphic = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column-reverse;
  justify-content: center;
  align-items: center;
  gap: 5px;
  padding: 16px 28%;

  .layer-bar {
    width: 100%;
    height: 8px;
    border-radius: 3px;
    background: ${lightPalette.juhong[400]};
    animation: ${layerRise} 2.6s ease-in-out infinite;
  }

  .layer-1 { width: 92%; opacity: 1; animation-delay: 0s; background: #65707c; } /* 석조 기단 */
  .layer-2 { width: 78%; opacity: 0.9; animation-delay: 0.1s; background: #8b95a1; } /* 디딤돌 */
  .layer-3 { width: 84%; opacity: 0.82; animation-delay: 0.2s; background: #d94000; } /* 목조 기둥 */
  .layer-4 { width: 88%; opacity: 0.72; animation-delay: 0.3s; background: #ff5500; } /* 대청 마루 */
  .layer-5 { width: 80%; opacity: 0.60; animation-delay: 0.4s; background: #ff7830; } /* 황토 벽체 */
  .layer-6 { width: 74%; opacity: 0.48; animation-delay: 0.5s; background: #ffbd99; } /* 창호 */
  .layer-7 { width: 100%; opacity: 0.35; animation-delay: 0.6s; background: #ff3b30; } /* 기와 지붕 */

  .joinery-indicator {
    position: absolute;
    bottom: 10px;
    right: 14px;
    font-size: 11px;
    font-weight: 600;
    color: ${lightPalette.juhong[700]};
    display: flex;
    align-items: center;
    gap: 4px;

    [data-theme='dark'] & {
      color: ${palette.juhong[400]};
    }
  }
`;

/* 카드 하단 — 이미 카드 전체가 버튼이니, 여기는 텍스트 링크 정도로만 존재를 알린다 */
const MoreLink = styled.div<{ $color: string }>`
  margin-top: 18px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${({ $color }) => $color};
  font-size: ${fontSize.sm};
  font-weight: 600;

  svg {
    transition: transform 0.22s ease;
  }

  ${CardContainer}:hover & svg {
    transform: translate(2px, -2px);
  }
`;

export default function HanokStructureCards() {
  const [open, setOpen] = useState<OpenModal>(null);
  const close = () => setOpen(null);

  return (
    <SectionWrapper aria-labelledby="structure-heading">
      <div>
        <SectionHeader
          id="structure-heading"
          title="한옥은 왜 이렇게 생겼을까"
        />
      </div>
      <div>
        <Grid>
        {/* 1. 빛: 절기 일조량 & 남중고도 처마 시뮬레이션 */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
            }}
          >
        <CardContainer
          type="button"
          onClick={() => setOpen('shadow')}
          $accentColor={palette.hwanggeum[500]}
          aria-label="처마 그림자 시뮬레이션 열기"
        >
          <PreviewCanvas $bg="rgba(255, 184, 0, 0.07)" aria-hidden="true">
            <SolarPreviewGraphic>
              <div className="sun-arc" />
              <div className="sun-orb" />
              <div className="roof-curve" />
              <div className="eaves-shadow" />
              <div className="season-indicator">
                <Sparkles size={12} /> 하지 77° ➔ 동지 29°
              </div>
            </SolarPreviewGraphic>
          </PreviewCanvas>

          <CardBody>
            <SectionLabel $color={lightPalette.hwanggeum[700]}>
              <SunMedium size={14} /> 자연의 빛과 일조 과학
            </SectionLabel>

            <CardTitle>처마는 왜 여름엔 그늘을, 겨울엔 볕을 줄까</CardTitle>
            <CardDesc>
              봄·여름·가을·겨울 24절기를 슬라이더로 옮겨 보세요. 남중고도(29°~77°) 변화에 따라 처마 밑으로 드리우는 그림자가 실제 건축 비율로 시시각각 변화합니다.
            </CardDesc>

            <MoreLink $color={lightPalette.hwanggeum[700]}>
              <span>3D로 보기</span>
              <ArrowUpRight size={16} />
            </MoreLink>
          </CardBody>
        </CardContainer>
          </motion.div>

        {/* 2. 뼈대: 못 없는 결구 & 7단계 부재 조립 */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.1 } },
            }}
          >
        <CardContainer
          type="button"
          onClick={() => setOpen('assembly')}
          $accentColor={palette.juhong[500]}
          aria-label="7단계 부재 조립 열기"
        >
          <PreviewCanvas $bg="rgba(217, 64, 0, 0.06)" aria-hidden="true">
            <AssemblyPreviewGraphic>
              <div className="layer-bar layer-1" />
              <div className="layer-bar layer-2" />
              <div className="layer-bar layer-3" />
              <div className="layer-bar layer-4" />
              <div className="layer-bar layer-5" />
              <div className="layer-bar layer-6" />
              <div className="layer-bar layer-7" />
              <div className="joinery-indicator">
                <Sparkles size={12} /> 기단에서 기와까지 7단계
              </div>
            </AssemblyPreviewGraphic>
          </PreviewCanvas>

          <CardBody>
            <SectionLabel $color={lightPalette.juhong[700]}>
              <Layers size={14} /> 못 없는 맞춤과 결구의 미학
            </SectionLabel>

            <CardTitle>쇠못 하나 없이, 한옥은 어떻게 일곱 켜로 설까</CardTitle>
            <CardDesc>
              기단부터 지붕까지 한 켜씩 세워 보세요. 사개맞춤과 장부맞춤으로 서로를 꽉 물어주어 지진과 비바람에도 흔들리지 않는 전통 목조 결구의 정수를 경험합니다.
            </CardDesc>

            <MoreLink $color={lightPalette.juhong[700]}>
              <span>3D로 보기</span>
              <ArrowUpRight size={16} />
            </MoreLink>
          </CardBody>
        </CardContainer>
          </motion.div>
        </Grid>
      </div>

      {open === 'shadow' && <SolarShadowModal onClose={close} />}
      {open === 'assembly' && <HanokAssemblyModal onClose={close} />}
    </SectionWrapper>
  );
}
