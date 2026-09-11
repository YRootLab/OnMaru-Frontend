'use client';

import React from 'react';
import styled from '@emotion/styled';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Camera,
  Compass,
  Headphones,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { lightPalette, darkPalette, meok, surface , fontSize } from '@/design-system/tokens';
import { useCinematicTourStore } from '@/features/cinematic-tour/store/useCinematicTourStore';

const Container = styled.div`
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: min(92vw, 620px);
  padding: 16px 20px;
  border-radius: 20px;
  backdrop-filter: blur(16px);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: tour-slide-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);

  @keyframes tour-slide-up {
    from {
      opacity: 0;
      transform: translate(-50%, 40px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0) scale(1);
    }
  }

  [data-theme='light'] &,
  :root:not([data-theme='dark']) & {
    background: rgba(255, 255, 255, 0.94);

  }

  [data-theme='dark'] & {
    background: rgba(36, 33, 29, 0.94);

  }

  @media (max-width: 768px) {
    bottom: 12px;
    width: calc(100vw - 24px);
    padding: 14px 16px;
  }
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
`;

const BadgeTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const TourBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 9999px;
  font-size: ${fontSize.micro};
  font-weight: 500;
  letter-spacing: 0.06em;
  white-space: nowrap;
  color: #ffffff;
  background: linear-gradient(135deg, ${lightPalette.juhong[500]} 0%, ${lightPalette.jangmi[500]} 100%);

`;

const TourTitle = styled.h4`
  margin: 0;
  font-size: ${fontSize.sm};
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  [data-theme='light'] &,
  :root:not([data-theme='dark']) & {
    color: ${meok[900]};
  }

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;

  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;

  [data-theme='light'] &,
  :root:not([data-theme='dark']) & {
    color: ${meok[700]};
    &:hover { background: rgba(25, 31, 40, 0.06); color: ${meok[900]}; }
  }

  [data-theme='dark'] & {
    color: ${meok[400]};
    &:hover { background: rgba(255, 255, 255, 0.08); color: ${meok[100]}; }
  }
`;

const WaypointChipsScroller = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 8px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const WaypointChip = styled.button<{ $active: boolean }>`
  flex: none;
  display: flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  border-radius: 9999px;
  border: none;
  font-size: ${fontSize.xs};
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);

  ${({ $active }) =>
    $active
      ? `
    background: ${lightPalette.jangmi[500]};
    color: #ffffff;
    transform: scale(1.04);
  `
      : `
    background: rgba(78, 89, 104, 0.08);
    color: ${meok[700]};
  `}

  [data-theme='dark'] & {
    ${({ $active }) =>
      $active
        ? `
      background: ${darkPalette.jangmi[500]};
      color: #ffffff;
    `
        : `
      background: rgba(255, 255, 255, 0.06);
      color: ${meok[400]};
    `}
  }
`;

const SubtitleBox = styled.div`
  padding: 10px 14px;
  margin-bottom: 12px;
  border-radius: 14px;
  border: none;
  min-height: 52px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: rgba(25, 31, 40, 0.04);

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const SubtitleMetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 3px;
`;

const SubtitleIndexBadge = styled.span`
  font-size: ${fontSize.micro};
  font-weight: 500;
  color: ${lightPalette.jangmi[700]};
  display: inline-flex;
  align-items: center;
  gap: 4px;

  [data-theme='dark'] & {
    color: ${darkPalette.jangmi[400]};
  }
`;

const SubtitleLine = styled.p`
  margin: 0;
  font-size: ${fontSize.sm};
  /* 자막 본문 — 읽는 글이지 강조하는 글이 아니다 */
  font-weight: 400;
  line-height: 1.5;
  color: ${meok[900]};
  word-break: keep-all;
  animation: sentence-glide-in 0.28s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes sentence-glide-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const PhotoTipPill = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${lightPalette.jangmi[700]};

  [data-theme='dark'] & {
    color: ${darkPalette.jangmi[400]};
  }
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const TimeText = styled.span`
  font-size: ${fontSize.xs};
  font-variant-numeric: tabular-nums;
  color: ${meok[500]};
  font-weight: 400;
`;

const MainButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PlayBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  background: ${lightPalette.jangmi[500]};
  color: #ffffff;
  cursor: pointer;

  transition: transform 0.15s ease, background 0.15s ease;

  &:hover {
    transform: scale(1.08);
    background: ${lightPalette.jangmi[700]};
  }

  &:active {
    transform: scale(0.95);
  }

  [data-theme='dark'] & {
    background: ${darkPalette.jangmi[500]};
  }
