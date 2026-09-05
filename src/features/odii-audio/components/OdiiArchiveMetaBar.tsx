'use client';

import React, { FormEvent, useId, useState } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { ODII_THEME_CATEGORIES } from '@/features/odii-audio/data/odiiCategoryData';

interface Props {
  resultCount: number;
  totalCount?: number;
}

const labelFor = (keyword: string) => {
  if (!keyword || keyword === '전체') return '전체 이야기';
  const category = ODII_THEME_CATEGORIES.find((item) => item.keyword === keyword);
  if (keyword === '마을') return '전통마을';
  if (keyword === '시장') return '전통시장';
  if (keyword === '궁') return '궁궐/역사';
  if (keyword === '길') return '자연/둘레길';
  return category?.label || keyword;
};

export const OdiiArchiveMetaBar: React.FC<Props> = ({ resultCount, totalCount }) => {
  const selectedCategory = useOdiiAudioStore((state) => state.selectedCategory);
  const searchQuery = useOdiiAudioStore((state) => state.searchQuery);
  const setSearchQuery = useOdiiAudioStore((state) => state.setSearchQuery);
  const setSelectedCategory = useOdiiAudioStore((state) => state.setSelectedCategory);
  const [draft, setDraft] = useState(searchQuery);
  const searchId = useId();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSelectedCategory('전체');
    setSearchQuery(draft.trim());
  };

  const reset = () => {
    setDraft('');
    setSearchQuery('');
    setSelectedCategory('전체');
  };

  const hasFilter = selectedCategory !== '전체' || Boolean(searchQuery);

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/75 p-3 backdrop-blur-md shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-6 items-center rounded-full bg-[#f84e76]/10 px-3 py-0.5 text-[11px] font-bold text-[#f84e76]">
          {labelFor(selectedCategory)}
        </span>
        {searchQuery && (
          <span className="truncate text-xs font-semibold text-[#655b4d]">
            “<strong className="text-[#f84e76]">{searchQuery}</strong>” 검색 결과
          </span>
        )}
        <span className="shrink-0 font-mono text-xs font-bold text-[#8c7e6c]">
          ({(totalCount ?? resultCount).toLocaleString()}개)
        </span>
      </div>

      <form onSubmit={submit} className="flex min-w-0 items-center gap-2">
        <label htmlFor={searchId} className="sr-only">오디오 이야기 검색</label>
        <div className="relative flex h-9 min-w-0 flex-1 items-center rounded-xl border border-[#211e19]/10 bg-white/90 px-3 shadow-inner focus-within:border-[#f84e76]/40 focus-within:ring-2 focus-within:ring-[#f84e76]/15 sm:w-52 sm:flex-none">
          <Search size={14} className="mr-2 shrink-0 text-[#a09282]" />
          <input
            id={searchId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="장소 또는 키워드 검색"
            className="h-full w-full bg-transparent text-xs text-[#211e19] outline-none placeholder:text-[#b0a398]"
          />
          {draft && (
            <button
              type="button"
              onClick={() => setDraft('')}
              className="p-1 text-[#b0a398] hover:text-[#211e19]"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-9 rounded-xl bg-[#f84e76] px-3.5 text-xs font-bold text-white shadow-sm shadow-[#f84e76]/20 transition-all duration-200 hover:bg-[#dc4569] hover:shadow-md"
        >
          검색
        </button>
        {hasFilter && (
          <button
            type="button"
            onClick={reset}
            className="h-9 rounded-xl border border-white/80 bg-white/80 px-3 text-xs font-semibold text-[#8c7e6c] transition-all hover:bg-white hover:text-[#f84e76]"
          >
            초기화
          </button>
        )}
      </form>
    </div>
  );
};
