'use client';

import React, { useEffect, useState } from 'react';
import { HeroAudioPlayer } from './HeroAudioPlayer';
import { ScriptSyncViewer } from './ScriptSyncViewer';
import { StoryCarousel } from './StoryCarousel';
import { CategoryTagFilter } from './CategoryTagFilter';
import { EditorialStoryList } from './EditorialStoryList';
import { ZIndexStackedSection } from './ZIndexStackedSection';
import { LocalMiniPlayer } from './LocalMiniPlayer';

import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { odiiApiAdapter } from '../api/odiiApi';
import { OdiiStoryItem } from '../types/odii.types';

export const OdiiAudioFeature: React.FC = () => {
  const selectedCategory = useOdiiAudioStore((s) => s.selectedCategory);
  const searchQuery = useOdiiAudioStore((s) => s.searchQuery);

  const [storyList, setStoryList] = useState<OdiiStoryItem[]>([]);
  const [nearbyStories, setNearbyStories] = useState<OdiiStoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 외부 데이터 주입형 API 호출 (어댑터 통과)
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
    return () => {
      isMounted = false;
    };
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#2A1A0A] selection:bg-[#D42058] selection:text-white font-sans pb-24">
      {/* 온마루 마음 여행 글로벌 헤더 배너 */}
      <header className="w-full bg-[#FAF6F0] border-b border-[#EAE0D0] py-8 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-bold bg-[#FFF0F4] text-[#D42058] rounded-full border border-[#F8A8C0]/30">
                ON-MARU AUDIO DOCENT
              </span>
              <span className="text-xs text-[#786050]">한국관광공사 Odii 데이터 연동</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#2A1A0A]">
              마음 여행 — 소리로 듣는 한옥의 온기
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#786050] max-w-md">
            가장 한국적인 공간에서 느끼는 따뜻한 환대. 고즈넉한 한옥 고택의 새벽부터 전통 시장의 사람내음까지 오디오 도슨트로 감상해보세요.
          </p>
        </div>
      </header>

      {/* 메인 콘텐츠 콘테이너 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 space-y-12">
        {/* 1. Hero Player & Live Script Sync Viewer Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5">
            <HeroAudioPlayer />
          </div>
          <div className="lg:col-span-7">
            <ScriptSyncViewer />
          </div>
        </section>

        {/* 2. 내 주변 이야기 LBS Carousel Section */}
        <StoryCarousel stories={nearbyStories} />

        {/* 3. Shopify Editions 2026 Style Z-Index Stacked Section */}
        <ZIndexStackedSection />

        {/* 4. Category Filter & Kolon Mall Style Editorial Story List Section */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE0D0] shadow-sm">
          <div className="mb-2">
            <span className="text-xs font-bold text-[#D42058] tracking-wider uppercase block">
              Story Archive
            </span>
            <h3 className="text-2xl font-extrabold text-[#2A1A0A]">
              오디오 이야기 컬렉션
            </h3>
          </div>

          <CategoryTagFilter />

          {isLoading ? (
            <div className="py-12 text-center text-[#786050] text-sm animate-pulse">
              한옥의 이야기를 불러오는 중입니다...
            </div>
          ) : (
            <EditorialStoryList stories={storyList} />
          )}
        </section>
      </main>

      {/* 오디 화면 하단 고정 Local Mini Player */}
      <LocalMiniPlayer />
    </div>
  );
};
