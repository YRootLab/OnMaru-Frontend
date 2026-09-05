'use client';

import React, { useMemo, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import type { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';
import { groupOdiiStoriesByPlace, type OdiiPlaceGroup } from '@/features/odii-audio/utils/odiiArchiveGrouping';

interface OdiiArchiveBrowseProps {
  stories: OdiiStoryItem[];
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

function imageFor(story: OdiiStoryItem, index: number) {
  if (story.imageUrl) return story.imageUrl;
  const seed = Array.from(`${story.stid}${story.title}`).reduce((sum, char) => sum + char.charCodeAt(0), index);
  return FALLBACK_IMAGES[seed % FALLBACK_IMAGES.length];
}

function storyContext(story: OdiiStoryItem) {
  const location = story.locationName || '대한민국 문화유산';
  const category = story.category && story.category !== '오디 이야기' ? story.category : '';
  return category ? `${category} · ${location}` : location;
}

function ArchiveSkeleton() {
  return (
    <div aria-busy="true" aria-label="이야기 목록 로딩 중" className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
      {Array.from({ length: 12 }, (_, index) => (
        <div key={index} className="grid grid-cols-[24px_76px_minmax(0,1fr)_32px] items-center gap-3 border-b border-[#211e19]/[0.08] py-4 sm:grid-cols-[26px_82px_minmax(0,1fr)_32px] sm:gap-3.5">
          <div className="odii-skeleton h-3 w-5 rounded bg-[#e5e5e3]" />
          <div className="odii-skeleton h-[76px] w-[76px] rounded-[12px] bg-[#d9d9d7] sm:h-[82px] sm:w-[82px]" />
          <div className="space-y-2.5"><div className="odii-skeleton h-2.5 w-24 rounded bg-[#e5e5e3]" /><div className="odii-skeleton h-4 w-4/5 rounded bg-[#cdcdca]" /><div className="odii-skeleton h-2.5 w-2/5 rounded bg-[#e5e5e3]" /></div>
          <div className="odii-skeleton h-8 w-8 rounded-full bg-[#e5e5e3]" />
        </div>
      ))}
    </div>
  );
}

interface StoryRowProps {
  story: OdiiStoryItem;
  index: number;
}

function StoryRow({ story, index }: StoryRowProps) {
  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const selectStory = useOdiiAudioStore((state) => state.selectStory);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);
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
      className={`group grid cursor-pointer grid-cols-[24px_76px_minmax(0,1fr)_32px] items-center gap-3 border-b border-[#211e19]/[0.08] py-4 transition-colors duration-200 sm:grid-cols-[26px_82px_minmax(0,1fr)_32px] sm:gap-3.5 ${isCurrent ? 'bg-[#fff8fa]' : 'hover:bg-[#f8f8f7]'}`}
    >
      <span className={`text-center font-mono text-[11px] font-semibold ${isCurrent ? 'text-[#f84e76]' : 'text-[#a19b93]'}`}>
        {isThisPlaying ? '●' : String(index + 1).padStart(2, '0')}
      </span>
      <div className="relative h-[76px] w-[76px] overflow-hidden rounded-[12px] bg-[#e5e5e3] sm:h-[82px] sm:w-[82px]">
        <img src={imageFor(story, index)} alt="" loading="lazy" decoding="async" className="h-full w-full scale-[1.18] object-cover" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = FALLBACK_IMAGES[0]; }} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[10px] leading-4 text-[#817a72]">{storyContext(story)}</p>
        <h3 className={`mt-0.5 line-clamp-2 font-odii-sans text-[15px] font-bold leading-snug tracking-[-0.028em] sm:text-base ${isCurrent ? 'text-[#f84e76]' : 'text-[#211e19]'}`}>{story.title}</h3>
        <p className="mt-1 truncate text-[11px] text-[#817a72]">{story.audioTitle || story.locationName || '오디오 가이드'}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span className="whitespace-nowrap text-[10px] font-medium text-[#9b9389]">{story.formattedDuration || '3:00'}</span>
        <button type="button" onClick={togglePlayback} aria-label={`${story.title} ${isThisPlaying ? '일시정지' : '재생'}`} className={`grid h-8 w-8 place-items-center rounded-full border transition-colors ${isThisPlaying ? 'border-[#f84e76] bg-[#f84e76] text-white' : 'border-[#211e19]/15 bg-white text-[#625d56] hover:border-[#f84e76] hover:text-[#f84e76]'}`}>
          {isThisPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} className="ml-0.5" fill="currentColor" />}
        </button>
      </div>
    </article>
  );
}

function PlaceGroupCard({ group, startIndex }: { group: OdiiPlaceGroup; startIndex: number }) {
  return (
    <section className="border-b border-[#211e19]/[0.1] py-4 sm:border sm:border-[#211e19]/[0.1] sm:p-4">
      <header className="mb-2.5 flex items-center gap-3">
        <img src={imageFor(group.representative, startIndex)} alt="" loading="lazy" decoding="async" className="h-14 w-14 rounded-[10px] object-cover" />
        <div className="min-w-0">
          <h3 className="truncate font-odii-sans text-[15px] font-bold tracking-[-0.03em] text-[#211e19]">{group.label}</h3>
          <p className="mt-0.5 text-[10px] text-[#817a72]">현재 결과의 이야기 {group.stories.length}개</p>
        </div>
      </header>
      <div className="border-t border-[#211e19]/[0.08]">
        {group.stories.map((story, index) => <StoryRow key={story.stid} story={story} index={startIndex + index} />)}
      </div>
    </section>
  );
}

export function OdiiArchiveBrowse({ stories, isLoading }: OdiiArchiveBrowseProps) {
  const [view, setView] = useState<ArchiveView>('stories');
  const groups = useMemo(() => groupOdiiStoriesByPlace(stories), [stories]);

  return (
    <div>
      <div className="mb-1 flex items-center gap-1 border-b border-[#211e19]/[0.1]" role="tablist" aria-label="아카이브 표시 방식">
        <button type="button" role="tab" aria-selected={view === 'stories'} onClick={() => setView('stories')} className={`relative px-1 pb-2 pt-1 text-xs transition-colors ${view === 'stories' ? 'font-semibold text-[#f84e76] after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-[calc(100%+8px)] after:-translate-x-1/2 after:bg-[#f84e76]' : 'text-[#817a72] hover:text-[#211e19]'}`}>이야기</button>
        <button type="button" role="tab" aria-selected={view === 'places'} onClick={() => setView('places')} className={`relative ml-4 px-1 pb-2 pt-1 text-xs transition-colors ${view === 'places' ? 'font-semibold text-[#f84e76] after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-[calc(100%+8px)] after:-translate-x-1/2 after:bg-[#f84e76]' : 'text-[#817a72] hover:text-[#211e19]'}`}>장소별 묶어 보기</button>
        {view === 'places' && <span className="ml-auto pb-2 text-[10px] text-[#9b9389]">현재 결과 기준</span>}
      </div>

      {isLoading ? <ArchiveSkeleton /> : stories.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#655f58]">선택한 조건에 해당하는 오디오 가이드가 없습니다.</div>
      ) : view === 'stories' ? (
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">{stories.map((story, index) => <StoryRow key={story.stid} story={story} index={index} />)}</div>
      ) : (
        <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">{groups.map((group, index) => <PlaceGroupCard key={group.key} group={group} startIndex={index * 10} />)}</div>
      )}
    </div>
  );
}
