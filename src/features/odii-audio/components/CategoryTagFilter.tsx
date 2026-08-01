'use client';

import React from 'react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiCategory } from '../types/odii.types';

const CATEGORIES: OdiiCategory[] = [
  '전체',
  '궁궐/유적',
  '한옥/고택',
  '정원/자연',
  '박물관/미술관',
  '시전/전통시장',
  '도보/골목길',
  '사람내음과 고운 정',
];

export const CategoryTagFilter: React.FC = () => {
  const selectedCategory = useOdiiAudioStore((s) => s.selectedCategory);
  const searchQuery = useOdiiAudioStore((s) => s.searchQuery);
  const setSelectedCategory = useOdiiAudioStore((s) => s.setSelectedCategory);
  const setSearchQuery = useOdiiAudioStore((s) => s.setSearchQuery);

  return (
    <div className="w-full py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* 태그 칩 모음 */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                isSelected
                  ? 'bg-[#D42058] text-white shadow-md shadow-[#D42058]/20 scale-105'
                  : 'bg-white/5 text-[#A09588] border border-white/10 hover:border-[#F8A8C0] hover:text-white'
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
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/15 rounded-full text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#D42058] focus:ring-2 focus:ring-[#D42058]/20 transition-all shadow-sm"
        />
        <span className="absolute left-3.5 top-3 text-xs text-white/50">🔍</span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-3 text-xs text-[#A09588] hover:text-white"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
