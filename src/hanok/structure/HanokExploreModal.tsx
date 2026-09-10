'use client';

/*
  한 채를 눌러 보는 모달.

  그림자는 절기가 축이고 조립은 순서가 축인데, 여기는 축이 없다. 완성된 한옥이 서 있고
  보는 사람이 궁금한 데를 누른다 — 목차가 목록이 아니라 집 자체다.

  259곳이 어디 있는지 말하는 섹션은 다섯인데 한옥이 무엇으로 이루어졌는지 말하는 길은
  글줄뿐이었다. 기둥을 눌러 기둥 이야기가 나오는 편이, 기둥이라는 단어를 읽는 것보다
  도감에 가깝다.

  카메라는 움직이지 않는다. 부재를 고를 때마다 시점이 날아다니면 방금 누른 것이
  어디였는지 잃는다. 집은 그 자리에 서 있고, 고른 켜에만 불이 들어온다.
*/

import { useState } from 'react';
import styled from '@emotion/styled';

import { meok, lightPalette, surface } from '@/design-system/tokens';
import { SHADOW_RANGE } from './constants';
import { STAGES, stageIndexForMesh } from './stages';
import StructureModal from './StructureModal';
import StructureCanvas from './StructureCanvas';

/** 그림자 모달과 같은 구도. 한 채가 통째로 들어오는 자리라 확인된 값을 그대로 쓴다. */
const HOUSE_VIEW = (SHADOW_RANGE[0] + SHADOW_RANGE[1]) / 2;

const Body = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(
    ellipse 82% 66% at 50% 48%,
    #ffffff 0%,
    ${surface.light.base} 58%,
    rgba(58, 46, 31, 0.07) 100%
  );

  [data-theme='dark'] & {
    background: radial-gradient(
      ellipse 82% 66% at 50% 48%,
      #463f35 0%,
      ${surface.dark.surface} 58%,
      ${surface.dark.app} 100%
    );
  }
`;

/*
  읽는 자리.

  3D 위에 겹쳐 띄우지 않고 오른쪽을 잘라 세운다 — 겹쳐 두면 글을 읽는 동안 한옥이
  가리고, 한옥을 보려면 글이 사라진다. 누른 것과 그 설명이 같이 보여야 한다.
*/
const Panel = styled.aside`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  width: min(38%, 380px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: clamp(24px, 3vw, 40px);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(8px);
  border-left: 1px solid ${meok[200]};

  [data-theme='dark'] & {
    background: rgba(36, 33, 29, 0.72);
    border-left-color: rgba(255, 255, 255, 0.1);
  }

  /* 좁은 화면에서는 아래를 잘라 쓴다. 세로로는 집이 위를 다 쓰는 게 낫다. */
  @media (max-width: 720px) {
    top: auto;
    left: 0;
    width: auto;
    max-height: 46%;
    justify-content: flex-end;
    border-left: 0;
    border-top: 1px solid ${meok[200]};

    [data-theme='dark'] & {
      border-top-color: rgba(255, 255, 255, 0.1);
    }
  }
`;

const Step = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.14em;
  color: ${lightPalette.kobalt[500]};
`;

const Name = styled.h3`
  margin: 0;
  font-size: clamp(22px, 2.6vw, 30px);
  font-weight: 500;
  letter-spacing: -0.022em;
  line-height: 1.25;
  color: ${meok[900]};
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }

  small {
    display: block;
    margin-top: 4px;
    font-size: 12.5px;
    font-weight: 400;
    letter-spacing: 0.02em;
    color: ${meok[500]};
  }
`;

const Desc = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: ${meok[700]};
  word-break: keep-all;
  overflow-y: auto;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }

  strong {
    font-weight: 700;
    color: ${meok[900]};

    [data-theme='dark'] & {
      color: ${meok[100]};
    }
  }
`;

/** 아직 아무것도 안 누른 상태. 무엇을 하라는지 한 줄이면 된다. */
const Empty = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: ${meok[500]};
  word-break: keep-all;
`;

function emphasize(text: string) {
  return text
    .split('**')
    .map((chunk, i) => (i % 2 === 1 ? <strong key={i}>{chunk}</strong> : chunk));
}

export default function HanokExploreModal({ onClose }: { onClose: () => void }) {
  // -1이면 아직 아무 켜도 안 골랐다.
  const [stage, setStage] = useState(-1);

  const picked = stage >= 0 ? STAGES[stage] : null;

  return (
    <StructureModal title="한옥 한 채 뜯어보기" onClose={onClose}>
      <Body>
        <StructureCanvas
          progress={HOUSE_VIEW}
          highlightStage={stage}
          onSelectMesh={(meshName) => {
            const next = stageIndexForMesh(meshName);
            // 못 읽은 부재는 아무 일도 일으키지 않는다. 고른 것을 지우는 게 더 나쁘다.
            if (next >= 0) setStage(next);
          }}
        />

        <Panel aria-live="polite">
          {picked ? (
            <>
              <Step>{String(picked.step).padStart(2, '0')} / 07</Step>
              <Name>
                {picked.nameKo}
                <small>{picked.nameEn}</small>
              </Name>
              <Desc>{emphasize(picked.desc)}</Desc>
            </>
          ) : (
            <Empty>
              한옥의 아무 데나 눌러 보세요.
              <br />
              기둥을 누르면 기둥 이야기가, 기와를 누르면 기와 이야기가 열립니다.
            </Empty>
          )}
        </Panel>
      </Body>
    </StructureModal>
  );
}
