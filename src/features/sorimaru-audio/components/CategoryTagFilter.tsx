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

const ScrollRail = styled.div`
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  align-items: center;
`;

const StoreThemeButton = styled.button<{ $selected: boolean }>`
  flex-shrink: 0;
  border-radius: 9999px;
  padding: 0.375rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;

  ${({ $selected }) =>
    $selected
      ? `
        background: linear-gradient(to right, ${palette.jangmi[500]}, ${palette.jangmi[700]});
        color: #ffffff;
      `
      : `
        background: none;
        color: ${meok[700]};
        &:hover {
          background-color: #ffffff;
          color: ${palette.jangmi[500]};
        }
      `}

  [data-theme='dark'] & {
    ${({ $selected }) =>
      $selected
        ? `
          background: linear-gradient(to right, ${palette.jangmi[500]}, ${palette.jangmi[700]});
          color: #ffffff;
        `
        : `
          background: none;
          color: ${meok[400]};
          &:hover {
            background-color: ${surface.dark.card};
            color: ${palette.jangmi[400]};
          }
        `}
  }
`;

const StoreRegionButton = styled.button<{ $selected: boolean }>`
  flex-shrink: 0;
  border-radius: 9999px;
  padding: 0.25rem 0.875rem;
  font-size: ${fontSize.micro};
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;

  ${({ $selected }) =>
    $selected
      ? `
        background-color: #211e19;
        color: #ffffff;
      `
      : `
        background-color: rgba(255, 255, 255, 0.7);
        color: ${meok[700]};
        &:hover {
          background-color: #ffffff;
          color: ${palette.jangmi[500]};
        }
      `}

  [data-theme='dark'] & {
    ${({ $selected }) =>
      $selected
        ? `
          background-color: ${palette.jangmi[500]};
          color: #ffffff;
        `
        : `
          background-color: rgba(45, 41, 36, 0.7);
          color: ${meok[400]};
          border: 1px solid rgba(255, 255, 255, 0.08);
          &:hover {
            background-color: ${surface.dark.card};
            color: ${palette.jangmi[400]};
          }
        `}
  }
`;

const CompactThemeButton = styled.button<{ $selected: boolean }>`
  flex-shrink: 0;
  border-radius: 9999px;
  padding: 0.375rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;

  ${({ $selected }) =>
    $selected
      ? `
        background: linear-gradient(to right, ${palette.jangmi[500]}, ${palette.jangmi[700]});
        color: #ffffff;
      `
      : `
        background-color: rgba(255, 255, 255, 0.8);
        color: ${meok[700]};
        &:hover {
          background-color: #ffffff;
          color: ${palette.jangmi[500]};
        }
      `}

  [data-theme='dark'] & {
    ${({ $selected }) =>
      $selected
        ? `
          background: linear-gradient(to right, ${palette.jangmi[500]}, ${palette.jangmi[700]});
          color: #ffffff;
        `
        : `
          background-color: rgba(45, 41, 36, 0.8);
          color: ${meok[400]};
          border: 1px solid rgba(255, 255, 255, 0.08);
          &:hover {
            background-color: ${surface.dark.card};
            color: ${palette.jangmi[400]};
          }
        `}
  }
`;

const CompactRegionButton = styled.button<{ $selected: boolean }>`
  flex-shrink: 0;
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-size: ${fontSize.micro};
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;

  ${({ $selected }) =>
    $selected
      ? `
        background-color: #211e19;
        color: #ffffff;
      `
      : `
        background-color: rgba(255, 255, 255, 0.6);
        color: ${meok[700]};
        &:hover {
          background-color: #ffffff;
          color: ${palette.jangmi[500]};
        }
      `}

  [data-theme='dark'] & {
    ${({ $selected }) =>
      $selected
        ? `
          background-color: ${palette.jangmi[500]};
          color: #ffffff;
        `
        : `
          background-color: rgba(45, 41, 36, 0.6);
          color: ${meok[400]};
          border: 1px solid rgba(255, 255, 255, 0.08);
          &:hover {
            background-color: ${surface.dark.card};
            color: ${palette.jangmi[400]};
          }
        `}
  }
`;

