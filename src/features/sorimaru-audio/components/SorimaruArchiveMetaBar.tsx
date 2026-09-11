'use client';

import React, { FormEvent, useId, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SORIMARU_THEME_CATEGORIES } from '@/features/sorimaru-audio/data/sorimaruCategoryData';

interface Props {
  resultCount: number;
  totalCount?: number;
}

const labelFor = (keyword: string) => {
  if (!keyword || keyword === '전체') return '전체 이야기';
  const category = SORIMARU_THEME_CATEGORIES.find((item) => item.keyword === keyword);
  if (keyword === '마을') return '전통마을';
  if (keyword === '시장') return '전통시장';
  if (keyword === '궁') return '궁궐/역사';
  if (keyword === '길') return '자연/둘레길';
  return category?.label || keyword;
};

export const SorimaruArchiveMetaBar: React.FC<Props> = ({ resultCount, totalCount }) => {
  const selectedCategory = useSorimaruAudioStore((state) => state.selectedCategory);
  const searchQuery = useSorimaruAudioStore((state) => state.searchQuery);
  const setSearchQuery = useSorimaruAudioStore((state) => state.setSearchQuery);
  const setSelectedCategory = useSorimaruAudioStore((state) => state.setSelectedCategory);
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
    <div className="mb-3 flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2 text-xs">
        <span className="inline-flex items-center rounded-full bg-[#211e19]/[0.05] px-2.5 py-1 font-bold text-[#191f28]">
          {labelFor(selectedCategory)}
        </span>
        {searchQuery && (
          <span className="truncate text-[#4e5968]">
            “<strong className="font-semibold text-[#191f28]">{searchQuery}</strong>” 검색 결과
          </span>
        )}
        <span className="shrink-0 text-[#8b95a1]">
          {(totalCount ?? resultCount).toLocaleString()}개
        </span>
      </div>

      <form onSubmit={submit} className="flex min-w-0 items-center gap-2 sm:w-72">
        <label htmlFor={searchId} className="sr-only">오디오 이야기 검색</label>

        <div className="group relative flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-[#f5f5f4] px-4 transition-all duration-200 focus-within:bg-[#FFF0F6]">
          <Search size={15} className="shrink-0 text-[#8b95a1] transition-colors group-focus-within:text-[#FF2A85]" />

          <input
            id={searchId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="장소 또는 키워드 검색"
            className="h-full w-full min-w-0 bg-transparent text-xs text-[#191f28] outline-none focus-visible:outline-none placeholder:text-[#8b95a1]"
          />
          {draft && (
            <button
              type="button"
              onClick={() => setDraft('')}
              aria-label="검색어 지우기"
              className="grid shrink-0 place-items-center rounded-full p-1 text-[#8b95a1] transition-colors hover:bg-[#211e19]/5 hover:text-[#191f28]"
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-10 shrink-0 rounded-full bg-[#211e19] px-4 text-xs font-bold text-white transition-colors hover:bg-[#FF2A85]"
        >
          검색
        </button>
        {hasFilter && (
          <button
            type="button"
            onClick={reset}
            className="shrink-0 text-xs font-medium text-[#8b95a1] transition-colors hover:text-[#191f28]"
          >
            초기화
          </button>
        )}
      </form>
    </div>
  );
};
