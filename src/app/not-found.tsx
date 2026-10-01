'use client';

import React from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react'
import { Home01Icon } from '@hugeicons/core-free-icons'
import OniSearchEmpty from '@/shared/components/OniSearchEmpty/OniSearchEmpty';

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 40px 20px;
`;

const HomeButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 9999px;
  background: #0B1220;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s ease, opacity 0.2s ease;

  [data-theme='dark'] & {
    background: #ffffff;
    color: #171513;
  }

  &:hover {
    transform: translateY(-1px);
    opacity: 0.92;
  }
`;

export default function NotFound() {
  return (
    <PageWrapper>
      <OniSearchEmpty
        size="lg"
        title="잠시 길을 잃었어요"
        description="요청하신 페이지를 찾을 수 없어요. 주소를 확인하시거나 온마루 홈으로 돌아가 보세요."
        action={
          <HomeButton href="/">
            <HugeiconsIcon icon={Home01Icon} size={16} />
            온마루 홈으로 돌아가기
          </HomeButton>
        }
      />
    </PageWrapper>
  );
}
