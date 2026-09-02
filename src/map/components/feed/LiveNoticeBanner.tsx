'use client';

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Volume2, ExternalLink, Sparkles } from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';

const NOTICES = [
  '2026 전국 한옥마을 문화재 야행 & 고택 달빛음악회 일정 안내',
  '한국관광공사 Odii와 함께하는 시네마틱 공간 오디오 도슨트 서비스 개시',
  '국가유산청 고택·종택 특별 야간 개방 및 전통 다도 체험 주간',
  '봄·가을 여행주간 맞이 전국 전통 한옥스테이 품질인증 특별전',
];

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  margin: 10px 14px 4px;
  border-radius: 12px;
  background: rgba(30, 122, 104, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(30, 122, 104, 0.1);
  }
`;

const IconWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${lightPalette.cheongrok[500]};
  flex-shrink: 0;
`;

const TextScroller = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const NoticeText = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: ${meok[900]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  animation: notice-fade 0.4s ease;

  @keyframes notice-fade {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ActionGlyph = styled.div`
  color: ${meok[400]};
  flex-shrink: 0;
  display: flex;
  align-items: center;
`;

export default function LiveNoticeBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % NOTICES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <Container role="status" aria-label="실시간 문화재 소식 안내">
      <IconWrap>
        <Volume2 size={14} />
      </IconWrap>
      <TextScroller>
        <NoticeText key={index}>{NOTICES[index]}</NoticeText>
      </TextScroller>
      <ActionGlyph>
        <Sparkles size={12} color={lightPalette.cheongrok[500]} />
      </ActionGlyph>
    </Container>
  );
}
