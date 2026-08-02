'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { HeroAudioPlayer } from './HeroAudioPlayer';
import { ScriptSyncViewer } from './ScriptSyncViewer';
import { StoryCarousel } from './StoryCarousel';
import { CategoryTagFilter } from './CategoryTagFilter';
import { EditorialStoryList } from './EditorialStoryList';
import { ZIndexStackedSection } from './ZIndexStackedSection';
import { FeaturedStoryRail } from './FeaturedStoryRail';
import { AllStoriesModal } from './AllStoriesModal';
import { LocalMiniPlayer } from './LocalMiniPlayer';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { odiiApiAdapter } from '../api/odiiApi';
import { OdiiStoryItem } from '../types/odii.types';

export const OdiiAudioFeature: React.FC = () => {
  const selectedCategory = useOdiiAudioStore((s) => s.selectedCategory);
  const searchQuery = useOdiiAudioStore((s) => s.searchQuery);
  const [storyList, setStoryList] = useState<OdiiStoryItem[]>([]);
  const [nearbyStories, setNearbyStories] = useState<OdiiStoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const [list, nearby] = await Promise.all([
        odiiApiAdapter.getStoryList(selectedCategory, searchQuery),
        odiiApiAdapter.getNearbyStories(),
      ]);
      if (isMounted) {
        setStoryList(list);
        setNearbyStories(nearby);
        setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#f3eee4] pb-24 font-odii-sans text-[#211e19] selection:bg-[#d56748] selection:text-white">
      <header className="px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="font-maruburi text-xl tracking-[-0.04em]">ONMARU</Link>
          <button onClick={() => setIsModalOpen(true)} className="text-xs font-semibold tracking-wide underline underline-offset-4">모든 이야기</button>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#a94d35]">오디 오디오 가이드</p>
            <h1 className="mt-5 max-w-3xl font-maruburi text-5xl font-semibold leading-[1.08] tracking-[-0.055em] sm:text-7xl">
              소리를 따라,<br />한국의 온기 속으로.
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-[#655b4d]">
              바람이 머무는 한옥, 사람의 온기가 흐르는 시장, 오래된 골목의 시간을 오디오로 천천히 만나보세요.
            </p>
          </div>
          <div className="border-t border-[#211e19]/20 pt-5 lg:col-span-5">
            <p className="text-sm leading-6 text-[#655b4d]">여행지의 풍경은 눈으로 먼저 만나지만, 그곳의 기억은 대개 소리로 남습니다.</p>
          </div>
        </section>

        <FeaturedStoryRail stories={storyList.length ? storyList : nearbyStories} />
        <ZIndexStackedSection stories={storyList.length ? storyList : nearbyStories} />

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
          <div className="mb-8 flex items-end justify-between border-b border-[#211e19]/20 pb-5">
            <div>
              <h2 className="font-maruburi text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">오늘, 여기에서 들을 수 있는 이야기</h2>
            </div>
              <p className="hidden text-xs text-[#655b4d] sm:block">거리순 · {nearbyStories.length}개의 오디오 가이드</p>
          </div>
          <StoryCarousel stories={nearbyStories} />
        </section>

        <section className="bg-[#e8dfd1] px-4 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-maruburi text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">모든 이야기를 찾아보세요.</h2>
              </div>
              <p className="max-w-xs text-sm leading-6 text-[#655b4d]">지역과 테마, 장소 이름으로 지금 떠나고 싶은 이야기를 찾을 수 있어요.</p>
            </div>
            <CategoryTagFilter />
            {isLoading ? (
              <div className="py-20 text-center text-sm text-[#655b4d]">이야기를 불러오는 중입니다.</div>
            ) : (
              <EditorialStoryList stories={storyList} />
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
          <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#211e19]/20 pb-5 sm:flex-row sm:items-end">
            <div><p className="text-xs font-semibold tracking-[0.16em] text-[#a94d35]">지금 재생 중</p><h2 className="mt-3 font-maruburi text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">지금, 귀 기울이는 장소</h2></div>
            <p className="max-w-xs text-sm leading-6 text-[#655b4d]">장소의 풍경을 보고, 이야기를 읽으며 같은 호흡으로 들어보세요.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
            <HeroAudioPlayer />
            <ScriptSyncViewer />
          </div>
        </section>
      </main>

      <LocalMiniPlayer />
      <AllStoriesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} allStories={storyList} />
    </div>
  );
};
