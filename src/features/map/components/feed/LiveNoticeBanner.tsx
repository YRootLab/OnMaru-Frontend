'use client';

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Megaphone } from 'lucide-react';
import { lightPalette, meok , fontSize } from '@/design-system/tokens';

const NOTICES = [
  '전국 한옥마을 문화재 야행 및 달빛음악회 일정 안내',
  '음성 도슨트와 함께 지도를 따라 걷는 한옥 산책',
  '고택·종택 특별 야간 개방 및 전통 다도 체험 진행',
  '전국 한옥스테이 품질인증 숙소 안내',
];

/* 카드형 박스 대신 "실시간 티커" 느낌의 얇은 필 — 아래 축제 카드 섹션과
   시각적으로 다른 무게감을 줘서 단조롭게 쌓인 느낌을 덜어낸다. */
const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 14px;
  margin: 12px 14px;
  border-radius: 9999px;
  background: rgba(30, 122, 104, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(30, 122, 104, 0.1);
  }

  [data-theme='dark'] & {
    background: rgba(45, 212, 191, 0.12);

    &:hover {
      background: rgba(45, 212, 191, 0.18);
    }
  }
`;

const IconWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${lightPalette.cheongrok[500]};
  flex-shrink: 0;

  [data-theme='dark'] & {
    color: #2dd4bf;
  }
`;

const TextScroller = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const NoticeText = styled.p`
  margin: 0;
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${meok[900]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  animation: notice-fade 0.35s ease;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }

  @keyframes notice-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
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
    <Container role="status" aria-label="문화재 소식 안내">
      <IconWrap>
        <Megaphone size={15} strokeWidth={2} />
      </IconWrap>
      <TextScroller>
        <NoticeText key={index}>{NOTICES[index]}</NoticeText>
      </TextScroller>
 
    </Container>
  );
}
