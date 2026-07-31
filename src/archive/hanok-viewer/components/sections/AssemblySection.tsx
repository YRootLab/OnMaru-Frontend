'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { STAGES, type HanokStageData } from '../../data/hanok.data';
import { useHanokViewerStore } from '../../store/useHanokViewerStore';
import { meok } from '@/design-system/tokens';

const EASE = [0.22, 1, 0.36, 1] as const;

const SectionContainer = styled.div<{ totalStages: number }>`
  height: ${(props) => props.totalStages * 100}vh;
  position: relative;
  font-family: 'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif;
  z-index: 10;
`;

const StickyViewport = styled.div`
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  color: ${meok[100]};
  pointer-events: none;
`;

const VignetteOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(28, 26, 23, 0.96) 0%,
    rgba(28, 26, 23, 0.88) 28%,
    rgba(28, 26, 23, 0.55) 45%,
    rgba(28, 26, 23, 0) 68%
  );
  pointer-events: none;
  z-index: 10;

  @media (max-width: 768px) {
    background: linear-gradient(
      to top,
      rgba(28, 26, 23, 0.96) 0%,
      rgba(28, 26, 23, 0.72) 20%,
      rgba(28, 26, 23, 0.22) 35%,
      rgba(28, 26, 23, 0) 52%
    );
  }
`;

const EditorialPanel = styled.div`
  position: absolute;
  left: clamp(24px, 6vw, 96px);
  top: 50%;
  transform: translateY(-50%);
  width: clamp(340px, 42vw, 540px);
  z-index: 20;

  @media (max-width: 768px) {
    left: 20px;
    right: 20px;
    bottom: 36px;
    top: auto;
    transform: none;
    width: auto;
    max-width: calc(100vw - 40px);
  }
`;

const StageIndicatorGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 28px;
  pointer-events: auto;

  @media (max-width: 768px) {
    gap: 8px;
    margin-top: 16px;
  }
`;

const StageIndicatorButton = styled.button<{ isActive: boolean }>`
  height: 4px;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: 2px;
  background: transparent;
  width: ${(props) => (props.isActive ? '44px' : '16px')};
  transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);

  @media (max-width: 768px) {
    height: 3px;
    width: ${(props) => (props.isActive ? '28px' : '10px')};
  }
`;

const IndicatorSpan = styled(motion.span)`
  display: block;
  height: 100%;
  border-radius: 2px;
`;

// 단계 번호 (01, 02, ...) — 타이틀과 동일 크기/굵기
const StageNumber = styled.span`
  color: ${meok[500]};
  margin-right: 16px;

  @media (max-width: 768px) {
    margin-right: 10px;
  }
`;

const OversizedTitle = styled.h2`
  font-family: 'SpoqaHanSansNeo', -apple-system, sans-serif;
  color: ${meok[100]};
  font-size: clamp(48px, 5.6vw, 76px);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.045em;
  margin: 0 0 22px;
  display: flex;
  align-items: baseline;

  @media (max-width: 768px) {
    font-size: clamp(28px, 7.5vw, 36px);
    margin: 0 0 12px;
  }
`;

const StageDescription = styled.p`
  font-family: 'SpoqaHanSansNeo', -apple-system, sans-serif;
  font-size: clamp(15px, 1.5vw, 17px);
  line-height: 1.75;
  font-weight: 400;
  color: ${meok[400]};
  margin: 0;
  letter-spacing: -0.015em;

  @media (max-width: 768px) {
    font-size: 14px;
    line-height: 1.65;
  }
`;

// 더보기/접기 텍스트 토글 버튼
const MoreToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  border-bottom: 1px solid currentColor;
  padding: 0 0 3px 0;
  margin-left: 8px;
  font-family: 'SpoqaHanSansNeo', -apple-system, sans-serif;
  font-size: 0.9em;
  font-weight: 600;
  color: ${meok[400]};
  cursor: pointer;
  letter-spacing: -0.01em;
  transition: color 0.2s ease;
  pointer-events: auto;

  &:hover {
    color: ${meok[200]};
  }
