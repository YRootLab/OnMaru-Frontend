'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

import { lightPalette, meok } from '@/design-system/tokens';
import SHADOW from '@/data/solarShadow.json';

import { usePrefersReducedMotion } from './LandingSectionFrame';

const FONT = "'Spoqa Han Sans Neo', -apple-system, BlinkMacSystemFont, sans-serif";

const START = 0.84;

const COUNT_AT = 0.28;
const COUNT_MS = 1200;

const CACHE_KEY = 'onmaru_hanok_total';







function readCachedTotal() {
  try {
    const cached = Number(sessionStorage.getItem(CACHE_KEY));
    if (Number.isFinite(cached) && cached > 0) return cached;
  } catch {

  }

  return undefined;
}











function reveal(localProgress, start, end, reduced) {
  const t = Math.min(1, Math.max(0, (localProgress - start) / (end - start)));
  const eased = 1 - (1 - t) ** 3;

  return {
    opacity: eased,

    transform: reduced ? 'none' : `translateY(${(1 - eased) * 16}px)`,
  };
}







function getNextSolarTerm(now = new Date()) {
  const year = now.getFullYear();

  const dated = [year, year + 1].flatMap((y) =>
    (SHADOW.stops || []).map((term) => ({ name: term.name, date: new Date(y, term.month - 1, term.day) })),
  );

  const next = dated.filter((term) => term.date >= now).sort((a, b) => a.date - b.date)[0];
  if (!next) return null;

  return {
    name: next.name,
    daysLeft: Math.ceil((next.date - now) / 86400000),
  };
}

const nextMonthOf = (now = new Date()) => ((now.getMonth() + 1) % 12) + 1;





const pulse = keyframes`
  0%, 100% { opacity: 0.45; }
  50%      { opacity: 0.9; }
`;





const Stage = styled.section`
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: safe center;
  gap: clamp(32px, 4vh, 56px);
  padding: 6vh 6vw;
  overflow-y: auto;
  font-family: ${FONT};

  @media (max-width: 768px) {
    padding: 4vh 20px;
    gap: clamp(20px, 3vh, 32px);
  }






  @media (max-height: 860px) {
    padding: 2vh 6vw;
    gap: clamp(8px, 1.4vh, 16px);
  }
`;

