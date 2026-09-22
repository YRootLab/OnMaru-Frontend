'use client';



















import { useLayoutEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';

import { meok, lightPalette, surface , fontSize } from '@/design-system/tokens';
import { ASSEMBLY_RANGE } from './constants';
import { STAGES } from './stages';
import { clamp01 } from './motion';
import StructureModal from './StructureModal';
import StructureCanvas from './StructureCanvas';
import HanokAssemblyPanel, { STAGE_WINDOWS, activeStageOf } from './HanokAssemblyPanel';








const STAGE_EPSILON = 0.0005;

const endOfStage = (i: number) =>
  i === STAGES.length - 1 ? 1 : STAGE_WINDOWS[i][1] - STAGE_EPSILON;






const ASSEMBLY_SCROLL_LENGTH = '600%';

const Body = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: ${surface.light.base};

  --sim-fade: rgba(255, 255, 255, 0.94);
  --sim-pill: rgba(255, 255, 255, 0.9);
  --sim-pill-border: rgba(25, 31, 40, 0.12);
  --sim-ink-weak: ${meok[500]};

  [data-theme='dark'] & {
    background: ${surface.dark.surface};

    --sim-fade: rgba(28, 26, 23, 0.94);
    --sim-pill: rgba(45, 41, 36, 0.9);
    --sim-pill-border: rgba(255, 255, 255, 0.12);
    --sim-ink-weak: ${meok[400]};
  }
`;

const Scroller = styled.div`
  position: absolute;
  inset: 0;
  overflow-y: auto;

  overscroll-behavior: contain;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Stage = styled.div`
  position: sticky;
  top: 0;

  height: 100%;
  overflow: hidden;
`;

const Spacer = styled.div`
  height: ${ASSEMBLY_SCROLL_LENGTH};
  pointer-events: none;
`;






const Controls = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 14px 18px 18px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  background: linear-gradient(to top, var(--sim-fade), rgba(255, 255, 255, 0));

  &::-webkit-scrollbar {
    display: none;
  }


  @media (min-width: 1024px) {
    justify-content: center;
  }

  > * {
    flex: 0 0 auto;
  }
`;

const StepButton = styled.button<{ $active: boolean; $done: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;

  border: 1px solid
    ${({ $active, $done }) =>
      $active ? 'transparent' : $done ? lightPalette.juhong[200] : 'var(--sim-pill-border)'};
  border-radius: 9999px;
  background: ${({ $active }) => ($active ? meok[900] : 'var(--sim-pill)')};
  color: ${({ $active, $done }) =>
    $active ? '#ffffff' : $done ? lightPalette.juhong[700] : 'var(--sim-ink-weak)'};
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: 500;
  letter-spacing: 0.04em;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    border-color: ${({ $active }) => ($active ? 'transparent' : lightPalette.juhong[400])};
    color: ${({ $active }) => ($active ? '#ffffff' : lightPalette.juhong[700])};
  }

  small {
    font-size: ${fontSize.micro};
    font-weight: 500;
    opacity: 0.72;
  }
`;


const ScrollHint = styled.p`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 64px;
  z-index: 10;
  margin: 0;
  text-align: center;
  font-size: ${fontSize.xs};
  font-weight: 400;
  color: var(--sim-ink-weak);
  pointer-events: none;
`;

interface HanokAssemblyModalProps {
  onClose: () => void;

  initialStage?: number;
}

export default function HanokAssemblyModal({ onClose, initialStage }: HanokAssemblyModalProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [local, setLocal] = useState(() =>
    initialStage === undefined ? 0 : endOfStage(initialStage),
  );

  const readProgress = () => {
    const el = scrollerRef.current;
    if (!el) return;

    const travel = el.scrollHeight - el.clientHeight;
    setLocal(travel > 0 ? clamp01(el.scrollTop / travel) : 0);
  };


  const scrollToStage = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;

    el.scrollTo({
      top: endOfStage(i) * (el.scrollHeight - el.clientHeight),
      behavior: 'smooth',
    });
  };









  useLayoutEffect(() => {
    if (initialStage === undefined) return undefined;

    const frame = requestAnimationFrame(() => {
      const el = scrollerRef.current;
      if (!el) return;

      const travel = el.scrollHeight - el.clientHeight;
      if (travel > 0) el.scrollTop = endOfStage(initialStage) * travel;
    });

    return () => cancelAnimationFrame(frame);
  }, [initialStage]);

  const activeIndex = Math.max(0, activeStageOf(local));

  return (
    <StructureModal title="한옥 7단계 조립" onClose={onClose}>
      <Body>
        <Scroller ref={scrollerRef} onScroll={readProgress}>
          <Stage>
            <StructureCanvas
              progress={ASSEMBLY_RANGE[0] + local * (ASSEMBLY_RANGE[1] - ASSEMBLY_RANGE[0])}
            />

            <HanokAssemblyPanel local={local} />

            {local < 0.01 && <ScrollHint>스크롤을 내려 한옥을 세워보세요</ScrollHint>}

            <Controls>
              {STAGES.map((stage, i) => (
                <StepButton
                  key={stage.id}
                  type="button"
                  $active={i === activeIndex}
                  $done={local >= endOfStage(i)}
                  onClick={() => scrollToStage(i)}
                  aria-current={i === activeIndex ? 'step' : undefined}
                >
                  <small>{String(stage.step).padStart(2, '0')}</small>
                  {stage.nameKo}
                </StepButton>
              ))}
            </Controls>
          </Stage>

          <Spacer aria-hidden="true" />
        </Scroller>
      </Body>
    </StructureModal>
  );
}