const NavUnderlineButton = styled.button<{ $selected: boolean }>`
  position: relative;
  flex-shrink: 0;
  padding-bottom: 0.375rem;
  font-size: 0.875rem;
  transition: color 0.2s ease;
  background: none;
  border: none;
  cursor: pointer;

  ${({ $selected }) =>
    $selected
      ? `
        font-weight: 700;
        color: #8B7A49;
      `
      : `
        font-weight: 500;
        color: ${meok[700]};
        &:hover {
          color: ${meok[900]};
        }
      `}

  [data-theme='dark'] & {
    ${({ $selected }) =>
      $selected
        ? `
          color: ${palette.hwanggeum[200]};
        `
        : `
          color: ${meok[400]};
          &:hover {
            color: ${meok[100]};
          }
        `}
  }
`;

const RegionTextButton = styled.button<{ $selected: boolean }>`
  flex-shrink: 0;
  transition: color 0.2s ease;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  ${({ $selected }) =>
    $selected
      ? `
        font-weight: 700;
        color: #8B7A49;
      `
      : `
        font-weight: 500;
        color: ${meok[700]};
        &:hover {
          color: ${meok[900]};
        }
      `}

  [data-theme='dark'] & {
    ${({ $selected }) =>
      $selected
        ? `
          color: ${palette.hwanggeum[200]};
        `
        : `
          color: ${meok[400]};
          &:hover {
            color: ${meok[100]};
          }
        `}
  }
`;

const StoreFilterRailBox = styled.div`
  border-radius: 1rem;
  background-color: rgba(255, 255, 255, 0.75);
  padding: 0.375rem;
  backdrop-filter: blur(12px);

  [data-theme='dark'] & {
    background-color: rgba(36, 33, 29, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
`;

const FilterSectionTitle = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

