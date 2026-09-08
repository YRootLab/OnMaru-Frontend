'use client';

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { IoMegaphoneOutline } from 'react-icons/io5';
import { lightPalette, meok } from '@/design-system/tokens';

const NOTICES = [
  '전국 한옥마을 문화재 야행 및 달빛음악회 일정 안내',
  '음성 도슨트와 함께 지도를 따라 걷는 한옥 산책',
  '고택·종택 특별 야간 개방 및 전통 다도 체험 진행',
  '전국 한옥스테이 품질인증 숙소 안내',
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
        <IoMegaphoneOutline size={15} />
      </IconWrap>
      <TextScroller>
        <NoticeText key={index}>{NOTICES[index]}</NoticeText>
      </TextScroller>
 
    </Container>
  );
}
