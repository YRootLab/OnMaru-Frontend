'use client';

import { useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { lightPalette, meok, surface } from '@/design-system/tokens';
import { useMapStore } from '@/map/hooks/useMapStore';
import { SNAP_CSS } from '@/map/components/BottomSheet';
import type { SheetSnap } from '@/map/types';

/**
 * 날짜 스크러버.
 *
 * 히트맵이 답하던 질문은 "지금 어디가 붐비나"였다. 한옥에 가려는 사람의 질문은
 * "언제 가면 조용한가"에 가깝다. 그래서 날짜를 축으로 꺼내 직접 문지르게 한다.
 *
 * 막대 서른 개는 컨트롤이면서 동시에 그래프다 — 높이가 그날 이 화면 권역의
 * 평균 혼잡도라, 끄는 물건과 읽는 물건이 하나다. 설명용 차트를 옆에 따로 두지 않는다.
 *
 * 날짜는 지어내지 않는다. 관광공사 데이터랩이 실제로 채워둔 날만 들어오고,
 * 이 피드는 한 달가량 지연되므로 축의 오른쪽 끝이 곧 '가장 최근'이다.
 */

const FONT =
  "'Pretendard', 'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif";

interface DateScrubberProps {
  embedded?: boolean;
}

const Root = styled.div<{ $panelOpen: boolean; $snap: SheetSnap; $embedded?: boolean }>`
  ${({ $embedded, $panelOpen, $snap }) =>
    $embedded
      ? `
        position: relative;
        width: 100%;
        box-sizing: border-box;
        padding: 14px 16px 12px;
        border-radius: 18px;
        background: #f8f6f0;
        border: none;
        box-shadow: none;

        [data-theme='dark'] & {
          background: #25221d;
        }
      `
      : `
        position: absolute;
        bottom: 20px;
        left: ${$panelOpen ? '452px' : '96px'};
        right: 24px;
        max-width: 720px;
        z-index: 16;
        padding: 12px 16px 10px;
        border-radius: 16px;
        background: ${surface.light.card};
        box-shadow: 0 6px 24px -4px rgba(0, 0, 0, 0.14);
        transition: left 0.25s cubic-bezier(0.16, 1, 0.3, 1);

        [data-theme='dark'] & {
          background: ${surface.dark.surface};
          box-shadow: 0 6px 24px -4px rgba(0, 0, 0, 0.6);
        }

        @media (max-width: 1023px) {
          left: 12px;
          right: 12px;
          bottom: calc(${SNAP_CSS[$snap]} + 12px);
          max-width: none;
          gap: 6px;
          padding: 10px 12px 8px;
          transition: bottom 0.4s cubic-bezier(0.32, 0.72, 0, 1);
          ${$snap === 'full' ? 'display: none;' : ''}
        }
      `}

  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: ${FONT};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Head = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
`;

const Stamp = styled.p`
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: ${meok[900]};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }

  span {
    margin-left: 6px;
    font-size: 12.5px;
    font-weight: 500;
    color: ${meok[500]};
  }
`;

const Verdict = styled.p<{ $tone: 'quiet' | 'busy' | 'flat' }>`
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: ${({ $tone }) =>
    $tone === 'quiet'
      ? lightPalette.cheongrok[500]
      : $tone === 'busy'
        ? lightPalette.juhong[500]
        : meok[500]};
`;

const Track = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 46px;
  cursor: ew-resize;
  touch-action: none;

  &:focus-visible {
    outline: 2px solid ${lightPalette.juhong[500]};
    outline-offset: 4px;
    border-radius: 4px;
  }
`;

const Bar = styled.div<{ $live: boolean }>`
  flex: 1 1 0;
  min-width: 0;
  border-radius: 2px 2px 0 0;
  background: ${({ $live }) => ($live ? meok[900] : 'rgba(78, 89, 104, 0.22)')};
  transition: background 0.12s ease;

  [data-theme='dark'] & {
    background: ${({ $live }) => ($live ? meok[100] : 'rgba(255, 255, 255, 0.18)')};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Ends = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 500;
  color: ${meok[500]};
  font-variant-numeric: tabular-nums;
`;

/* 출처 표기. 좁은 화면에서는 양 끝 날짜에 자리를 내준다. */
const Source = styled.span`
  @media (max-width: 560px) {
    display: none;
  }
`;

function formatDay(ymd: string): string {
  if (ymd.length !== 8) return ymd;
  return `${Number(ymd.slice(4, 6))}월 ${Number(ymd.slice(6, 8))}일`;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export default function DateScrubber({ embedded = false }: DateScrubberProps) {
  const mode = useMapStore((s) => s.mode);
  const heatSpots = useMapStore((s) => s.heatSpots);
  const days = useMapStore((s) => s.heatDays);
  const index = useMapStore((s) => s.heatDayIndex);
  const setIndex = useMapStore((s) => s.setHeatDayIndex);
  const panelOpen = useMapStore((s) => s.panelOpen);
  const sheetSnap = useMapStore((s) => s.sheetSnap);

  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  /*
    막대 높이는 전국 평균이 아니라 지금 화면에 잡힌 권역들의 평균이다.
    지도를 옮기면 리듬이 따라 바뀌어야 이 축이 내 여행과 상관있는 값이 된다.
  */
  const daily = useMemo(() => {
    const withSeries = heatSpots.filter((s) => s.series && s.series.length === days.length);
    if (withSeries.length === 0) return [];

    return days.map((_, d) => {
      const sum = withSeries.reduce((acc, s) => acc + (s.series?.[d] ?? 0), 0);
      return sum / withSeries.length;
    });
  }, [heatSpots, days]);

  if (mode !== 'warmth' || days.length < 2 || daily.length === 0) return null;

  /*
    막대는 0이 아니라 이 기간의 최솟값을 바닥으로 잡는다.
    혼잡도가 44~73 사이에서만 움직이는데 0부터 그리면 전부 비슷한 키가 되어
    주말마다 솟는 리듬 — 이 리본이 존재하는 이유 — 이 뭉개진다.
  */
  const lo = Math.min(...daily);
  const hi = Math.max(...daily);
  const span = Math.max(hi - lo, 1);
  const mid = median(daily);
  const current = daily[index] ?? 0;
  const delta = mid > 0 ? Math.round((current / mid - 1) * 100) : 0;

  const tone = delta <= -6 ? 'quiet' : delta >= 6 ? 'busy' : 'flat';
  const verdict =
    tone === 'quiet'
      ? `평소보다 ${Math.abs(delta)}% 한적`
      : tone === 'busy'
        ? `평소보다 ${delta}% 붐빔`
        : '평소와 비슷함';

  const today = days[index];
  const dayFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return index;
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left) / Math.max(rect.width, 1);
    return Math.round(ratio * (days.length - 1));
  };

  return (
    <Root
      $panelOpen={panelOpen}
      $snap={sheetSnap}
      $embedded={embedded}
      aria-label="날짜별 혼잡도"
    >
      <Head>
        <Stamp>
          {formatDay(today.ymd)}
          {today.weekday ? <span>{today.weekday}</span> : null}
        </Stamp>
        <Verdict $tone={tone} aria-live="polite">
          {verdict}
        </Verdict>
      </Head>

      <Track
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="날짜 선택"
        aria-valuemin={1}
        aria-valuemax={days.length}
        aria-valuenow={index + 1}
        aria-valuetext={`${formatDay(today.ymd)} ${today.weekday} · ${verdict}`}
        onPointerDown={(e) => {
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
          setIndex(dayFromClientX(e.clientX));
        }}
        onPointerMove={(e) => {
          if (dragging) setIndex(dayFromClientX(e.clientX));
        }}
        onPointerUp={(e) => {
          setDragging(false);
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
        }}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={(e) => {
          const step =
            e.key === 'ArrowLeft' || e.key === 'ArrowDown'
              ? -1
              : e.key === 'ArrowRight' || e.key === 'ArrowUp'
                ? 1
                : e.key === 'PageDown'
                  ? -7
                  : e.key === 'PageUp'
                    ? 7
                    : 0;

          if (step !== 0) {
            e.preventDefault();
            setIndex(index + step);
          } else if (e.key === 'Home') {
            e.preventDefault();
            setIndex(0);
          } else if (e.key === 'End') {
            e.preventDefault();
            setIndex(days.length - 1);
          }
        }}
      >
        {daily.map((value, d) => (
          <Bar
            key={days[d].ymd}
            $live={d === index}
            style={{ height: `${18 + ((value - lo) / span) * 82}%` }}
          />
        ))}
      </Track>

      <Ends>
        <span>{formatDay(days[0].ymd)}</span>
        <Source>한국관광 데이터랩 집계일</Source>
        <span>{formatDay(days[days.length - 1].ymd)}</span>
      </Ends>
    </Root>
  );
}
