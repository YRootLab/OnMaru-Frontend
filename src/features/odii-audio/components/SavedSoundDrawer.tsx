'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { OdiiStoryItem } from '@/features/odii-audio/types/odii.types';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';

interface SavedSoundDrawerProps {
  savedStories: OdiiStoryItem[];
  onRemoveBookmark: (storyId: string) => void;
}

export const SavedSoundDrawer: React.FC<SavedSoundDrawerProps> = ({
  savedStories,
  onRemoveBookmark,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handlePlay = (story: OdiiStoryItem) => {
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`마음 담아둔 소리 ${savedStories.length}개 열기`}
        className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2  bg-[#fbf8f2] px-3.5 py-2.5 text-xs font-semibold text-[#211e19]  transition-colors hover: hover:text-[#a94d35] sm:right-6"
      >
        <span className="text-[#a94d35]">♥</span>
        마음 담아둔 소리
        <span className="font-mono text-[10px] text-[#8c7e6c]">{savedStories.length}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="마음 담아둔 소리 보관함">
            <motion.button
              type="button"
              aria-label="보관함 닫기"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 cursor-default bg-[#211e19]/35"
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#fbf8f2] p-6 text-[#211e19]  sm:p-8"
            >
              <div className="flex items-start justify-between   pb-5">
                <div>
                  <p className="text-xs font-semibold text-[#a94d35]">다시 듣고 싶은 장면</p>
                  <h2 className="mt-1 font-odii-sans text-2xl font-bold tracking-[-0.045em]">마음 담아둔 소리</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="보관함 닫기"
                  className="flex h-8 w-8 items-center justify-center text-xl text-[#8c7e6c] transition-colors hover:text-[#a94d35]"
                >
                  ×
                </button>
              </div>

              <p className="mt-4 text-xs leading-5 text-[#786d5e]">
                좋아하는 이야기를 이곳에 모아두면 다음 방문에도 이어서 들을 수 있어요.
              </p>

              <div className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
                {savedStories.length === 0 ? (
                  <div className="   py-16 text-center text-xs leading-6 text-[#8c7e6c]">
                    아직 담아둔 소리가 없습니다.
                    <br />
                    이야기 옆의 하트를 눌러보세요.
                  </div>
                ) : (
                  savedStories.map((story, index) => {
                    const isCurrentPlaying = currentStory.stid === story.stid && isPlaying;
                    return (
                      <div key={`${story.stid}-${index}`} className="flex gap-3   pb-4">
                        <div className="h-16 w-20 shrink-0 overflow-hidden bg-[#e5dbcd]">
                          <img src={story.imageUrl || 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80'} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] text-[#a94d35]">{story.locationName || '소리의 장소'}</p>
                          <button type="button" onClick={() => handlePlay(story)} className="mt-1 block max-w-full text-left">
                            <h3 className="truncate font-odii-sans text-sm font-bold">{story.title}</h3>
                            <p className="mt-0.5 truncate text-[10px] text-[#8c7e6c]">{story.audioTitle}</p>
                          </button>
                          <div className="mt-2 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handlePlay(story)}
                              className="text-[11px] font-semibold text-[#a94d35] hover:text-[#211e19]"
                            >
                              {isCurrentPlaying ? '잠시 멈추기' : '이야기 듣기'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveBookmark(story.stid)}
                              className="text-[11px] text-[#8c7e6c] hover:text-[#a94d35]"
                            >
                              담아두기 취소
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <p className="  pt-4 text-[10px] text-[#8c7e6c]">
                이 기기의 브라우저에 저장됩니다.
              </p>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
