'use client';

import React from 'react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiCategory } from '../types/odii.types';

const CATEGORIES: OdiiCategory[] = [
  '전체',
  '한옥/고택',
  '궁궐/역사',
  '전통시장/장터',
  '마을/골목길',
  '소리/문화',
  '박물관/미술관',
  '자연/둘레길',
];



export const CategoryTagFilter: React.FC = () => {
  const selectedCategory = useOdiiAudioStore((s) => s.selectedCategory);
  const searchQuery = useOdiiAudioStore((s) => s.searchQuery);
  const setSelectedCategory = useOdiiAudioStore((s) => s.setSelectedCategory);
  const setSearchQuery = useOdiiAudioStore((s) => s.setSearchQuery);

  return (
    <div className="w-full py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#211e19]/15">
      {/* 태그 칩 모음 */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                isSelected
                  ? 'bg-[#211e19] text-[#f7f0e4]'
                  : 'text-[#655b4d] border border-[#211e19]/20 hover:border-[#a94d35] hover:text-[#211e19]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 검색 입력창 */}
      <div className="relative w-full md:w-72">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="이야기, 장소, 해설사 검색"
          className="w-full pl-10 pr-4 py-2.5 bg-[#f7f0e4]/70 border border-[#211e19]/20 rounded-full text-sm text-[#211e19] placeholder-[#655b4d] focus:outline-none focus:border-[#a94d35] transition-all"
        />
        <span className="absolute left-3.5 top-3 text-xs text-[#655b4d]">⌕</span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-3 text-xs text-[#655b4d] hover:text-[#211e19]"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
