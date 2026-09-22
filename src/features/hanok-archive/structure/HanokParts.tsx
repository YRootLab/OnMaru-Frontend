'use client';






















import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';

import { meok, palette, lightPalette, fluidHeading, fontSize } from '@/design-system/tokens';
import SectionHeader from '@/features/hanok-archive/components/SectionHeader';
import { STAGES } from './stages';

const HanokAssemblyModal = dynamic(() => import('./HanokAssemblyModal'), { ssr: false });

const Section = styled.section``;


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


const Cue = styled.span`

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





function emphasize(text: string) {
  return text.split('**').map((chunk, i) =>
    i % 2 === 1 ? <strong key={i}>{chunk}</strong> : <React.Fragment key={i}>{chunk}</React.Fragment>,
  );
}

export default function HanokParts() {

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