export const CategoryTagFilter: React.FC<CategoryTagFilterProps> = ({ variant = 'default' }) => {
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

  if (variant === 'store') {
    return (
      <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.25rem' }}>
          <FilterSectionTitle>테마별 탐색</FilterSectionTitle>
          <span style={{ fontSize: fontSize.micro, fontWeight: 500, color: meok[500] }}>주제 오디오</span>
        </div>

        {/* 주 메뉴 메인 필터 레일 */}
        <StoreFilterRailBox>
          <ScrollRail style={{ gap: '0.25rem' }}>
            <StoreThemeButton
              type="button"
              onClick={() => { setSelectedCategory('전체'); setSearchQuery(''); }}
              $selected={selectedCategory === '전체'}
            >
              전체
            </StoreThemeButton>
            {SORIMARU_THEME_CATEGORIES.map((theme) => {
              const isSelected = selectedCategory === theme.keyword;
              const label = theme.keyword === '마을' ? '전통마을' : theme.label.split('/')[0];
              return (
                <StoreThemeButton
                  key={theme.id}
                  type="button"
                  onClick={() => { setSelectedCategory(theme.keyword); setSearchQuery(''); }}
                  $selected={isSelected}
                >
                  {label}
                </StoreThemeButton>
              );
            })}
          </ScrollRail>
        </StoreFilterRailBox>

        {/* 소메뉴 지역 필터 칩 */}
        <ScrollRail style={{ gap: '0.5rem', padding: '0.25rem 0.25rem 0' }}>
          <span style={{ flexShrink: 0, fontSize: fontSize.micro, fontWeight: 700, color: meok[700] }}>지역</span>
          {SORIMARU_REGION_CHIPS.map((region) => {
            const isSelected = selectedCategory === region;
            return (
              <StoreRegionButton
                key={region}
                type="button"
                onClick={() => handleRegionClick(region)}
                $selected={isSelected}
              >
                {region}
              </StoreRegionButton>
            );
          })}
        </ScrollRail>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', padding: '0 0.25rem' }}>
        <ScrollRail style={{ gap: '0.5rem' }}>
          <span style={{ marginRight: '0.25rem', flexShrink: 0, fontSize: fontSize.micro, fontWeight: 700, color: meok[700] }}>주제</span>
          <CompactThemeButton
            type="button"
            onClick={() => { setSelectedCategory('전체'); setSearchQuery(''); }}
            $selected={selectedCategory === '전체'}
          >
            전체
          </CompactThemeButton>
          {SORIMARU_THEME_CATEGORIES.map((theme) => {
            const isSelected = selectedCategory === theme.keyword;
            return (
              <CompactThemeButton
                key={theme.id}
                type="button"
                onClick={() => { setSelectedCategory(theme.keyword); setSearchQuery(''); }}
                $selected={isSelected}
              >
                {theme.keyword === '마을' ? '전통마을' : theme.label.split('/')[0]}
              </CompactThemeButton>
            );
          })}
        </ScrollRail>
        <ScrollRail style={{ gap: '0.5rem', paddingLeft: '0.25rem' }}>
          <span style={{ marginRight: '0.25rem', flexShrink: 0, fontSize: fontSize.micro, fontWeight: 700, color: meok[700] }}>지역</span>
          {SORIMARU_REGION_CHIPS.map((region) => {
            const isSelected = selectedCategory === region;
            return (
              <CompactRegionButton
                key={region}
                type="button"
                onClick={() => handleRegionClick(region)}
                $selected={isSelected}
              >
                {region}
              </CompactRegionButton>
            );
          })}
        </ScrollRail>
      </div>
    );
  }

  // Default Variant: 메인 오디오 아카이브 필터바 (섹션 5 전용)
  return (
    <div style={{ width: '100%', padding: '0.5rem 0' }}>
      <ScrollRail as="nav" aria-label="오디오 이야기 주제" style={{ gap: '1.25rem' }}>
        <NavUnderlineButton
          type="button"
          onClick={() => { setSelectedCategory('전체'); setSearchQuery(''); }}
          $selected={selectedCategory === '전체'}
        >
          전체 보기
          {selectedCategory === '전체' && (
            <motion.span
              layoutId="sorimaru-archive-filter"
              style={{
                position: 'absolute',
                left: -4,
                right: -4,
                bottom: 0,
                height: 2,
                borderRadius: 9999,
                backgroundColor: '#d4af37',
              }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            />
          )}
        </NavUnderlineButton>
        {SORIMARU_THEME_CATEGORIES.map((theme) => {
          const isSelected = selectedCategory === theme.keyword;
          return (
            <NavUnderlineButton
              key={theme.id}
              type="button"
              onClick={() => { setSelectedCategory(theme.keyword); setSearchQuery(''); }}
              title={theme.description}
              $selected={isSelected}
            >
              {theme.label}
              {isSelected && (
                <motion.span
                  layoutId="sorimaru-archive-filter"
                  style={{
                    position: 'absolute',
                    left: -4,
                    right: -4,
                    bottom: 0,
                    height: 2,
                    borderRadius: 9999,
                    backgroundColor: '#d4af37',
                  }}
                  transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                />
              )}
            </NavUnderlineButton>
          );
        })}
      </ScrollRail>

      <ScrollRail style={{ marginTop: '0.6rem', gap: '0.75rem', fontSize: '0.75rem' }}>
        <span style={{ flexShrink: 0, fontWeight: 500, color: meok[500] }}>지역</span>
        <span style={{ height: '0.75rem', width: 1, flexShrink: 0, backgroundColor: 'rgba(33, 30, 25, 0.1)' }} />
        <RegionTextButton
          type="button"
          onClick={() => { setSelectedCategory('전체'); setSearchQuery(''); }}
          $selected={!SORIMARU_REGION_CHIPS.includes(selectedCategory as (typeof SORIMARU_REGION_CHIPS)[number])}
        >
          전체
        </RegionTextButton>
        {SORIMARU_REGION_CHIPS.map((region) => {
          const isSelected = selectedCategory === region;
          return (
            <RegionTextButton
              key={region}
              type="button"
              onClick={() => handleRegionClick(region)}
              $selected={isSelected}
            >
              {region}
            </RegionTextButton>
          );
        })}
      </ScrollRail>
    </div>
  );
};
