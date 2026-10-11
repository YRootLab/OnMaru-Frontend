'use client';

import React from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Building04Icon,
  HandsClappingIcon,
  Restaurant01Icon,
  ClapperboardIcon,
  Film01Icon,
  Music02Icon,
} from '@hugeicons/core-free-icons';
import { lightPalette, meok, ringShadow, fontSize } from '@/design-system/tokens';
import type { DiscoveryTopic, TopicCode } from '../../domain/types';

const TOPIC_ICONS: Record<TopicCode, React.ComponentType<any>> = {
  TRADITIONAL_SPACE_HERITAGE: Building04Icon,
  TRADITIONAL_EXPERIENCE: HandsClappingIcon,
  TRADITIONAL_FOOD_TEA: Restaurant01Icon,
  K_DRAMA: ClapperboardIcon,
  K_MOVIE: Film01Icon,
  K_POP_MV: Music02Icon,
};

const ScrollRow = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0 12px;
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
  border-radius: 9999px;
  border: none;
  background: ${({ $active }) =>
    $active ? lightPalette.juhong[500] : meok[200]};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  box-shadow: ${({ $active }) =>
    $active ? ringShadow.light.chipActive : 'none'};
  font-size: ${fontSize.sm};
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;
  font-family: inherit;
  white-space: nowrap;

  &:hover {
    background: ${({ $active }) =>
      $active ? lightPalette.juhong[400] : meok[300]};
    box-shadow: ${({ $active }) =>
      $active ? ringShadow.light.chipActive : ringShadow.light.chipHover};
  }

  [data-theme='dark'] & {
    background: ${({ $active }) =>
      $active ? lightPalette.juhong[500] : meok[700]};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[300])};
    box-shadow: ${({ $active }) =>
      $active ? ringShadow.dark.chipActive : 'none'};

    &:hover {
      background: ${({ $active }) =>
        $active ? lightPalette.juhong[400] : meok[600]};
    }
  }
`;

const Count = styled.span`
  font-size: 11px;
  font-weight: 500;
  opacity: 0.72;
`;

const SkeletonTab = styled.div`
  flex-shrink: 0;
  width: 88px;
  height: 36px;
  border-radius: 9999px;
  background: ${meok[200]};

  [data-theme='dark'] & {
    background: #2d2b28;
  }
`;

export interface TopicTabBarProps {
  topics: DiscoveryTopic[];
  activeCode: TopicCode | 'all';
  isLoading?: boolean;
  onChange: (code: TopicCode | 'all') => void;
}

export default function TopicTabBar({
  topics,
  activeCode,
  isLoading,
  onChange,
}: TopicTabBarProps) {
  if (isLoading) {
    return (
      <ScrollRow aria-busy="true">
        {[80, 96, 80, 72, 80, 72, 96].map((w, i) => (
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
        return (
          <Tab
            key={topic.code}
            type="button"
            role="tab"
            $active={activeCode === topic.code}
            aria-selected={activeCode === topic.code}
            onClick={() => onChange(topic.code)}
          >
            <HugeiconsIcon icon={Icon} size={13} strokeWidth={2} aria-hidden="true" />
            {topic.labelKo}
            <Count>{topic.placeCount}</Count>
          </Tab>
        );
      })}
    </ScrollRow>
  );
}
