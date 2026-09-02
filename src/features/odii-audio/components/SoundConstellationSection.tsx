'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';

interface SoundConstellationSectionProps {
  stories: OdiiStoryItem[];
}

type Region = {
  id: string;
  label: string;
  shortLabel: string;
  x: number;
  y: number;
  color: string;
  keywords: string[];
};

const REGIONS: Region[] = [
  { id: 'seoul', label: '서울·경기', shortLabel: '서울·경기', x: 42, y: 27, color: '#f84e76', keywords: ['서울', '경기', '인천'] },
  { id: 'gangwon', label: '강원', shortLabel: '강원', x: 70, y: 18, color: '#6b9b80', keywords: ['강원'] },
  { id: 'chungbuk', label: '충북', shortLabel: '충북', x: 59, y: 41, color: '#c08c53', keywords: ['충북'] },
  { id: 'chungnam', label: '충남·대전', shortLabel: '충남', x: 35, y: 48, color: '#d27b62', keywords: ['충남', '대전', '세종'] },
  { id: 'jeonbuk', label: '전북', shortLabel: '전북', x: 34, y: 65, color: '#9d7b9e', keywords: ['전북', '전주'] },
  { id: 'jeonnam', label: '전남·광주', shortLabel: '전남', x: 22, y: 82, color: '#7695ad', keywords: ['전남', '광주'] },
  { id: 'gyeongbuk', label: '경북·대구', shortLabel: '경북', x: 74, y: 59, color: '#b8865e', keywords: ['경북', '대구', '안동', '경주'] },
  { id: 'gyeongnam', label: '경남·부산', shortLabel: '경남', x: 67, y: 82, color: '#8b9e6b', keywords: ['경남', '부산', '울산'] },
];

const MAP_PATH = 'M39 7 C34 12 29 17 27 24 C24 31 29 36 26 42 C22 49 25 57 21 64 C18 71 22 77 29 79 C35 81 36 89 43 92 C49 95 54 90 60 91 C67 92 70 86 76 83 C82 79 84 71 80 65 C77 60 82 53 78 47 C75 42 78 36 74 31 C71 27 75 19 69 16 C63 12 57 15 53 11 C49 7 44 4 39 7 Z';

const normalizeText = (story: OdiiStoryItem) => `${story.locationName || ''} ${story.title} ${story.audioTitle} ${story.category}`;
const getRegionStories = (stories: OdiiStoryItem[], region: Region) => {
  const matched = stories.filter((story) => region.keywords.some((keyword) => normalizeText(story).includes(keyword)));
  return matched.length ? matched : stories.slice(0, 4);
};

