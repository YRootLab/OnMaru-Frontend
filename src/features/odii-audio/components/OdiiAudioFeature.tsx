'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { StoryCarousel } from './StoryCarousel';
import { CategoryTagFilter } from './CategoryTagFilter';
import { EditorialStoryList } from './EditorialStoryList';
import { ZIndexStackedSection } from './ZIndexStackedSection';
import { FeaturedStoryRail } from './FeaturedStoryRail';
import { AllStoriesModal } from './AllStoriesModal';
import { LocalMiniPlayer } from './LocalMiniPlayer';
import { OdiiAtmosphereBackground } from './OdiiAtmosphereBackground';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { odiiApiAdapter } from '../api/odiiApi';
import { MOCK_ODII_STORIES } from '../api/odiiMockData';
import { OdiiStoryItem } from '../types/odii.types';
import { ODII_CHAPTER_DEFINITIONS } from '../data/odiiChapterData';
import { ODII_HERO_TABS } from '../data/odiiCategoryData';
import { OdiiChapterPresentation } from '../types/odiiChapter.types';

const CHAPTER_FALLBACK_TERMS: Record<string, string[]> = {
  hanok: ['한옥', '고택', '한옥마을', '마루'],
  seowon: ['서원', '향교', '선비', '서당', '유교'],
  market: ['시장', '장터', '시전', '전통시장', '사람'],
  temple: ['사찰', '산사', '절', '사원', '종소리'],
};

function getStorySearchText(story: OdiiStoryItem): string {
  return [story.category, story.title, story.audioTitle, story.locationName]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase();
}

function scoreFallbackStory(story: OdiiStoryItem, chapterId: string): number {
  const searchableText = getStorySearchText(story);
  return (CHAPTER_FALLBACK_TERMS[chapterId] || []).reduce(
    (score, term) => score + (searchableText.includes(term) ? 1 : 0),
    0,
  );
}

function normalizeChapterPresentations(
  chapterStories: Record<string, OdiiStoryItem | null>,
  chapterStorySets: Record<string, OdiiStoryItem[]>,
  fallbackStories: OdiiStoryItem[],
): OdiiChapterPresentation[] {
  const storyPool = Array.from(new Map(fallbackStories.map((story) => [story.stid, story])).values());
  const usedStoryIds = new Set<string>();

  return ODII_CHAPTER_DEFINITIONS.map((definition) => {
    const apiStory = chapterStories[definition.keyword];
    const exactFallback = storyPool
      .filter((story) => !usedStoryIds.has(story.stid) && story.audioUrl)
      .sort((left, right) => scoreFallbackStory(right, definition.id) - scoreFallbackStory(left, definition.id))[0];
    const story = apiStory && !usedStoryIds.has(apiStory.stid) ? apiStory : exactFallback || null;
    const relatedStories = (chapterStorySets[definition.keyword] || [])
      .filter((relatedStory) => relatedStory.audioUrl && !usedStoryIds.has(relatedStory.stid))
      .slice(0, 2);
    const stories = Array.from(
      new Map([story, ...relatedStories].filter((item): item is OdiiStoryItem => Boolean(item)).map((item) => [item.stid, item])).values(),
    ).slice(0, 2);

    stories.forEach((item) => usedStoryIds.add(item.stid));
    return { ...definition, story: stories[0] || story, stories };
  });
}

