'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { Pause, Play } from 'lucide-react';
import { lightPalette, meok, surface , fontSize } from '@/design-system/tokens';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { SNAP_CSS } from '@/features/map/components/BottomSheet';
import type { SheetSnap } from '@/features/map/types';














const FONT =
  "'Spoqa Han Sans Neo', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif";

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

const HeadLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;








const PlayButton = styled.button<{ $playing: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 9999px;
  cursor: pointer;

  background: ${({ $playing }) => ($playing ? meok[900] : 'rgba(78, 89, 104, 0.1)')};
  color: ${({ $playing }) => ($playing ? '#ffffff' : meok[700])};
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: ${({ $playing }) => ($playing ? meok[900] : 'rgba(78, 89, 104, 0.18)')};
  }

  &:focus-visible {
    outline: 2px solid ${lightPalette.hwanggeum[500]};
    outline-offset: 2px;
  }

  [data-theme='dark'] & {
    background: ${({ $playing }) => ($playing ? meok[100] : 'rgba(255, 255, 255, 0.12)')};
    color: ${({ $playing }) => ($playing ? meok[900] : meok[200])};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Stamp = styled.p`
  margin: 0;
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: ${meok[900]};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }

  span {
    margin-left: 6px;
    font-size: ${fontSize.xs};
    font-weight: 500;
    color: ${meok[500]};
  }
`;

const Verdict = styled.p<{ $tone: 'quiet' | 'busy' | 'flat' }>`
  margin: 0;
  font-size: ${fontSize.sm};
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: ${({ $tone }) =>
    $tone === 'quiet'
      ? lightPalette.hwanggeum[400]
      : $tone === 'busy'
        ? lightPalette.hwanggeum[500]
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
    outline: 2px solid ${lightPalette.hwanggeum[500]};
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
  font-size: ${fontSize.micro};
  font-weight: 500;
  color: ${meok[500]};
  font-variant-numeric: tabular-nums;
`;


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
  const [playing, setPlaying] = useState(false);






  useEffect(() => {
    if (!playing || mode !== 'warmth' || days.length < 2) return;

    const id = setInterval(() => {
      const s = useMapStore.getState();
      const next = s.heatDayIndex + 1;
      s.setHeatDayIndex(next >= s.heatDays.length ? 0 : next);
    }, 170);

    return () => clearInterval(id);
  }, [playing, mode, days.length]);





  const daily = useMemo(() => {
    const withSeries = heatSpots.filter((s) => s.series && s.series.length === days.length);
    if (withSeries.length === 0) return [];

    return days.map((_, d) => {
      const sum = withSeries.reduce((acc, s) => acc + (s.series?.[d] ?? 0), 0);
      return sum / withSeries.length;
    });
  }, [heatSpots, days]);

  if (mode !== 'warmth' || days.length < 2 || daily.length === 0) return null;






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
        <HeadLeft>
          <PlayButton
            type="button"
            $playing={playing}
            aria-pressed={playing}
            aria-label={playing ? '날짜 흐름 멈추기' : '30일 흐름 재생'}
            title={playing ? '멈추기' : '30일 흐름 보기'}
            onClick={() => setPlaying((on) => !on)}
          >
            {playing ? <Pause size={13} strokeWidth={2} /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
          </PlayButton>
          <Stamp>
            {formatDay(today.ymd)}
            {today.weekday ? <span>{today.weekday}</span> : null}
          </Stamp>
        </HeadLeft>
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

          setPlaying(false);
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