`;

// 토글 화살표 아이콘
const ToggleArrow = styled.span<{ isOpen: boolean }>`
  display: inline-block;
  font-size: 10px;
  transition: transform 0.3s ease;
  transform: ${(props) => (props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
`;

// 펼쳐지는 추가 설명 영역
const ExpandedDesc = styled.span``;

// 'SCROLL' 글자 없이 아래 방향 셰브론만 남긴다.
// 라벨은 프로젝트 규칙(인위적 라벨링 금지)에 걸리고, 형태만으로 충분히 읽힌다.
const ScrollPrompt = styled(motion.div)`
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${meok[400]};
  z-index: 20;
  pointer-events: none;

  @media (max-width: 768px) {
    bottom: 20px;
  }
`;

const ScrollChevron = styled(motion.svg)`
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;

  @media (max-width: 768px) {
    width: 16px;
    height: 16px;
  }
`;

// 단계 텍스트 크로스페이드용 겹침 컨테이너
const StageTextStack = styled.div`
  position: relative;
  min-height: 300px;

  @media (max-width: 768px) {
    min-height: 200px;
  }
`;

const StageTextLayer = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
`;

// 설명 텍스트를 첫 문장과 나머지로 분리
function splitFirstSentence(text: string): [string, string] {
  const dotIdx = text.indexOf('.');
  if (dotIdx >= 0 && dotIdx < text.length - 1) {
    return [text.slice(0, dotIdx + 1), text.slice(dotIdx + 1).trim()];
  }
  return [text, ''];
}

// 제목·본문 한 벌. 부모가 key={stage.id}로 감싸므로 단계가 바뀌면 이 컴포넌트가
// 통째로 다시 마운트되고 isExpanded도 자연히 초기화된다.
// (단계 변경 때마다 useEffect로 setIsExpanded(false)를 부르던 방식은 렌더를 한 번
//  더 유발하고 react-hooks/set-state-in-effect에도 걸렸다.)
function StageCopy({ stage }: { stage: HanokStageData }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const [firstLine, restLines] = splitFirstSentence(stage.desc);
  const hasMore = restLines.length > 0;
  const stageNum = String(stage.step).padStart(2, '0');

  return (
    <>
      <OversizedTitle>
        <StageNumber>{stageNum}</StageNumber>
        {stage.nameKo}
      </OversizedTitle>

      <StageDescription>
        {firstLine}
        {hasMore && (
          <>
            {isExpanded && (
              <ExpandedDesc>
                {' '}{restLines}
              </ExpandedDesc>
            )}
            <MoreToggle onClick={() => setIsExpanded((prev) => !prev)}>
              {isExpanded ? '접기' : '더보기'}
              <ToggleArrow isOpen={isExpanded}>▼</ToggleArrow>
            </MoreToggle>
          </>
        )}
      </StageDescription>
    </>
  );
}

interface AssemblySectionProps {
  onJumpStage?: (index: number) => void;
}

export default function AssemblySection({ onJumpStage }: AssemblySectionProps) {
  const activeStageIndex = useHanokViewerStore((s) => s.activeStageIndex);
  const isOrbitEnabled = useHanokViewerStore((s) => s.isOrbitEnabled);
  const stage = STAGES[activeStageIndex] ?? STAGES[0];

  return (
    <SectionContainer id="assembly-section" totalStages={STAGES.length}>
      <StickyViewport>
        <VignetteOverlay />

        <EditorialPanel style={{ pointerEvents: isOrbitEnabled ? 'none' : 'auto' }}>
          <StageTextStack>
            <AnimatePresence initial={false}>
              <StageTextLayer
                key={stage.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.2, ease: EASE } }}
                transition={{ duration: 0.42, ease: EASE, delay: 0.1 }}
              >
                <StageCopy stage={stage} />
              </StageTextLayer>
            </AnimatePresence>
          </StageTextStack>

          <StageIndicatorGroup>
            {STAGES.map((s, i) => {
              const isActive = i === activeStageIndex;
              return (
                <StageIndicatorButton
                  key={s.id}
                  onClick={() => onJumpStage?.(i)}
                  aria-label={`${String(s.step).padStart(2, '0')}단계 ${s.nameKo}`}
                  aria-current={isActive}
                  isActive={isActive}
                >
                  <IndicatorSpan
                    animate={{
                      backgroundColor: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.22)',
                    }}
                    transition={{ duration: 0.45, ease: EASE }}
                  />
                </StageIndicatorButton>
              );
            })}
          </StageIndicatorGroup>
        </EditorialPanel>

        <AnimatePresence>
          {activeStageIndex < STAGES.length - 1 && (
            <ScrollPrompt
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ScrollChevron
                viewBox="0 0 24 24"
                aria-hidden="true"
                animate={{ y: [0, 6, 0], opacity: [0.65, 0.25, 0.65] }}
                transition={{ repeat: Infinity, duration: 1.9, ease: 'easeInOut' }}
              >
                <path d="M6 9l6 6 6-6" />
              </ScrollChevron>
            </ScrollPrompt>
          )}
        </AnimatePresence>
      </StickyViewport>
    </SectionContainer>
  );
}
