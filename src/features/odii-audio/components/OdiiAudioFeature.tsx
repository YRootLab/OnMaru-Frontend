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
    <div className="min-h-screen bg-[#FAF6F0] text-[#2A1A0A] selection:bg-[#D42058] selection:text-white font-sans pb-24 relative overflow-hidden">
      {/* 배경 은은한 창호지 문살 문양 SVG 디테일 패턴 */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#2A1A0A_1.5px,transparent_1.5px)] [background-size:24px_24px]" />

      {/* 온마루 마음 여행 에디토리얼 상단 헤더 */}
      <header className="w-full bg-[#FAF6F0] border-b border-[#EAE0D0] py-12 px-4 sm:px-8 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="px-3 py-1 text-xs font-extrabold bg-[#FFF0F4] text-[#D42058] rounded-full border border-[#F8A8C0]/40 shadow-xs">
                ON-MARU DOCENT ARCHIVE
              </span>
              <span className="text-xs font-semibold text-[#786050]">
                🇰🇷 한국관광공사 오디(Odii) 공공데이터 연동
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#2A1A0A] font-serif leading-tight">
              마음 여행 — 소리로 품은 한옥의 온기
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#786050] max-w-lg leading-relaxed border-l-2 border-[#D42058] pl-4">
            가장 한국적인 공간에서 느끼는 은근한 환대. 고즈넉한 한옥 고택의 새벽 아침부터 대청마루를 관통하는 바람 소리, 전통 시장의 따뜻한 인심까지 오디오 도슨트로 감상해보세요.
          </p>
        </div>
      </header>

      {/* 메인 콘텐츠 메인 레이아웃 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-10 space-y-16 relative z-10">
        {/* 1. Hero Player & Live Script Sync Viewer Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
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
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EAE0D0] shadow-md relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EAE0D0] pb-6 mb-4 gap-2">
            <div>
              <span className="text-xs font-extrabold text-[#D42058] tracking-widest uppercase block mb-1">
                Story Archive Collection
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2A1A0A] font-serif">
                오디 한옥 이야기 컬렉션
              </h3>
            </div>
            <span className="text-xs text-[#786050]">
              원하시는 테마별 태그를 선택하거나 장소를 검색해 보세요.
            </span>
          </div>

          <CategoryTagFilter />

          {isLoading ? (
            <div className="py-16 text-center text-[#786050] text-sm animate-pulse flex flex-col items-center gap-2">
              <span className="text-3xl animate-bounce">🏯</span>
              <span>한옥과 전통 시장의 이야기를 큐레이션하는 중입니다...</span>
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
