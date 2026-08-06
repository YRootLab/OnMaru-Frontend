'use client';

import React, { useState } from 'react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem, OdiiCategory } from '../types/odii.types';

interface AllStoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  allStories: OdiiStoryItem[];
}

const MODAL_CATEGORIES: OdiiCategory[] = [
  '전체',
  '한옥/고택',
  '전통시장/장터',
  '마을/골목길',
  '궁궐/역사',
  '소리/문화',
  '자연/둘레길',
];

const MODAL_CATEGORY_KEYWORDS: Record<string, string[]> = {
  '한옥/고택': ['한옥', '고택', '한옥마을'],
  '전통시장/장터': ['시장', '장터', '시전'],
  '마을/골목길': ['마을', '골목', '길'],
  '궁궐/역사': ['궁', '역사', '유적'],
  '소리/문화': ['소리', '전통', '문화'],
  '자연/둘레길': ['자연', '둘레길', '산', '공원'],
};

export const AllStoriesModal: React.FC<AllStoriesModalProps> = ({
  isOpen,
  onClose,
  allStories,
}) => {
  const currentStory = useOdiiAudioStore((s) => s.currentStory);
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  const setCurrentStory = useOdiiAudioStore((s) => s.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((s) => s.setIsPlaying);

  const [activeCat, setActiveCat] = useState<OdiiCategory>('전체');
  const [modalSearch, setModalSearch] = useState<string>('');

  if (!isOpen) return null;

  let filtered = allStories;
  if (activeCat !== '전체') {
    const keywords = MODAL_CATEGORY_KEYWORDS[activeCat] || [];
    filtered = filtered.filter((story) => {
      const searchableText = [story.category, story.title, story.audioTitle, story.locationName]
        .filter(Boolean)
        .join(' ');
      return keywords.some((keyword) => searchableText.includes(keyword));
    });
  }
  if (modalSearch.trim().length > 0) {
    const q = modalSearch.toLowerCase().trim();
    filtered = filtered.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.audioTitle.toLowerCase().includes(q) ||
        s.script.toLowerCase().includes(q)
    );
  }

  const handlePlayStory = (story: OdiiStoryItem) => {
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-[#1C1814] text-white w-full max-w-4xl max-h-[85vh] rounded-3xl border border-[#3A332C] shadow-2xl flex flex-col overflow-hidden">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-[#3A332C]">
          <div>
            <span className="text-[11px] font-bold text-[#F8A8C0] uppercase tracking-wider block mb-0.5">
              COMPLETE AUDIO COLLECTION
            </span>
            <h2 className="font-odii-sans text-xl font-semibold text-white sm:text-2xl">
              오디(Odii) 전체 이야기 아카이브
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-base transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 카테고리 필터 & 검색 */}
        <div className="p-6 border-b border-[#3A332C] space-y-4 bg-[#141210]">
          {/* 카테고리 태그 칩 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {MODAL_CATEGORIES.map((cat) => {
              const isSel = activeCat === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    isSel
                      ? 'bg-[#D42058] text-white shadow-md'
                      : 'bg-white/5 text-[#A09588] border border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* 검색창 */}
          <div className="relative">
            <input
              type="text"
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              placeholder="이야기, 장소, 해설사 키워드로 검색"
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#D42058]"
            />
            <span className="absolute left-3.5 top-3 text-xs text-white/50">🔍</span>
          </div>
        </div>

        {/* 오디오 이야기 리스트 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-thin scrollbar-thumb-white/20">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[#A09588] text-sm">
              일치하는 이야기가 없습니다.
            </div>
          ) : (
            filtered.map((story) => {
              const isCurrent = currentStory.stid === story.stid;
              const isThisPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={story.stid}
                  onClick={() => handlePlayStory(story)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#D42058]/20 border-[#D42058] text-white'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/25 text-[#A09588]'
                  }`}
                >
                  <div className="flex items-center space-x-4 min-w-0">
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      className="w-14 h-14 rounded-xl object-cover border border-white/10 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-[#D42058] text-white rounded">
                          {story.category}
                        </span>
                        <span className="text-xs text-white/60">
                          ⏱ {story.formattedDuration}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-white truncate">
                        {story.title}
                      </h4>
                      <p className="text-xs text-[#A09588] truncate mt-0.5">
                        {story.locationName || story.title} • {story.speaker}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayStory(story);
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ml-3 ${
                      isThisPlaying
                        ? 'bg-[#D42058] text-white shadow-lg animate-pulse'
                        : 'bg-white/10 text-white hover:bg-[#D42058]'
                    }`}
                  >
                    {isThisPlaying ? (
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
