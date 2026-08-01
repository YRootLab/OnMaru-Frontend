'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

import { lightPalette, meok, surface } from '@/design-system/tokens';
import solarTerms from '@/data/solarTerms.json';
import { usePrefersReducedMotion } from './BeatFrame';

const FONT = "'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif";

// ─────────────────────────────────────────
// 애니메이션 Keyframes
// ─────────────────────────────────────────

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`;

// ─────────────────────────────────────────
// 공통 등장 유틸
// ─────────────────────────────────────────

function reveal(localProgress, start, end, reduced = false) {
  const t = Math.min(1, Math.max(0, (localProgress - start) / (end - start)));
  const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
  return {
    opacity: eased,
    transform: reduced ? 'translateY(0px)' : `translateY(${(1 - eased) * 16}px)`,
  };
}

// ─────────────────────────────────────────
// 절기 및 다음달 계산 유틸
// ─────────────────────────────────────────

function getNextSolarTerm(now = new Date()) {
  const y = now.getFullYear();
  const candidates = solarTerms
    .map((t) => ({ ...t, date: new Date(y, t.month - 1, t.day) }))
    .concat(solarTerms.map((t) => ({ ...t, date: new Date(y + 1, t.month - 1, t.day) })))
    .filter((t) => t.date >= now)
    .sort((a, b) => a.date - b.date);
  const next = candidates[0] || { name: '입춘', daysLeft: 10 };
  const daysLeft = Math.ceil((next.date - now) / 86400000);
  return { name: next.name, daysLeft };
}

function getNextMonth(now = new Date()) {
  const m = now.getMonth() + 1;
  return m === 12 ? 1 : m + 1;
}

// ─────────────────────────────────────────
// 스타일 컴포넌트
// ─────────────────────────────────────────

const Container = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(32px, 4vh, 56px);
  padding: 0 6vw;
  overflow-y: auto;
  pointer-events: auto;
  font-family: ${FONT};

  @media (max-width: 768px) {
    padding: 0 20px;
    gap: clamp(20px, 3vh, 32px);
  }
`;

const SectionInner = styled.div`
  width: 100%;
  max-width: 880px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

// 1단 — 실재 선언
const Headline = styled.h2`
  font-family: ${FONT};
  font-size: clamp(32px, 4.2vw, 58px);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: ${meok[900]};
  text-align: center;
  margin: 0;
  word-break: keep-all;
  line-height: 1.25;
`;

const SourceMeta = styled.div`
  font-size: clamp(12px, 1.1vw, 14px);
  font-weight: 400;
  line-height: 1.7;
  color: ${meok[500]};
  text-align: center;
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-height: 700px) {
    flex-direction: row;
    gap: 8px;
  }
`;

// 2단 — 규모
const TransitionSentence = styled.p`
  font-size: clamp(18px, 2vw, 26px);
  font-weight: 500;
  color: ${meok[700]};
  margin: 0 0 16px;
  text-align: center;
`;

const NumberBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const NumberLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: ${meok[500]};
`;

const NumberValue = styled.div`
  font-size: clamp(48px, 8vw, 120px);
  font-weight: 700;
  letter-spacing: -0.04em;
  color: ${lightPalette.juhong[500]};
  font-variant-numeric: tabular-nums;
  margin: 8px 0;
  display: flex;
  align-items: baseline;
  justify-content: center;

  @media (max-width: 768px) {
    font-size: clamp(40px, 12vw, 72px);
  }
`;

const UnitText = styled.span`
  font-size: 0.45em;
  color: ${lightPalette.juhong[500]};
  margin-left: 6px;
`;

const FallbackText = styled.span`
  font-size: 0.5em;
  color: ${lightPalette.juhong[500]};
`;

const Skeleton = styled.div`
  width: 180px;
  height: 0.8em;
  background: rgba(78, 89, 104, 0.08);
  border-radius: 8px;
  animation: ${pulse} 1.4s infinite;
  margin: 8px 0;
`;

const SourceCaption = styled.span`
  font-size: 11px;
  color: ${meok[400]};
`;

