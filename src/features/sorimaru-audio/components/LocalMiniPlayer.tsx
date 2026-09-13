'use client';

import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Pause, ChevronLeft, ChevronRight, X, SkipBack, SkipForward } from 'lucide-react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { useSorimaruAudioPlayer } from '@/features/sorimaru-audio/hooks/useSorimaruAudioPlayer';
import { palette, meok, surface, fontSize } from '@/design-system/tokens';

const formatTime = (seconds: number) =>
  `${Math.floor(Math.max(0, seconds || 0) / 60)}:${String(Math.floor(Math.max(0, seconds || 0) % 60)).padStart(2, '0')}`;

const PlayIcon: React.FC<{ size?: number }> = ({ size = 16 }) => {
  const isPlaying = useSorimaruAudioStore((s) => s.isPlaying);
  return isPlaying ? <Pause size={size} strokeWidth={2} /> : <Play size={size} fill="currentColor" style={{ marginLeft: 2 }} />;
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80';

const FloatingBarContainer = styled(motion.div)`
  position: fixed;
  bottom: calc(5.5rem + env(safe-area-inset-bottom));
  left: 0.75rem;
  right: 0.75rem;
  z-index: 110;
  margin-left: auto;
  margin-right: auto;
  width: auto;
  max-width: 36rem;
  overflow: hidden;
  border-radius: 1.35rem;
  background-color: rgba(248, 248, 247, 0.95);
  padding: 0.625rem 0.875rem 0.875rem;
  backdrop-filter: blur(24px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);

  [data-theme='dark'] & {
    background-color: rgba(36, 33, 29, 0.95);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  @media (min-width: 640px) {
    padding: 0.75rem 1rem 1rem;
  }
  @media (min-width: 768px) {
    bottom: calc(1.25rem + env(safe-area-inset-bottom));
    z-index: 50;
  }
`;

const MiniPlayerContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ExpandButton = styled.button`
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 0.75rem;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
`;

const ThumbnailImg = styled.img`
  height: 2.5rem;
  width: 2.5rem;
  flex-shrink: 0;
  border-radius: 0.75rem;
  object-fit: cover;
`;

const MetaTextCol = styled.span`
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const StoryTitle = styled.span`
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-hanok);
  font-size: ${fontSize.sm};
  font-weight: 600;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const StorySubMeta = styled.span`
  display: block;
  font-size: ${fontSize.micro};
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }

  .category {
    color: ${palette.jangmi[500]};
    font-weight: 600;
  }
  .time {
    margin-left: 0.5rem;
  }
`;

const PlayCircleBtn = styled.button`
  display: flex;
  height: 2.5rem;
  width: 2.5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background-color: ${palette.jangmi[500]};
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease;

  &:hover {
    background-color: ${palette.jangmi[700]};
    transform: scale(1.05);
  }
`;

const ScriptOpenBtn = styled.button`
  display: none;
  align-items: center;
  gap: 0.25rem;
  border-radius: 9999px;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${meok[700]};
  border: none;
  background: none;
  cursor: pointer;

  &:hover {
    background-color: ${meok[200]};
  }

  @media (min-width: 640px) {
    display: flex;
  }
`;

const ProgressSlot = styled.div`
  position: absolute;
  bottom: 0.375rem;
  left: 1rem;
  right: 1rem;

  @media (min-width: 640px) {
    left: 1.25rem;
    right: 1.25rem;
  }
`;

const ProgressTrack = styled.div`
  height: 2.5px;
  width: 100%;
  overflow: hidden;
  border-radius: 9999px;
  background-color: rgba(33, 30, 25, 0.1);
`;

const ProgressFill = styled.div<{ $width: number }>`
  height: 100%;
  border-radius: 9999px;
  background-color: ${palette.jangmi[500]};
  transition: width 0.3s ease;
  width: ${({ $width }) => $width}%;
`;

const DrawerBackdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 200;
  background-color: rgba(33, 30, 25, 0.4);
  backdrop-filter: blur(4px);

  @media (min-width: 768px) {
    z-index: 60;
  }
`;

const DrawerPanel = styled(motion.aside)<{ $isTranscriptOpen: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  border-top-left-radius: 1.5rem;
  border-top-right-radius: 1.5rem;
  background-color: #f8f8f7;
  padding: 1.5rem;
  padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  max-height: ${({ $isTranscriptOpen }) => ($isTranscriptOpen ? '88dvh' : '90dvh')};

  [data-theme='dark'] & {
    background-color: ${surface.dark.card};
    color: ${meok[100]};
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  @media (min-width: 1024px) {
    bottom: 1.5rem;
    left: 50%;
    right: auto;
    margin-left: -230px;
    width: 460px;
    border-radius: 1.5rem;
    padding: 1.75rem;
    max-height: ${({ $isTranscriptOpen }) => ($isTranscriptOpen ? '86vh' : 'auto')};

    [data-theme='dark'] & {
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
  }
`;

const DrawerHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1rem;
`;

const BackToPlayerBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${palette.jangmi[500]};
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    color: ${palette.jangmi[700]};
  }

  [data-theme='dark'] & {
    color: ${palette.jangmi[400]};
  }
`;

const CloseBtn = styled.button`
  display: flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  color: ${meok[700]};
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: ${meok[200]};
  }

  [data-theme='dark'] & {
    color: ${meok[400]};

    &:hover {
      background-color: rgba(255, 255, 255, 0.08);
      color: ${meok[100]};
    }
  }
`;

const CategoryBadge = styled.span`
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background-color: #FFF0F6;
  font-size: ${fontSize.micro};
  font-weight: 700;
  color: ${palette.jangmi[500]};

  [data-theme='dark'] & {
    background-color: rgba(255, 92, 159, 0.18);
    color: ${palette.jangmi[400]};
  }
`;

const PlayingStatusBadge = styled.span`
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  background-color: rgba(255, 42, 133, 0.1);
  font-size: ${fontSize.micro};
  font-weight: 700;
  color: ${palette.jangmi[500]};
  letter-spacing: 0.05em;

  [data-theme='dark'] & {
    background-color: rgba(255, 92, 159, 0.18);
    color: ${palette.jangmi[400]};
  }
`;

const ScriptProgressTrack = styled.div`
  pointer-events: none;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #e5e5e3;

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.08);
  }
`;

const ScriptProgressActive = styled(motion.div)`
  pointer-events: none;
  position: absolute;
  left: 0;
  top: 0;
  width: 2px;
  background-color: ${palette.jangmi[500]};
`;

const ScriptLineBtn = styled.button<{ $active: boolean }>`
  display: block;
  width: 100%;
  border-radius: 0.75rem;
  padding: 0.75rem 0.875rem;
  text-align: left;
  font-size: 0.875rem;
  line-height: 1.5rem;
  transition: background-color 0.15s ease, color 0.15s ease;
  border: none;
  cursor: pointer;

  ${({ $active }) =>
    $active
      ? `
        background-color: #e5e5e3;
        font-weight: 600;
        color: ${meok[900]};
      `
      : `
        background: none;
        color: ${meok[700]};
        &:hover {
          background-color: #f5f5f4;
        }
      `}

  [data-theme='dark'] & {
    ${({ $active }) =>
      $active
        ? `
          background-color: rgba(255, 255, 255, 0.12);
          font-weight: 600;
          color: #ffffff;
        `
        : `
          background: none;
          color: ${meok[400]};
          &:hover {
            background-color: rgba(255, 255, 255, 0.06);
            color: ${meok[200]};
          }
        `}
  }
`;

const BigPlayBtn = styled.button`
  display: flex;
  height: 3.25rem;
  width: 3.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background-color: ${palette.jangmi[500]};
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: ${palette.jangmi[700]};
  }
`;

const SkipTimeBtn = styled.button`
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  background-color: #f5f5f4;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${meok[700]};
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #e5e5e3;
  }

  [data-theme='dark'] & {
    background-color: ${surface.dark.surface};
    color: ${meok[200]};
    border: 1px solid rgba(255, 255, 255, 0.08);

    &:hover {
      background-color: ${surface.dark.elevated};
    }
  }
`;

const PreviewLineBtn = styled.button<{ $active: boolean }>`
  display: block;
  width: 100%;
  border-radius: 0.5rem;
  padding: 0.375rem 0.625rem;
  text-align: left;
  font-size: 0.75rem;
  line-height: 1.4;
  transition: all 0.15s ease;
  border: none;
  cursor: pointer;

  @media (min-width: 640px) {
    font-size: 0.875rem;
  }

  ${({ $active }) =>
    $active
      ? `
        background-color: ${palette.jangmi[500]};
        font-weight: 600;
        color: #ffffff;
      `
      : `
        background: none;
        color: ${meok[700]};
        &:hover {
          color: ${meok[900]};
        }
      `}

  [data-theme='dark'] & {
    ${({ $active }) =>
      $active
        ? `
          background-color: ${palette.jangmi[500]};
          font-weight: 600;
          color: #ffffff;
        `
        : `
          background: none;
          color: ${meok[400]};
          &:hover {
            color: ${meok[100]};
            background-color: rgba(255, 255, 255, 0.05);
          }
        `}
  }
`;