export const SoundConstellationSection: React.FC<SoundConstellationSectionProps> = ({ stories }) => {
  const [selectedRegionId, setSelectedRegionId] = useState('seoul');
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);
  const selectedRegion = REGIONS.find((region) => region.id === selectedRegionId) || REGIONS[0];
  const regionStories = useMemo(() => getRegionStories(stories, selectedRegion), [stories, selectedRegion]);

  const playStory = (story: OdiiStoryItem) => {
    if (currentStory.stid === story.stid) setIsPlaying(!isPlaying);
    else setCurrentStory(story);
  };

  return (
    <section aria-labelledby="sound-map-heading" className="w-full py-10 sm:py-14">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-[#f84e76]">AUDIO HERITAGE MAP</p>
            <h2 id="sound-map-heading" className="font-odii-sans text-2xl font-bold tracking-[-0.045em] text-[#211e19] sm:text-3xl">전국 문화유산 소리 지도</h2>
            <p className="mt-2 text-xs leading-5 text-[#786d5e]">대한민국 8개 권역을 눌러 그곳에 남은 오디오 이야기를 들어보세요.</p>
          </div>
          <span className="text-xs text-[#8c7e6c]">{stories.length}개의 이야기 · 권역 선택형</span>
        </div>

        <div className="grid gap-5 rounded-[28px] border border-[#211e19]/10 bg-[#fbf8f2] p-3  sm:p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)] lg:gap-6">
          <div className="relative min-h-[480px] overflow-hidden rounded-[22px] bg-[#f4efe7] p-4 sm:min-h-[560px] sm:p-6">
            <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-[#211e19]/10 bg-[#fffdf9]/85 px-3 py-1.5 text-[10px] text-[#786d5e] backdrop-blur-sm sm:left-6 sm:top-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f84e76]" /> 점선은 권역 경계 · 버튼을 눌러 탐색
            </div>

            <div className="relative mx-auto mt-12 h-[420px] w-full max-w-[620px] sm:mt-10 sm:h-[485px]">
              <svg viewBox="0 0 100 100" className="absolute inset-[5%_12%] h-[90%] w-[76%] overflow-visible" aria-hidden="true">
                <path d={MAP_PATH} fill="#fffdf9" stroke="#211e19" strokeOpacity=".28" strokeWidth=".55" vectorEffect="non-scaling-stroke" />
                <path d="M28 27 C43 22 55 25 70 18 M26 42 C39 38 53 41 63 48 M23 63 C38 58 52 67 66 59 M29 79 C42 76 52 84 67 82 M53 11 C52 30 58 42 54 56 C52 70 59 82 60 91 M27 24 C31 43 28 59 35 70 M74 31 C66 39 69 53 76 64" fill="none" stroke="#211e19" strokeOpacity=".2" strokeDasharray="1.5 1.7" strokeWidth=".65" vectorEffect="non-scaling-stroke" />
                <path d="M40 7 C34 14 30 21 28 29 M28 29 C25 38 26 44 22 52 M22 52 C19 63 20 73 29 79 M29 79 C38 86 40 93 49 92 M49 92 C60 94 71 86 78 78 M78 78 C84 69 80 58 78 48 M78 48 C76 36 77 27 69 17 M69 17 C58 11 48 3 40 7" fill="none" stroke="#f84e76" strokeOpacity=".55" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              </svg>

              {REGIONS.map((region) => {
                const active = region.id === selectedRegionId;
                const count = getRegionStories(stories, region).length;
                return (
                  <motion.button key={region.id} type="button" onClick={() => setSelectedRegionId(region.id)} whileHover={{ scale: 1.06 }} whileTap={{ scale: .97 }} style={{ left: `${region.x}%`, top: `${region.y}%`, '--region-color': region.color } as React.CSSProperties} className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border px-2.5 py-2 text-[10px] font-semibold  backdrop-blur-sm transition-colors sm:px-3 sm:text-xs ${active ? 'border-[var(--region-color)] bg-[#211e19] text-white' : 'border-[#211e19]/10 bg-[#fffdf9]/90 text-[#655b4d] hover:border-[var(--region-color)]'}`} aria-pressed={active}>
                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--region-color)]" />{region.shortLabel}<span className={active ? 'text-white/60' : 'text-[#a09587]'}>{count}</span></span>
                  </motion.button>
                );
              })}
              <span className="absolute left-[52%] top-[96%] -translate-x-1/2 text-[10px] tracking-[.14em] text-[#a09587]">JEJU</span>
            </div>
          </div>

          <aside aria-live="polite" className="flex min-h-[480px] flex-col rounded-[20px] border border-[#211e19]/8 bg-[#fffdf9] p-4 sm:min-h-[560px] sm:p-5">
            <div className="border-b border-[#211e19]/10 pb-4">
              <p className="text-[10px] font-semibold tracking-[.15em] text-[#f84e76]">SELECTED REGION</p>
              <div className="mt-1 flex items-end justify-between gap-3"><h3 className="text-xl font-bold tracking-[-.04em] text-[#211e19]">{selectedRegion.label}</h3><span className="text-xs text-[#8c7e6c]">{regionStories.length}개 이야기</span></div>
              <p className="mt-2 text-xs leading-5 text-[#786d5e]">이 권역에서 가장 먼저 들어볼 만한 문화유산 소리입니다.</p>
            </div>
            <div className="mt-3 flex-1 space-y-1 overflow-y-auto pr-1">
              {regionStories.slice(0, 6).map((story, index) => {
                const active = currentStory.stid === story.stid;
                return <motion.button key={story.stid} type="button" onClick={() => playStory(story)} whileHover={{ x: 3 }} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${active ? 'bg-[#fff1f3]' : 'hover:bg-[#f7f4ee]'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${active ? 'bg-[#f84e76] text-white' : 'bg-[#f2ede6] text-[#8c7e6c]'}`}>{String(index + 1).padStart(2, '0')}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs font-bold text-[#211e19]">{story.title}</strong><span className="mt-1 block truncate text-[10px] text-[#8c7e6c]">{story.locationName || story.audioTitle || '문화유산 오디오'}</span></span><span className={`shrink-0 text-[10px] font-semibold ${active ? 'text-[#f84e76]' : 'text-[#a09587]'}`}>{active && isPlaying ? '재생 중' : story.formattedDuration || '듣기'}</span></motion.button>;
              })}
            </div>
            <button type="button" onClick={() => regionStories[0] && playStory(regionStories[0])} className="mt-4 flex h-11 items-center justify-center gap-2 rounded-full bg-[#211e19] text-xs font-bold text-white transition-colors hover:bg-[#f84e76]">{isPlaying && currentStory.stid === regionStories[0]?.stid ? '일시정지' : `${selectedRegion.shortLabel} 이야기 하나 듣기`} <span aria-hidden="true">▶</span></button>
          </aside>
        </div>
      </div>
    </section>
  );
};
