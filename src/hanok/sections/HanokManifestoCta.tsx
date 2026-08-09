'use client';

import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { meok, lightPalette } from '@/design-system/tokens';

import { Home, Leaf, ArrowUpRight, ArrowRight } from 'lucide-react';

const Section = styled.section`
  padding: clamp(60px, 8vh, 120px) 0 clamp(40px, 6vh, 80px);
  display: flex;
  justify-content: center;
`;

const Container = styled(motion.div)`
  max-width: 860px;
  width: 100%;
  text-align: center;
  margin: 0 auto;
`;

const ManifestoParagraph = styled.h2`
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: clamp(22px, 3.6vw, 38px);
  font-weight: 700;
  line-height: 1.6;
  letter-spacing: -0.025em;
  color: ${meok[900]};
  margin: 0 0 40px;
  word-break: keep-all;
`;

const InlineIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: clamp(34px, 4.2vw, 48px);
  height: clamp(34px, 4.2vw, 48px);
  border-radius: 50%;
  background: rgba(78, 89, 104, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: ${lightPalette.kobalt[500]};
  margin: 0 6px;
  vertical-align: middle;
  transition: transform 0.2s ease, background-color 0.2s ease;

  &:hover {
    transform: scale(1.15) rotate(6deg);
    background: #ffffff;
    border-color: ${lightPalette.kobalt[400]};
  }

  svg {
    width: clamp(16px, 2.2vw, 22px);
    height: clamp(16px, 2.2vw, 22px);
  }
`;

const HighlightText = styled.span`
  color: ${lightPalette.kobalt[500]};
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
    $primary ? lightPalette.kobalt[500] : 'rgba(255, 255, 255, 0.9)'};
  color: ${({ $primary }) => ($primary ? '#ffffff' : meok[900])};
  border: 1px solid
    ${({ $primary }) => ($primary ? lightPalette.kobalt[500] : 'rgba(0, 0, 0, 0.12)')};
  font-size: 14.5px;
  font-weight: 700;
  padding: 14px 28px;
  border-radius: 9999px;
  text-decoration: none;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $primary }) =>
      $primary ? lightPalette.kobalt[700] : '#f8fafc'};
    border-color: ${lightPalette.kobalt[500]};
    transform: translateY(-2px);
  }
`;

export default function HanokManifestoCta() {
  return (
    <Section id="cta" aria-label="온마루 한옥 매니페스토">
      <Container
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <ManifestoParagraph>
          한옥 <InlineIcon><Home /></InlineIcon>은 지나간 유산이 아니라 지금의 쉼터{' '}
          <InlineIcon><Leaf /></InlineIcon>입니다. 수백 년을 버틴 대청마루에서{' '}
          <HighlightText>당신의 하루</HighlightText>를 쉬어 가세요.
        </ManifestoParagraph>

        <ButtonRow>
          <CtaButton href="/map" $primary>
            전국 지도 보기 <ArrowUpRight size={16} />
          </CtaButton>
          <CtaButton href="#hanok-stays">
            고택 스테이 둘러보기 <ArrowRight size={16} />
          </CtaButton>
        </ButtonRow>
      </Container>
    </Section>
  );
}
