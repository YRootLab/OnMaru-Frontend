'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react'
import { HeadphonesIcon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { useRouter } from 'next/navigation';

import type { AudioGuideStory } from '../hooks/useHanokAudioGuide';
import { palette, meok, surface, typographyRole } from '@/design-system/tokens';

interface SoriMaruBridgeCardProps {
  stories: AudioGuideStory[];
  hanokName: string;
}

export default function SoriMaruBridgeCard({ stories, hanokName }: SoriMaruBridgeCardProps) {
  const router = useRouter();
  const tBridge = useTranslations('hanok.bridge');

  if (!stories || stories.length === 0) return null;

  const primaryStory = stories[0];

  const handleNavigateToSoriMaru = () => {
    router.push(`/sorimaru?stid=${encodeURIComponent(primaryStory.storyId)}`);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    if (s > 0) {
      return tBridge('durationMinutesSeconds', { min: m, sec: s });
    }
    return tBridge('durationMinutes', { min: m });
  };

  return (
    <CardContainer>
      <HeaderRow>
        <BadgeBox>
          <HugeiconsIcon icon={HeadphonesIcon} size={13} />
          <span>{tBridge('badge')}</span>
        </BadgeBox>
        <OfficialTag>{tBridge('officialTag')}</OfficialTag>
      </HeaderRow>

      <ContentBody>
        <StoryTitle>
          {primaryStory.audioTitle || tBridge('defaultTitle', { name: hanokName })}
        </StoryTitle>
        <GuideDesc>
          {primaryStory.durationSeconds > 0 && (
            <DurationText>{formatDuration(primaryStory.durationSeconds)}</DurationText>
          )}
          {tBridge('desc')}
        </GuideDesc>
      </ContentBody>

      <ActionRow>
        <ListenInSoriMaruBtn type="button" onClick={handleNavigateToSoriMaru}>
          <span>{tBridge('listenBtn')}</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2.2} />
        </ListenInSoriMaruBtn>
      </ActionRow>
    </CardContainer>
  );
}

const CardContainer = styled.div`
  background: #f8f8f7;
  border-radius: 20px;
  padding: 20px 22px;
  margin-top: 16px;
  margin-bottom: 24px;
  border: none;
  box-shadow: none;
  transition: background-color 0.2s ease;

  [data-theme='dark'] & {
    background: ${surface.dark.surface};
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
  color: ${palette.jangmi[700]};
  font-size: ${typographyRole.label.fontSize};
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 9999px;

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

const OfficialTag = styled.span`
  font-size: ${typographyRole.caption.fontSize};
  font-weight: 500;
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const ContentBody = styled.div`
  margin-bottom: 16px;
`;

const StoryTitle = styled.h4`
  font-size: ${typographyRole.bodySm.fontSize};
  font-weight: 700;
  color: ${meok[900]};
  margin: 0 0 6px;
  line-height: 1.4;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const GuideDesc = styled.p`
  font-size: ${typographyRole.label.fontSize};
  line-height: 1.6;
  color: ${meok[700]};
  margin: 0;
  word-break: keep-all;

  strong {
    font-weight: 700;
    color: ${palette.jangmi[700]};
  }

  [data-theme='dark'] & {
    color: ${meok[200]};

    strong {
      color: ${palette.jangmi[400]};
    }
  }
`;

const DurationText = styled.span`
  font-weight: 600;
  color: ${meok[700]};

  [data-theme='dark'] & {
    color: ${meok[200]};
  }
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const ListenInSoriMaruBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 18px;
  border-radius: 9999px;
  background: ${palette.jangmi[500]};
  color: #ffffff;
  font-size: ${typographyRole.label.fontSize};
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${palette.jangmi[700]};
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.98);
  }

  [data-theme='dark'] & {
    background: ${palette.jangmi[500]};
    &:hover {
      background: ${palette.jangmi[400]};
    }
  }
`;
