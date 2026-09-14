'use client';

import { useMemo } from 'react';
import styled from '@emotion/styled';
import { MapPin, Flame } from 'lucide-react';
import { meok, surface , fontSize } from '@/design-system/tokens';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { filterWarmth } from '@/features/map/warmth/warmthRepo';
import {
  PERIOD_OPTIONS,
  filterByPeriod,
  moodStatOf,
  type WarmthPeriod,
} from '@/features/map/warmth/heatScale';
import { rampCss } from './HeatCanvas';
import type { WarmthFilter } from '@/features/map/types';

/**
 * 히트맵 범례 · 화면 요약 · 기간 창.
 *
 * 히트맵에 색을 칠해놓고 그 색이 무슨 뜻인지는 어디에도 적지 않았다.
 * 범례 없는 히트맵은 장식이지 데이터가 아니다.
 *
 * 겸사겸사 "지금 보고 있는 영역이 어떤가"를 한 줄로 요약한다.
 * 지도를 옮길 때마다 숫자가 따라 움직여서, 색이 실제로 데이터라는 것이 드러난다.
 */

const Root = styled.div<{ $isDark: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 11px 14px;
  width: max-content;
  max-width: calc(100vw - 32px);

  border-radius: 18px;
  background: ${({ $isDark }) => ($isDark ? 'rgba(28, 26, 23, 0.94)' : 'rgba(255, 255, 255, 0.95)')};
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: none;
  box-shadow: ${({ $isDark }) =>
    $isDark ? '0 4px 16px rgba(0, 0, 0, 0.4)' : '0 4px 14px rgba(0, 0, 0, 0.08)'};
  font-family: 'Spoqa Han Sans Neo', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;
  transition: all 0.2s ease;

  [data-theme='dark'] & {
    background: rgba(28, 26, 23, 0.94);
    border: none;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  @media (max-width: 1023px) {
    padding: 8px 10px;
  }
`;

const Summary = styled.p<{ $isDark: boolean }>`
  margin: 0;
  font-size: ${fontSize.xs};
  font-weight: 500;
  line-height: 1.35;
  color: ${({ $isDark }) => ($isDark ? '#F3F4F6' : meok[900])};
  white-space: nowrap;

  [data-theme='dark'] & {
    color: #F3F4F6;
  }

  b {
    font-weight: 700;
    color: ${({ $isDark }) => ($isDark ? '#FBBF24' : meok[900])};
    font-variant-numeric: tabular-nums;

    [data-theme='dark'] & {
      color: #FBBF24;
    }
  }
`;

const Ramp = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

/*
  바탕색을 깔고 그 위에 램프를 얹는다.
  램프는 0에서만 완전히 투명하므로, 바탕이 그대로 비치는 자리는
  "한적한 곳"이 아니라 "집계가 없는 곳"을 뜻한다.
*/
const RampBar = styled.div<{ $gradient: string }>`
  height: 8px;
  border-radius: 2px;
  background-color: rgba(78, 89, 104, 0.1);
  background-image: ${({ $gradient }) => $gradient};

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.08);
  }
`;

const RampEnds = styled.div<{ $isDark: boolean }>`
  display: flex;
  justify-content: space-between;
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${({ $isDark }) => ($isDark ? '#9CA3AF' : meok[700])};

  [data-theme='dark'] & {
    color: #9CA3AF;
  }
`;

const RampNote = styled.p<{ $isDark: boolean }>`
  margin: 0;
  font-size: ${fontSize.micro};
  font-weight: 500;
  line-height: 1.4;
  color: ${({ $isDark }) => ($isDark ? '#9CA3AF' : meok[500])};

  [data-theme='dark'] & {
    color: #9CA3AF;
  }
