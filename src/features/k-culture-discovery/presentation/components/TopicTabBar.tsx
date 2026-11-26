'use client';

import { useLocale, useTranslations } from 'next-intl';
import styled from '@emotion/styled';
import { meok, ringShadow, fontSize } from '@/design-system/tokens';
import type { DiscoveryTopic, TopicCode } from '../../domain/types';

const KNOWN_TOPIC_CODES = new Set<TopicCode>([
  'TRADITIONAL_SPACE_HERITAGE',
  'TRADITIONAL_EXPERIENCE',
  'TRADITIONAL_FOOD_TEA',
  'K_DRAMA',
  'K_MOVIE',
  'K_POP_MV',
  'K_ARTIST',
]);

const ScrollRow = styled.div`
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding: 2px 0 16px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
`;

const Tab = styled.button<{ $active: boolean }>`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  border: none;
  font-size: ${fontSize.xs};
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  letter-spacing: -0.01em;
  transition: background 0.18s cubic-bezier(0.4,0,0.2,1), color 0.18s ease, transform 0.12s ease, box-shadow 0.18s ease;

  background: ${({ $active }) => $active
    ? meok[900]
    : 'rgba(0,0,0,0.04)'};
  color: ${({ $active }) => $active ? '#ffffff' : meok[500]};
  box-shadow: ${({ $active }) => $active
    ? ringShadow.light.button
    : 'none'};

  &:hover {
    background: ${({ $active }) => $active ? meok[800] : 'rgba(0,0,0,0.07)'};
    color: ${({ $active }) => $active ? '#ffffff' : meok[800]};
    transform: ${({ $active }) => $active ? 'none' : 'translateY(-1px)'};
    box-shadow: ${({ $active }) => $active
      ? ringShadow.light.buttonHover
      : 'none'};
  }

  &:active { transform: scale(0.96); }

  [data-theme='dark'] & {
    background: ${({ $active }) => $active
      ? '#ffffff'
      : 'rgba(255,255,255,0.07)'};
    color: ${({ $active }) => $active ? meok[900] : 'rgba(255,255,255,0.5)'};
    box-shadow: ${({ $active }) => $active
      ? ringShadow.dark.button
      : 'none'};

    &:hover {
      background: ${({ $active }) => $active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.11)'};
      color: ${({ $active }) => $active ? meok[900] : 'rgba(255,255,255,0.8)'};
      box-shadow: ${({ $active }) => $active
        ? ringShadow.dark.buttonHover
        : 'none'};
    }
  }
`;

const Count = styled.span<{ $active: boolean }>`
  font-size: 10px;
  font-weight: 700;
  opacity: ${({ $active }) => $active ? 0.65 : 0.45};
  letter-spacing: 0;
`;

const SkeletonTab = styled.div`
  flex-shrink: 0;
  height: 36px;
  border-radius: 999px;
  background: #e5e5e3;

  [data-theme='dark'] & {
    background: rgba(255,255,255,0.06);
  }
`;

export interface TopicTabBarProps {
  topics: DiscoveryTopic[];
  activeCode: TopicCode | 'all';
  isLoading?: boolean;
  onChange: (code: TopicCode | 'all') => void;
}

export default function TopicTabBar({ topics, activeCode, isLoading, onChange }: TopicTabBarProps) {
  const t = useTranslations('kCulture');
  const locale = useLocale();

  if (isLoading) {
    return (
      <ScrollRow aria-busy="true">
        {[52, 80, 104, 76, 92, 72, 88, 104].map((w, i) => (
          <SkeletonTab key={i} style={{ width: w }} />
        ))}
      </ScrollRow>
    );
  }

  return (
    <ScrollRow role="tablist" aria-label={t('topicTabLabel')}>
      <Tab
        type="button"
        role="tab"
        $active={activeCode === 'all'}
        aria-selected={activeCode === 'all'}
        onClick={() => onChange('all')}
      >
        {t('allTab')}
      </Tab>

      {topics.map((topic) => {
        const isActive = activeCode === topic.code;
        const label = KNOWN_TOPIC_CODES.has(topic.code)
          ? t(`topic.${topic.code}`)
          : locale === 'ko'
            ? topic.labelKo
            : topic.labelEn || topic.labelKo;
        return (
          <Tab
            key={topic.code}
            type="button"
            role="tab"
            $active={isActive}
            aria-selected={isActive}
            onClick={() => onChange(topic.code)}
          >
            {label}
            <Count $active={isActive}>{topic.placeCount}</Count>
          </Tab>
        );
      })}
    </ScrollRow>
  );
}
