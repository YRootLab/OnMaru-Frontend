'use client';

import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Play } from 'lucide-react';
import { lightPalette, meok, surface , fontSize } from '@/design-system/tokens';

const bannerShimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonBar = styled.div<{ $w: string; $h: string; $radius?: string }>`
  width: ${({ $w }) => $w};
  height: ${({ $h }) => $h};
  border-radius: ${({ $radius }) => $radius || '6px'};
  background: linear-gradient(90deg, rgba(25, 31, 40, 0.05) 25%, rgba(25, 31, 40, 0.09) 50%, rgba(25, 31, 40, 0.05) 75%);
  background-size: 200% 100%;
  animation: ${bannerShimmer} 1.6s ease-in-out infinite;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.06) 25%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.06) 75%);
    background-size: 200% 100%;
  }
`;
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { useCinematicTourStore } from '@/features/cinematic-tour/store/useCinematicTourStore';
import { generateDynamicWaypoints } from '@/features/sorimaru-audio/hooks/useSorimaruPlaceStory';
import { useMapStore } from '@/features/map/hooks/useMapStore';

const CardContainer = styled.div`
  position: relative;
  margin: 0 14px;
  padding: 16px 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, ${lightPalette.jangmi[50]} 0%, ${surface.light.card} 100%);

  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-1px);
  }

  [data-theme='dark'] & {
    background: linear-gradient(135deg, rgba(212, 32, 88, 0.15) 0%, ${surface.dark.card} 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
`;

const BackgroundAura = styled.div`
  position: absolute;
  top: -24px;
  right: -24px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: ${lightPalette.jangmi[100]};
  opacity: 0.5;
  filter: blur(30px);
  pointer-events: none;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2.5px 8px;
  border-radius: 9999px;
  font-size: ${fontSize.micro};
  font-weight: 700;
  color: ${lightPalette.jangmi[500]};
  background: ${lightPalette.jangmi[50]};
`;

const DurationText = styled.span`
  font-size: ${fontSize.micro};
  font-weight: 500;
  color: ${meok[500]};
`;

const StoryTitle = styled.h4`
  margin: 0 0 4px;
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: ${meok[900]};
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const StoryExcerpt = styled.p`
  margin: 0 0 12px;
  font-size: ${fontSize.xs};
  line-height: 1.4;
  color: ${meok[700]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
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
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${lightPalette.jangmi[700]};
`;

const StartBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 14px;
  border-radius: 9999px;

  background: ${lightPalette.jangmi[500]};
  color: ${surface.light.card};
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: ${lightPalette.jangmi[400]};
    transform: translateY(-1px);

  }

  &:active {
    transform: scale(0.96);
  }
`;

export default function SorimaruSpotlightBanner() {
  const availableStories = useSorimaruAudioStore((s) => s.availableStories);
  const center = useMapStore((s) => s.center);
  const currentAddress = useMapStore((s) => s.currentAddress);
  const startTour = useCinematicTourStore((s) => s.startTour);


  const spotlightStory = React.useMemo(() => {
    const validStories = availableStories.filter((s) => Boolean(s.audioUrl));
    if (validStories.length === 0) return null;


    if (currentAddress && !currentAddress.includes('전국')) {
      const cleanAddr = currentAddress.replace(/특별자치도|특별자치시|광역시|도|시|군|구/g, '').trim();
      const addrTokens = cleanAddr.split(/\s+/).filter((t) => t.length >= 2);

      const addrMatch = validStories.find((s) => {
        const fullText = `${s.title} ${s.audioTitle || ''} ${s.locationName || ''} ${s.badgeText || ''}`;
        return addrTokens.some((token) => fullText.includes(token));
      });
      if (addrMatch) return addrMatch;
    }


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
  }, [availableStories, center.lat, center.lng, currentAddress]);

  if (!spotlightStory) {
    return (
      <CardContainer aria-busy="true" aria-label="공간 오디오 투어 불러오는 중">
        <BackgroundAura />
        <TopRow>
          <Badge>
            <span>공간 오디오 투어</span>
          </Badge>
          <SkeletonBar $w="44px" $h="13px" $radius="9999px" />
        </TopRow>

        <div style={{ margin: '0 0 4px', height: '21px', display: 'flex', alignItems: 'center' }}>
          <SkeletonBar $w="64%" $h="16.5px" />
        </div>
        <div style={{ margin: '0 0 12px', height: '17px', display: 'flex', alignItems: 'center' }}>
          <SkeletonBar $w="86%" $h="12px" />
        </div>

        <ActionRow>
          <SkeletonBar $w="84px" $h="14px" />
          <StartBtn type="button" disabled style={{ opacity: 0.5, cursor: 'default' }}>
            <Play size={13} className="ml-0.5" />
            <span>투어 시작</span>
          </StartBtn>
        </ActionRow>
      </CardContainer>
    );
  }

  const handleStart = () => {
    if (!spotlightStory.waypoints || spotlightStory.waypoints.length === 0) {
      spotlightStory.waypoints = generateDynamicWaypoints(spotlightStory);
    }
    startTour(spotlightStory);
  };

  return (
    <CardContainer>
      <BackgroundAura />
      <TopRow>
        <Badge>
          <span>공간 오디오 투어</span>
        </Badge>
        <DurationText>{spotlightStory.formattedDuration || '약 10분'}</DurationText>
      </TopRow>

      <StoryTitle>{spotlightStory.audioTitle || spotlightStory.title}</StoryTitle>
      <StoryExcerpt title={spotlightStory.script}>
        {spotlightStory.script || '문화해설사의 음성 해설과 함께 지도를 따라 걷는 고택 산책'}
      </StoryExcerpt>

      <ActionRow>
        <DocentTag>
          <span>{spotlightStory.speaker ?? '문화해설사 도슨트'}</span>
        </DocentTag>

        <StartBtn type="button" onClick={handleStart}>
          <Play size={13} fill="currentColor" className="ml-0.5" />
          <span>투어 시작</span>
        </StartBtn>
      </ActionRow>
    </CardContainer>
  );
}
