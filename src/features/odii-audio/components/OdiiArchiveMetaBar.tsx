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
    <div className="mb-3 flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2 text-xs">
        <span className="inline-flex items-center rounded-full bg-[#211e19]/[0.05] px-2.5 py-1 font-bold text-[#211e19]">
          {labelFor(selectedCategory)}
        </span>
        {searchQuery && (
          <span className="truncate text-[#786d5e]">
            “<strong className="font-semibold text-[#211e19]">{searchQuery}</strong>” 검색 결과
          </span>
        )}
        <span className="shrink-0 text-[#a09282]">
          {(totalCount ?? resultCount).toLocaleString()}개
        </span>
      </div>

      <form onSubmit={submit} className="flex min-w-0 items-center gap-2 sm:w-72">
        <label htmlFor={searchId} className="sr-only">오디오 이야기 검색</label>
        <div className="group relative flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-[#211e19]/[0.07] bg-white px-4 shadow-[0_1px_3px_rgba(33,30,25,0.04)] transition-all duration-200 focus-within:border-[#f84e76]/40 focus-within:shadow-[0_6px_18px_rgba(248,78,118,0.14)]">
          <IoSearchOutline size={15} className="shrink-0 text-[#b0a398] transition-colors group-focus-within:text-[#f84e76]" />
          <input
            id={searchId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="장소 또는 키워드 검색"
            className="h-full w-full min-w-0 bg-transparent text-xs text-[#211e19] outline-none focus-visible:outline-none placeholder:text-[#b0a398]"
          />
          {draft && (
            <button
              type="button"
              onClick={() => setDraft('')}
              aria-label="검색어 지우기"
              className="grid shrink-0 place-items-center rounded-full p-1 text-[#b0a398] transition-colors hover:bg-[#211e19]/5 hover:text-[#211e19]"
            >
              <IoCloseOutline size={14} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-10 shrink-0 rounded-full bg-[#211e19] px-4 text-xs font-bold text-white transition-colors hover:bg-[#f84e76]"
        >
          검색
        </button>
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
