'use client';

import React from 'react';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { ODII_REGION_CHIPS, ODII_THEME_CATEGORIES } from '@/features/odii-audio/data/odiiCategoryData';

interface CategoryTagFilterProps {
  variant?: 'default' | 'compact' | 'store';
}

export const CategoryTagFilter: React.FC<CategoryTagFilterProps> = ({ variant = 'default' }) => {
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

  if (variant === 'store') {
    return (
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-[#211e19]">탐색하기</span>
          <span className="text-[10px] text-[#a59a8d]">주제별 오디오</span>
        </div>
        <div className="rounded-[20px] bg-[#f5f3ef] p-1.5 ">
          <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => { setSelectedCategory('전체'); setSearchQuery(''); }}
              className={`flex h-10 shrink-0 items-center gap-2 rounded-[14px] px-4 text-xs transition-all ${selectedCategory === '전체' ? 'bg-white font-semibold text-[#f84e76] ' : 'text-[#786d5e] hover:text-[#f84e76]'}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${selectedCategory === '전체' ? 'bg-[#f84e76]' : 'bg-[#c8bfb5]'}`} />
              전체
            </button>
            {ODII_THEME_CATEGORIES.map((theme) => {
              const isSelected = selectedCategory === theme.keyword;
              const label = theme.keyword === '마을' ? '전통마을' : theme.label.split('/')[0];
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => { setSelectedCategory(theme.keyword); setSearchQuery(''); }}
                  className={`flex h-10 shrink-0 items-center gap-2 rounded-[14px] px-4 text-xs transition-all ${isSelected ? 'bg-white font-semibold text-[#f84e76] ' : 'text-[#786d5e] hover:text-[#f84e76]'}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-[#f84e76]' : 'bg-[#c8bfb5]'}`} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="mr-1 shrink-0 text-[10px] font-medium text-[#a59a8d]">지역</span>
          {ODII_REGION_CHIPS.map((region) => {
            const isSelected = selectedCategory === region;
            return (
              <button
                key={region}
                type="button"
                onClick={() => handleRegionClick(region)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] transition-colors ${isSelected ? 'bg-[#f84e76] font-semibold text-white ' : 'text-[#8c7e6c] hover:bg-[#fff0f5] hover:text-[#f84e76]'}`}
              >
                {region}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="mb-5 space-y-3 px-1">
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="mr-1 shrink-0 text-[11px] font-semibold text-[#655b4d]">주제</span>
          <button
            type="button"
            onClick={() => { setSelectedCategory('전체'); setSearchQuery(''); }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition-all ${selectedCategory === '전체' ? 'bg-[#f84e76] font-semibold text-white ' : 'bg-[#f7f4ee] text-[#786d5e] hover:bg-[#fff0f5] hover:text-[#f84e76]'}`}
          >전체</button>
          {ODII_THEME_CATEGORIES.map((theme) => {
            const isSelected = selectedCategory === theme.keyword;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => { setSelectedCategory(theme.keyword); setSearchQuery(''); }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition-all ${isSelected ? 'bg-[#f84e76] font-semibold text-white ' : 'bg-[#f7f4ee] text-[#786d5e] hover:bg-[#fff0f5] hover:text-[#f84e76]'}`}
              >
                {theme.keyword === '마을' ? '전통마을' : theme.label.split('/')[0]}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pl-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="mr-1 shrink-0 text-[11px] font-semibold text-[#655b4d]">지역</span>
          {ODII_REGION_CHIPS.map((region) => {
            const isSelected = selectedCategory === region;
            return (
              <button
                key={region}
                type="button"
                onClick={() => handleRegionClick(region)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] transition-colors ${isSelected ? ' bg-[#fff0f5] font-semibold text-[#f84e76]' : ' text-[#8c7e6c] hover: hover:bg-[#fff8fa] hover:text-[#f84e76]'}`}
              >
                {region}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-5 flex flex-col gap-4  ">
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
                ? 'bg-[#f84e76] text-white  font-bold'
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
                    ? 'bg-[#f84e76] text-white  font-bold'
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
                    ? 'bg-[#f84e76] text-white font-bold '
                    : 'bg-white text-[#655b4d]  hover: hover:text-[#f84e76]'
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
