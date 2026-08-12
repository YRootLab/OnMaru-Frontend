'use client';

import { useState } from 'react';
import { CompactPosterVariant } from './CompactPosterVariant';
import { EditorialCaptionVariant } from './EditorialCaptionVariant';
import { LandscapeCardVariant } from './LandscapeCardVariant';
import { OverlayInfoVariant } from './OverlayInfoVariant';
import { SECTION2_STUDY_STORIES } from './studyData';

export function Section2UiImprovements() {
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const sharedProps = {
    stories: SECTION2_STUDY_STORIES,
    selectedStoryId,
    onSelectStory: setSelectedStoryId,
  };

  return (
    <main className="odii-feature relative isolate overflow-x-clip pb-24 text-[#211e19]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(circle_at_12%_12%,rgba(248,78,118,0.12),transparent_32%),radial-gradient(circle_at_82%_4%,rgba(206,178,136,0.22),transparent_31%),linear-gradient(180deg,#fffaf5_0%,rgba(255,250,245,0)_100%)]"
      />
      <header className="mx-auto w-full max-w-6xl pb-12 pt-12 sm:pb-16 sm:pt-20">
        <div className="flex flex-col gap-8 border-b border-[#211e19]/10 pb-10 sm:flex-row sm:items-end sm:justify-between sm:pb-12">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold tracking-[0.22em] text-[#f84e76]">ODII · SECTION 2 UI IMPROVEMENTS</p>
            <h1 className="mt-4 font-odii-sans text-[clamp(34px,5.5vw,64px)] font-bold leading-[1.04] tracking-[-0.065em] text-[#211e19]">
              같은 이야기를,
              <br />
              네 가지 호흡으로.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-[#655b4d] sm:text-base sm:leading-7">
              기존 “장면을 골라 듣다”를 그대로 둔 채, 카드 높이와 정보 위치, 여백과 모서리만 달리해 비교하는 독립 시안 페이지입니다.
            </p>
          </div>
          <div className="grid w-full max-w-xs grid-cols-2 gap-px overflow-hidden rounded-[18px] border border-[#211e19]/10 bg-[#211e19]/10 text-[10px] sm:w-[270px]">
            <div className="bg-[#fffdf9]/90 p-3"><span className="block text-[#8c7e6c]">데이터</span><strong className="mt-1 block text-[#403930]">목 스토리 5개</strong></div>
            <div className="bg-[#fffdf9]/90 p-3"><span className="block text-[#8c7e6c]">범위</span><strong className="mt-1 block text-[#403930]">카드 UI 4안</strong></div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl">
        <CompactPosterVariant {...sharedProps} />
        <OverlayInfoVariant {...sharedProps} />
        <EditorialCaptionVariant {...sharedProps} />
        <LandscapeCardVariant {...sharedProps} />
      </div>
    </main>
  );
}
