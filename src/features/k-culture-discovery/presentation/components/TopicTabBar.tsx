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
import { lightPalette, meok, fontSize } from '@/design-system/tokens';
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
  gap: 6px;
  overflow-x: auto;
  padding: 2px 0 14px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
`;

const Tab = styled.button<{ $active: boolean }>`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: 9999px;
  border: none;
  background: ${({ $active }) =>
    $active ? lightPalette.juhong[500] : meok[100]};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[600])};
  font-size: ${fontSize.xs};
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: background 0.14s ease, color 0.14s ease, transform 0.10s ease;

  &:hover {
    background: ${({ $active }) =>
      $active ? lightPalette.juhong[400] : meok[200]};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[800])};
  }

  &:active {
    transform: scale(0.96);
  }

  [data-theme='dark'] & {
    background: ${({ $active }) =>
      $active ? lightPalette.juhong[500] : 'rgba(255,255,255,0.07)'};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[400])};

    &:hover {
      background: ${({ $active }) =>
        $active ? lightPalette.juhong[400] : 'rgba(255,255,255,0.12)'};
      color: ${({ $active }) => ($active ? '#ffffff' : 'rgba(255,255,255,0.72)')};
    }
  }
`;

const Count = styled.span<{ $active: boolean }>`
  font-size: 10px;
  font-weight: 600;
  opacity: ${({ $active }) => ($active ? 0.72 : 0.55)};
`;

const SkeletonTab = styled.div`
  flex-shrink: 0;
  height: 34px;
  border-radius: 9999px;
  background: ${meok[100]};

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
  if (isLoading) {
    return (
      <ScrollRow aria-busy="true">
        {[48, 76, 100, 72, 88, 68, 84, 100].map((w, i) => (
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
            {Icon && <HugeiconsIcon icon={Icon} size={12} strokeWidth={2} aria-hidden="true" />}
            {topic.labelKo}
            <Count $active={isActive}>{topic.placeCount}</Count>
          </Tab>
        );
      })}
    </ScrollRow>
  );
}

