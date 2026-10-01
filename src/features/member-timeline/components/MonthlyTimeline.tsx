'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react'
import { CalendarDaysIcon, ChevronRightIcon, HeartIcon, RotateCcwIcon } from '@hugeicons/core-free-icons'
import { motion } from 'framer-motion';
import { getPlaceSlipMotion } from '@/shared/motion/placeSlip';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { defaultMemberTimelineRepository, type MemberTimelineRepository } from '../api/memberTimelineApi';
import {
  formatTimelineDayLabel,
  isSupportedTimelineItem,
  type MemberTimeline,
  type TimelineItem,
} from '../api/memberTimelineContract';

type MonthlyTimelineProps = {
  repository?: MemberTimelineRepository;
};

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  padding-left: 4px;

  @media (max-width: 380px) {
    flex-wrap: wrap;
    gap: 8px;
  }
`;

const Title = styled.h2`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #1f2328;
  flex-shrink: 0;

  [data-theme='dark'] & {
    color: #f0ede9;
  }
`;

const MonthInput = styled.input`
  height: 30px;
  border: none;
  border-radius: 8px;
  padding: 0 10px;
  background: rgba(0, 0, 0, 0.06);
  color: #1f2328;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
  max-width: 160px;

  &:focus {
    box-shadow: 0 0 0 2px #2f6f4e;
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.1);
    color: #f0ede9;
    color-scheme: dark;

    &:focus {
      box-shadow: 0 0 0 2px #4ca97a;
    }
  }
`;

const Panel = styled.div`
  border-radius: 16px;
  background: #ffffff;
  overflow: hidden;
  width: 100%;

  [data-theme='dark'] & {
    background: #1e1c19;
  }
`;

const DayGroup = styled(motion.div)`
  padding: 16px 18px;

  & + & {
    border-top: 1px solid rgba(0, 0, 0, 0.05);
  }

  [data-theme='dark'] & + & {
    border-top-color: rgba(255, 255, 255, 0.07);
  }
`;

const DayLabel = styled.div`
  margin-bottom: 8px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: #8a929b;

  [data-theme='dark'] & {
    color: #7a8490;
  }
`;

const TimelineLink = styled(Link)`
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 16px;
  gap: 10px;
  align-items: center;
  padding: 7px 0;
  color: inherit;
  text-decoration: none;
  border-radius: 6px;
  transition: background-color 0.15s;

  &:hover {
    background-color: rgba(47, 111, 78, 0.06);
    padding-left: 4px;
    padding-right: 4px;
    margin-left: -4px;
    margin-right: -4px;
  }

  &:focus-visible {
    outline: 2px solid #2f6f4e;
    outline-offset: 2px;
  }

  [data-theme='dark'] &:hover {
    background-color: rgba(76, 169, 122, 0.1);
  }
`;

const ItemIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  background: rgba(47, 111, 78, 0.1);
  color: #2f6f4e;
  flex-shrink: 0;

  [data-theme='dark'] & {
    background: rgba(76, 169, 122, 0.15);
    color: #4ca97a;
  }
`;

const ItemText = styled.span`
  min-width: 0;
`;

const ItemTitle = styled.span`
  display: block;
  overflow: hidden;
  font-size: 13.5px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1f2328;

  [data-theme='dark'] & {
    color: #f0ede9;
  }
`;

const ItemSub = styled.span`
  display: block;
  margin-top: 2px;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #8a929b;

  [data-theme='dark'] & {
    color: #7a8490;
  }
`;

const Note = styled.p`
  margin: 0;
  padding: 20px 18px;
  font-size: 13px;
  line-height: 1.55;
  color: #8a929b;

  [data-theme='dark'] & {
    color: #7a8490;
  }
`;

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 12px;
  margin-left: 8px;
  border: none;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.06);
  color: #1f2328;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  vertical-align: middle;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.1);
    color: #f0ede9;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }
`;

const ChevronIcon = styled(HugeiconsIcon)`
  flex-shrink: 0;
  color: #c0c7ce;

  [data-theme='dark'] & {
    color: #555e66;
  }
`;

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function targetHref(item: TimelineItem): string {
  if (item.target.type === 'PLACE') return `/map?id=${encodeURIComponent(item.target.placeId)}`;
  if (item.target.type === 'ODII_STORY') return '/sorimaru';
  if (item.target.type === 'SAVED_JOURNEY') return '/';
  return `/map?id=${encodeURIComponent(item.target.placeId)}`;
}

export default function MonthlyTimeline({ repository = defaultMemberTimelineRepository }: MonthlyTimelineProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [month, setMonth] = useState(currentMonth());
  const [timeline, setTimeline] = useState<MemberTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (targetMonth = month) => {
    setLoading(true);
    setError(null);
    try {
      setTimeline(await repository.getTimeline({ month: targetMonth, limit: 20 }));
    } catch {
      setTimeline(null);
      setError('월간 기록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(month);
  }, [month]);

  const visibleGroups = useMemo(
    () =>
      timeline?.groups
        .map((group) => ({ ...group, items: group.items.filter(isSupportedTimelineItem) }))
        .filter((group) => group.items.length > 0) ?? [],
    [timeline],
  );

  return (
    <Wrap>
      <Header>
        <Title>
          <HugeiconsIcon icon={CalendarDaysIcon} size={15} />
          이번 달에 모은 장소
        </Title>
        <MonthInput
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          aria-label="타임라인 월 선택"
        />
      </Header>

      <Panel>
        {loading ? (
          <Note>월간 기록을 불러오는 중입니다.</Note>
        ) : error ? (
          <Note>
            {error}
            <RetryButton type="button" onClick={() => void load()}>
              <HugeiconsIcon icon={RotateCcwIcon} size={12} />
              다시 시도
            </RetryButton>
          </Note>
        ) : visibleGroups.length === 0 ? (
          <Note>아직 이 달에 담은 장소나 여정이 없습니다.</Note>
        ) : (
          visibleGroups.map((group, index) => (
            <DayGroup key={group.date} {...getPlaceSlipMotion({ reducedMotion, index })}>
              <DayLabel>{formatTimelineDayLabel(group.date)}</DayLabel>
              {group.items.map((item) => (
                <TimelineLink key={item.id} href={targetHref(item)}>
                  <ItemIcon>
                    <HugeiconsIcon icon={HeartIcon} size={13} fill="currentColor" />
                  </ItemIcon>
                  <ItemText>
                    <ItemTitle>{item.title}</ItemTitle>
                    {item.subtitle && <ItemSub>{item.subtitle}</ItemSub>}
                  </ItemText>
                  <ChevronIcon icon={ChevronRightIcon} size={14} />
                </TimelineLink>
              ))}
            </DayGroup>
          ))
        )}
        {timeline && timeline.unavailableCount > 0 && (
          <Note>현재 공개되지 않는 장소 {timeline.unavailableCount}개는 이름과 이미지를 표시하지 않았습니다.</Note>
        )}
      </Panel>
    </Wrap>
  );
}
