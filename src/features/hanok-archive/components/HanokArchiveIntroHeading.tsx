'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import styled from '@emotion/styled';
import { lightPalette, meok, typographyRole } from '@/design-system/tokens';

const Kicker = styled.p`
  margin: 0 0 16px;
  color: ${meok[500]};
  font-size: ${typographyRole.label.fontSize};
  font-weight: 600;
  letter-spacing: 0.02em;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;


const Title = styled.h1`
  /* ponytail: 예외 — Dohyun 폰트 아카이브 인트로 타이틀, 브랜드 감성 의도적 크기 */
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
  const t = useTranslations('hanok.intro');
  return (
    <>
      <Kicker>{t('kicker', { total })}</Kicker>
      <Title>
        <Accent>{t('titleMain')}</Accent>
        {t('titleSuffix')}
      </Title>
    </>
  );
}
