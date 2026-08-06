'use client';

import React, { FormEvent, useState } from 'react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { ODII_REGION_CHIPS, ODII_THEME_CATEGORIES } from '../data/odiiCategoryData';

export const CategoryTagFilter: React.FC = () => {
  const selectedCategory = useOdiiAudioStore((s) => s.selectedCategory);
  const setSelectedCategory = useOdiiAudioStore((s) => s.setSelectedCategory);
  const setSearchQuery = useOdiiAudioStore((s) => s.setSearchQuery);
  const searchQuery = useOdiiAudioStore((s) => s.searchQuery);
  const [searchDraft, setSearchDraft] = useState(searchQuery);
  const selectedTheme = ODII_THEME_CATEGORIES.find((theme) => theme.keyword === selectedCategory);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSelectedCategory('전체');
    setSearchQuery(searchDraft.trim());
  };

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
      <form onSubmit={handleSearch} className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <label htmlFor="odii-story-search" className="sr-only">오디 이야기 검색</label>
        <div className="relative min-w-0 flex-1">
          <input
            id="odii-story-search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="장소·인물·키워드로 이야기 찾기"
            className="h-11 w-full rounded-xl border border-[#211e19]/12 bg-white px-4 pr-20 text-sm text-[#211e19] outline-none transition-colors placeholder:text-[#a59a8d] focus:border-[#a94d35]"
          />
        </div>
        <button type="submit" className="h-11 rounded-xl bg-[#211e19] px-5 text-xs font-semibold text-white transition-colors duration-300 hover:bg-[#a94d35]">
          찾기
        </button>
        {(searchQuery || searchDraft) && (
          <button
            type="button"
            onClick={() => {
              setSearchDraft('');
              setSearchQuery('');
            }}
            className="h-11 shrink-0 px-1 text-xs font-semibold text-[#8c7e6c] transition-colors hover:text-[#a94d35]"
          >
            지우기
          </button>
        )}
      </form>

      <div>
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
