'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';
import { KOREA_MAP_VIEWBOX, KOREA_REGION_PATHS, KoreaRegionPath } from '@/features/odii-audio/data/koreaMapPaths';

interface SoundConstellationSectionProps {
  stories: OdiiStoryItem[];
}

const [VB_WIDTH, VB_HEIGHT] = KOREA_MAP_VIEWBOX.split(' ').slice(2).map(Number);
const VISIBLE_STORY_COUNT = 6;
const EXPANDED_STORY_CAP = 30;
const STACK_ROTATIONS = [-7, 4, -3, 6];

const normalizeText = (story: OdiiStoryItem) => `${story.locationName || ''} ${story.title} ${story.audioTitle} ${story.category}`;
const getRegionStories = (stories: OdiiStoryItem[], region: KoreaRegionPath) => {
  const matched = stories.filter((story) => region.keywords.some((keyword) => normalizeText(story).includes(keyword)));
  return matched.length ? matched : stories.slice(0, 4);
};

export const SoundConstellationSection: React.FC<SoundConstellationSectionProps> = ({ stories }) => {
  const [selectedRegionId, setSelectedRegionId] = useState('seoul');
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);
  const selectedRegion = KOREA_REGION_PATHS.find((region) => region.id === selectedRegionId) || KOREA_REGION_PATHS[0];
  const regionStories = useMemo(() => getRegionStories(stories, selectedRegion), [stories, selectedRegion]);

  const [expandedForRegion, setExpandedForRegion] = useState(selectedRegionId);
  if (expandedForRegion !== selectedRegionId) {
    setExpandedForRegion(selectedRegionId);
    setIsListExpanded(false);
  }

  const playStory = (story: OdiiStoryItem) => {
    if (currentStory.stid === story.stid) setIsPlaying(!isPlaying);
    else setCurrentStory(story);
  };

  return (
    <section aria-labelledby="sound-map-heading" className="w-full py-10 sm:py-14">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        <div className="pb-1">
          <h2 id="sound-map-heading" className="inline-block bg-gradient-to-r from-[#211e19] via-[#403b35] to-[#6a6158] bg-clip-text font-odii-sans text-[clamp(24px,3.2vw,36px)] font-bold tracking-[-0.045em] text-transparent">지도로 듣는 이야기</h2>
          <p className="mt-1 max-w-xl text-xs sm:text-sm leading-5 text-[#786d5e]">대한민국 지도에서 지역을 눌러 그곳에 남은 오디오 이야기를 들어보세요.</p>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)] lg:gap-6">
          <div className="relative min-h-[480px] p-4 sm:min-h-[560px] sm:p-6">
            <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full  bg-[#fffdf9]/85 px-3.5 py-2 text-[12px] text-[#786d5e] backdrop-blur-sm sm:left-6 sm:top-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f84e76]" /> 지역을 눌러 탐색해보세요
            </div>

            <div className="relative mx-auto mt-14 aspect-[800/759] w-full max-w-[520px] sm:mt-12">
              <svg
                viewBox={KOREA_MAP_VIEWBOX}
                className="absolute inset-0 h-full w-full overflow-visible"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
              >
                {KOREA_REGION_PATHS.map((region) => {
                  const active = region.id === selectedRegionId;
                  const hovered = region.id === hoveredRegionId;
                  return (
                    <motion.path
                      key={region.id}
                      d={region.d}
                      onClick={() => setSelectedRegionId(region.id)}
                      onHoverStart={() => setHoveredRegionId(region.id)}
                      onHoverEnd={() => setHoveredRegionId((current) => (current === region.id ? null : current))}
                      animate={{
                        fill: active ? '#f84e76' : hovered ? '#e9dfcd' : '#fffdf9',
                        fillOpacity: active ? 0.92 : 1,
                      }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      stroke={active ? '#f84e76' : '#211e19'}
                      strokeOpacity={active ? 0.5 : 0.18}
                      strokeWidth={active ? 2.4 : 1.4}
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      className="cursor-pointer"
                      style={active ? { filter: 'drop-shadow(0 3px 8px rgba(248,78,118,0.22))' } : undefined}
                    />
                  );
                })}
              </svg>

              {KOREA_REGION_PATHS.map((region) => {
                const active = region.id === selectedRegionId;
                const count = getRegionStories(stories, region).length;
                return (
                  <div
                    key={region.id}
                    style={{ left: `${(region.centroid.x / VB_WIDTH) * 100}%`, top: `${(region.centroid.y / VB_HEIGHT) * 100}%` }}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedRegionId(region.id)}
                      className={`rounded-full px-2.5 py-1.5 text-[10px] font-semibold  backdrop-blur-sm outline-none transition-colors sm:px-3 sm:text-xs ${active ? ' bg-[#211e19] text-white' : ' bg-[#fffdf9]/90 text-[#655b4d] shadow-[0_1px_4px_rgba(33,30,25,0.1)] hover:'}`}
                      aria-pressed={active}
                    >
                      <span className="flex items-center gap-1.5">{region.shortLabel}<span className={active ? 'text-white/60' : 'text-[#a09587]'}>{count}</span></span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <aside aria-live="polite" className="flex min-h-[480px] flex-col rounded-[20px] border border-[#211e19]/[0.1] bg-white p-4 sm:min-h-[560px] sm:p-5">
            <div className="  pb-4">
              {regionStories.length > 0 && (
                <div className="mb-4 flex items-center pl-3">
                  {regionStories.slice(0, 4).map((story, index) => (
                    <div
                      key={story.stid}
                      style={{ marginLeft: index === 0 ? 0 : -26, zIndex: 10 - index, transform: `rotate(${STACK_ROTATIONS[index % STACK_ROTATIONS.length]}deg)` }}
                      className="h-[76px] w-[76px] shrink-0 rounded-xl bg-white p-1 shadow-[0_8px_18px_rgba(33,30,25,0.18)]"
                    >
                      <div className="h-full w-full overflow-hidden rounded-lg">
                        <img src={story.imageUrl} alt="" loading="lazy" className="h-full w-full scale-150 object-cover" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end justify-between gap-3"><h3 className="text-xl font-bold tracking-[-.04em] text-[#211e19]">{selectedRegion.label}</h3><span className="text-xs text-[#8c7e6c]">{regionStories.length}개 이야기</span></div>
            </div>
            <div className="mt-1 flex-1 divide-y divide-[#211e19]/[0.05] overflow-y-auto pr-1">
              {(isListExpanded ? regionStories.slice(0, EXPANDED_STORY_CAP) : regionStories.slice(0, VISIBLE_STORY_COUNT)).map((story) => {
                const active = currentStory.stid === story.stid;
                return (
                  <motion.button key={story.stid} type="button" onClick={() => playStory(story)} whileHover={{ x: 3 }} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${active ? 'bg-[#fff1f3]' : 'hover:bg-[#f7f4ee]'}`}>
                    {active && isPlaying && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#f84e76]" />}
                    <span className="min-w-0 flex-1"><strong className="block truncate text-xs font-bold text-[#211e19]">{story.title}</strong><span className="mt-1 block truncate text-[10px] text-[#8c7e6c]">{story.locationName || story.audioTitle || '문화유산 오디오'}</span></span>
                    <span className={`shrink-0 text-[10px] font-semibold ${active ? 'text-[#f84e76]' : 'text-[#a09587]'}`}>{active && isPlaying ? '재생 중' : story.formattedDuration || '듣기'}</span>
                  </motion.button>
                );
              })}
              {isListExpanded && regionStories.length > EXPANDED_STORY_CAP && (
                <p className="p-3 text-center text-[10px] leading-4 text-[#a09587]">전체 {regionStories.length}개 중 {EXPANDED_STORY_CAP}개까지 표시돼요.</p>
              )}
            </div>
            {regionStories.length > VISIBLE_STORY_COUNT && (
              <button
                type="button"
                onClick={() => setIsListExpanded((prev) => !prev)}
                className="mt-2 shrink-0 rounded-xl py-2 text-center text-[11px] font-semibold text-[#8c7e6c] transition-colors hover:bg-[#f7f4ee] hover:text-[#211e19]"
              >
                {isListExpanded ? '접기' : `${regionStories.length - VISIBLE_STORY_COUNT}개 더보기`}
              </button>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
};