`;

const Divider = styled.div<{ $isDark: boolean }>`
  height: 1px;
  background: ${({ $isDark }) => ($isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(78, 89, 104, 0.12)')};

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const PeriodRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PeriodLabel = styled.span<{ $isDark: boolean }>`
  margin-right: 2px;
  font-size: ${fontSize.micro};
  font-weight: 500;
  color: ${({ $isDark }) => ($isDark ? '#9CA3AF' : meok[500])};

  [data-theme='dark'] & {
    color: #9CA3AF;
  }
`;

const PeriodBtn = styled.button<{ $active: boolean; $isDark: boolean }>`
  padding: 3px 9px;
  border-radius: 9999px;
  border: none;

  background: ${({ $active, $isDark }) =>
    $active
      ? $isDark
        ? '#F59E0B'
        : meok[900]
      : $isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(78, 89, 104, 0.08)'};
  color: ${({ $active, $isDark }) =>
    $active
      ? $isDark
        ? '#1C1A17'
        : '#ffffff'
      : $isDark
        ? '#D1D5DB'
        : meok[700]};
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $active, $isDark }) =>
      $active
        ? $isDark
          ? '#F59E0B'
          : meok[900]
        : $isDark
          ? 'rgba(255, 255, 255, 0.14)'
          : 'rgba(78, 89, 104, 0.16)'};
  }

  &:focus-visible {
    outline: 2px solid ${meok[900]};
    outline-offset: 2px;
  }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? '#F59E0B' : 'rgba(255, 255, 255, 0.08)')};
    color: ${({ $active }) => ($active ? '#1C1A17' : '#D1D5DB')};

    &:hover {
      background: ${({ $active }) => ($active ? '#F59E0B' : 'rgba(255, 255, 255, 0.14)')};
    }
  }
`;

const ViewTypeSegment = styled.div<{ $isDark: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: 12px;
  background: ${({ $isDark }) => ($isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(78, 89, 104, 0.08)')};
  border: none;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
    border: none;
  }
`;

const ViewTypeBtn = styled.button<{ $active: boolean; $isDark: boolean }>`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 9px;
  border: none;
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;

  background: ${({ $active, $isDark }) =>
    $active
      ? $isDark
        ? '#3A3630'
        : '#ffffff'
      : 'transparent'};
  color: ${({ $active, $isDark }) =>
    $active
      ? $isDark
        ? '#FBBF24'
        : meok[900]
      : $isDark
        ? '#9CA3AF'
        : meok[500]};
  box-shadow: none;

  &:hover {
    color: ${({ $isDark }) => ($isDark ? '#ffffff' : meok[900])};
  }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? '#3A3630' : 'transparent')};
    color: ${({ $active }) => ($active ? '#FBBF24' : '#9CA3AF')};
    box-shadow: none;

    &:hover {
      color: #ffffff;
    }
  }
`;

export default function WarmthLegend() {
  const mode = useMapStore((s) => s.mode);
  const warmths = useMapStore((s) => s.warmths);
  const category = useMapStore((s) => s.category);
  const period = useMapStore((s) => s.warmthPeriod);
  const setPeriod = useMapStore((s) => s.setWarmthPeriod);
  const warmthViewType = useMapStore((s) => s.warmthViewType);
  const setWarmthViewType = useMapStore((s) => s.setWarmthViewType);
  const map = useMapStore((s) => s.map);
  const center = useMapStore((s) => s.center);
  const level = useMapStore((s) => s.level);

  const { mode: colorMode } = useOnmaruTheme();
  const isDark = colorMode === 'dark';

  /*
    화면 안 온기만 센다.
    center·level을 의존성에 두어 지도를 움직일 때마다 다시 센다 —
    숫자가 따라 움직이는 것이 이 요약의 전부다.
  */
  const stat = useMemo(() => {
    const scoped = filterWarmth(
      filterByPeriod(warmths, period),
      (category ?? 'all') as WarmthFilter,
    );

    const bounds = map?.getBounds?.();
    if (!bounds || !window.kakao?.maps) return moodStatOf(scoped);

    return moodStatOf(
      scoped.filter((w) => bounds.contain(new window.kakao.maps.LatLng(w.lat, w.lng))),
    );
    // center/level은 값 자체를 쓰진 않지만, 지도가 움직였다는 신호로 필요하다.
  }, [warmths, period, category, map, center, level]);

  const rampGradient = useMemo(() => rampCss(isDark), [isDark]);

  if (mode !== 'warmth') return null;

  const percent = stat.ratio === null ? null : Math.round(stat.ratio * 100);

  return (
    <Root $isDark={isDark} aria-label="온기 히트맵 범례">
      {/* 보기 모드 세그먼트 스위처: [시·군 행정별 | 원형 히트맵] */}
      <ViewTypeSegment $isDark={isDark} role="tablist" aria-label="온기 표시 방식">
        <ViewTypeBtn
          type="button"
          role="tab"
          aria-selected={warmthViewType === 'district'}
          $active={warmthViewType === 'district'}
          $isDark={isDark}
          onClick={() => setWarmthViewType('district')}
          title="시·군·구 행정구역 경계선과 권역별 통계로 보기"
        >
          <MapPin size={13} strokeWidth={2.2} />
          <span>시·군 행정별</span>
        </ViewTypeBtn>
        <ViewTypeBtn
          type="button"
          role="tab"
          aria-selected={warmthViewType === 'heatmap'}
          $active={warmthViewType === 'heatmap'}
          $isDark={isDark}
          onClick={() => setWarmthViewType('heatmap')}
          title="초기 버전의 부드러운 원형 밀도 히트맵으로 보기"
        >
          <Flame size={13} strokeWidth={2.2} />
          <span>원형 히트맵</span>
        </ViewTypeBtn>
      </ViewTypeSegment>

      <Summary $isDark={isDark} aria-live="polite">
        {stat.total === 0 ? (
          '이 일대에 남은 한줄평이 아직 없습니다'
        ) : (
          <>
            이 일대 한줄평 <b>{stat.total}</b>편 · 고즈넉함 <b>{100 - (percent ?? 0)}%</b> · 북적이는 정{' '}
            <b>{percent}%</b>
          </>
        )}
      </Summary>

      <Ramp>
        <RampBar $gradient={rampGradient} aria-hidden="true" />
        <RampEnds $isDark={isDark}>
          <span>한적</span>
          <span>붐빔</span>
        </RampEnds>
        <RampNote $isDark={isDark}>아무 색도 없는 곳은 아직 집계가 닿지 않은 곳입니다.</RampNote>
      </Ramp>

      <Divider $isDark={isDark} />

      <PeriodRow role="group" aria-label="온기 기간">
        <PeriodLabel $isDark={isDark}>기간</PeriodLabel>
        {PERIOD_OPTIONS.map((option) => (
          <PeriodBtn
            key={option.id}
            type="button"
            aria-pressed={period === option.id}
            $active={period === option.id}
            $isDark={isDark}
            onClick={() => setPeriod(option.id as WarmthPeriod)}
          >
            {option.label}
          </PeriodBtn>
        ))}
      </PeriodRow>
    </Root>
  );
}