const Block = styled.div`
  width: 100%;
  max-width: 880px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;



const Headline = styled.h2`
  margin: 0;
  font-size: clamp(32px, 4.2vw, 58px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.25;
  word-break: keep-all;
  color: ${meok[900]};

  @media (max-height: 860px) {
    font-size: clamp(26px, 2.8vw, 40px);
  }
`;





const Source = styled.p`
  margin: 14px 0 0;
  font-size: clamp(12px, 1.1vw, 14px);
  font-weight: 400;
  line-height: 1.7;
  color: ${meok[500]};
  word-break: keep-all;

  span + span::before {
    content: '';
    display: block;
  }

  @media (max-height: 860px) {
    margin-top: 8px;

    span + span::before {
      content: ' · ';
      display: inline;
    }
  }
`;



const Lead = styled.p`
  margin: 0 0 16px;
  font-size: clamp(18px, 2vw, 26px);
  font-weight: 500;
  color: ${meok[700]};

  @media (max-height: 860px) {
    margin-bottom: 6px;
    font-size: clamp(16px, 1.6vw, 20px);
  }
`;

const CountLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: ${meok[500]};
`;

const CountValue = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin: 8px 0;
  font-size: clamp(48px, 8vw, 120px);
  font-weight: 700;
  letter-spacing: -0.04em;
  color: ${lightPalette.juhong[500]};

  font-variant-numeric: tabular-nums;

  @media (max-width: 768px) {
    font-size: clamp(40px, 12vw, 72px);
  }

  @media (max-height: 860px) {
    margin: 2px 0;
    font-size: clamp(32px, 4vw, 52px);
  }
`;

const Unit = styled.span`
  margin-left: 6px;
  font-size: 0.45em;
`;

const CountFallback = styled.span`
  font-size: 0.5em;
`;

const Skeleton = styled.div`
  width: 180px;
  height: 0.8em;
  border-radius: 8px;
  background: rgba(78, 89, 104, 0.08);
  animation: ${pulse} 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const CountSource = styled.span`
  font-size: 11px;
  color: ${meok[400]};
`;


const SrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  white-space: nowrap;
  clip-path: inset(50%);
`;



const Doors = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(16px, 2vw, 28px);
  width: 100%;
  max-width: 880px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;







const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 240px;
  padding: clamp(24px, 3vw, 36px) clamp(20px, 2.6vw, 32px);
  border-radius: 18px;
  text-decoration: none;
  cursor: pointer;
  background: rgba(25, 31, 40, 0.03);
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s ease;

  &[data-primary='true'] {
    background: rgba(232, 90, 24, 0.05);
    border-color: rgba(232, 90, 24, 0.24);
  }

  &:hover {
    transform: translateY(-6px);
  }

  &:focus-visible {
    outline: 2px solid ${lightPalette.juhong[500]};
    outline-offset: 3px;
  }

  @media (max-width: 768px) {
    min-height: 180px;


    &[data-primary='true'] {
      order: -1;
    }
  }

  @media (max-height: 860px) {
    min-height: 0;
    padding: 16px 18px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: box-shadow 0.3s ease;

    &:hover {
      transform: none;
    }
  }
`;

const CardTag = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: ${meok[700]};

  [data-primary='true'] & {
    color: ${lightPalette.juhong[500]};
  }
`;

const CardTitle = styled.h3`
  margin: 12px 0 8px;
  font-size: clamp(22px, 2.6vw, 30px);
  font-weight: 700;
  line-height: 1.35;
  white-space: pre-line;
  word-break: keep-all;
  color: ${meok[900]};
`;

const CardDesc = styled.p`
  margin: 0;
  font-size: 13px;
  font-weight: 400;
  color: ${meok[500]};
`;

const CardAction = styled.span`
  margin-top: 16px;
  font-size: 15px;
  font-weight: 500;
  color: ${meok[700]};

  [data-primary='true'] & {
    color: ${lightPalette.juhong[500]};
  }
`;



const NextVisit = styled.div`
  width: 100%;
  max-width: 480px;
  padding: 24px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);

  @media (max-width: 768px) {
    padding: 20px;
  }

  @media (max-height: 860px) {
    padding: 16px 20px;
  }
`;

const NextVisitTitle = styled.h4`
  margin: 0 0 16px;

  @media (max-height: 860px) {
    margin-bottom: 10px;
  }
  font-size: 15px;
  font-weight: 500;
  color: ${meok[700]};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  & + & {
    margin-top: 10px;
  }

  @media (max-height: 860px) {
    & + & {
      margin-top: 6px;
    }
  }
`;

const RowLabel = styled.span`
  font-size: 14px;
  font-weight: 400;
  color: ${meok[500]};
`;

const RowValue = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${meok[700]};

  &[data-accent='true'] {
    color: ${lightPalette.juhong[500]};
  }
`;

const AutoNote = styled.p`
  margin: 16px 0 0;
  padding-top: 14px;
  border-top: 1px solid rgba(78, 89, 104, 0.1);
  font-size: 12px;
  text-align: center;
  color: ${meok[400]};

  @media (max-height: 860px) {
    margin-top: 8px;
    padding-top: 8px;
  }
`;





