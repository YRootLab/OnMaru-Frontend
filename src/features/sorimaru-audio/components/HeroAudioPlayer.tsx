'use client';

import React from 'react';
import styled from '@emotion/styled';
import { Bookmark, BookmarkCheck, Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { useSorimaruAudioPlayer } from '@/features/sorimaru-audio/hooks/useSorimaruAudioPlayer';
import { palette, meok, surface } from '@/design-system/tokens';

const PlayerCard = styled.div`
  background-color: #1C1814;
  color: #ffffff;
  border-radius: 1.5rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  position: relative;
  overflow: hidden;

  @media (min-width: 640px) {
    padding: 2rem;
  }
`;

const AtmosphereMood = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 16rem;
  height: 16rem;
  background: radial-gradient(circle at top right, rgba(212, 32, 88, 0.12), transparent 70%);
  pointer-events: none;
`;

const ContentTop = styled.div`
  position: relative;
  z-index: 10;
`;

const AlbumArtWrapper = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 1rem;
  overflow: hidden;
  margin-bottom: 1.5rem;
  background-color: #24211D;
`;

const CoverImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ImageScrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent 60%);
`;

const BadgeRow = styled.div`
  position: absolute;
  bottom: 0.75rem;
  left: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const GuideBadge = styled.span`
  padding: 0.25rem 0.75rem;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 800;
  border-radius: 0.375rem;
  background-color: ${palette.jangmi[500]};
`;

const CategoryBadge = styled.span`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.75rem;
  font-weight: 500;
  backdrop-filter: blur(4px);
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  background-color: rgba(0, 0, 0, 0.3);
`;

const AudioTitleHeading = styled.h1`
  margin-bottom: 0.375rem;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: var(--font-hanok);
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.025em;
  color: #ffffff;

  @media (min-width: 640px) {
    font-size: 1.5rem;
  }
`;

const DocentMeta = styled.p`
  margin-bottom: 1.5rem;
  font-size: 0.75rem;
  line-height: 1.25rem;
  color: #A09588;

  @media (min-width: 640px) {
    font-size: 0.875rem;
  }

  span.location {
    display: block;
  }
  span.speaker {
    display: block;
    margin-top: 0.125rem;
  }
`;

const ControlsContainer = styled.div`
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SliderWrapper = styled.div`
  width: 100%;
`;

const TimeRangeInput = styled.input`
  width: 100%;
  accent-color: ${palette.jangmi[500]};
  height: 6px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  appearance: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-color: ${palette.jangmi[500]};
    cursor: pointer;
  }
`;

const TimeRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  font-family: monospace;
  color: #A09588;
  margin-top: 0.375rem;
`;

const ButtonsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.5rem;
`;

const BookmarkBtn = styled.button<{ $active: boolean }>`
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  border: none;
  cursor: pointer;
  ${({ $active }) =>
    $active
      ? `
        color: #F8A8C0;
        background-color: rgba(212, 32, 88, 0.2);
      `
      : `
        color: #A09588;
        background-color: transparent;
        &:hover {
          color: #ffffff;
          background-color: rgba(255, 255, 255, 0.05);
        }
      `}
`;

const CenterControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SkipBtn = styled.button`
  padding: 0.5rem;
  color: #A09588;
  border: none;
  background: none;
  cursor: pointer;
  transition: color 0.15s ease;
  font-weight: 700;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    color: #ffffff;
  }
`;

const PlayPauseBtn = styled.button`
  padding: 0.75rem 1.25rem;
  color: #ffffff;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
  font-weight: 700;
  background-color: ${palette.jangmi[500]};

  &:hover {
    background-color: ${palette.jangmi[700]};
  }
  &:active {
    transform: scale(0.95);
  }
`;

const VolumeIndicator = styled.div`
  font-size: 0.75rem;
  color: #A09588;
  font-family: monospace;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const HeroAudioPlayer: React.FC = () => {
  const currentStory = useSorimaruAudioStore((s) => s.currentStory);
  const isPlaying = useSorimaruAudioStore((s) => s.isPlaying);
  const currentTime = useSorimaruAudioStore((s) => s.currentTime);
  const duration = useSorimaruAudioStore((s) => s.duration);
  const isBookmarked = useSorimaruAudioStore((s) => s.isBookmarked);

  const setIsPlaying = useSorimaruAudioStore((s) => s.setIsPlaying);
  const skipForward = useSorimaruAudioStore((s) => s.skipForward);
  const skipBackward = useSorimaruAudioStore((s) => s.skipBackward);
  const toggleBookmark = useSorimaruAudioStore((s) => s.toggleBookmark);

  const { seekTo } = useSorimaruAudioPlayer();

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo(val);
  };

  const remainingSeconds = Math.max(0, duration - currentTime);

  return (
    <PlayerCard>
      {/* 배경 은은한 무드 */}
      <AtmosphereMood />

      {/* 상단 앨범 아트 및 배지 */}
      <ContentTop>
        <AlbumArtWrapper>
          <CoverImage
            src={currentStory.imageUrl || 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80'}
            alt={currentStory.title}
          />
          <ImageScrim />
          <BadgeRow>
            <GuideBadge>
              {currentStory.badgeText || '한옥 오디오 가이드'}
            </GuideBadge>
            <CategoryBadge>
              {currentStory.category}
            </CategoryBadge>
          </BadgeRow>
        </AlbumArtWrapper>

        {/* 타이틀 및 해설자 */}
        <AudioTitleHeading>
          {currentStory.audioTitle || currentStory.title}
        </AudioTitleHeading>
        <DocentMeta>
          <span className="location">{currentStory.locationName || currentStory.title}</span>
          <span className="speaker">{currentStory.speaker || '온마루 해설 도슨트'}</span>
        </DocentMeta>
      </ContentTop>

      {/* 타임라인 슬라이더 & 컨트롤 */}
      <ControlsContainer>
        {/* 프로그레스 슬라이더 */}
        <SliderWrapper>
          <TimeRangeInput
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSliderChange}
          />
          <TimeRow>
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(remainingSeconds)}</span>
          </TimeRow>
        </SliderWrapper>

        {/* 컨트롤 버튼 모음 (SVG 아이콘 및 정갈한 라벨 적용) */}
        <ButtonsBar>
          {/* 북마크 버튼 */}
          <BookmarkBtn
            onClick={toggleBookmark}
            $active={isBookmarked}
          >
            {isBookmarked ? <BookmarkCheck size={14} strokeWidth={2} fill="currentColor" /> : <Bookmark size={14} strokeWidth={2} />}
            <span>{isBookmarked ? '저장됨' : '북마크'}</span>
          </BookmarkBtn>

          {/* 메인 컨트롤러 (10초 이전 / 재생-일시정지 / 10초 다음) */}
          <CenterControls>
            <SkipBtn
              onClick={() => skipBackward(10)}
              title="10초 뒤로"
            >
              <SkipBack size={16} strokeWidth={2} />
              <span>10s</span>
            </SkipBtn>

            <PlayPauseBtn
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <>
                  <Pause size={16} strokeWidth={2} />
                  <span>일시정지</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" style={{ marginLeft: '2px' }} />
                  <span>재생하기</span>
                </>
              )}
            </PlayPauseBtn>

            <SkipBtn
              onClick={() => skipForward(10)}
              title="10초 앞으로"
            >
              <span>10s</span>
              <SkipForward size={16} strokeWidth={2} />
            </SkipBtn>
          </CenterControls>

          <VolumeIndicator>
            <Volume2 size={16} strokeWidth={2} />
          </VolumeIndicator>
        </ButtonsBar>
      </ControlsContainer>
    </PlayerCard>
  );
};