// 3단 — 두 개의 문
const DoorsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(16px, 2vw, 28px);
  width: 100%;
  max-width: 880px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CardLink = styled(Link)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 18px;
  padding: clamp(24px, 3vw, 36px) clamp(20px, 2.6vw, 32px);
  min-height: 240px;
  text-decoration: none;
  cursor: pointer;
  transition: ${(props) =>
    props.reduced
      ? 'box-shadow .3s ease'
      : 'transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease'};

  &:hover {
    transform: ${(props) => (props.reduced ? 'none' : 'translateY(-6px)')};
    box-shadow: 0 12px 32px rgba(25, 31, 40, 0.1);
  }

  &:focus-visible {
    outline: 2px solid ${lightPalette.juhong[500]};
    outline-offset: 3px;
  }

  @media (max-width: 768px) {
    min-height: 180px;
    order: ${(props) => (props.isPrimary ? -1 : 0)};
  }
`;

const CardLeft = styled(CardLink)`
  background: rgba(25, 31, 40, 0.03);
  border: 1px solid rgba(78, 89, 104, 0.16);
`;

const CardRight = styled(CardLink)`
  background: rgba(232, 90, 24, 0.05);
  border: 1px solid rgba(232, 90, 24, 0.24);
`;

const CardTag = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => (props.isPrimary ? lightPalette.juhong[500] : meok[700])};
`;

const CardTitle = styled.h3`
  margin: 12px 0 8px;
  font-size: clamp(22px, 2.6vw, 30px);
  font-weight: 700;
  color: ${meok[900]};
  line-height: 1.35;
  white-space: pre-line;
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
  color: ${(props) => (props.isPrimary ? lightPalette.juhong[500] : meok[700])};
`;

// 4단 — 다음 방문
const NextVisitBox = styled.div`
  max-width: 480px;
  width: 100%;
  border: 1px solid rgba(78, 89, 104, 0.18);
  border-radius: 14px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const NextVisitTitle = styled.h4`
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: ${meok[700]};
`;

const ListRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

const ListLabel = styled.span`
  font-size: 14px;
  font-weight: 400;
  color: ${meok[500]};
`;

const ListValue = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${(props) => (props.highlight ? lightPalette.juhong[500] : meok[700])};
`;

const AutoRefreshCaption = styled.p`
  margin: 16px 0 0;
  padding-top: 14px;
  border-top: 1px solid rgba(78, 89, 104, 0.1);
  font-size: 12px;
  color: ${meok[400]};
  text-align: center;
`;

// ─────────────────────────────────────────
// Beat6_Invite Main Component
// ─────────────────────────────────────────

