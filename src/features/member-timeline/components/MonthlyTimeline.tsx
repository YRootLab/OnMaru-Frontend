'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { CalendarDays, ChevronRight, Heart, RotateCcw } from 'lucide-react';
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

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Title = styled.h2`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  color: #1f2328;
  font-size: 15px;
  font-weight: 800;
`;

const MonthInput = styled.input`
  height: 32px;
  border: 1px solid #e5e5e3;
  border-radius: 8px;
  padding: 0 8px;
  background: #f8f8f7;
  color: #1f2328;
  font: inherit;
  font-size: 12px;
`;

const Panel = styled.div`
  border: 1px solid #e5e5e3;
  border-radius: 12px;
  background: #f8f8f7;
  overflow: hidden;
`;

const DayGroup = styled(motion.div)`
  padding: 14px;

  & + & {
    border-top: 1px solid #e5e5e3;
  }
`;

const DayLabel = styled.div`
  margin-bottom: 10px;
  color: #626b75;
  font-size: 12px;
  font-weight: 800;
`;

const TimelineLink = styled(Link)`
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) 16px;
  gap: 8px;
  align-items: center;
  padding: 8px 0;
  color: inherit;
  text-decoration: none;

  &:focus-visible {
    outline: 2px solid #2f6f4e;
    outline-offset: 2px;
    border-radius: 6px;
  }
`;

const ItemIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 9999px;
  background: rgba(47, 111, 78, 0.12);
  color: #2f6f4e;
`;

const ItemText = styled.span`
  min-width: 0;
`;

const ItemTitle = styled.span`
  display: block;
  overflow: hidden;
  color: #1f2328;
  font-size: 13px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemSub = styled.span`
  display: block;
  margin-top: 2px;
  overflow: hidden;
  color: #626b75;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Note = styled.p`
  margin: 0;
  padding: 14px;
  color: #626b75;
  font-size: 12px;
  line-height: 1.55;
  background: #f5f5f4;
`;

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  border: 1px solid #e5e5e3;
  border-radius: 8px;
  background: #fff;
  color: #1f2328;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
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
    <Section>
      <Header>
        <Title>
          <CalendarDays size={16} />
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
            {error}{' '}
            <RetryButton type="button" onClick={() => void load()}>
              <RotateCcw size={13} />
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
                    <Heart size={13} fill="currentColor" />
                  </ItemIcon>
                  <ItemText>
                    <ItemTitle>{item.title}</ItemTitle>
                    {item.subtitle && <ItemSub>{item.subtitle}</ItemSub>}
                  </ItemText>
                  <ChevronRight size={14} color="#8a929b" />
                </TimelineLink>
              ))}
            </DayGroup>
          ))
        )}
        {timeline && timeline.unavailableCount > 0 && (
          <Note>현재 공개되지 않는 장소 {timeline.unavailableCount}개는 이름과 이미지를 표시하지 않았습니다.</Note>
        )}
      </Panel>
    </Section>
  );
}
