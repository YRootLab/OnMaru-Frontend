'use client';

/*
  한옥 7단계 조립 모달.

  진행도는 모달 안쪽 스크롤이 몬다. 단계마다 읽을 설명이 붙어 있어서 타이머로 넘기면
  누구에게는 빠르고 누구에게는 느리다 — 스크롤이면 읽는 속도가 곧 조립 속도가 된다.

    Scroller(overflow-y) — 높이가 확정된 스크롤 컨테이너
      ├ Stage(sticky, height 100%) — 스크롤하는 동안 화면에 붙어 있다
      │   ├ z 1  3D 캔버스
      │   ├ z 5  단계 텍스트 패널
      │   └ z 10 단계 칩 (지금 어디인지 + 바로가기)
      └ Spacer — 스크롤 길이를 만드는 빈 칸

  무대를 Track 안에 넣고 height 100%를 주면 그 100%가 Scroller가 아니라 Track(700%)
  기준으로 풀려서 무대가 5320px가 되고, 캔버스가 크기를 못 받아 기본값 300×150으로
  주저앉는다. 무대와 여백을 형제로 두어야 100%가 Scroller 높이로 떨어진다.
*/

import { useRef, useState } from 'react';
import styled from '@emotion/styled';

import { meok, lightPalette, surface } from '@/design-system/tokens';
import { ASSEMBLY_RANGE } from './constants';
import { STAGES } from './stages';
import { clamp01 } from './motion';
import StructureModal from './StructureModal';
import StructureCanvas from './StructureCanvas';
import HanokAssemblyPanel, { STAGE_WINDOWS, activeStageOf } from './HanokAssemblyPanel';

/**
 * 단계 i를 "다 세운" 지점.
 *
 * 창의 끝값은 다음 단계의 시작값과 같아서 그대로 쓰면 activeStageOf가 i+1을 돌려준다 —
 * 01로 갔는데 02가 켜지던 이유다. 머리카락만큼 앞에 세운다.
 * 마지막 단계만은 완성(RESULT_AT)을 넘겨야 마무리 문구가 뜬다.
 */
const STAGE_EPSILON = 0.0005;

const endOfStage = (i: number) =>
  i === STAGES.length - 1 ? 1 : STAGE_WINDOWS[i][1] - STAGE_EPSILON;

/**
 * 무대 뒤에 깔아 스크롤 길이를 만드는 빈 칸. 무대 높이의 배수다.
 * 무대 한 장(100%)이 앞에 있으므로 실제로 굴러가는 거리가 곧 이 값이고,
 * 600%면 한 단계가 대략 화면 한 장이라 설명을 읽는 사이 부재가 다 넘어가지 않는다.
 */
const ASSEMBLY_SCROLL_LENGTH = '600%';

const Body = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(
    ellipse 90% 80% at 62% 30%,
    ${lightPalette.hwanggeum[50]} 0%,
    ${surface.light.base} 58%,
    #ffffff 100%
  );
`;

const Scroller = styled.div`
  position: absolute;
  inset: 0;
  overflow-y: auto;
  /* 끝까지 내려도 뒤쪽 도감으로 스크롤이 넘어가지 않는다. */
  overscroll-behavior: contain;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Stage = styled.div`
  position: sticky;
  top: 0;
  /* Scroller가 inset 0으로 높이가 확정돼 있어 100%가 그 높이로 떨어진다. */
  height: 100%;
  overflow: hidden;
`;

const Spacer = styled.div`
  height: ${ASSEMBLY_SCROLL_LENGTH};
  pointer-events: none;
`;

/*
  칩이 일곱 개라 좁은 화면에서 줄바꿈되면 바가 여러 줄로 자라 한옥을 덮는다.
  한 줄로 고정하고 넘치는 만큼 가로로 민다 — 바 높이가 어디서나 일정해야
  위쪽 3D 구도를 한 벌로 잡을 수 있다.
*/
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
  background: linear-gradient(to top, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0));

  &::-webkit-scrollbar {
    display: none;
  }

  /* 다 들어가는 넓은 화면에서는 가운데로 모은다. */
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
      $active ? 'transparent' : $done ? lightPalette.juhong[200] : 'rgba(25, 31, 40, 0.12)'};
  border-radius: 9999px;
  background: ${({ $active }) => ($active ? meok[900] : 'rgba(255, 255, 255, 0.9)')};
  color: ${({ $active, $done }) =>
    $active ? '#ffffff' : $done ? lightPalette.juhong[700] : meok[500]};
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    border-color: ${({ $active }) => ($active ? 'transparent' : lightPalette.juhong[400])};
    color: ${({ $active }) => ($active ? '#ffffff' : lightPalette.juhong[700])};
  }

  small {
    font-size: 11px;
    font-weight: 500;
    opacity: 0.72;
  }
`;

/** 스크롤로 움직인다는 걸 알려준다. 한 번 굴리면 사라진다. */
const ScrollHint = styled.p`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 64px;
  z-index: 10;
  margin: 0;
  text-align: center;
  font-size: 12.5px;
  font-weight: 400;
  color: ${meok[500]};
  pointer-events: none;
`;

export default function HanokAssemblyModal({ onClose }: { onClose: () => void }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [local, setLocal] = useState(0);

  const readProgress = () => {
    const el = scrollerRef.current;
    if (!el) return;

    const travel = el.scrollHeight - el.clientHeight;
    setLocal(travel > 0 ? clamp01(el.scrollTop / travel) : 0);
  };

  /** 칩을 누르면 그 단계가 서는 지점으로 스크롤을 옮긴다. */
  const scrollToStage = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;

    el.scrollTo({
      top: endOfStage(i) * (el.scrollHeight - el.clientHeight),
      behavior: 'smooth',
    });
  };

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
