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
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#211e19]">테마별 탐색</span>
          <span className="text-[10px] font-medium text-[#a59a8d]">주제 오디오</span>
        </div>

        {/* 주 메뉴 메인 필터 레일 */}
        <div className="rounded-2xl border border-white/80 bg-white/75 p-1.5 shadow-xs backdrop-blur-md">
          <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => { setSelectedCategory('전체'); setSearchQuery(''); }}
              className={`flex h-9 shrink-0 items-center justify-center rounded-xl px-4 text-xs font-bold transition-all duration-200 ${
                selectedCategory === '전체'
                  ? 'bg-gradient-to-r from-[#f84e76] to-[#e03860] text-white shadow-md shadow-[#f84e76]/25'
                  : 'text-[#655b4d] hover:bg-white hover:text-[#f84e76]'
              }`}
            >
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
                  className={`flex h-9 shrink-0 items-center justify-center rounded-xl px-4 text-xs font-bold transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#f84e76] to-[#e03860] text-white shadow-md shadow-[#f84e76]/25'
                      : 'text-[#655b4d] hover:bg-white hover:text-[#f84e76]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 소메뉴 지역 필터 칩 */}
        <div className="flex items-center gap-2 overflow-x-auto px-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 text-[11px] font-bold text-[#8c7e6c]">지역</span>
          {ODII_REGION_CHIPS.map((region) => {
            const isSelected = selectedCategory === region;
            return (
              <button
                key={region}
                type="button"
                onClick={() => handleRegionClick(region)}
                className={`shrink-0 rounded-full px-3.5 py-1 text-[11px] font-semibold transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#211e19] text-white shadow-xs'
                    : 'border border-white/70 bg-white/70 text-[#786d5e] hover:border-[#f84e76]/30 hover:bg-white hover:text-[#f84e76]'
                }`}
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
      <div className="mb-5 space-y-2.5 px-1">
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="mr-1 shrink-0 text-[11px] font-bold text-[#655b4d]">주제</span>
          <button
            type="button"
            onClick={() => { setSelectedCategory('전체'); setSearchQuery(''); }}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
              selectedCategory === '전체'
                ? 'bg-gradient-to-r from-[#f84e76] to-[#e03860] text-white shadow-xs'
                : 'bg-white/80 text-[#786d5e] hover:bg-white hover:text-[#f84e76]'
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
                onClick={() => { setSelectedCategory(theme.keyword); setSearchQuery(''); }}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#f84e76] to-[#e03860] text-white shadow-xs'
                    : 'bg-white/80 text-[#786d5e] hover:bg-white hover:text-[#f84e76]'
                }`}
              >
                {theme.keyword === '마을' ? '전통마을' : theme.label.split('/')[0]}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pl-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="mr-1 shrink-0 text-[11px] font-bold text-[#8c7e6c]">지역</span>
          {ODII_REGION_CHIPS.map((region) => {
            const isSelected = selectedCategory === region;
            return (
              <button
                key={region}
                type="button"
                onClick={() => handleRegionClick(region)}
                className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#211e19] text-white shadow-xs'
                    : 'bg-white/60 text-[#8c7e6c] hover:bg-white hover:text-[#f84e76]'
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Default Variant: 메인 오디오 아카이브 필터바 (섹션 5 전용)
  return (
    <div className="w-full py-2 space-y-2.5">
      {/* 1단: 메인 테마 메뉴 */}
      <div className="rounded-2xl border border-white/80 bg-white/80 p-1.5 shadow-xs backdrop-blur-md">
        <div className="flex items-center space-x-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('전체');
              setSearchQuery('');
            }}
            className={`flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-xs transition-all duration-200 whitespace-nowrap ${
              selectedCategory === '전체'
                ? 'bg-gradient-to-r from-[#f84e76] to-[#e03860] font-bold text-white shadow-md shadow-[#f84e76]/25 scale-[1.02]'
                : 'font-semibold text-[#655b4d] hover:bg-white/90 hover:text-[#f84e76]'
            }`}
          >
            전체 보기
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
                className={`flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-xs transition-all duration-200 whitespace-nowrap ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#f84e76] to-[#e03860] font-bold text-white shadow-md shadow-[#f84e76]/25 scale-[1.02]'
                    : 'font-semibold text-[#655b4d] hover:bg-white/90 hover:text-[#f84e76]'
                }`}
              >
                {theme.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 테마 설명 서브 캡션 */}
      {selectedTheme && (
        <div className="flex items-center gap-2 rounded-xl border border-[#f84e76]/15 bg-[#fff0f5]/60 px-3.5 py-2 text-xs text-[#786d5e] backdrop-blur-xs">
          <span className="font-bold text-[#f84e76]">{selectedTheme.label}</span>
          <span className="text-[#a09282]">·</span>
          <span>{selectedTheme.description}</span>
        </div>
      )}

      {/* 2단: 소메뉴 (지역 칩 레일) */}
      <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-white/70 bg-white/60 p-2.5 backdrop-blur-sm sm:px-4">
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 text-xs font-bold text-[#8c7e6c]">지역</span>
          <div className="h-3 w-px bg-[#211e19]/10 shrink-0 mx-1" />
          {ODII_REGION_CHIPS.map((region) => {
            const isSelected = selectedCategory === region;
            return (
              <button
                key={region}
                type="button"
                onClick={() => handleRegionClick(region)}
                className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#211e19] text-white shadow-xs scale-105'
                    : 'border border-white/80 bg-white/75 text-[#655b4d] hover:border-[#f84e76]/30 hover:bg-white hover:text-[#f84e76]'
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