export const LocalMiniPlayer: React.FC = () => {
  const story = useSorimaruAudioStore((s) => s.currentStory);
  const isPlaying = useSorimaruAudioStore((s) => s.isPlaying);
  const currentTime = useSorimaruAudioStore((s) => s.currentTime);
  const duration = useSorimaruAudioStore((s) => s.duration);
  const activeIndex = useSorimaruAudioStore((s) => s.activeScriptIndex);
  const lines = useSorimaruAudioStore((s) => s.parsedScriptLines);
  const isExpanded = useSorimaruAudioStore((s) => s.isPlayerExpanded);
  const setIsPlaying = useSorimaruAudioStore((s) => s.setIsPlaying);
  const setIsExpanded = useSorimaruAudioStore((s) => s.setIsPlayerExpanded);
  const { seekTo } = useSorimaruAudioPlayer();
  const [isVisible, setIsVisible] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      const isMobileViewport = window.matchMedia('(max-width: 767px)').matches;
      const hasStartedPlayback = isPlaying || currentTime > 0;
      setIsVisible(isMobileViewport ? hasStartedPlayback : window.scrollY > 220 || isPlaying);
    };
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);
    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, [currentTime, isPlaying]);

  useEffect(() => {
    if (!isExpanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isExpanded]);

  const previewStart = Math.max(0, Math.min(activeIndex, Math.max(0, lines.length - 6)));
  const previewLines = lines.slice(previewStart, previewStart + 6);
  const audioProgress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const transcriptProgress = lines.length ? ((activeIndex + 1) / lines.length) * 100 : 0;
  const closePlayer = () => {
    setIsTranscriptOpen(false);
    setIsExpanded(false);
  };

  return (
    <>
      {/* 하단 플로팅 미니 플레이어 */}
      <AnimatePresence>
        {isVisible && (
          <FloatingBarContainer
            key="mini-player-floating-bar"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <MiniPlayerContent>
              <ExpandButton type="button" onClick={() => setIsExpanded(true)}>
                <ThumbnailImg src={story.imageUrl || FALLBACK_IMAGE} alt="" />
                <MetaTextCol>
                  <StoryTitle>{story.title}</StoryTitle>
                  <StorySubMeta>
                    <span className="category">{story.category}</span>
                    <span className="time">{formatTime(currentTime)} / {formatTime(duration)}</span>
                  </StorySubMeta>
                </MetaTextCol>
              </ExpandButton>

              <PlayCircleBtn type="button" onClick={() => setIsPlaying(!isPlaying)}>
                <PlayIcon />
              </PlayCircleBtn>
              <ScriptOpenBtn type="button" onClick={() => setIsExpanded(true)}>
                대본 보기
              </ScriptOpenBtn>
            </MiniPlayerContent>

            {/* 🎵 미니 플레이어 바닥면 프로그레스 바 */}
            <ProgressSlot>
              <ProgressTrack>
                <ProgressFill $width={audioProgress} />
              </ProgressTrack>
            </ProgressSlot>
          </FloatingBarContainer>
        )}
      </AnimatePresence>

      {/* 확장 플레이어 & 전체 대본 Drawer */}
      <AnimatePresence>
        {isExpanded && (
          <DrawerBackdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePlayer}
          >
            <DrawerPanel
              layout
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ type: 'spring', damping: 30, stiffness: 340 }}
              onClick={(event) => event.stopPropagation()}
              $isTranscriptOpen={isTranscriptOpen}
            >
              {isTranscriptOpen ? (
                <>
                  <DrawerHeader>
                    <BackToPlayerBtn type="button" onClick={() => setIsTranscriptOpen(false)}>
                      <ChevronLeft size={14} strokeWidth={2} /> 오디오 플레이어로
                    </BackToPlayerBtn>
                    <CloseBtn type="button" onClick={closePlayer} aria-label="패널 닫기">
                      <X size={20} strokeWidth={2} />
                    </CloseBtn>
                  </DrawerHeader>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0' }}>
                    <div>
                      <CategoryBadge>{story.category}</CategoryBadge>
                      <h2
                        style={{
                          marginTop: '0.375rem',
                          maxWidth: 280,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontFamily: 'var(--font-hanok)',
                          fontSize: '1.125rem',
                          fontWeight: 600,
                          color: meok[900],
                        }}
                      >
                        {story.title}
                      </h2>
                      <p style={{ fontSize: '0.75rem', color: meok[700] }}>{story.locationName || '대한민국 문화유산'}</p>
                    </div>
                    <PlayCircleBtn
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      style={{ height: '2.75rem', width: '2.75rem' }}
                    >
                      <PlayIcon />
                    </PlayCircleBtn>
                  </div>

                  <div style={{ position: 'relative', paddingLeft: '1.25rem', paddingRight: '0.5rem', paddingTop: '0.5rem' }}>
                    <ScriptProgressTrack />
                    <ScriptProgressActive
                      animate={{ height: `${transcriptProgress}%` }}
                      transition={{ duration: 0.45 }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {lines.map((line) => (
                        <ScriptLineBtn
                          key={line.id}
                          type="button"
                          onClick={() => seekTo(line.timeSec)}
                          $active={line.id === lines[activeIndex]?.id}
                        >
                          {line.text}
                        </ScriptLineBtn>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <PlayingStatusBadge>지금 재생 중</PlayingStatusBadge>
                    <CloseBtn type="button" onClick={closePlayer} aria-label="패널 닫기">
                      <X size={20} strokeWidth={2} />
                    </CloseBtn>
                  </div>

                  <motion.img
                    layoutId="sorimaru-player-art"
                    src={story.imageUrl || FALLBACK_IMAGE}
                    alt={story.title}
                    style={{
                      height: '9rem',
                      width: '100%',
                      borderRadius: '1rem',
                      objectFit: 'cover',
                    }}
                  />

                  {/* 메인 타이틀 & 서브타이틀 UX */}
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CategoryBadge>{story.category}</CategoryBadge>
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: meok[700] }}>
                        {story.locationName || '대한민국 문화유산'}
                      </span>
                    </div>

                    <h2
                      style={{
                        marginTop: '0.5rem',
                        fontFamily: 'var(--font-hanok)',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: meok[900],
                        lineHeight: 1.25,
                      }}
                    >
                      {story.title}
                    </h2>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', lineHeight: '1.25rem', color: meok[700] }}>
                      <span style={{ display: 'block' }}>{story.audioTitle}</span>
                      <span style={{ marginTop: '0.125rem', display: 'block', color: meok[500], fontWeight: 500 }}>
                        {story.speaker || '온마루 문화해설사'}
                      </span>
                    </p>
                  </div>

                  {/* 오디오 탐색 프로그레스 바 & 컨트롤 */}
                  <div style={{ marginTop: '1.25rem' }}>
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={(event) => seekTo(Number(event.target.value))}
                      style={{ width: '100%', accentColor: palette.jangmi[500], cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'monospace', color: meok[500], marginTop: '0.25rem' }}>
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                    <SkipTimeBtn type="button" onClick={() => seekTo(Math.max(0, currentTime - 10))}>
                      <SkipBack size={13} strokeWidth={2} />
                      <span>10초 전</span>
                    </SkipTimeBtn>
                    <BigPlayBtn type="button" onClick={() => setIsPlaying(!isPlaying)}>
                      <PlayIcon size={20} />
                    </BigPlayBtn>
                    <SkipTimeBtn type="button" onClick={() => seekTo(Math.min(duration || currentTime + 10, currentTime + 10))}>
                      <span>10초 후</span>
                      <SkipForward size={13} strokeWidth={2} />
                    </SkipTimeBtn>
                  </div>

                  {/* 대본 미리보기 & 전체 대본 보기 전환 */}
                  {previewLines.length > 0 && (
                    <section style={{ marginTop: '1.25rem', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontSize: fontSize.micro, fontWeight: 700, letterSpacing: '0.14em', color: palette.jangmi[500] }}>
                            실시간 자막
                          </p>
                          <h3 style={{ marginTop: '0.125rem', fontFamily: 'var(--font-hanok)', fontSize: '0.875rem', fontWeight: 600, color: meok[900] }}>
                            해설 대본
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsTranscriptOpen(true)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(255, 42, 133, 0.1)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: palette.jangmi[500],
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <span>전체 대본 보기</span>
                          <ChevronRight size={13} strokeWidth={2} />
                        </button>
                      </div>

                      <div style={{ position: 'relative', marginTop: '0.75rem', height: '9rem', overflow: 'hidden', borderRadius: '0.75rem', backgroundColor: '#f5f5f4', padding: '0.75rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                          {previewLines.map((line) => (
                            <PreviewLineBtn
                              key={line.id}
                              type="button"
                              onClick={() => seekTo(line.timeSec)}
                              $active={line.id === lines[activeIndex]?.id}
                            >
                              {line.text}
                            </PreviewLineBtn>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}
                </>
              )}
            </DrawerPanel>
          </DrawerBackdrop>
        )}
      </AnimatePresence>
    </>
  );
};
