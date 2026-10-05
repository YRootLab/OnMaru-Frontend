'use client';

import React from 'react';
import styled from '@emotion/styled';
import { fontSize, lightPalette, meok } from '@/design-system/tokens';

const Kicker = styled.p`
  margin: 0 0 16px;
  color: ${meok[500]};
  font-size: ${fontSize.xs};
  font-weight: 600;
  letter-spacing: 0.02em;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;


const Title = styled.h1`
  --section-heading-size: clamp(24px,3.2vw,36px);
  width: fit-content;
  margin: 0 0 14px;
  background-image: linear-gradient(to right, #211e19, #403b35, #6a6158);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  font-family: 'Dohyun', var(--font-dohyun), sans-serif;
  font-size: var(--section-heading-size);
  font-weight: 400;
  letter-spacing: -0.04em;
  line-height: 1.1;
  text-align: left;
  word-break: keep-all;

  [data-theme='dark'] & {
    background-image: linear-gradient(to right, #ffffff, #d9d9d7, #b0b8c1);
  }
`;

const Accent = styled.span`
  color: ${lightPalette.juhong[500]};
  -webkit-text-fill-color: ${lightPalette.juhong[500]};

  [data-theme='dark'] & {
    color: ${lightPalette.juhong[400]};
    -webkit-text-fill-color: ${lightPalette.juhong[400]};
  }
`;

interface HanokArchiveIntroHeadingProps {
  total: number;
}

export default function HanokArchiveIntroHeading({ total }: HanokArchiveIntroHeadingProps) {
  return (
    <>
      <Kicker>사라지기 전에 기록한다 · 전국 {total}곳</Kicker>
      <Title><Accent>지금 한옥</Accent>은 어디에 남아&nbsp;있을까?</Title>
    </>
  );
}
