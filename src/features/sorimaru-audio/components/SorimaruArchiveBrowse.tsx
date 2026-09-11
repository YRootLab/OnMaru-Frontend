'use client';

import React, { useMemo, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import type { SorimaruStoryItem } from '@/features/sorimaru-audio/types/sorimaru.types';
import { groupSorimaruStoriesByPlace, type SorimaruPlaceGroup } from '@/features/sorimaru-audio/utils/sorimaruArchiveGrouping';

interface SorimaruArchiveBrowseProps {
  stories: SorimaruStoryItem[];
  isLoading: boolean;
}

type ArchiveView = 'stories' | 'places';

const FALLBACK_IMAGES = [
  '/images/hanok/hanok-main.png',
  '/images/hanok/hanok-exterior.png',
  '/images/hanok/hanok-interior.png',
  '/images/hanok/hanok-porch.png',
  '/images/hanok/giwa-detail.png',
];

function imageFor(story: SorimaruStoryItem, index: number) {
  if (story.imageUrl) return story.imageUrl;
  const seed = Array.from(`${story.stid}${story.title}`).reduce((sum, char) => sum + char.charCodeAt(0), index);
  return FALLBACK_IMAGES[seed % FALLBACK_IMAGES.length];
}

function storyContext(story: SorimaruStoryItem) {
  const location = story.locationName || '대한민국 문화유산';
  const category = story.category && story.category !== '오디 이야기' ? story.category : '';
  return category ? `${category} · ${location}` : location;
}

function ArchiveSkeleton() {
  return (
    <div aria-busy="true" aria-label="이야기 목록 로딩 중" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {Array.from({ length: 12 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-2xl bg-[#f8f8f7] p-3">
          <div className="sorimaru-skeleton h-20 w-20 shrink-0 rounded-xl bg-[#e5e5e3] sm:h-[86px] sm:w-[86px]" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="sorimaru-skeleton h-2.5 w-24 rounded bg-[#e5e5e3]" />
            <div className="sorimaru-skeleton h-4 w-4/5 rounded bg-[#cdcdca]" />
            <div className="sorimaru-skeleton h-2.5 w-2/5 rounded bg-[#e5e5e3]" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface StoryRowProps {
  story: SorimaruStoryItem;
  index: number;
}

function StoryRow({ story, index }: StoryRowProps) {
  const currentStory = useSorimaruAudioStore((state) => state.currentStory);
  const isPlaying = useSorimaruAudioStore((state) => state.isPlaying);
  const selectStory = useSorimaruAudioStore((state) => state.selectStory);
  const setCurrentStory = useSorimaruAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useSorimaruAudioStore((state) => state.setIsPlaying);
  const isCurrent = currentStory.stid === story.stid;
  const isThisPlaying = isCurrent && isPlaying;

  const togglePlayback = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isCurrent) setIsPlaying(!isPlaying);
    else setCurrentStory(story);
  };

  return (
    <article
      onClick={() => selectStory(story)}
      className={`group relative flex cursor-pointer items-center gap-4 rounded-2xl p-3 transition-all duration-300 ${
        isCurrent
          ? 'bg-[#FFF0F6]'
          : 'bg-[#f8f8f7] hover:bg-[#f0f0f0]'
      }`}
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#e5e5e3] sm:h-[86px] sm:w-[86px]">
        <img src={imageFor(story, index)} alt="" loading="lazy" decoding="async" className="h-full w-full scale-[1.18] object-cover transition-transform duration-500 group-hover:scale-[1.28]" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = FALLBACK_IMAGES[0]; }} />

        <span className="absolute left-1.5 top-1.5 rounded-md bg-black/45 px-1.5 py-0.5 font-mono text-micro font-bold leading-none text-white backdrop-blur-sm">
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className={`absolute inset-0 flex items-center justify-center bg-black/35 transition-opacity duration-200 ${isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={`${story.title} ${isThisPlaying ? '일시정지' : '재생'}`}
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#FF2A85] transition-transform active:scale-90"
          >
            {isThisPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
          </button>
        </div>

        {isThisPlaying && (
          <span className="absolute bottom-1.5 right-1.5 flex h-3 items-end gap-[2px]" aria-hidden="true">
            <span className="eq-bar w-[2.5px] rounded-full bg-[#FF2A85]" style={{ animationDelay: '0ms' }} />
            <span className="eq-bar w-[2.5px] rounded-full bg-[#FF2A85]" style={{ animationDelay: '180ms' }} />
            <span className="eq-bar w-[2.5px] rounded-full bg-[#FF2A85]" style={{ animationDelay: '90ms' }} />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-micro leading-4 text-[#4e5968]">{storyContext(story)}</p>
        <h3 className={`mt-0.5 line-clamp-2 font-sorimaru-sans text-sm font-bold leading-snug tracking-[-0.028em] sm:text-base ${isCurrent ? 'text-[#FF2A85]' : 'text-[#191f28]'}`}>{story.title}</h3>
        <p className="mt-1 truncate text-micro text-[#4e5968]">{story.audioTitle || story.locationName || '오디오 가이드'}</p>
      </div>


      <span className="shrink-0 self-start whitespace-nowrap rounded-full bg-[#211e19]/[0.05] px-2 py-1 text-micro font-semibold text-[#4e5968]">
        {story.formattedDuration || '3:00'}
      </span>

    </article>
  );
}

function PlaceGroupCard({ group, startIndex }: { group: SorimaruPlaceGroup; startIndex: number }) {
  return (
    <section className="rounded-2xl bg-[#f5f5f4] p-4">
      <header className="mb-3 flex items-center gap-3">
        <img src={imageFor(group.representative, startIndex)} alt="" loading="lazy" decoding="async" className="h-14 w-14 rounded-[10px] object-cover" />
        <div className="min-w-0">
          <h3 className="truncate font-sorimaru-sans text-sm font-bold tracking-[-0.03em] text-[#191f28]">{group.label}</h3>
          <p className="mt-0.5 text-micro text-[#4e5968]">현재 결과의 이야기 {group.stories.length}개</p>
        </div>
      </header>
      <div className="flex flex-col gap-2.5">
        {group.stories.map((story, index) => <StoryRow key={story.stid} story={story} index={startIndex + index} />)}
      </div>
    </section>
  );
}

export function SorimaruArchiveBrowse({ stories, isLoading }: SorimaruArchiveBrowseProps) {
  const [view, setView] = useState<ArchiveView>('stories');
  const groups = useMemo(() => groupSorimaruStoriesByPlace(stories), [stories]);

  return (
    <div>
      <div className="mb-1 flex items-center gap-1 pb-1" role="tablist" aria-label="아카이브 표시 방식">
        <button type="button" role="tab" aria-selected={view === 'stories'} onClick={() => setView('stories')} className={`relative px-1 pb-2 pt-1 text-xs transition-colors ${view === 'stories' ? 'font-semibold text-[#FF2A85] after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-[calc(100%+8px)] after:-translate-x-1/2 after:bg-[#FF2A85]' : 'text-[#4e5968] hover:text-[#191f28]'}`}>이야기</button>
        <button type="button" role="tab" aria-selected={view === 'places'} onClick={() => setView('places')} className={`relative ml-4 px-1 pb-2 pt-1 text-xs transition-colors ${view === 'places' ? 'font-semibold text-[#FF2A85] after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-[calc(100%+8px)] after:-translate-x-1/2 after:bg-[#FF2A85]' : 'text-[#4e5968] hover:text-[#191f28]'}`}>장소별 묶어 보기</button>
        {view === 'places' && <span className="ml-auto pb-2 text-micro text-[#8b95a1]">현재 결과 기준</span>}
      </div>

      {isLoading ? <ArchiveSkeleton /> : stories.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#4e5968]">선택한 조건에 해당하는 오디오 가이드가 없습니다.</div>
      ) : view === 'stories' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3">{stories.map((story, index) => <StoryRow key={story.stid} story={story} index={index} />)}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">{groups.map((group, index) => <PlaceGroupCard key={group.key} group={group} startIndex={index * 10} />)}</div>
      )}
    </div>
  );
}
