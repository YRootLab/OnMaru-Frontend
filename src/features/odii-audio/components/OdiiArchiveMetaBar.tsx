'use client';

import React, { FormEvent, useId, useState } from 'react';
import { IoSearchOutline, IoCloseOutline } from 'react-icons/io5';
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
    <div className="mb-2 flex flex-col gap-3 border-b border-[#211e19]/10 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2 text-xs">
        <span className="font-semibold text-[#211e19]">{labelFor(selectedCategory)}</span>
        <span className="text-[#d0c7bd]">·</span>
        {searchQuery && (
          <span className="truncate text-[#655b4d]">
            “<strong className="font-semibold text-[#211e19]">{searchQuery}</strong>” 검색 결과
          </span>
        )}
        <span className="shrink-0 text-[#a09282]">
          {(totalCount ?? resultCount).toLocaleString()}개
        </span>
      </div>

      <form onSubmit={submit} className="flex min-w-0 items-center gap-2 sm:w-60">
        <label htmlFor={searchId} className="sr-only">오디오 이야기 검색</label>
        <div className="relative flex h-8 min-w-0 flex-1 items-center border-b border-[#211e19]/15 px-0.5 transition-colors duration-200 focus-within:border-[#f84e76]">
          <IoSearchOutline size={15} className="mr-2 shrink-0 text-[#a09282]" />
          <input
            id={searchId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="장소 또는 키워드 검색"
            className="h-full w-full bg-transparent text-xs text-[#211e19] outline-none focus-visible:outline-none placeholder:text-[#b0a398]"
          />
          {draft && (
            <button
              type="button"
              onClick={() => setDraft('')}
              className="p-1 text-[#b0a398] transition-colors hover:text-[#211e19]"
            >
              <IoCloseOutline size={14} />
            </button>
          )}
        </div>
        <button type="submit" className="shrink-0 text-xs font-semibold text-[#655b4d] transition-colors hover:text-[#f84e76]">검색</button>
        {hasFilter && (
          <button
            type="button"
            onClick={reset}
            className="shrink-0 text-xs font-medium text-[#a09282] transition-colors hover:text-[#211e19]"
          >
            초기화
          </button>
        )}
      </form>
    </div>
  );
};
