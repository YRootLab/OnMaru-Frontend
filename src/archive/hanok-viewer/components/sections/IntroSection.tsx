'use client';

import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ─────────────────────────────────────────
// Styled Components
// ─────────────────────────────────────────

const Outer = styled.div`
  position: relative;
  width: 100%;
`;

const Inner = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0a0908;
  overflow: hidden;
`;

const Center = styled.div`
  position: relative;
  width: 100%;
  max-width: 90vw;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
`;

const PhraseContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  max-width: 90vw;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35em;
  flex-wrap: wrap;
  padding: 0 24px;
  visibility: hidden;
  opacity: 0;
  will-change: opacity, transform, visibility;
`;

const Word = styled.span`
  display: inline-block;
  font-family: 'MaruBuri', 'SpoqaHanSansNeo', serif;
  font-size: clamp(28px, 5vw, 64px);
  font-weight: 700;
  color: #f4efe4;
  line-height: 1.35;
  letter-spacing: -0.03em;
  text-shadow: 0 0 20px rgba(244, 239, 228, 0.4);
  will-change: opacity, transform;
`;

const DotWord = styled(Word)`
  color: #d4af37;
  font-weight: 400;
  text-shadow: 0 0 20px rgba(212, 175, 55, 0.4);
`;

const PeriodWord = styled(Word)`
  color: #d4af37;
  text-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
`;

// [0.85~1.00] 배경색 #0A0908 -> #F7F2E9 커스텀 라디얼 그라데이션 전환 오버레이
const BrightenOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 40%,
    #f9f5f0 0%,
    #f7f2e9 50%,
    #ede4d6 100%
  );
  pointer-events: none;
  z-index: 20;
  opacity: 0;
  will-change: opacity;
`;


// ─────────────────────────────────────────
// prefers-reduced-motion용 폴백
// ─────────────────────────────────────────
const ReducedSection = styled.section`
  width: 100%;
  min-height: 100vh;
  background-color: #0a0908;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 48px;
  padding: 80px 24px;
  font-family: 'MaruBuri', 'SpoqaHanSansNeo', serif;
  font-size: clamp(24px, 4vw, 48px);
  color: #f4efe4;
  text-align: center;
  text-shadow: 0 0 20px rgba(244, 239, 228, 0.4);
`;

const ReducedPhrase = styled.p<{ delay?: number }>`
  margin: 0;
  opacity: 0;
  animation: fadeInUp 0.5s ease forwards;
  animation-delay: ${({ delay = 0 }) => delay}s;
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// ─────────────────────────────────────────
// 단어 데이터 (렌더링 시 1회 계산)
// ─────────────────────────────────────────
const S1_WORDS = ['단', '하나의', '선도', '우연이', '아닙니다.'];

type TagItem = { text: string; isDot: boolean };
const S2_ITEMS: TagItem[] = [
  { text: '기와', isDot: false },
  { text: '·', isDot: true },
  { text: '마루', isDot: false },
  { text: '·', isDot: true },
  { text: '처마', isDot: false },
];

const S3_WORDS = ['자연을', '다루는', '가장', '치밀한', '계산입니다'];

