'use client';

import React, { FormEvent, useId, useState } from 'react';
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
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#211e19]/8 bg-white/65 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#f84e76] " />
        <span className="truncate text-xs font-semibold text-[#211e19]">{labelFor(selectedCategory)}</span>
        {searchQuery && <span className="truncate text-[11px] text-[#8c7e6c]">“{searchQuery}”</span>}
        <span className="shrink-0 text-[10px] text-[#a59a8d]">{totalCount ?? resultCount}개 결과</span>
      </div>
      <form onSubmit={submit} className="flex min-w-0 items-center gap-2">
        <label htmlFor={searchId} className="sr-only">오디오 이야기 검색</label>
        <input
          id={searchId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="장소나 이야기 검색"
          className="h-8 min-w-0 flex-1 rounded-lg border border-[#211e19]/10 bg-white px-2.5 text-[11px] text-[#211e19] outline-none placeholder:text-[#b0a398] focus:border-[#f84e76]/60 sm:w-44 sm:flex-none"
        />
        <button type="submit" className="h-8 rounded-lg bg-[#f84e76] px-3 text-[11px] font-semibold text-white transition-colors hover:bg-[#dc4569]">검색</button>
        {hasFilter && <button type="button" onClick={reset} className="text-[11px] font-medium text-[#8c7e6c] hover:text-[#f84e76]">초기화</button>}
      </form>
    </div>
  );
};