export default function LandingCallToAction({ progress }) {
  const reduced = usePrefersReducedMotion();


  const [total, setTotal] = useState(readCachedTotal);
  const [counted, setCounted] = useState(0);
  const started = useRef(false);

  const term = useMemo(() => getNextSolarTerm(), []);
  const nextMonth = useMemo(() => nextMonthOf(), []);






  const localProgress = Math.min(1, Math.max(0, (progress - START) / (1 - START)));

  useEffect(() => {
    if (total !== undefined) return;

    fetch('/api/tour/summary')
      .then((response) => response.json())
      .then((data) => {
        const value = Number(data?.total);


        if (!Number.isFinite(value) || value <= 0) throw new Error('total 없음');

        setTotal(value);
        sessionStorage.setItem(CACHE_KEY, String(value));
      })
      .catch(() => setTotal(null));
  }, [total]);


  useEffect(() => {
    if (started.current || reduced) return undefined;
    if (localProgress < COUNT_AT || typeof total !== 'number') return undefined;

    started.current = true;

    const startedAt = performance.now();
    let frame = 0;

    const tick = (now) => {
      const t = Math.min(1, (now - startedAt) / COUNT_MS);
      const eased = 1 - 2 ** (-10 * t);

      setCounted(Math.round(total * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [localProgress, total, reduced]);

  if (progress < START) return null;


  const shown = reduced ? total ?? 0 : counted;
  const settled = typeof total === 'number' && shown >= total;

  const termValue = (() => {
    if (!term) return '—';
    if (term.daysLeft === 0) return `${term.name} 오늘`;
    if (term.daysLeft === 1) return `${term.name} 내일`;
    return `${term.name}까지 ${term.daysLeft}일`;
  })();

  return (
    <Stage aria-label="온마루 둘러보기">
      {}
      <Block>
        <Headline style={reveal(localProgress, 0.02, 0.12, reduced)}>이 집은, 실재합니다.</Headline>

        <Source style={reveal(localProgress, 0.08, 0.18, reduced)}>
          <span>서울 계동 · 1930년대</span>
          <span>국가유산청 3D 실측 데이터 · 공공누리 제1유형</span>
        </Source>
      </Block>

      {}
      <Block>
        <Lead style={reveal(localProgress, 0.2, 0.28, reduced)}>그리고 이런 집들이,</Lead>

        <Block style={reveal(localProgress, 0.26, 0.38, reduced)}>
          <CountLabel>전국 한옥 숙소</CountLabel>

          <CountValue aria-hidden="true">
            {total === undefined && <Skeleton />}
            {total === null && <CountFallback>전국 곳곳에</CountFallback>}
            {typeof total === 'number' && (
              <>
                {shown.toLocaleString('ko-KR')}
                <Unit>곳</Unit>
              </>
            )}
          </CountValue>

          <SrOnly role="status" aria-live="polite">
            {settled ? `전국 한옥 숙소 ${total.toLocaleString('ko-KR')}곳` : ''}
          </SrOnly>

          {total !== null && <CountSource>한국관광공사 실시간 데이터</CountSource>}
        </Block>
      </Block>

      {}
      <Doors>
        <Card
          href="/hanok"
          aria-label="한옥 구조 알아보기 페이지로 이동"
          style={reveal(localProgress, 0.46, 0.6, reduced)}
        >
          <div>
            <CardTag>더 알아보기</CardTag>
            <CardTitle>{'한옥은 어떻게\n지어졌는가'}</CardTitle>
            <CardDesc>구조 · 온돌 · 창호</CardDesc>
          </div>

          <CardAction>한옥 이야기 →</CardAction>
        </Card>

        <Card
          href="/map"
          data-primary="true"
          aria-label="전국 한옥 숙소 지도 페이지로 이동"
          style={reveal(localProgress, 0.5, 0.64, reduced)}
        >
          <div>
            <CardTag>가보기</CardTag>
            <CardTitle>{'전국 한옥 숙소를\n지도에서'}</CardTitle>
            <CardDesc>
              {typeof total === 'number'
                ? `${total.toLocaleString('ko-KR')}곳 · 실시간`
                : '실시간 연동'}
            </CardDesc>
          </div>

          <CardAction>지도 열기 →</CardAction>
        </Card>
      </Doors>

      {}
      <NextVisit style={reveal(localProgress, 0.82, 0.94, reduced)}>
        <NextVisitTitle>다음에 오시면, 달라져 있습니다</NextVisitTitle>

        <Row>
          <RowLabel>○ 오늘의 볕</RowLabel>
          <RowValue data-accent="true">매일 갱신</RowValue>
        </Row>

        <Row>
          <RowLabel>○ 절기 알림</RowLabel>
          <RowValue>{termValue}</RowValue>
        </Row>

        <Row>
          <RowLabel>○ 이 달의 한옥</RowLabel>
          <RowValue>{`${nextMonth}월 1일 교체`}</RowValue>
        </Row>

        <AutoNote>한국관광공사 데이터를 기반으로 자동으로 갱신됩니다.</AutoNote>
      </NextVisit>
    </Stage>
  );
}
