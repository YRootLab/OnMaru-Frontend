'use client';

import React from 'react';
import styled from '@emotion/styled';
import Link from 'next/link';
import { meok, palette, surface, fontSize } from '@/design-system/tokens';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';

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

const ManifestoLabel = styled.div`
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${meok[500]};
  margin-bottom: 24px;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const ManifestoParagraph = styled.h2`
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
  font-size: clamp(24px, 3.8vw, 42px);
  font-weight: 500;
  line-height: 1.58;
  letter-spacing: -0.025em;
  color: ${meok[900]};
  margin: 0 auto 44px;
  max-width: 820px;
  word-break: keep-all;
  text-wrap: balance;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const DesktopBreak = styled.br`
  @media (max-width: 640px) {
    display: none;
  }
`;

const InlineEmoji = styled.span`
  display: inline-block;
  font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', sans-serif;
  font-size: 1.08em;
  line-height: 1;
  vertical-align: -0.08em;
  margin: 0 0.16em;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  user-select: none;
  cursor: default;

  &:hover {
    transform: scale(1.3) rotate(8deg);
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
    $primary ? palette.juhong[500] : '#f5f5f4'};
  color: ${({ $primary }) => ($primary ? '#ffffff' : meok[900])};
  font-size: ${fontSize.sm};
  font-weight: ${({ $primary }) => ($primary ? 700 : 500)};
  padding: 14px 28px;
  border-radius: 9999px;
  border: none;
  text-decoration: none;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $primary }) =>
      $primary ? palette.juhong[600] : '#eaeaea'};
    transform: translateY(-2px);
  }

  [data-theme='dark'] & {
    background: ${({ $primary }) =>
      $primary ? palette.juhong[500] : surface.dark.card};
    color: ${({ $primary }) => ($primary ? '#ffffff' : meok[100])};
    &:hover {
      background: ${({ $primary }) =>
        $primary ? palette.juhong[600] : 'rgba(255, 255, 255, 0.12)'};
    }
  }
`;

export default function HanokManifestoCta() {
  return (
    <Section id="cta" aria-label="온마루 한옥 매니페스토">
      <Container>
        <ManifestoLabel>OnMaru Manifesto</ManifestoLabel>

        <ManifestoParagraph>
          한옥은 지나간 유산이 아니라 지금 우리에게 필요한 쉼터입니다. <DesktopBreak />
          수백 년을 버틴 대청마루에 당신의 하루도 쉬어 갑니다.
        </ManifestoParagraph>

        <ButtonRow>
          <CtaButton href="/map" $primary>
            전국 지도 보기 <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
          </CtaButton>
          <CtaButton href="#hanok-stays">
            한옥 스테이 둘러보기 <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
          </CtaButton>
        </ButtonRow>
      </Container>
    </Section>
  );
}
