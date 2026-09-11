'use client';

import React from 'react';
import styled from '@emotion/styled';
import { Headphones, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { meok, palette } from '@/design-system/tokens';
import type { OdiiStory } from '../hooks/useHanokOdii';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';

interface SoriMaruBridgeCardProps {
  stories: OdiiStory[];
  hanokName: string;
}

/**
 * 소리마루(Odii) 연계 브릿지 카드:
 * 한옥 마루 페이지에서 오디오를 직접 재생하여 소리마루와 기능이 겹치는 문제를 해결하고,
 * 소리 관련 모든 경험을 전문 공간인 '소리마루(/odii)'로 유기적으로 연결합니다.
 */
export default function SoriMaruBridgeCard({ stories, hanokName }: SoriMaruBridgeCardProps) {
  const router = useRouter();
  const setCurrentStory = useOdiiAudioStore((s) => s.setCurrentStory);

  if (!stories || stories.length === 0) return null;

  const primaryStory = stories[0];

  const handleNavigateToSoriMaru = () => {
    // 소리마루 오디오 스토어에 해당 한옥 음원 정보를 세팅하여
    // 소리마루 페이지 도착 즉시 해당 도슨트가 바로 준비되도록 연동
    setCurrentStory({
      tid: String(primaryStory.stid),
      tlid: String(primaryStory.stlid),
      stid: String(primaryStory.stid),
      stlid: String(primaryStory.stlid),
      title: primaryStory.title || hanokName,
      audioTitle: primaryStory.audioTitle || `${hanokName} 공간 해설`,
      speaker: '한국관광공사 문화해설사',
      category: '한옥',
      mapX: '126.9780',
      mapY: '37.5665',
      script: primaryStory.script || '',
      playTime: String(primaryStory.playTime || 300),
      audioUrl: primaryStory.audioUrl || '',
      imageUrl: primaryStory.imageUrl || '',
    });

    router.push('/odii');
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}분 ${s > 0 ? `${s}초` : ''}`;
  };

  return (
    <CardContainer>
      <HeaderRow>
        <BadgeBox>
          <Headphones size={13} />
          <span>소리마루 도슨트 연계</span>
        </BadgeBox>
        <OfficialTag>한국관광공사 Odii 공식 음원</OfficialTag>
      </HeaderRow>

      <ContentBody>
        <StoryTitle>
          {primaryStory.audioTitle || `${hanokName} 건축 공간 해설`}
        </StoryTitle>
        <GuideDesc>
          {primaryStory.playTime > 0 && (
            <DurationText>약 {formatSeconds(primaryStory.playTime)} 소요 · </DurationText>
          )}
          이 건축물의 깊이 있는 역사와 공간 해설은 온마루의 오디오 전문 공간인{' '}
          <strong>‘소리마루’</strong>에서 고음질 음원과 동기화 대본으로 감상하실 수 있습니다.
        </GuideDesc>
      </ContentBody>

      <ActionRow>
        <ListenInSoriMaruBtn type="button" onClick={handleNavigateToSoriMaru}>
          <span>소리마루에서 도슨트 듣기</span>
          <ArrowRight size={15} strokeWidth={2.2} />
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
  color: ${palette.jangmi[700]};
  font-size: 11.5px;
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
  font-size: 11px;
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
  font-size: 15px;
  font-weight: 700;
  color: ${meok[900]};
  margin: 0 0 6px;
  line-height: 1.4;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const GuideDesc = styled.p`
  font-size: 12.5px;
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
  font-size: 13px;
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
