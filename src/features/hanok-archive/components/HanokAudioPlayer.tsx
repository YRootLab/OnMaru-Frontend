'use client';

import React, { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { Headphones, Play, Pause, RotateCcw, FileText, ChevronDown, ChevronUp, Volume2 } from 'lucide-react';
import { meok, lightPalette, surface } from '@/design-system/tokens';
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
          <Headphones size={15} color={lightPalette.kobalt[500]} />
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
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
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
  background: #f8f8f7;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 18px;
  padding: 20px 22px;
  margin-top: 20px;
  margin-bottom: 24px;
  transition: all 0.2s ease;

  [data-theme='dark'] & {
    background: #232220;
    border-color: rgba(255, 255, 255, 0.1);
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
  background: rgba(43, 108, 176, 0.08);
  padding: 4px 10px;
  border-radius: 9999px;

  [data-theme='dark'] & {
    background: rgba(43, 108, 176, 0.25);
  }
`;

const BadgeText = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: ${lightPalette.kobalt[500]};

  [data-theme='dark'] & {
    color: #90cdf4;
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
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 4px 8px;
  color: ${meok[700]};
  cursor: pointer;

  [data-theme='dark'] & {
    background: #1c1a17;
    border-color: rgba(255, 255, 255, 0.15);
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
  background: ${lightPalette.kobalt[500]};
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: #1e4e8c;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.96);
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
  height: 5px;
  border-radius: 5px;
  appearance: none;
  background: rgba(0, 0, 0, 0.12);
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${lightPalette.kobalt[500]};
    cursor: pointer;
    transition: transform 0.1s ease;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const ScriptSection = styled.div`
  margin-top: 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-top: 12px;

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.08);
  }
`;

const ScriptToggleBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  padding: 4px 0;
  font-size: 12.5px;
  font-weight: 600;
  color: ${meok[700]};
  cursor: pointer;

  &:hover {
    color: ${lightPalette.kobalt[500]};
  }

  [data-theme='dark'] & {
    color: ${meok[200]};
    &:hover {
      color: #90cdf4;
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
  padding: 14px;
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.05);
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
    background: #1c1a17;
    border-color: rgba(255, 255, 255, 0.08);
    color: ${meok[200]};
  }
`;