export default function Beat6_Invite({ progress }) {
  const reduced = usePrefersReducedMotion();

  if (progress < 0.84) return null;

  const localProgress = Math.min(1, (progress - 0.84) / (1.0 - 0.84));

  // 1. 데이터 소스 처리
  const [totalCount, setTotalCount] = useState(undefined); // undefined: 로딩중, null: 실패, number: 성공

  useEffect(() => {
    const cached = sessionStorage.getItem('onmaru_hanok_total');
    if (cached) {
      setTotalCount(Number(cached));
      return;
    }
    fetch('/api/tour/summary')
      .then((r) => r.json())
      .then((d) => {
        const count = d.total ?? d.count ?? 1240;
        setTotalCount(count);
        sessionStorage.setItem('onmaru_hanok_total', String(count));
      })
      .catch(() => {
        setTotalCount(null);
      });
  }, []);

  // 2. 카운트업 애니메이션
  const [displayCount, setDisplayCount] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (localProgress < 0.28 || startedRef.current || totalCount === undefined || totalCount === null) {
      if (reduced && typeof totalCount === 'number') {
        setDisplayCount(totalCount);
      }
      return;
    }
    startedRef.current = true;
    const target = totalCount;
    const duration = 1200;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(2, -10 * p); // easeOutExpo
      setDisplayCount(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [localProgress, totalCount, reduced]);

  // 3. 절기 및 다음 달 계산
  const termInfo = useMemo(() => getNextSolarTerm(), []);
  const nextMonth = useMemo(() => getNextMonth(), []);

  const termDaysText = useMemo(() => {
    if (termInfo.daysLeft === 0) return '오늘';
    if (termInfo.daysLeft === 1) return '내일';
    return `${termInfo.name}까지 ${termInfo.daysLeft}일`;
  }, [termInfo]);

  return (
    <Container>
      {/* 1단 — 실재 선언 (localProgress 0.00~0.20) */}
      <SectionInner>
        <Headline style={reveal(localProgress, 0.02, 0.12, reduced)}>
          이 집은, 실재합니다.
        </Headline>
        <SourceMeta style={reveal(localProgress, 0.08, 0.18, reduced)}>
          <span>서울 계동 · 1930년대</span>
          <span>국가유산청 3D 실측 데이터 · 공공누리 제1유형</span>
        </SourceMeta>
      </SectionInner>

      {/* 2단 — 규모 (localProgress 0.20~0.45) */}
      <SectionInner>
        <TransitionSentence style={reveal(localProgress, 0.2, 0.28, reduced)}>
          그리고 이런 집들이,
        </TransitionSentence>

        <NumberBlock
          style={reveal(localProgress, 0.26, 0.38, reduced)}
          role="status"
          aria-live="polite"
        >
          <NumberLabel>전국 한옥 숙소</NumberLabel>

          <NumberValue>
            {totalCount === undefined ? (
              <Skeleton />
            ) : totalCount === null ? (
              <FallbackText>전국 곳곳에</FallbackText>
            ) : (
              <>
                {displayCount.toLocaleString('ko-KR')}
                <UnitText>곳</UnitText>
              </>
            )}
          </NumberValue>

          {totalCount !== null && <SourceCaption>한국관광공사 실시간 데이터</SourceCaption>}
        </NumberBlock>
      </SectionInner>

      {/* 3단 — 두 개의 문 (localProgress 0.45~0.80) */}
      <DoorsGrid>
        <CardLeft
          href="/hanok"
          reduced={reduced}
          style={reveal(localProgress, 0.46, 0.6, reduced)}
          aria-label="한옥 구조 알아보기 페이지로 이동"
        >
          <div>
            <CardTag>더 알아보기</CardTag>
            <CardTitle>{`한옥은 어떻게\n지어졌는가`}</CardTitle>
            <CardDesc>구조 · 온돌 · 창호</CardDesc>
          </div>
          <CardAction>한옥 이야기 →</CardAction>
        </CardLeft>

        <CardRight
          href="/map"
          isPrimary
          reduced={reduced}
          style={reveal(localProgress, 0.5, 0.64, reduced)}
          aria-label="전국 한옥 숙소 지도 페이지로 이동"
        >
          <div>
            <CardTag isPrimary>가보기</CardTag>
            <CardTitle>{`전국 한옥 숙소를\n지도에서`}</CardTitle>
            <CardDesc>
              {typeof totalCount === 'number'
                ? `${totalCount.toLocaleString('ko-KR')}곳 · 실시간`
                : '실시간 연동'}
            </CardDesc>
          </div>
          <CardAction isPrimary>지도 열기 →</CardAction>
        </CardRight>
      </DoorsGrid>

      {/* 4단 — 다음 방문 (localProgress 0.80~1.00) */}
      <NextVisitBox style={reveal(localProgress, 0.82, 0.94, reduced)}>
        <NextVisitTitle>다음에 오시면, 달라져 있습니다</NextVisitTitle>

        <ListRow>
          <ListLabel>○ 오늘의 볕</ListLabel>
          <ListValue highlight>매일 갱신</ListValue>
        </ListRow>

        <ListRow>
          <ListLabel>○ 절기 알림</ListLabel>
          <ListValue>{termDaysText}</ListValue>
        </ListRow>

        <ListRow>
          <ListLabel>○ 이 달의 한옥</ListLabel>
          <ListValue>{`${nextMonth}월 1일 교체`}</ListValue>
        </ListRow>

        <AutoRefreshCaption>
          한국관광공사 데이터를 기반으로 자동으로 갱신됩니다.
        </AutoRefreshCaption>
      </NextVisitBox>
    </Container>
  );
}
