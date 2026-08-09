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
      {/* 1단: 인위적 요약 뱃지 없이 깨끗한 6대 브랜드 카테고리 태그 칩 */}
      <div className="min-h-[60px]">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('전체');
              setSearchQuery('');
            }}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 whitespace-nowrap ${
              selectedCategory === '전체'
                ? 'bg-[#f84e76] text-white shadow-[0_6px_14px_rgba(248,78,118,0.2)] font-bold'
                : 'text-[#655b4d] bg-[#f7f4ee] hover:bg-[#fff0f5] hover:text-[#f84e76]'
            }`}
          >
            전체
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
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#f84e76] text-white shadow-[0_6px_14px_rgba(248,78,118,0.2)] font-bold'
                    : 'text-[#655b4d] bg-[#f7f4ee] hover:bg-[#fff0f5] hover:text-[#f84e76]'
                }`}
              >
                {theme.label}
              </button>
            );
          })}
        </div>

        {selectedTheme && (
          <p className="mt-2 text-xs leading-5 text-[#8c7e6c]">
            <strong className="mr-1 font-semibold text-[#f84e76]">{selectedTheme.label}</strong>
            <span>{selectedTheme.description}</span>
          </p>
        )}
      </div>

      {/* 2단: 서브 검색 폼 & 지역 명소 필터 칩 */}
      <div className="rounded-2xl bg-[#f7f4ee]/70 p-3.5">
        {/* 지역 칩 */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ODII_REGION_CHIPS.map((region) => {
            const isSelected = selectedCategory === region;
            return (
              <button
                key={region}
                type="button"
                onClick={() => handleRegionClick(region)}
                className={`px-3 py-1 rounded-lg text-xs transition-all duration-200 whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#f84e76] text-white font-bold shadow-[0_5px_12px_rgba(248,78,118,0.18)]'
                    : 'bg-white text-[#655b4d] border border-[#211e19]/10 hover:border-[#f84e76]/50 hover:text-[#f84e76]'
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
