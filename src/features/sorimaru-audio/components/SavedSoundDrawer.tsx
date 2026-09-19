'use client';

import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import { SorimaruStoryItem } from '@/features/sorimaru-audio/types/sorimaru.types';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { palette, meok, surface, fontSize } from '@/design-system/tokens';

interface SavedSoundDrawerProps {
  savedStories: SorimaruStoryItem[];
  onRemoveBookmark: (storyId: string) => void;
}

const FloatingOpenButton = styled.button`
  position: fixed;
  bottom: 5rem;
  right: 1rem;
  z-index: 40;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f8f8f7;
  padding: 0.625rem 0.875rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${meok[900]};
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-radius: 9999px;
  transition: color 0.2s ease, background-color 0.2s ease;

  [data-theme='dark'] & {
    background-color: rgba(36, 33, 29, 0.95);
    color: ${meok[100]};
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  &:hover {
    color: ${palette.juhong[500]};
  }

  @media (min-width: 640px) {
    right: 1.5rem;
  }
`;

const DrawerBackdrop = styled(motion.button)`
  position: absolute;
  inset: 0;
  cursor: default;
  background-color: rgba(33, 30, 25, 0.35);
  border: none;
`;

const DrawerAside = styled(motion.aside)`
  position: relative;
  z-index: 10;
  display: flex;
  height: 100%;
  width: 100%;
  max-width: 28rem;
  flex-direction: column;
  background-color: #f8f8f7;
  padding: 1.5rem;
  color: ${meok[900]};
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.15);

  [data-theme='dark'] & {
    background-color: ${surface.dark.card};
    color: ${meok[100]};
    border-left: 1px solid rgba(255, 255, 255, 0.08);
  }

  @media (min-width: 640px) {
    padding: 2rem;
  }
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(33, 30, 25, 0.08);

  [data-theme='dark'] & {
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
`;

const CloseButton = styled.button`
  display: flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  color: ${meok[700]};
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: ${palette.juhong[500]};
  }

  [data-theme='dark'] & {
    color: ${meok[400]};

    &:hover {
      color: ${palette.juhong[400]};
    }
  }
`;

const ScrollList = styled.div`
  margin-top: 1.5rem;
  flex: 1;
  overflow-y: auto;
  padding-right: 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ItemRow = styled.div`
  display: flex;
  gap: 0.75rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(33, 30, 25, 0.06);

  [data-theme='dark'] & {
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }
`;

const ThumbBox = styled.div`
  height: 4rem;
  width: 5rem;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 8px;
  background-color: #e5e5e3;

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.08);
  }

  img {
    height: 100%;
    width: 100%;
    object-fit: cover;
  }
`;

const DrawerSubText = styled.p`
  font-size: 0.75rem;
  line-height: 1.25rem;
  color: ${meok[700]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

export const SavedSoundDrawer: React.FC<SavedSoundDrawerProps> = ({
  savedStories,
  onRemoveBookmark,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentStory = useSorimaruAudioStore((state) => state.currentStory);
  const isPlaying = useSorimaruAudioStore((state) => state.isPlaying);
  const setCurrentStory = useSorimaruAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useSorimaruAudioStore((state) => state.setIsPlaying);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handlePlay = (story: SorimaruStoryItem) => {
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  return (
    <>
      <FloatingOpenButton
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`마음 담아둔 소리 ${savedStories.length}개 열기`}
      >
        <Heart size={14} strokeWidth={2} fill="currentColor" style={{ color: palette.juhong[500] }} />
        마음 담아둔 소리
        <span style={{ fontFamily: 'var(--font-hanok)', fontVariantNumeric: 'tabular-nums', fontSize: fontSize.micro, color: meok[700] }}>
          {savedStories.length}
        </span>
      </FloatingOpenButton>

      <AnimatePresence>
        {isOpen && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}
            role="dialog"
            aria-modal="true"
            aria-label="마음 담아둔 소리 보관함"
          >
            <DrawerBackdrop
              type="button"
              aria-label="보관함 닫기"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            <DrawerAside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <DrawerHeader>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: palette.juhong[500] }}>다시 듣고 싶은 장면</p>
                  <h2 style={{ marginTop: '0.25rem', fontFamily: 'var(--font-hanok)', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.045em' }}>
                    마음 담아둔 소리
                  </h2>
                </div>
                <CloseButton
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="보관함 닫기"
                >
                  <X size={22} strokeWidth={2} />
                </CloseButton>
              </DrawerHeader>

              <DrawerSubText style={{ marginTop: '1rem' }}>
                좋아하는 이야기를 이곳에 모아두면 다음 방문에도 이어서 들을 수 있어요.
              </DrawerSubText>

              <ScrollList>
                {savedStories.length === 0 ? (
                  <div style={{ padding: '4rem 0', textAlign: 'center', fontSize: '0.75rem', lineHeight: '1.5rem', color: meok[700] }}>
                    담아둔 소리가 아직 없어요.
                    <br />
                    이야기 옆 하트를 누르면 담을 수 있어요.
                  </div>
                ) : (
                  savedStories.map((story, index) => {
                    const isCurrentPlaying = currentStory.stid === story.stid && isPlaying;
                    return (
                      <ItemRow key={`${story.stid}-${index}`}>
                        <ThumbBox>
                          <img
                            src={story.imageUrl || 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80'}
                            alt=""
                          />
                        </ThumbBox>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: fontSize.micro, color: palette.juhong[500] }}>
                            {story.locationName || '소리의 장소'}
                          </p>
                          <button
                            type="button"
                            onClick={() => handlePlay(story)}
                            style={{ marginTop: 2, display: 'block', maxWidth: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            <h3 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-hanok)', fontSize: '0.875rem', fontWeight: 700 }}>
                              {story.title}
                            </h3>
                            <p style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: fontSize.micro, color: meok[700] }}>
                              {story.audioTitle}
                            </p>
                          </button>
                          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button
                              type="button"
                              onClick={() => handlePlay(story)}
                              style={{ fontSize: fontSize.micro, fontWeight: 600, color: palette.juhong[500], background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              {isCurrentPlaying ? '잠시 멈추기' : '이야기 듣기'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveBookmark(story.stid)}
                              style={{ fontSize: fontSize.micro, color: meok[700], background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              담기 해제
                            </button>
                          </div>
                        </div>
                      </ItemRow>
                    );
                  })
                )}
              </ScrollList>

              <p style={{ paddingTop: '1rem', fontSize: fontSize.micro, color: meok[700], borderTop: '1px solid rgba(33, 30, 25, 0.08)' }}>
                이 기기에만 저장돼요.
              </p>
            </DrawerAside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