export default function IntroSection() {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const phrase1Ref = useRef<HTMLDivElement>(null);
  const phrase2Ref = useRef<HTMLDivElement>(null);
  const phrase3Ref = useRef<HTMLDivElement>(null);

  const s1Refs = useRef<(HTMLSpanElement | null)[]>([]);
  const s2Refs = useRef<(HTMLSpanElement | null)[]>([]);
  const s3Refs = useRef<(HTMLSpanElement | null)[]>([]);
  const periodRef = useRef<HTMLSpanElement | null>(null);

  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (prefersReduced) return;

    const outer = outerRef.current;
    const inner = innerRef.current;
    const overlay = overlayRef.current;
    const p1 = phrase1Ref.current;
    const p2 = phrase2Ref.current;
    const p3 = phrase3Ref.current;

    if (!outer || !inner || !p1 || !p2 || !p3) return;

    const s1 = s1Refs.current.filter(Boolean) as HTMLSpanElement[];
    const s2 = s2Refs.current.filter(Boolean) as HTMLSpanElement[];
    const s3 = s3Refs.current.filter(Boolean) as HTMLSpanElement[];
    const period = periodRef.current;

    const ctx = gsap.context(() => {
      // ── 초기 상태 설정 (autoAlpha: 0으로 가시성 및 클릭 차단) ──
      gsap.set([p1, p2, p3], { autoAlpha: 0 });
      gsap.set([...s1, ...s2, ...s3], { opacity: 0, y: 10 });
      if (period) gsap.set(period, { opacity: 0, scale: 0.8 });
      if (overlay) gsap.set(overlay, { opacity: 0 });


      // GSAP 타임라인 (전체 duration = 1.0 단위 스크롤 프로그레스 매핑)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: outer,
          pin: inner,
          pinnedContainer: outer,
          start: 'top top',
          end: '+=150%',
          scrub: 1,
        },
      });

      // ─────────────────────────────────────────
      // 0.00 ~ 0.05 : 모든 텍스트 opacity 0 유지 (침묵)
      // ─────────────────────────────────────────
      tl.to({}, { duration: 0.05 });

      // ─────────────────────────────────────────
      // 0.05 ~ 0.15 : "단 하나의 선도 우연이 아닙니다." 노출
      //   - 구간 0.10 시간 내 5개 단어가 순차적으로 등장하도록 stagger 배치
      //   - Phrase 1 컨테이너 활성화 (autoAlpha: 1)
      // ─────────────────────────────────────────
      tl.set(p1, { autoAlpha: 1 }, 0.05);
      tl.to(
        s1,
        {
          opacity: 1,
          y: 0,
          stagger: 0.018, // 5개 단어 * 0.018 = 0.09s 동안 배치
          ease: 'power2.out',
          duration: 0.04,
        },
        0.05
      );

      // ─────────────────────────────────────────
      // 0.15 ~ 0.30 : 문장 1 그대로 유지 (opacity 1)
      // ─────────────────────────────────────────
      tl.to({}, { duration: 0.15 }, 0.15);

      // ─────────────────────────────────────────
      // 0.30 ~ 0.40 : 문장 1 페이드아웃 (opacity 1->0, y: 0->-20px)
      // ─────────────────────────────────────────
      tl.to(
        s1,
        {
          opacity: 0,
          y: -20,
          ease: 'power2.in',
          duration: 0.08,
        },
        0.30
      );
      // 0.39 시점에 Phrase 1을 완전 차단 (autoAlpha: 0)하여 문장 2와 절대 겹치지 않게 함
      tl.set(p1, { autoAlpha: 0 }, 0.39);

      // ─────────────────────────────────────────
      // 0.40 ~ 0.55 : "기와 · 마루 · 처마" 노출 (stagger 0.025로 0.15s 구간 내 배치)
      // ─────────────────────────────────────────
      tl.set(p2, { autoAlpha: 1 }, 0.40);
      tl.to(
        s2,
        {
          opacity: 1,
          y: 0,
          stagger: 0.025,
          ease: 'power2.out',
          duration: 0.04,
        },
        0.40
      );

      // ─────────────────────────────────────────
      // 0.55 ~ 0.65 : 문장 2 페이드아웃 후 완전한 검정 침묵 구간
      // ─────────────────────────────────────────
      tl.to(
        s2,
        {
          opacity: 0,
          y: -20,
          ease: 'power2.in',
          duration: 0.06,
        },
        0.55
      );
      tl.set(p2, { autoAlpha: 0 }, 0.64);

      // ─────────────────────────────────────────
      // 0.65 ~ 0.85 : "자연을 다루는 가장 치밀한 계산입니다." 노출
      //   - 단어 stagger 노출 후 마침표(.) 바운스 애니메이션
      // ─────────────────────────────────────────
      tl.set(p3, { autoAlpha: 1 }, 0.65);
      tl.to(
        s3,
        {
          opacity: 1,
          y: 0,
          stagger: 0.02,
          ease: 'power2.out',
          duration: 0.04,
        },
        0.65
      );

      // 마침표(.) stagger 시퀀스 직후 바운스 (0.75 ~ 0.83)
      if (period) {
        tl.to(
          period,
          {
            opacity: 1,
            scale: 1.05,
            ease: 'back.out(2)',
            duration: 0.05,
          },
          0.74
        );
        tl.to(
          period,
          {
            scale: 1.0,
            ease: 'power1.out',
            duration: 0.04,
          },
          0.79
        );
      }

      // ─────────────────────────────────────────
      // 0.85 ~ 1.00 : 문장 3 페이드아웃 + radial-gradient 배경 오버레이 전환
      const s3Elements = [...s3, ...(period ? [period] : [])];
      tl.to(
        s3Elements,
        {
          opacity: 0,
          y: -20,
          ease: 'power2.in',
          duration: 0.06,
        },
        0.85
      );
      tl.set(p3, { autoAlpha: 0 }, 0.92);

      if (overlay) {
        tl.to(
          overlay,
          {
            opacity: 1,
            ease: 'power1.inOut',
            duration: 0.15,
          },
          0.85
        );
      }
    });

    return () => ctx.revert();
  }, [prefersReduced]);

  if (prefersReduced) {
    return (
      <ReducedSection id="intro-section">
        <ReducedPhrase delay={0}>단 하나의 선도 우연이 아닙니다.</ReducedPhrase>
        <ReducedPhrase delay={0.3} style={{ color: '#d4af37' }}>
          기와 · 마루 · 처마
        </ReducedPhrase>
        <ReducedPhrase delay={0.6}>
          자연을 다루는 가장 치밀한 계산입니다.
        </ReducedPhrase>
      </ReducedSection>
    );
  }

  return (
    <Outer id="intro-section" ref={outerRef}>
      <Inner ref={innerRef}>
        {/* 커스탈 라디얼 그라데이션 전환 오버레이 */}
        <BrightenOverlay ref={overlayRef} />

        <Center>

          {/* Phrase 1: "단 하나의 선도 우연이 아닙니다." */}
          <PhraseContainer ref={phrase1Ref}>
            {S1_WORDS.map((word, i) => (
              <Word
                key={`s1-${i}`}
                ref={(el) => {
                  s1Refs.current[i] = el;
                }}
              >
                {word}
              </Word>
            ))}
          </PhraseContainer>

          {/* Phrase 2: "기와 · 마루 · 처마" */}
          <PhraseContainer ref={phrase2Ref}>
            {S2_ITEMS.map((item, i) =>
              item.isDot ? (
                <DotWord
                  key={`s2-${i}`}
                  ref={(el) => {
                    s2Refs.current[i] = el;
                  }}
                >
                  {item.text}
                </DotWord>
              ) : (
                <Word
                  key={`s2-${i}`}
                  ref={(el) => {
                    s2Refs.current[i] = el;
                  }}
                >
                  {item.text}
                </Word>
              )
            )}
          </PhraseContainer>

          {/* Phrase 3: "자연을 다루는 가장 치밀한 계산입니다." */}
          <PhraseContainer ref={phrase3Ref}>
            {S3_WORDS.map((word, i) => (
              <Word
                key={`s3-${i}`}
                ref={(el) => {
                  s3Refs.current[i] = el;
                }}
              >
                {word}
              </Word>
            ))}
            <PeriodWord
              ref={(el) => {
                periodRef.current = el;
              }}
            >
              .
            </PeriodWord>
          </PhraseContainer>
        </Center>
      </Inner>
    </Outer>
  );
}
