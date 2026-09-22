'use client';

import React from 'react';
import styled from '@emotion/styled';
import Link from 'next/link';
import { meok, palette, lightPalette, surface, fluidHeading , fontSize } from '@/design-system/tokens';

import { Home, Leaf, ArrowRight } from 'lucide-react';


const Section = styled.section`
  padding: clamp(96px, 13vh, 180px) 0 clamp(48px, 7vh, 96px);
  display: flex;
  justify-content: center;
`;

const Container = styled.div`
  max-width: 860px;
  width: 100%;
  text-align: center;
  margin: 0 auto;
`;

const ManifestoParagraph = styled.h2`
  font-family: var(--font-hanok);
  font-size: ${fluidHeading.feature};
  font-weight: 300;
  line-height: 1.6;
  letter-spacing: -0.015em;
  color: ${meok[900]};
  margin: 0 0 40px;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const InlineIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: clamp(34px, 4.2vw, 48px);
  height: clamp(34px, 4.2vw, 48px);
  border-radius: 50%;
  background: rgba(78, 89, 104, 0.06);
  color: ${lightPalette.juhong[500]};
  margin: 0 6px;
  vertical-align: middle;
  transition: transform 0.2s ease, background-color 0.2s ease;

  &:hover {
    transform: scale(1.15) rotate(6deg);
    background: #ffffff;
    border-color: ${lightPalette.juhong[400]};
  }

  svg {
    width: clamp(16px, 2.2vw, 22px);
    height: clamp(16px, 2.2vw, 22px);
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
  }

  [data-theme='dark'] &:hover {
    background: rgba(255, 255, 255, 0.16);
  }
`;

const HighlightText = styled.span`
  color: ${lightPalette.juhong[500]};
  font-weight: 700;

  [data-theme='dark'] & {
    color: ${palette.juhong[400]};
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const CtaButton = styled(Link, {
  shouldForwardProp: (prop) => prop !== '$primary',
})<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${({ $primary }) =>
    $primary ? lightPalette.juhong[500] : 'rgba(255, 255, 255, 0.9)'};
  color: ${({ $primary }) => ($primary ? '#ffffff' : meok[900])};
  font-size: ${fontSize.sm};
  font-weight: ${({ $primary }) => ($primary ? 700 : 500)};
  padding: 14px 28px;
  border-radius: 9999px;
  border: 1px solid ${({ $primary }) => ($primary ? 'transparent' : 'rgba(78, 89, 104, 0.12)')};
  text-decoration: none;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $primary }) =>
      $primary ? lightPalette.juhong[700] : '#f8fafc'};
    border-color: ${lightPalette.juhong[500]};
    transform: translateY(-2px);
  }

  [data-theme='dark'] & {
    background: ${({ $primary }) =>
      $primary ? lightPalette.juhong[500] : surface.dark.card};
    color: ${({ $primary }) => ($primary ? '#ffffff' : meok[100])};
    border-color: rgba(255, 255, 255, 0.12);
  }

  [data-theme='dark'] &:hover {
    background: ${({ $primary }) =>
      $primary ? lightPalette.juhong[700] : 'rgba(255, 255, 255, 0.12)'};
    border-color: rgba(255, 255, 255, 0.25);
  }
`;

export default function HanokManifestoCta() {
  return (
    <Section id="cta" aria-label="온마루 한옥 매니페스토">
      <Container
      >
        <ManifestoParagraph>
          한옥 <InlineIcon><Home strokeWidth={2} /></InlineIcon>은 지나간 유산이 아니라 지금 우리에게 필요한 쉼터{' '}
          <InlineIcon><Leaf strokeWidth={2} /></InlineIcon>입니다. 수백 년을 버틴 대청마루에{' '}
          <HighlightText>당신의 하루</HighlightText>도 쉬어 갑니다.
        </ManifestoParagraph>

        <ButtonRow>
          <CtaButton href="/map" $primary>
            전국 지도 보기 <ArrowRight size={16} strokeWidth={2} />
          </CtaButton>
          <CtaButton href="#hanok-stays">
            고택 스테이 둘러보기 <ArrowRight size={16} strokeWidth={2} />
          </CtaButton>
        </ButtonRow>
      </Container>
    </Section>
  );
}
