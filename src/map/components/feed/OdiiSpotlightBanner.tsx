'use client';

import React from 'react';
import styled from '@emotion/styled';
import Image from 'next/image';
import { Compass, Headphones, Play, Sparkles } from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { useCinematicTourStore } from '@/features/cinematic-tour/store/useCinematicTourStore';
import { generateDynamicWaypoints } from '@/features/odii-audio/hooks/useOdiiPlaceStory';
import { useMapStore } from '../../hooks/useMapStore';

const CardContainer = styled.div`
  position: relative;
  margin: 10px 14px;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #1f2a37 0%, #111827 100%);
  color: #ffffff;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(17, 24, 39, 0.25);
`;

const BackgroundGlow = styled.div`
  position: absolute;
  top: -40px;
  right: -40px;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: ${lightPalette.jangmi[500]};
  opacity: 0.3;
  filter: blur(40px);
  pointer-events: none;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 9999px;
  font-size: 10.5px;
  font-weight: 800;
  color: #ffffff;
  background: ${lightPalette.jangmi[500]};
  box-shadow: 0 2px 8px rgba(212, 32, 88, 0.45);
`;

const DurationText = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.65);
`;

const StoryTitle = styled.h4`
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.02em;
`;

const StoryExcerpt = styled.p`
  margin: 0 0 14px;
  font-size: 12px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.8);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const DocentTag = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
`;

const StartBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 34px;
  padding: 0 14px;
  border-radius: 9999px;
  border: none;
  background: ${lightPalette.jangmi[500]};
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 3px 10px rgba(212, 32, 88, 0.45);

  &:hover {
    background: ${lightPalette.jangmi[400]};
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.96);
  }
`;

export default function OdiiSpotlightBanner() {
  const availableStories = useOdiiAudioStore((s) => s.availableStories);
  const center = useMapStore((s) => s.center);
  const startTour = useCinematicTourStore((s) => s.startTour);

  // 현재 지도 중심(center)에 가장 가까운 지역별 대표 Odii 스토리 동적 선별
  const spotlightStory = React.useMemo(() => {
    const validStories = availableStories.filter((s) => Boolean(s.audioUrl));
    if (validStories.length === 0) return null;

    let closest = validStories[0];
    let minDistance = Infinity;

    for (const s of validStories) {
      const sLat = parseFloat(s.mapY);
      const sLng = parseFloat(s.mapX);
      if (sLat && sLng) {
        const dLat = (sLat - center.lat) * 111;
        const dLng = (sLng - center.lng) * 88.8;
        const distKm = Math.sqrt(dLat * dLat + dLng * dLng);
        if (distKm < minDistance) {
          minDistance = distKm;
          closest = s;
        }
      }
    }
    return closest;
  }, [availableStories, center.lat, center.lng]);

  if (!spotlightStory) return null;

  const handleStart = () => {
    if (!spotlightStory.waypoints || spotlightStory.waypoints.length === 0) {
      spotlightStory.waypoints = generateDynamicWaypoints(spotlightStory);
    }
    startTour(spotlightStory);
  };

  return (
    <CardContainer>
      <BackgroundGlow />
      <TopRow>
        <Badge>
          <Compass size={12} />
          <span>공간 오디오 투어</span>
        </Badge>
        <DurationText>{spotlightStory.formattedDuration || '약 10분 소요'}</DurationText>
      </TopRow>

      <StoryTitle>{spotlightStory.audioTitle || spotlightStory.title}</StoryTitle>
      <StoryExcerpt>
        {spotlightStory.script || '문화해설사의 음성 해설과 함께 지도를 따라 걷는 고택 산책'}
      </StoryExcerpt>

      <ActionRow>
        <DocentTag>
          <Headphones size={13} />
          <span>{spotlightStory.speaker ?? '문화해설사 도슨트'}</span>
        </DocentTag>

        <StartBtn type="button" onClick={handleStart}>
          <Play size={13} fill="currentColor" />
          <span>투어 시작</span>
        </StartBtn>
      </ActionRow>
    </CardContainer>
  );
}
