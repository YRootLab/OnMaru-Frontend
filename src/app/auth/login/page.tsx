'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { useAuth } from '@/features/auth';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { useIsAppleDevice } from '@/shared/hooks/useIsAppleDevice';

const HanokLogin3DStage = dynamic(() => import('@/features/auth/components/HanokLogin3DStage'), {
  ssr: false,
});

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px);
  padding: 32px 20px;
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const WelcomeStage = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  height: 305px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  user-select: none;
  margin-bottom: 4px;
`;

const OniContainer = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateY(-2px);
`;

const SpeechBubble = styled.div`
  position: relative;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 9999px;
  background: #0b1220;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(255,255,255,0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  /* PNG 상단 투명 여백(약 40px)만큼 당겨서 캐릭터 머리에 바짝 붙임 */
  margin-bottom: -36px;
  animation: bubbleFloat 3s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  @keyframes bubbleFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 4px;
    border-style: solid;
    border-color: #0b1220 transparent transparent transparent;
  }

  [data-theme='dark'] & {
    background: #f5f0eb;
    color: #171513;
    border-color: rgba(0, 0, 0, 0.08);

    &::after {
      border-color: #f5f0eb transparent transparent transparent;
    }
  }
`;

const OniVideoWrap = styled.div`
  width: 205px;
  height: 205px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.16));

  img, video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    pointer-events: none;
  }

  video {
    mix-blend-mode: screen;
  }

  @media (prefers-reduced-motion: reduce) {
    img, video {
      display: none;
    }
  }
`;

const KakaoButton = styled.button`
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 10px;
  border: none;
  background-color: #fee500;
  color: #191919;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
  box-shadow: 0 4px 14px rgba(254, 229, 0, 0.28);

  &:hover {
    filter: brightness(0.98);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(254, 229, 0, 0.38);
  }

  &:active {
    transform: scale(0.98);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
    }
    &:active {
      transform: none;
    }
  }
`;

const DevQuickButton = styled.button`
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 10px;
  border: 1px dashed rgba(212, 175, 55, 0.5);
  background-color: transparent;
  color: #8a8175;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background-color: rgba(212, 175, 55, 0.1);
    color: #d4af37;
  }
`;

export default function LoginPage() {
  const router = useRouter();
  const { loginWithKakao, completeMockKakaoLogin } = useAuth();
  const { theme } = useOnmaruTheme();
  const c = theme.colors;
  const isApple = useIsAppleDevice();
  const [oniVideoError, setOniVideoError] = useState(false);

  return (
    <PageWrapper>
      <LoginCard>
        {/* 균형 잡힌 한옥 3D 무대 + 온이 */}
        <WelcomeStage>
          {/* 뒤편의 3D 한옥 모델 */}
          <HanokLogin3DStage />

          {/* 온이 캐릭터 + 온이 정수리 바로 위 말풍선 */}
          <OniContainer>
            <SpeechBubble>온마루에 오신 걸 환영해요!</SpeechBubble>
            <OniVideoWrap>
              {isApple || oniVideoError ? (
                <img src="/images/character/Oni_hi.png" alt="온마루 캐릭터 온이" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <video autoPlay loop muted playsInline preload="auto" aria-label="온마루 캐릭터 온이" onError={() => setOniVideoError(true)}>
                  <source src="/videos/Oni_hi.webm" type="video/webm" onError={() => setOniVideoError(true)} />
                </video>
              )}
            </OniVideoWrap>
          </OniContainer>
        </WelcomeStage>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ fontSize: '14px', color: c.text.muted, margin: 0, lineHeight: 1.5 }}>
            카카오 계정으로 간편하게 시작하고
            <br />
            한옥 여정과 소리를 기록해 보세요.
          </p>
        </div>

        <KakaoButton type="button" onClick={loginWithKakao}>
          <KakaoBubbleIcon />
          카카오로 시작하기
        </KakaoButton>

        {process.env.NODE_ENV !== 'production' && (
          <DevQuickButton
            type="button"
            onClick={() => {
              completeMockKakaoLogin();
              router.push('/mypage');
            }}
          >
            ⚡ 개발용 빠른 로그인 (마이페이지 체험)
          </DevQuickButton>
        )}
      </LoginCard>
    </PageWrapper>
  );
}

function KakaoBubbleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 1.5C4.58 1.5 1 4.28 1 7.71c0 2.19 1.47 4.12 3.68 5.23-.16.6-.6 2.2-.69 2.54-.11.42.15.42.32.3.13-.09 2.1-1.43 2.96-2.02.55.08 1.12.12 1.73.12 4.42 0 8-2.78 8-6.17S13.42 1.5 9 1.5Z"
        fill="#191919"
      />
    </svg>
  );
}
