'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { ODII_REGION_CHIPS, ODII_THEME_CATEGORIES } from '@/features/odii-audio/data/odiiCategoryData';

interface CategoryTagFilterProps {
  variant?: 'default' | 'compact' | 'store';
}

export const CategoryTagFilter: React.FC<CategoryTagFilterProps> = ({ variant = 'default' }) => {
  const selectedCategory = useOdiiAudioStore((s) => s.selectedCategory);
  const setSelectedCategory = useOdiiAudioStore((s) => s.setSelectedCategory);
  const setSearchQuery = useOdiiAudioStore((s) => s.setSearchQuery);
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
    <div className="w-full border-y border-[#211e19]/10 py-3.5 sm:py-4">
      <nav aria-label="오디오 이야기 주제" className="flex items-center gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-6">
        <button
          type="button"
          onClick={() => { setSelectedCategory('전체'); setSearchQuery(''); }}
          className={`relative shrink-0 pb-1.5 text-sm transition-colors duration-200 ${selectedCategory === '전체' ? 'font-bold text-[#f84e76]' : 'font-medium text-[#8c7e6c] hover:text-[#211e19]'}`}
        >
          전체 보기
          {selectedCategory === '전체' && <motion.span layoutId="odii-archive-filter" className="absolute -inset-x-1.5 bottom-px h-[2px] rounded-full bg-[#f84e76]/70 shadow-[1px_1px_0_rgba(248,78,118,0.18)] -rotate-[1deg]" transition={{ type: 'spring', stiffness: 360, damping: 28 }} />}
        </button>
        {ODII_THEME_CATEGORIES.map((theme) => {
          const isSelected = selectedCategory === theme.keyword;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => { setSelectedCategory(theme.keyword); setSearchQuery(''); }}
              title={theme.description}
              className={`relative shrink-0 pb-1.5 text-sm transition-colors duration-200 ${isSelected ? 'font-bold text-[#f84e76]' : 'font-medium text-[#8c7e6c] hover:text-[#211e19]'}`}
            >
              {theme.label}
              {isSelected && <motion.span layoutId="odii-archive-filter" className="absolute -inset-x-1.5 bottom-px h-[2px] rounded-full bg-[#f84e76]/70 shadow-[1px_1px_0_rgba(248,78,118,0.18)] -rotate-[1deg]" transition={{ type: 'spring', stiffness: 360, damping: 28 }} />}
            </button>
          );
        })}
      </nav>

      <div className="mt-3 flex items-center gap-3 overflow-x-auto text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="shrink-0 font-medium text-[#a09282]">지역</span>
        <span className="h-3 w-px shrink-0 bg-[#211e19]/10" />
        <button
          type="button"
          onClick={() => { setSelectedCategory('전체'); setSearchQuery(''); }}
          className={`shrink-0 transition-colors duration-200 ${!ODII_REGION_CHIPS.includes(selectedCategory as (typeof ODII_REGION_CHIPS)[number]) ? 'font-bold text-[#f84e76]' : 'font-medium text-[#8c7e6c] hover:text-[#211e19]'}`}
        >
          전체
        </button>
        {ODII_REGION_CHIPS.map((region) => {
          const isSelected = selectedCategory === region;
          return (
            <button
              key={region}
              type="button"
              onClick={() => handleRegionClick(region)}
              className={`shrink-0 transition-colors duration-200 ${isSelected ? 'font-bold text-[#f84e76]' : 'font-medium text-[#8c7e6c] hover:text-[#211e19]'}`}
            >
              {region}
            </button>
          );
        })}
      </div>

    </div>
  );
};