export const OdiiAudioFeature: React.FC = () => {
  const selectedCategory = useOdiiAudioStore((s) => s.selectedCategory);
  const searchQuery = useOdiiAudioStore((s) => s.searchQuery);
  const [storyList, setStoryList] = useState<OdiiStoryItem[]>([]);
  const [nearbyStories, setNearbyStories] = useState<OdiiStoryItem[]>([]);
  const [heroStorySets, setHeroStorySets] = useState<Record<string, OdiiStoryItem[]>>({});
  const [chapterStories, setChapterStories] = useState<Record<string, OdiiStoryItem | null>>({});
  const [chapterStorySets, setChapterStorySets] = useState<Record<string, OdiiStoryItem[]>>({});
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

  useEffect(() => {
    let isMounted = true;

    Promise.all(
      ODII_HERO_TABS.map(async (tab) => {
        const stories = await odiiApiAdapter.getStoryList(undefined, tab.keyword || undefined);
        return [tab.id, stories.slice(0, 7)] as const;
      }),
    ).then((entries) => {
      if (isMounted) setHeroStorySets(Object.fromEntries(entries));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    odiiApiAdapter
      .getChapterStorySets(
        ODII_CHAPTER_DEFINITIONS.map((chapter) => chapter.keyword),
        MOCK_ODII_STORIES,
      )
      .then((storySets) => {
        if (isMounted) {
          setChapterStorySets(storySets);
          setChapterStories(
            Object.fromEntries(
              Object.entries(storySets).map(([keyword, stories]) => [keyword, stories[0] || null]),
            ),
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const chapterFallbackStories = useMemo(
    () => [...storyList, ...nearbyStories, ...MOCK_ODII_STORIES],
    [nearbyStories, storyList],
  );
  const chapters = useMemo(
    () => normalizeChapterPresentations(chapterStories, chapterStorySets, chapterFallbackStories),
    [chapterFallbackStories, chapterStories, chapterStorySets],
  );

  return (
    <div className="odii-feature relative isolate min-h-screen pb-24 text-[#211e19] selection:bg-[#d56748] selection:text-white">
      <OdiiAtmosphereBackground />
      <div className="relative z-10">
        <header className="px-4 py-6 sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/" className="text-xl font-semibold tracking-[-0.04em]">ONMARU</Link>
            <button onClick={() => setIsModalOpen(true)} className="text-xs font-semibold tracking-wide underline underline-offset-4">모든 이야기</button>
          </div>
        </header>

        <main>
        {/* 섹션 1: 상단 인트로 */}
        <section className="mx-auto max-w-6xl px-4 pb-6 pt-8 sm:px-8 sm:pt-10">
          <div className="max-w-xl">
            <h1 className="font-odii-sans text-2xl font-bold tracking-tight text-[#211e19] sm:text-3xl">
              소리를 따라, 한국의 온기 속으로
            </h1>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#655b4d]">
              바람이 머무는 한옥, 사람의 온기가 흐르는 시장, 오래된 골목의 시간을 오디오로 천천히 만나보세요.
            </p>
          </div>
        </section>

        <FeaturedStoryRail
          stories={storyList.length ? storyList : nearbyStories}
          storySets={heroStorySets}
        />
        <ZIndexStackedSection
          chapters={chapters}
        />

        {/* 섹션 4: 오늘, 여기에서 */}
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-odii-sans text-xl font-bold tracking-tight text-[#211e19] sm:text-2xl">가까운 이야기</h2>
            <span className="text-xs font-medium text-[#786d5e]">거리순 · {nearbyStories.length}개</span>
          </div>
          <StoryCarousel stories={nearbyStories} />
        </section>

        {/* 섹션 5: 모든 이야기 아카이브 */}
        <section className="bg-white px-4 py-10 sm:px-8 sm:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-xl">
              <h2 className="font-odii-sans text-xl font-bold tracking-tight text-[#211e19] sm:text-2xl">더 많은 이야기</h2>
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#655b4d]">
                테마 태그와 주요 문화도시 키워드로 취향에 맞는 오디오 도슨트를 탐색해 보세요.
              </p>
            </div>
            <CategoryTagFilter />
            {isLoading ? (
              <div className="py-16 text-center text-xs text-[#655b4d]">이야기를 불러오는 중입니다...</div>
            ) : (
              <EditorialStoryList stories={storyList} />
            )}
          </div>
        </section>

        </main>
      </div>

      <LocalMiniPlayer />
      <AllStoriesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} allStories={storyList} />
    </div>
  );
};
