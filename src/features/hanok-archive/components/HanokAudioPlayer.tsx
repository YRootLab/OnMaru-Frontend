'use client';

import React, { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { Headphones, Play, Pause, RotateCcw, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { meok, palette } from '@/design-system/tokens';
import type { OdiiStory } from '../hooks/useHanokOdii';

interface HanokAudioPlayerProps {
  stories: OdiiStory[];
  hanokName: string;
}

export default function HanokAudioPlayer({ stories, hanokName }: HanokAudioPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showScript, setShowScript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(currentStory?.playTime || 0);
  }, [currentIndex, currentStory]);

  if (!stories || stories.length === 0) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Container>
      <audio
        ref={audioRef}
        src={currentStory.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      <HeaderRow>
        <BadgeBox>
          <Headphones size={14} />
          <BadgeText>한국관광공사 Odii 오디오 도슨트</BadgeText>
        </BadgeBox>
        <QualityTag>공식 해설 음원</QualityTag>
      </HeaderRow>

      <StoryTitleBox>
        <StoryTitle>{currentStory.audioTitle || `${hanokName} 공간 해설`}</StoryTitle>
        {stories.length > 1 && (
          <SelectorSelect
            value={currentIndex}
            onChange={(e) => setCurrentIndex(Number(e.target.value))}
          >
            {stories.map((s, idx) => (
              <option key={s.stid || idx} value={idx}>
                {idx + 1}. {s.audioTitle.slice(0, 24)}...
              </option>
            ))}
          </SelectorSelect>
        )}
      </StoryTitleBox>

      {/* 오디오 컨트롤 바 */}
      <PlayerControls>
        <PlayBtn onClick={togglePlay} aria-label={isPlaying ? '일시정지' : '재생'}>
          {isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
        </PlayBtn>

        <TimeDisplay>{formatSeconds(currentTime)}</TimeDisplay>

        <ProgressBarWrapper>
          <ProgressBar
            type="range"
            min={0}
            max={duration || 1}
            value={currentTime}
            onChange={handleSeek}
          />
        </ProgressBarWrapper>

        <TimeDisplay>{formatSeconds(duration)}</TimeDisplay>

        <SecondaryBtn onClick={handleRestart} title="처음부터 다시 듣기">
          <RotateCcw size={15} />
        </SecondaryBtn>
      </PlayerControls>

      {/* 스크립트 토글 & 내용 */}
      {currentStory.script && (
        <ScriptSection>
          <ScriptToggleBtn onClick={() => setShowScript(!showScript)}>
            <ScriptToggleLeft>
              <FileText size={14} />
              <span>도슨트 낭독 대본 보기</span>
            </ScriptToggleLeft>
            {showScript ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </ScriptToggleBtn>

          {showScript && (
            <ScriptContent>
              {currentStory.script.split('\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </ScriptContent>
          )}
        </ScriptSection>
      )}
    </Container>
  );
}

const Container = styled.div`
  background: #f5f5f4;
  border: none;
  box-shadow: none;
  border-radius: 20px;
  padding: 22px 24px;
  margin-top: 16px;
  margin-bottom: 24px;

  [data-theme='dark'] & {
    background: #24211D;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const BadgeBox = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${palette.jangmi[50]};
  padding: 4px 10px;
  border-radius: 9999px;
  border: none;
  color: ${palette.jangmi[700]};

  svg {
    color: ${palette.jangmi[700]};
  }

  [data-theme='dark'] & {
    background: rgba(255, 42, 133, 0.16);
    color: ${palette.jangmi[400]};

    svg {
      color: ${palette.jangmi[400]};
    }
  }
`;

const BadgeText = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: ${palette.jangmi[700]};

  [data-theme='dark'] & {
    color: ${palette.jangmi[400]};
  }
`;

const QualityTag = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const StoryTitleBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const StoryTitle = styled.h4`
  font-size: 15px;
  font-weight: 600;
  color: ${meok[900]};
  margin: 0;
  line-height: 1.4;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const SelectorSelect = styled.select`
  font-size: 12px;
  background: #ffffff;
  border: none;
  box-shadow: none;
  border-radius: 8px;
  padding: 6px 10px;
  color: ${meok[700]};
  cursor: pointer;

  [data-theme='dark'] & {
    background: #1C1A17;
    color: ${meok[200]};
  }
`;

const PlayerControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PlayBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${palette.jangmi[500]};
  color: #ffffff;
  border: none;
  box-shadow: none;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: ${palette.jangmi[700]};
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.96);
  }

  [data-theme='dark'] & {
    background: ${palette.jangmi[500]};
    &:hover {
      background: ${palette.jangmi[400]};
    }
  }
`;

const SecondaryBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: transparent;
  color: ${meok[500]};
  border: none;
  box-shadow: none;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: ${meok[900]};
  }

  [data-theme='dark'] & {
    color: ${meok[400]};
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: ${meok[100]};
    }
  }
`;

const TimeDisplay = styled.span`
  font-size: 11.5px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: ${meok[500]};
  min-width: 34px;
  text-align: center;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const ProgressBarWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
`;

const ProgressBar = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 6px;
  appearance: none;
  background: rgba(0, 0, 0, 0.08);
  outline: none;
  cursor: pointer;
  border: none;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${palette.jangmi[500]};
    cursor: pointer;
    transition: transform 0.1s ease;
    border: none;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.25);
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.12);
  }
`;

const ScriptSection = styled.div`
  margin-top: 14px;
  padding-top: 12px;
  border: none;
`;

const ScriptToggleBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  box-shadow: none;
  padding: 4px 0;
  font-size: 12.5px;
  font-weight: 600;
  color: ${meok[700]};
  cursor: pointer;

  &:hover {
    color: ${palette.jangmi[700]};
  }

  [data-theme='dark'] & {
    color: ${meok[200]};
    &:hover {
      color: ${palette.jangmi[400]};
    }
  }
`;

const ScriptToggleLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ScriptContent = styled.div`
  margin-top: 10px;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  border: none;
  box-shadow: none;
  max-height: 180px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.7;
  color: ${meok[700]};
  word-break: keep-all;

  p {
    margin: 0 0 8px;
    &:last-child {
      margin-bottom: 0;
    }
  }

  [data-theme='dark'] & {
    background: #1C1A17;
    color: ${meok[200]};
  }
`;
