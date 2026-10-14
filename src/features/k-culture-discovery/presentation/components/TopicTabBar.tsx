'use client';

import type { ComponentProps } from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Building04Icon,
  HandsClappingIcon,
  Restaurant01Icon,
  ClapperboardIcon,
  Film01Icon,
  Music02Icon,
  HeadphonesIcon,
} from '@hugeicons/core-free-icons';
import { meok, lightPalette, fontSize } from '@/design-system/tokens';
import type { DiscoveryTopic, TopicCode } from '../../domain/types';

const TOPIC_ICONS: Record<TopicCode, ComponentProps<typeof HugeiconsIcon>['icon']> = {
  TRADITIONAL_SPACE_HERITAGE: Building04Icon,
  TRADITIONAL_EXPERIENCE: HandsClappingIcon,
  TRADITIONAL_FOOD_TEA: Restaurant01Icon,
  K_DRAMA: ClapperboardIcon,
  K_MOVIE: Film01Icon,
  K_POP_MV: Music02Icon,
  K_ARTIST: HeadphonesIcon,
};

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
  border-radius: 12px;
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
    ? '0 2px 10px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.12)'
    : 'none'};

  &:hover {
    background: ${({ $active }) => $active ? meok[800] : 'rgba(0,0,0,0.07)'};
    color: ${({ $active }) => $active ? '#ffffff' : meok[800]};
    transform: ${({ $active }) => $active ? 'none' : 'translateY(-1px)'};
  }

  &:active { transform: scale(0.96); }

  [data-theme='dark'] & {
    background: ${({ $active }) => $active
      ? '#ffffff'
      : 'rgba(255,255,255,0.07)'};
    color: ${({ $active }) => $active ? meok[900] : 'rgba(255,255,255,0.5)'};
    box-shadow: ${({ $active }) => $active
      ? '0 2px 12px rgba(0,0,0,0.45)'
      : 'none'};

    &:hover {
      background: ${({ $active }) => $active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.11)'};
      color: ${({ $active }) => $active ? meok[900] : 'rgba(255,255,255,0.8)'};
    }
  }
`;

const TabIcon = styled(HugeiconsIcon)<{ $active: boolean }>`
  opacity: ${({ $active }) => $active ? 1 : 0.6};
  transition: opacity 0.15s ease;
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
  border-radius: 12px;
  background: rgba(0,0,0,0.04);

  [data-theme='dark'] & {
    background: rgba(255,255,255,0.05);
  }
`;

export interface TopicTabBarProps {
  topics: DiscoveryTopic[];
  activeCode: TopicCode | 'all';
  isLoading?: boolean;
  onChange: (code: TopicCode | 'all') => void;
}

export default function TopicTabBar({ topics, activeCode, isLoading, onChange }: TopicTabBarProps) {
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
    <ScrollRow role="tablist" aria-label="K-Culture 주제 선택">
      <Tab
        type="button"
        role="tab"
        $active={activeCode === 'all'}
        aria-selected={activeCode === 'all'}
        onClick={() => onChange('all')}
      >
        전체
      </Tab>

      {topics.map((topic) => {
        const Icon = TOPIC_ICONS[topic.code];
        const isActive = activeCode === topic.code;
        return (
          <Tab
            key={topic.code}
            type="button"
            role="tab"
            $active={isActive}
            aria-selected={isActive}
            onClick={() => onChange(topic.code)}
          >
            {Icon && <TabIcon icon={Icon} size={13} strokeWidth={2.2} aria-hidden="true" $active={isActive} />}
            {topic.labelKo}
            <Count $active={isActive}>{topic.placeCount}</Count>
          </Tab>
        );
      })}
    </ScrollRow>
  );
}
