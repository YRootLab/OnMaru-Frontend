'use client';

import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SORIMARU_REGION_CHIPS, SORIMARU_THEME_CATEGORIES } from '@/features/sorimaru-audio/data/sorimaruCategoryData';
import { palette, meok, surface, fontSize } from '@/design-system/tokens';

export interface CategoryTagFilterProps {
  variant?: 'default' | 'store' | 'compact';
}

const FilterContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
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

/* 🏷️ 메인 대분류 테마 알약(Pill) 버튼 - TDS 스타일의 명확한 상태 시인성 */
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
        background-color: #171513;
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      `
      : `
        background-color: #f3f3f2;
        color: ${meok[700]};
        &:hover {
          background-color: #e8e8e6;
          color: ${meok[900]};
        }
      `}

  [data-theme='dark'] & {
    ${({ $selected }) =>
      $selected
        ? `
          background-color: #ffffff;
          color: #171513;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
        `
        : `
          background-color: rgba(255, 255, 255, 0.08);
          color: ${meok[300]};
          &:hover {
            background-color: rgba(255, 255, 255, 0.14);
            color: #ffffff;
          }
        `}
  }
`;

/* 📍 슬림 서브 지역 칩 (지역 라벨 삭제, 깔끔한 미니 알약) */
const RegionPillButton = styled.button<{ $selected: boolean }>`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  font-size: ${fontSize.micro};
  font-weight: ${({ $selected }) => ($selected ? '700' : '500')};
  letter-spacing: -0.01em;
  white-space: nowrap;
  border: none;
  cursor: pointer;
  transition: all 0.18s ease;

  ${({ $selected }) =>
    $selected
      ? `
        background-color: ${palette.juhong[500]};
        color: #ffffff;
      `
      : `
        background-color: transparent;
        color: ${meok[600]};
        &:hover {
          background-color: rgba(0, 0, 0, 0.04);
          color: ${meok[900]};
        }
      `}

  [data-theme='dark'] & {
    ${({ $selected }) =>
      $selected
        ? `
          background-color: ${palette.juhong[500]};
          color: #ffffff;
        `
        : `
          background-color: transparent;
          color: ${meok[400]};
          &:hover {
            background-color: rgba(255, 255, 255, 0.08);
            color: #ffffff;
          }
        `}
  }
`;

export const CategoryTagFilter: React.FC<CategoryTagFilterProps> = () => {
  const selectedCategory = useSorimaruAudioStore((s) => s.selectedCategory);
  const setSelectedCategory = useSorimaruAudioStore((s) => s.setSelectedCategory);
  const setSearchQuery = useSorimaruAudioStore((s) => s.setSearchQuery);

  const handleRegionClick = (region: string) => {
    if (selectedCategory === region) {
      setSelectedCategory('전체');
    } else {
      setSelectedCategory(region);
      setSearchQuery('');
    }
  };

  const isRegionSelected = SORIMARU_REGION_CHIPS.includes(
    selectedCategory as (typeof SORIMARU_REGION_CHIPS)[number]
  );

  return (
    <FilterContainer>
      {/* 1단: 테마 대분류 캡슐 레일 */}
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
          const isSelected = selectedCategory === theme.keyword;
          return (
            <ThemePillButton
              key={theme.id}
              type="button"
              onClick={() => {
                setSelectedCategory(theme.keyword);
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

      {/* 2단: 서브 지역 칩 레일 ('지역 |' 텍스트 삭제 및 깔끔한 칩 나열) */}
      <ScrollRail as="nav" aria-label="지역별 필터" style={{ gap: '0.35rem' }}>
        <RegionPillButton
          type="button"
          onClick={() => {
            setSelectedCategory('전체');
            setSearchQuery('');
          }}
          $selected={!isRegionSelected}
        >
          전국
        </RegionPillButton>
        {SORIMARU_REGION_CHIPS.map((region) => {
          const isSelected = selectedCategory === region;
          return (
            <RegionPillButton
              key={region}
              type="button"
              onClick={() => handleRegionClick(region)}
              $selected={isSelected}
            >
              {region}
            </RegionPillButton>
          );
        })}
      </ScrollRail>
    </FilterContainer>
  );
};
