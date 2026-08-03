'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

import { lightPalette, meok } from '@/design-system/tokens';
import SHADOW from '@/data/solarShadow.json';

import { usePrefersReducedMotion } from './LandingSectionFrame';

const FONT = "'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif";

const START = 0.84;

const COUNT_AT = 0.28; // 숫자 블록이 자리를 잡는 지점. 여기서 카운트업이 출발한다.
const COUNT_MS = 1200;

const CACHE_KEY = 'onmaru_hanok_total';

/**
 * 이번 세션에서 이미 받아둔 숙소 수. 없으면 undefined.
 *
 * 렌더 전에 답이 나오는 값이라 초기값으로 읽는다 —
 * effect에서 setState로 밀어넣으면 스켈레톤을 한 번 그린 뒤 다시 그린다.
 */
function readCachedTotal() {
  try {
    const cached = Number(sessionStorage.getItem(CACHE_KEY));
    if (Number.isFinite(cached) && cached > 0) return cached;
  } catch {
    /* 프라이빗 모드 등 — 캐시가 없는 셈 친다 */
  }

  return undefined;
}

// ─────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────

/**
 * 블록 하나의 등장.
 *
 * 스크롤이 매 프레임 값을 바꾸므로 CSS transition을 걸면 뒤늦게 쫓아가며 밀린다.
 * 이징을 여기서 직접 먹이고 결과값만 style로 넣는다.
 */
function reveal(localProgress, start, end, reduced) {
  const t = Math.min(1, Math.max(0, (localProgress - start) / (end - start)));
  const eased = 1 - (1 - t) ** 3; // easeOutCubic

  return {
    opacity: eased,
    // 모션을 줄인 사용자에게는 투명도만 남긴다
    transform: reduced ? 'none' : `translateY(${(1 - eased) * 16}px)`,
  };
}

/**
 * 다음 절기.
 *
 * 올해치와 내년치를 함께 늘어놓고 오늘 이후 가장 가까운 것을 고른다.
 * 12월에 서면 올해 남은 절기가 없으므로 내년 소한이 잡힌다.
 */
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

// ─────────────────────────────────────────
// 스타일
// ─────────────────────────────────────────

const pulse = keyframes`
  0%, 100% { opacity: 0.45; }
  50%      { opacity: 0.9; }
`;

/**
 * justify-content에 safe를 붙인다.
 * 내용이 화면보다 길어지면 그냥 center인 경우 위쪽이 잘려 스크롤로도 못 올라간다.
 */
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

  /*
    노트북 뷰포트(대략 700~860px)에서는 네 블록이 한 화면에 들어오지 않는다.
    스크롤이 이미 문서 끝이라 잘린 부분은 어떤 방법으로도 볼 수 없으므로,
    여기서부터는 여백과 숫자를 줄여 전부 담는다.
  */
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

// ── 1단 — 실재 선언

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

/**
 * 출처 두 줄. 화면이 낮으면 한 줄로 합쳐 세로를 아낀다.
 * 가운데 구분점은 한 줄일 때만 나온다.
 */
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

// ── 2단 — 규모

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
  /* 자릿수가 바뀔 때 숫자가 좌우로 흔들리지 않는다 */
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

/** 카운트업을 한 자리씩 읽어주지 않도록, 다 센 결과만 스크린리더에 한 번 전한다. */
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

// ── 3단 — 두 개의 문

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

/**
 * 카드 두 장.
 *
 * 성격 차이는 data-primary 하나로 가른다 — 커스텀 prop을 styled(Link)에 넘기면
 * next/link가 그대로 <a>에 뿌려 React가 알 수 없는 속성이라고 경고한다.
 */
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
  border: 1px solid rgba(78, 89, 104, 0.16);
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s ease;

  &[data-primary='true'] {
    background: rgba(232, 90, 24, 0.05);
    border-color: rgba(232, 90, 24, 0.24);
  }

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(25, 31, 40, 0.1);
  }

  &:focus-visible {
    outline: 2px solid ${lightPalette.juhong[500]};
    outline-offset: 3px;
  }

  @media (max-width: 768px) {
    min-height: 180px;

    /* 주 행동을 위로 올린다 */
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
  font-weight: 600;
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
  font-weight: 600;
  color: ${meok[700]};

  [data-primary='true'] & {
    color: ${lightPalette.juhong[500]};
  }
`;

// ── 4단 — 다음 방문

const NextVisit = styled.div`
  width: 100%;
  max-width: 480px;
  padding: 24px;
  border: 1px solid rgba(78, 89, 104, 0.18);
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
  font-weight: 600;
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

// ─────────────────────────────────────────
// Beat6_Invite
// ─────────────────────────────────────────

export default function LandingCallToAction({ progress }) {
  const reduced = usePrefersReducedMotion();

  // undefined = 아직 모름, null = 못 가져옴, number = 확인된 값
  const [total, setTotal] = useState(readCachedTotal);
  const [counted, setCounted] = useState(0);
  const started = useRef(false);

  const term = useMemo(() => getNextSolarTerm(), []);
  const nextMonth = useMemo(() => nextMonthOf(), []);

  /*
    훅은 전부 이 위에 둔다.
    아래 early return보다 뒤에 훅이 하나라도 있으면 progress가 0.84를 넘는 순간
    렌더마다 훅 개수가 달라져 React가 통째로 던진다.
  */
  const localProgress = Math.min(1, Math.max(0, (progress - START) / (1 - START)));

  useEffect(() => {
    if (total !== undefined) return; // 캐시가 이미 답을 줬다

    fetch('/api/tour/summary')
      .then((response) => response.json())
      .then((data) => {
        const value = Number(data?.total);

        // 값이 없으면 지어내지 않는다. 아래 대체 문구로 간다.
        if (!Number.isFinite(value) || value <= 0) throw new Error('total 없음');

        setTotal(value);
        sessionStorage.setItem(CACHE_KEY, String(value));
      })
      .catch(() => setTotal(null));
  }, [total]);

  // 숫자가 자리를 잡는 지점에서 한 번만 센다.
  useEffect(() => {
    if (started.current || reduced) return undefined;
    if (localProgress < COUNT_AT || typeof total !== 'number') return undefined;

    started.current = true;

    const startedAt = performance.now();
    let frame = 0;

    const tick = (now) => {
      const t = Math.min(1, (now - startedAt) / COUNT_MS);
      const eased = 1 - 2 ** (-10 * t); // easeOutExpo

      setCounted(Math.round(total * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [localProgress, total, reduced]);

  if (progress < START) return null;

  // 모션을 줄인 사용자에게는 세는 과정 없이 결과만 보여준다.
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
      {/* 1단 — 실재 선언 */}
      <Block>
        <Headline style={reveal(localProgress, 0.02, 0.12, reduced)}>이 집은, 실재합니다.</Headline>

        <Source style={reveal(localProgress, 0.08, 0.18, reduced)}>
          <span>서울 계동 · 1930년대</span>
          <span>국가유산청 3D 실측 데이터 · 공공누리 제1유형</span>
        </Source>
      </Block>

      {/* 2단 — 규모 */}
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

      {/* 3단 — 두 개의 문 */}
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

      {/* 4단 — 다음 방문 */}
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
