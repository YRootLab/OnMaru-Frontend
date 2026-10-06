'use client';

import React from 'react';
import styled from '@emotion/styled';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SORIMARU_THEME_CATEGORIES } from '@/features/sorimaru-audio/data/sorimaruCategoryData';
import { palette, meok, ringShadow } from '@/design-system/tokens';

export interface CategoryTagFilterProps {
  variant?: 'default' | 'store' | 'compact';
}

const FilterContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0 0.5rem;
`;

const ScrollRail = styled.div`
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  align-items: center;
  gap: 0.45rem;
  padding: 0.15rem 0.1rem;
`;


const ThemePillButton = styled.button<{ $selected: boolean }>`
  position: relative;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 0.95rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: ${({ $selected }) => ($selected ? '700' : '500')};
  letter-spacing: -0.015em;
  white-space: nowrap;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  ${({ $selected }) =>
    $selected
      ? `
        background-color: ${palette.juhong[50]};
        color: ${palette.juhong[700]};
        box-shadow: 0 2px 8px rgba(255, 85, 0, 0.12);
      `
      : `
        background-color: transparent;
        color: ${meok[700]};
        box-shadow: ${ringShadow.light.card};
        &:hover {
          background-color: ${meok[200]};
          color: ${meok[900]};
          box-shadow: ${ringShadow.light.cardHoverGlow};
        }
      `}

  [data-theme='dark'] & {
    ${({ $selected }) =>
      $selected
        ? `
          background-color: rgba(255, 85, 0, 0.16);
          color: ${palette.juhong[300]};
          box-shadow: 0 2px 10px rgba(255, 85, 0, 0.18);
        `
        : `
          background-color: transparent;
          color: ${meok[300]};
          box-shadow: ${ringShadow.dark.card};
          &:hover {
            background-color: rgba(255, 255, 255, 0.08);
            color: #ffffff;
            box-shadow: ${ringShadow.dark.cardHoverGlow};
          }
        `}
  }
`;


export const CategoryTagFilter: React.FC<CategoryTagFilterProps> = () => {
  const selectedCategory = useSorimaruAudioStore((s) => s.selectedCategory);
  const setSelectedCategory = useSorimaruAudioStore((s) => s.setSelectedCategory);
  const setSearchQuery = useSorimaruAudioStore((s) => s.setSearchQuery);

  return (
    <FilterContainer>
      {}
      <ScrollRail as="nav" aria-label="오디오 이야기 주제">
        <ThemePillButton
          type="button"
          onClick={() => {
            setSelectedCategory('전체');
            setSearchQuery('');
          }}
          $selected={selectedCategory === '전체'}
        >
          전체 보기
        </ThemePillButton>
        {SORIMARU_THEME_CATEGORIES.map((theme) => {
          const isSelected = selectedCategory === theme.apiCategory;
          return (
            <ThemePillButton
              key={theme.id}
              type="button"
              onClick={() => {
                setSelectedCategory(theme.apiCategory);
                setSearchQuery('');
              }}
              title={theme.description}
              $selected={isSelected}
            >
              {theme.label}
            </ThemePillButton>
          );
        })}
      </ScrollRail>

    </FilterContainer>
  );
};
