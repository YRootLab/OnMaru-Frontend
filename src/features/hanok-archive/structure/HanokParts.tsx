'use client';

/*
  부재 일곱 켜의 이름과 하는 일.

  글은 새로 쓰지 않았다. stages.ts가 조립 모달을 위해 이미 들고 있던 해설을 그대로
  본문으로 꺼낸 것이다. 그 글은 카드 → 모달 → 7단계 진행, 세 겹 안쪽에 있었다.
  모달을 여는 사람은 적고 끝까지 돌리는 사람은 더 적어서, 이 도감에서 가장 밀도 높은
  글 1,200자가 화면에 거의 나오지 않았다.

  도감(圖鑑)은 이름을 붙여 주는 책이다. 259곳이 어디 있는지 말하는 섹션은 다섯인데
  한옥이 무엇으로 이루어졌는지 말하는 자리가 본문에 하나도 없었다 — 여기가 그 자리다.

  모달과 같은 순서, 같은 번호를 쓴다. 조립을 본 사람은 여기서 이름을 다시 만나고,
  여기서 먼저 읽은 사람은 모달에서 그 이름이 세워지는 걸 본다.

  그리고 한 줄을 누르면 3D가 '그 켜에서' 열린다.

  이 목록과 3D는 같은 stages.ts를 읽는데도 서로 모르는 사이였다. 글을 읽다 실물이
  궁금해지면 위로 되돌아가 카드를 누르고, 7단계를 처음부터 훑어 그 켜까지 다시
  내려가야 했다. 읽던 자리에서 바로 그 켜로 들어갈 수 있어야 목록이 목차가 된다.
*/

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';

import { meok, palette, lightPalette, fluidHeading, fontSize } from '@/design-system/tokens';
import SectionHeader from '@/features/hanok-archive/components/SectionHeader';
import { STAGES } from './stages';

const HanokAssemblyModal = dynamic(() => import('./HanokAssemblyModal'), { ssr: false });

const Section = styled.section``;

/* 켜를 쌓듯 위에서 아래로 읽힌다. 구분선은 켜와 켜 사이의 자리다. */
const List = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid ${meok[200]};

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.12);
  }
`;

const Item = styled.li`
  border-bottom: 1px solid ${meok[200]};

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.12);
  }
`;

/* 줄 전체가 문이다. 오른쪽 끝의 작은 링크만 누르게 하면 대부분 그게 있는 줄도 모른다. */
const Row = styled.button`
  width: 100%;
  display: grid;
  grid-template-columns: 44px minmax(0, 200px) minmax(0, 1fr);
  gap: clamp(12px, 2vw, 28px);
  align-items: baseline;
  padding: clamp(18px, 2.4vh, 26px) clamp(10px, 1.2vw, 16px);
  margin: 0 clamp(-10px, -1.2vw, -16px);
  border: 0;
  border-radius: 12px;
  background: none;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.18s ease-out;

  &:hover {
    background: rgba(78, 89, 104, 0.04);
  }

  &:focus-visible {
    outline: 2px solid ${meok[900]};
    outline-offset: -2px;
  }

  [data-theme='dark'] &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  [data-theme='dark'] &:focus-visible {
    outline-color: ${meok[100]};
  }

  /* 이름과 설명이 한 줄에 못 들어가는 폭. 번호는 이름 옆에 남긴다. */
  @media (max-width: 720px) {
    grid-template-columns: 32px minmax(0, 1fr);
    gap: 6px 12px;
    row-gap: 8px;
  }
`;

const Step = styled.span`
  font-size: ${fontSize.xs};
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  color: ${meok[400]};
`;

const Name = styled.h3`
  font-family: var(--font-traditional-title);
  margin: 0;
  font-size: ${fluidHeading.label};
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.35;
  color: ${meok[900]};
  word-break: keep-all;

  small {
    font-family: var(--font-traditional-body);
    display: block;
    margin-top: 3px;
    font-size: ${fontSize.xs};
    font-weight: 400;
    letter-spacing: 0.02em;
    color: ${meok[500]};
  }

  [data-theme='dark'] & {
    color: ${meok[100]};

    small {
      color: ${meok[400]};
    }
  }
`;

const Desc = styled.p`
  font-family: var(--font-traditional-body);
  margin: 0;
  font-size: 14.5px;
  font-weight: 400;
  line-height: 1.8;
  color: ${meok[700]};
  word-break: keep-all;

  /* 원문이 볼드로 짚어 둔 구절. 굵기만 올리고 색은 본문과 같이 둔다 —
     일곱 켜에 색이 일곱 번 들어오면 목록이 얼룩진다. */
  strong {
    font-weight: 700;
    color: ${meok[900]};
  }

  @media (max-width: 720px) {
    grid-column: 2;
  }

  [data-theme='dark'] & {
    color: ${meok[400]};

    strong {
      color: ${meok[100]};
    }
  }
`;

/* 누를 수 있다는 표시. 줄에 손을 얹으면 화살표가 한 걸음 나간다. */
const Cue = styled.span`
  /* 3열 그리드의 넷째 칸이라 그냥 두면 번호 아래로 떨어진다. 설명 밑에 붙인다. */
  grid-column: 3;
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${lightPalette.juhong[500]};

  [data-theme='dark'] & {
    color: ${palette.juhong[400]};
  }

  span {
    transition: transform 0.18s ease-out;
  }

  ${Row}:hover & span {
    transform: translateX(3px);
  }

  @media (max-width: 720px) {
    grid-column: 2;
  }
`;

/**
 * stages.ts의 해설은 **강조** 표기를 그대로 담고 있다.
 * 마크다운 파서를 들일 일이 아니라 별 두 개로 끊어 번갈아 굵히면 된다.
 */
function emphasize(text: string) {
  return text.split('**').map((chunk, i) =>
    i % 2 === 1 ? <strong key={i}>{chunk}</strong> : <React.Fragment key={i}>{chunk}</React.Fragment>,
  );
}

export default function HanokParts() {
  // null이면 닫힌 상태. 숫자는 그 켜에서 열린 3D다 (0은 유효한 켜라 falsy로 보면 안 된다).
  const [openStage, setOpenStage] = useState<number | null>(null);

  return (
    <Section aria-labelledby="hanok-parts-heading">
      <SectionHeader
        id="hanok-parts-heading"
        title="일곱 켜, 이름과 하는 일"
        subtitle="한 줄을 누르면 그 켜가 선 3D로 들어갑니다"
      />

      <List>
        {STAGES.map((stage, i) => (
          <Item key={stage.id}>
            <Row type="button" onClick={() => setOpenStage(i)}>
              <Step aria-hidden="true">{String(stage.step).padStart(2, '0')}</Step>
              <Name>
                {stage.nameKo}
                <small>{stage.nameEn}</small>
              </Name>
              <Desc>{emphasize(stage.desc)}</Desc>
              <Cue>
                {stage.nameKo} 세우는 것 보기 <span aria-hidden="true">→</span>
              </Cue>
            </Row>
          </Item>
        ))}
      </List>

      {openStage !== null && (
        <HanokAssemblyModal initialStage={openStage} onClose={() => setOpenStage(null)} />
      )}
    </Section>
  );
}
