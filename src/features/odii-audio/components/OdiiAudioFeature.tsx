'use client';

import React, { useEffect, useState } from 'react';
import { HeroAudioPlayer } from './HeroAudioPlayer';
import { ScriptSyncViewer } from './ScriptSyncViewer';
import { StoryCarousel } from './StoryCarousel';
import { CategoryTagFilter } from './CategoryTagFilter';
import { EditorialStoryList } from './EditorialStoryList';
import { ZIndexStackedSection } from './ZIndexStackedSection';
import { ZTranslateCardStage } from './ZTranslateCardStage';
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

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
    <div className="min-h-screen bg-[#12100E] text-white selection:bg-[#D42058] selection:text-white font-sans pb-24 relative overflow-hidden">
      {/* 3D 깊이감 그라데이션 및 한지 은은한 배경 오버레이 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#2A221B_0%,#12100E_70%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* 온마루 마음 여행 다크 럭셔리 에디토리얼 상단 헤더 */}
      <header className="w-full border-b border-[#3A332C]/60 py-12 px-4 sm:px-8 relative z-10 bg-black/20 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="px-3 py-1 text-xs font-extrabold bg-[#D42058]/20 text-[#F8A8C0] rounded-full border border-[#D42058]/40 shadow-sm">
                ON-MARU AUDIO DOCENT
              </span>
              <span className="text-xs font-semibold text-[#A09588]">
                🇰🇷 한국관광공사 오디(Odii) 공공데이터 연동
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-serif leading-tight">
              마음 여행 — 소리로 품은 한옥의 온기
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <p className="text-xs sm:text-sm text-[#A09588] max-w-md leading-relaxed border-l-2 border-[#D42058] pl-4">
              가장 한국적인 공간에서 느끼는 은근한 환대. 고즈넉한 한옥 고택의 새벽부터 대청마루의 바람 소리, 전통 시장의 따뜻한 인심까지 오디오 도슨트로 감상해보세요.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-[#D42058] hover:bg-[#E03870] text-white text-xs font-bold rounded-xl transition-all shadow-lg flex-shrink-0"
            >
              전체 이야기 보기 ➔
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 콘테이너 */}
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

        {/* 2. preview.html 기반 3차원 Z-축 Translate3D Interactive Stage */}
        <ZTranslateCardStage featuredStories={nearbyStories} />

        {/* 3. 내 주변 이야기 LBS Carousel Section */}
        <StoryCarousel stories={nearbyStories} />

        {/* 4. Shopify Editions 2026 Style Z-Index Stacked Section */}
        <ZIndexStackedSection />

        {/* 5. Category Filter & Kolon Mall Style Editorial Story List Section */}
        <section className="bg-[#1C1814] rounded-3xl p-6 sm:p-10 border border-[#3A332C] shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#3A332C] pb-6 mb-4 gap-2">
            <div>
              <span className="text-xs font-extrabold text-[#F8A8C0] tracking-widest uppercase block mb-1">
                Story Archive Collection
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
                오디 한옥 이야기 컬렉션
              </h3>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs text-[#F8A8C0] hover:underline font-bold"
            >
              전체 아카이브 모달 띄우기 ↗
            </button>
          </div>

          <CategoryTagFilter />

          {isLoading ? (
            <div className="py-16 text-center text-[#A09588] text-sm animate-pulse flex flex-col items-center gap-2">
              <span className="text-3xl animate-bounce">🏯</span>
              <span>한옥과 전통 시장의 오디오 이야기를 큐레이션하는 중입니다...</span>
            </div>
          ) : (
            <EditorialStoryList stories={storyList} />
          )}
        </section>
      </main>

      {/* 오디 화면 하단 고정 Local Mini Player */}
      <LocalMiniPlayer />

      {/* 이야기 전체보기 모달 드로어 */}
      <AllStoriesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        allStories={storyList}
      />
    </div>
  );
};
