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
      {/* 1단: 인위적 요약 뱃지 없이 깨끗한 6대 브랜드 카테고리 태그 칩 */}
      <div>
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('전체');
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 whitespace-nowrap ${
              selectedCategory === '전체'
                ? 'bg-[#211e19] text-white shadow-sm font-bold'
                : 'text-[#655b4d] bg-[#f7f4ee] hover:bg-[#ede5d8] hover:text-[#211e19]'
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
                    ? 'bg-[#211e19] text-white shadow-sm font-bold'
                    : 'text-[#655b4d] bg-[#f7f4ee] hover:bg-[#ede5d8] hover:text-[#211e19]'
                }`}
              >
                {theme.label}
              </button>
            );
          })}
        </div>

        {selectedTheme && (
          <p className="mt-2 text-xs leading-5 text-[#8c7e6c]">
            <strong className="font-semibold text-[#a94d35]">{selectedTheme.label}</strong> · {selectedTheme.description}
          </p>
        )}
      </div>

      {/* 2단: 서브 검색 폼 & 지역 명소 필터 칩 */}
      <div className="flex flex-col gap-3 rounded-2xl bg-[#f7f4ee]/70 p-3.5 sm:flex-row sm:items-center sm:justify-between">
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
                    ? 'bg-[#a94d35] text-white font-bold shadow-xs'
                    : 'bg-white text-[#655b4d] border border-[#211e19]/10 hover:border-[#a94d35]/50 hover:text-[#211e19]'
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>

        {/* 서브 검색바 */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <label htmlFor="odii-story-search" className="sr-only">장소 및 가이드 검색</label>
          <input
            id="odii-story-search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="원하는 장소 검색"
            className="h-9 w-40 sm:w-48 rounded-xl border border-[#211e19]/12 bg-white px-3 text-xs text-[#211e19] outline-none transition-colors placeholder:text-[#a59a8d] focus:border-[#a94d35]"
          />
          <button type="submit" className="h-9 rounded-xl bg-[#211e19] px-3.5 text-xs font-semibold text-white transition-colors duration-300 hover:bg-[#a94d35]">
            검색
          </button>
          {(searchQuery || searchDraft) && (
            <button
              type="button"
              onClick={() => {
                setSearchDraft('');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-[#8c7e6c] hover:text-[#a94d35]"
            >
              지우기
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

