'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SORIMARU_REGION_CHIPS, SORIMARU_THEME_CATEGORIES } from '@/features/sorimaru-audio/data/sorimaruCategoryData';

interface CategoryTagFilterProps {
  variant?: 'default' | 'compact' | 'store';
}

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
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#191f28]">테마별 탐색</span>
          <span className="text-micro font-medium text-[#8b95a1]">주제 오디오</span>
        </div>

        {/* 주 메뉴 메인 필터 레일 */}
        <div className="rounded-2xl bg-white/75 p-1.5 backdrop-blur-md">
          <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => { setSelectedCategory('전체'); setSearchQuery(''); }}
              className={`flex h-9 shrink-0 items-center justify-center rounded-xl px-4 text-xs font-bold transition-all duration-200 ${
                selectedCategory === '전체'
                  ? 'bg-gradient-to-r from-[#FF2A85] to-[#D40D63] text-white'
                  : 'text-[#4e5968] hover:bg-white hover:text-[#FF2A85]'
              }`}
            >
              전체
            </button>
            {SORIMARU_THEME_CATEGORIES.map((theme) => {
              const isSelected = selectedCategory === theme.keyword;
              const label = theme.keyword === '마을' ? '전통마을' : theme.label.split('/')[0];
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => { setSelectedCategory(theme.keyword); setSearchQuery(''); }}
                  className={`flex h-9 shrink-0 items-center justify-center rounded-xl px-4 text-xs font-bold transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#FF2A85] to-[#D40D63] text-white'
                      : 'text-[#4e5968] hover:bg-white hover:text-[#FF2A85]'
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
          <span className="shrink-0 text-micro font-bold text-[#4e5968]">지역</span>
          {SORIMARU_REGION_CHIPS.map((region) => {
            const isSelected = selectedCategory === region;
            return (
              <button
                key={region}
                type="button"
                onClick={() => handleRegionClick(region)}
                className={`shrink-0 rounded-full px-3.5 py-1 text-micro font-semibold transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#211e19] text-white'
                    : 'bg-white/70 text-[#4e5968] hover:bg-white hover:text-[#FF2A85]'
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
          <span className="mr-1 shrink-0 text-micro font-bold text-[#4e5968]">주제</span>
          <button
            type="button"
            onClick={() => { setSelectedCategory('전체'); setSearchQuery(''); }}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
              selectedCategory === '전체'
                ? 'bg-gradient-to-r from-[#FF2A85] to-[#D40D63] text-white'
                : 'bg-white/80 text-[#4e5968] hover:bg-white hover:text-[#FF2A85]'
            }`}
          >
            전체
          </button>
          {SORIMARU_THEME_CATEGORIES.map((theme) => {
            const isSelected = selectedCategory === theme.keyword;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => { setSelectedCategory(theme.keyword); setSearchQuery(''); }}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#FF2A85] to-[#D40D63] text-white'
                    : 'bg-white/80 text-[#4e5968] hover:bg-white hover:text-[#FF2A85]'
                }`}
              >
                {theme.keyword === '마을' ? '전통마을' : theme.label.split('/')[0]}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pl-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="mr-1 shrink-0 text-micro font-bold text-[#4e5968]">지역</span>
          {SORIMARU_REGION_CHIPS.map((region) => {
            const isSelected = selectedCategory === region;
            return (
              <button
                key={region}
                type="button"
                onClick={() => handleRegionClick(region)}
                className={`shrink-0 rounded-full px-3 py-1 text-micro font-semibold transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#211e19] text-white'
                    : 'bg-white/60 text-[#4e5968] hover:bg-white hover:text-[#FF2A85]'
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
    <div className="w-full py-3.5 sm:py-4">
      <nav aria-label="오디오 이야기 주제" className="flex items-center gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-6">
        <button
          type="button"
          onClick={() => { setSelectedCategory('전체'); setSearchQuery(''); }}
          className={`relative shrink-0 pb-1.5 text-sm transition-colors duration-200 ${selectedCategory === '전체' ? 'font-bold text-[#FF2A85]' : 'font-medium text-[#4e5968] hover:text-[#191f28]'}`}
        >
          전체 보기
          {selectedCategory === '전체' && <motion.span layoutId="sorimaru-archive-filter" className="absolute -inset-x-1.5 bottom-px h-[2px] rounded-full bg-[#FF2A85]/70 -rotate-[1deg]" transition={{ type: 'spring', stiffness: 360, damping: 28 }} />}
        </button>
        {SORIMARU_THEME_CATEGORIES.map((theme) => {
          const isSelected = selectedCategory === theme.keyword;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => { setSelectedCategory(theme.keyword); setSearchQuery(''); }}
              title={theme.description}
              className={`relative shrink-0 pb-1.5 text-sm transition-colors duration-200 ${isSelected ? 'font-bold text-[#FF2A85]' : 'font-medium text-[#4e5968] hover:text-[#191f28]'}`}
            >
              {theme.label}
              {isSelected && <motion.span layoutId="sorimaru-archive-filter" className="absolute -inset-x-1.5 bottom-px h-[2px] rounded-full bg-[#FF2A85]/70 -rotate-[1deg]" transition={{ type: 'spring', stiffness: 360, damping: 28 }} />}
            </button>
          );
        })}
      </nav>

      <div className="mt-3 flex items-center gap-3 overflow-x-auto text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="shrink-0 font-medium text-[#8b95a1]">지역</span>
        <span className="h-3 w-px shrink-0 bg-[#211e19]/10" />
        <button
          type="button"
          onClick={() => { setSelectedCategory('전체'); setSearchQuery(''); }}
          className={`shrink-0 transition-colors duration-200 ${!SORIMARU_REGION_CHIPS.includes(selectedCategory as (typeof SORIMARU_REGION_CHIPS)[number]) ? 'font-bold text-[#FF2A85]' : 'font-medium text-[#4e5968] hover:text-[#191f28]'}`}
        >
          전체
        </button>
        {SORIMARU_REGION_CHIPS.map((region) => {
          const isSelected = selectedCategory === region;
          return (
            <button
              key={region}
              type="button"
              onClick={() => handleRegionClick(region)}
              className={`shrink-0 transition-colors duration-200 ${isSelected ? 'font-bold text-[#FF2A85]' : 'font-medium text-[#4e5968] hover:text-[#191f28]'}`}
            >
              {region}
            </button>
          );
        })}
      </div>

    </div>
  );
};
