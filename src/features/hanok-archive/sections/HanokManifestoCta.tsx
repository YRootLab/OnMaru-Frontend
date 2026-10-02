'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styled from '@emotion/styled';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { meok, palette, surface, fontSize } from '@/design-system/tokens';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';

export const MANIFESTO_VARIANTS = [
  // 1. 시간과 위로 (온마루 시그니처)
  [
    '바쁘게 내달리던 걸음을 멈추고',
    '온기를 품은 마루에 기대앉는 순간.',
    '수백 년을 버텨낸 단단한 시간이',
    '당신의 오늘을 포근하게 감싸 안습니다.',
  ],
  // 2. 빛과 여백 (일조 과학과의 연결)
  [
    '창호지 너머로 스며드는 볕이',
    '당신의 짙은 그림자를 옅게 지워내는 시간.',
    '세상의 잣대는 잠시 문밖으로 밀어내고',
    '오직 나만의 숨소리에 집중해 보세요.',
  ],
  // 3. 구조와 응원 (결구 미학과의 연결)
  [
    '수많은 비바람을 견뎌낸 굳건한 기둥이',
    '지친 당신의 어깨에 조용히 곁을 내어줍니다.',
    '견고하게 맞물린 한옥의 결구처럼',
    '당신의 일상도 다시 단단해질 것입니다.',
  ],
  // 4. 여정과 쉼표 (전국 지도와의 연결)
  [
    '계절이 머물다 간 너른 대청마루에',
    '오늘, 당신의 여정도 잠시 쉬어갑니다.',
    '세월이 깎아낸 둥근 문턱을 넘어',
    '가장 당신다운 평온을 되찾아 보세요.',
  ],
] as const;

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

const ManifestoParagraph = styled(motion.h2)`
  font-family: 'Dohyun', 'Pretendard', var(--font-hanok), -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
  font-size: clamp(20px, 3.2vw, 38px);
  font-weight: 400;
  line-height: 1.8;
  letter-spacing: -0.01em;
  text-align: center;
  color: ${meok[900]};
  margin: 0 auto 48px;
  max-width: 820px;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const ManifestoLine = styled.span`
  display: block;
  min-height: 1.8em;
  line-height: 1.8;
  text-align: center;
`;

const Word = styled.span`
  display: inline-block;
  white-space: nowrap;
`;

const CharSpan = styled(motion.span)`
  display: inline-block;
  will-change: opacity, filter;
  backface-visibility: hidden;
  transform: translateZ(0);
`;

const ButtonRow = styled(motion.div)`
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
  const shouldReduceMotion = useReducedMotion();

  // 하이드레이션 불일치 없이 페이지 진입 시마다 4개 테마 중 1개를 랜덤 선택
  const [manifestoLines, setManifestoLines] = useState<readonly [string, string, string, string]>(
    MANIFESTO_VARIANTS[0]
  );

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * MANIFESTO_VARIANTS.length);
    setManifestoLines(MANIFESTO_VARIANTS[randomIndex]);
  }, []);

  // '쉼'의 호흡에 맞추어 사르르 스며드는 극상의 부드러운 딜레이 계산
  const { linesWithDelays, totalDelay } = useMemo(() => {
    let globalDelay = 0.35; // 화면 도달 후 잠시 머무는 고요한 여백
    const STAGGER_STEP = 0.075; // 앞글자가 피어나는 도중 다음 글자가 안개처럼 겹쳐 이어지는 간격
    const LINE_PAUSE = 0.55; // 행과 행 사이 깊은 숨고르기 쉼

    const lines = manifestoLines.map((line, lineIndex) => {
      let isLineFirst = true;
      const words = line.split(' ').map((word) => {
        const chars = word.split('').map((char) => {
          const isManifestoFirst = lineIndex === 0 && isLineFirst;
          isLineFirst = false;

          const delay = globalDelay;
          globalDelay += STAGGER_STEP;
          return {
            char,
            delay,
            isManifestoFirst,
          };
        });
        return { word, chars };
      });
      globalDelay += LINE_PAUSE;
      return { line, words };
    });

    return { linesWithDelays: lines, totalDelay: globalDelay };
  }, [manifestoLines]);

  const charVariants = {
    hidden: ({ isManifestoFirst }: { isManifestoFirst: boolean }) => ({
      // 모든 글자는 시작 전 완전 투명(opacity: 0)하여 2행 이후가 미리 화면에 비치지 않습니다
      opacity: 0,
      filter: isManifestoFirst ? 'blur(2px)' : 'blur(7px)',
      y: 0,
    }),
    visible: ({
      delay,
      isManifestoFirst,
    }: {
      delay: number;
      isManifestoFirst: boolean;
    }) => ({
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            duration: isManifestoFirst ? 0.9 : 1.8, // 첫글자는 0.9초 만에 또렷하게 안착
            delay,
            ease: [0.25, 0.1, 0.25, 1],
          },
    }),
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            delay: totalDelay + 0.3,
            duration: 1.4,
            ease: [0.25, 0.1, 0.25, 1],
          },
    },
  };

  return (
    <Section id="cta" aria-label="온마루 한옥 매니페스토">
      <Container>

        <ManifestoParagraph
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          aria-label={manifestoLines.join(' ')}
        >
          {linesWithDelays.map((lineData, lineIdx) => (
            <ManifestoLine key={lineIdx}>
              {lineData.words.map((wordData, wordIdx) => (
                <React.Fragment key={wordIdx}>
                  <Word>
                    {wordData.chars.map((charData, charIdx) => (
                      <CharSpan
                        key={charIdx}
                        custom={charData}
                        variants={charVariants}
                      >
                        {charData.char}
                      </CharSpan>
                    ))}
                  </Word>
                  {wordIdx < lineData.words.length - 1 && (
                    <span aria-hidden="true">&nbsp;</span>
                  )}
                </React.Fragment>
              ))}
            </ManifestoLine>
          ))}
        </ManifestoParagraph>

        <ButtonRow
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={buttonVariants}
        >
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




