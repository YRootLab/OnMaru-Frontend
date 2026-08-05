'use client';

import React from 'react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { ODII_REGION_CHIPS, ODII_THEME_CATEGORIES } from '../data/odiiCategoryData';

export const CategoryTagFilter: React.FC = () => {
  const selectedCategory = useOdiiAudioStore((s) => s.selectedCategory);
  const setSelectedCategory = useOdiiAudioStore((s) => s.setSelectedCategory);
  const setSearchQuery = useOdiiAudioStore((s) => s.setSearchQuery);
  const selectedTheme = ODII_THEME_CATEGORIES.find((theme) => theme.keyword === selectedCategory);

  const handleRegionClick = (region: string) => {
    if (selectedCategory === region) {
      setSelectedCategory('전체');
    } else {
      setSelectedCategory(region);
      setSearchQuery('');
    }
  };

  return (
    <div className="w-full py-5 flex flex-col gap-4 border-b border-[#211e19]/10">
      {/* 10대 정규 테마 태그 칩 모음 */}
      <div>
        <p className="mb-2 text-[10px] font-bold tracking-[0.16em] text-[#a94d35] uppercase">
          주제별 큐레이션
        </p>
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('전체');
              setSearchQuery('');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === '전체'
                ? 'bg-[#211e19] text-white shadow-sm ring-1 ring-black/10 font-bold'
                : 'text-[#655b4d] bg-[#f7f4ee]/80 hover:bg-[#ede5d8] hover:text-[#211e19]'
            }`}
          >
            {selectedCategory === '전체' && <span className="h-1.5 w-1.5 rounded-full bg-[#a94d35] animate-pulse" />}
            오늘의 전체
          </button>
          {ODII_THEME_CATEGORIES.map((theme) => {
            const isSelected = selectedCategory === theme.keyword;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(theme.keyword);
                  setSearchQuery('');
                }}
                title={theme.description}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#211e19] text-white shadow-sm ring-1 ring-black/10 font-bold'
                    : 'text-[#655b4d] bg-[#f7f4ee]/80 hover:bg-[#ede5d8] hover:text-[#211e19]'
                }`}
              >
                {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-[#a94d35] animate-pulse" />}
                {theme.shortLabel}
              </button>
            );
          })}
        </div>
        {selectedTheme && (
          <p className="mt-2 text-[11px] leading-5 text-[#8c7e6c]">
            <span className="font-semibold text-[#a94d35]">{selectedTheme.shortLabel}</span> · {selectedTheme.description}
          </p>
        )}
      </div>

      {/* 7대 문화도시 지역 퀵 필터 칩 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-1 border-t border-[#211e19]/5">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="text-[11px] font-semibold text-[#8c7e6c] shrink-0 mr-1">
            지역 명소:
          </span>
          {ODII_REGION_CHIPS.map((region) => {
            const isSelected = selectedCategory === region;
            return (
              <button
                key={region}
                type="button"
                onClick={() => handleRegionClick(region)}
                className={`px-2.5 py-1 rounded-full text-xs transition-all duration-200 whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#a94d35] text-white font-bold shadow-xs'
                    : 'bg-white text-[#655b4d] border border-[#211e19]/10 hover:border-[#a94d35]/50 hover:text-[#211e19]'
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>

        {/* 선택 카테고리 / 키워드 초기화 */}
        {selectedCategory !== '전체' && (
          <button
            type="button"
            onClick={() => setSelectedCategory('전체')}
            className="text-[11px] text-[#a94d35] font-semibold tracking-wide hover:underline shrink-0"
          >
            초기화 ↺
          </button>
        )}
      </div>
    </div>
  );
};