`;

function formatSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function CinematicTourFloatingBar() {
  const router = useRouter();
  const isActive = useCinematicTourStore((s) => s.isActive);
  const story = useCinematicTourStore((s) => s.story);
  const activeWaypointIndex = useCinematicTourStore((s) => s.activeWaypointIndex);
  const isPlaying = useCinematicTourStore((s) => s.isPlaying);
  const currentTime = useCinematicTourStore((s) => s.currentTime);
  const duration = useCinematicTourStore((s) => s.duration);
  const currentSubtitle = useCinematicTourStore((s) => s.currentSubtitle);
  const activeSentenceIndex = useCinematicTourStore((s) => s.activeSentenceIndex);
  const totalSentences = useCinematicTourStore((s) => s.totalSentences);
  const currentPhotoTip = useCinematicTourStore((s) => s.currentPhotoTip);

  const stopTour = useCinematicTourStore((s) => s.stopTour);
  const togglePlay = useCinematicTourStore((s) => s.togglePlay);
  const jumpToWaypoint = useCinematicTourStore((s) => s.jumpToWaypoint);
  const nextWaypoint = useCinematicTourStore((s) => s.nextWaypoint);
  const prevWaypoint = useCinematicTourStore((s) => s.prevWaypoint);

  if (!isActive || !story) return null;

  const waypoints = story.waypoints ?? [];

  return (
    <Container role="dialog" aria-label="시네마틱 공간 오디오 투어 컨트롤러">
      <TopRow>
        <BadgeTitleGroup>
          <TourBadge>
            <Compass size={13} />
            <span>시네마틱 투어</span>
          </TourBadge>
          <TourTitle>{story.title}</TourTitle>
        </BadgeTitleGroup>

        <ActionGroup>
          <IconButton
            type="button"
            onClick={() => router.push(`/sorimaru?storyId=${story.tid}`)}
            title="오디 전체 해설 및 대본 페이지로 이동"
          >
            <ExternalLink size={16} />
          </IconButton>
          <IconButton type="button" onClick={stopTour} title="투어 종료">
            <X size={18} />
          </IconButton>
        </ActionGroup>
      </TopRow>

      {/* 경유지 칩 목록 */}
      {waypoints.length > 0 && (
        <WaypointChipsScroller>
          {waypoints.map((wp, idx) => (
            <WaypointChip
              key={wp.id}
              type="button"
              $active={idx === activeWaypointIndex}
              onClick={() => jumpToWaypoint(idx)}
            >
              <span>{idx + 1}.</span>
              <span>{wp.title}</span>
            </WaypointChip>
          ))}
        </WaypointChipsScroller>
      )}

      {/* 실시간 한줄 대사 텔레프롬프터 및 포토존 팁 */}
      <SubtitleBox>
        {totalSentences > 1 && (
          <SubtitleMetaRow>
            <SubtitleIndexBadge>
              <Headphones size={11} />
              <span>해설 자막 ({activeSentenceIndex + 1}/{totalSentences})</span>
            </SubtitleIndexBadge>
          </SubtitleMetaRow>
        )}
        <SubtitleLine key={`${activeSentenceIndex}-${currentSubtitle.slice(0, 10)}`}>
          "{currentSubtitle || story.audioTitle}"
        </SubtitleLine>
        {currentPhotoTip && (
          <PhotoTipPill>
            <Camera size={13} />
            <span>포토 스팟: {currentPhotoTip}</span>
          </PhotoTipPill>
        )}
      </SubtitleBox>

      {/* 재생 컨트롤 및 시간 */}
      <ControlsRow>
        <TimeText>
          {formatSec(currentTime)} / {formatSec(duration)}
        </TimeText>

        <MainButtons>
          <IconButton
            type="button"
            onClick={prevWaypoint}
            disabled={activeWaypointIndex === 0}
            title="이전 스팟"
          >
            <SkipBack size={18} />
          </IconButton>

          <PlayBtn type="button" onClick={togglePlay} title={isPlaying ? '일시정지' : '재생'}>
            {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
          </PlayBtn>

          <IconButton
            type="button"
            onClick={nextWaypoint}
            disabled={activeWaypointIndex >= waypoints.length - 1}
            title="다음 스팟"
          >
            <SkipForward size={18} />
          </IconButton>
        </MainButtons>

        <TimeText style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Headphones size={13} />
          <span>{story.speaker ?? '도슨트'}</span>
        </TimeText>
      </ControlsRow>
    </Container>
  );
}
