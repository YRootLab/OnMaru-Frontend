'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from '@emotion/styled';
import { fontSize, meok } from '@/design-system/tokens';
import { useIsAppleDevice } from '@/shared/hooks/useIsAppleDevice';
import PolicyModal, { type PolicyTabKey } from './PolicyModal';

const FooterWrapper = styled.footer`
  position: relative;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  font-family: 'Spoqa Han Sans Neo', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  padding: clamp(36px, 4vw, 52px) clamp(20px, 3.5vw, 48px) clamp(16px, 2vw, 24px);


  background: linear-gradient(180deg, #faf9f8 0%, #f3f1ee 100%);
  color: ${meok[700]};
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  transition:
    background 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.4s ease;


  [data-theme='dark'] & {
    background: linear-gradient(180deg, #0B1220 0%, #070E18 100%);
    color: rgba(255, 255, 255, 0.7);
    border-top: 1px solid rgba(255, 255, 255, 0.07);
  }
`;


const CursorSpotlight = styled.div<{ $x: number; $y: number; $visible: boolean }>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.35s ease;

  background: radial-gradient(
    600px circle at ${({ $x }) => $x}px ${({ $y }) => $y}px,
    rgba(255, 120, 30, 0.06),
    transparent 80%
  );

  [data-theme='dark'] & {
    background: radial-gradient(
      600px circle at ${({ $x }) => $x}px ${({ $y }) => $y}px,
      rgba(255, 120, 30, 0.10),
      transparent 80%
    );
  }
`;

const FooterInner = styled.div`
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  margin: 0 auto;
  display: flex;
  position: relative;
  z-index: 2;

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
  }

  @media (max-width: 640px) {
    width: calc(100% - 20px);
    flex-direction: column;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;


const TopNavGrid = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: clamp(28px, 4.5vw, 64px);
  margin-bottom: clamp(24px, 3vw, 36px);
  flex-wrap: wrap;

  @media (max-width: 640px) {
    justify-content: flex-start;
    gap: 28px;
  }
`;

const NavCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NavColTitle = styled.div`
  font-size: ${fontSize.xs};
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-bottom: 2px;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.95);
  }
`;

const FooterLink = styled(Link)`
  font-size: ${fontSize.xs};
  text-decoration: none;
  transition: color 0.18s ease;
  color: ${meok[600]};

  &:hover {
    color: ${meok[900]};
  }

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.62);

    &:hover {
      color: #ffffff;
    }
  }
`;

const ExternalFooterLink = styled.a`
  font-size: ${fontSize.xs};
  text-decoration: none;
  transition: color 0.18s ease;
  color: ${meok[600]};

  &:hover {
    color: ${meok[900]};
  }

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.62);

    &:hover {
      color: #ffffff;
    }
  }
`;


const BusinessInfo = styled.div`
  font-size: 11.5px;
  line-height: 1.6;
  margin-bottom: 12px;
  color: ${meok[600]};

  p {
    margin: 0;
  }

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.58);
  }
`;


const PolicyLinksRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: clamp(8px, 1.8vw, 16px);
  margin-bottom: 12px;

  @media (max-width: 640px) {
    gap: 8px 14px;
  }
`;

const PolicyButton = styled.button<{ $bold?: boolean }>`
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: ${({ $bold }) => ($bold ? 700 : 500)};
  cursor: pointer;
  transition: color 0.18s ease;
  color: ${({ $bold }) => ($bold ? meok[900] : meok[600])};

  &:hover {
    color: ${meok[900]};
    text-decoration: underline;
  }

  [data-theme='dark'] & {
    color: ${({ $bold }) => ($bold ? '#ffffff' : 'rgba(255, 255, 255, 0.65)')};

    &:hover {
      color: #ffffff;
    }
  }
`;


const Copyright = styled.div`
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${meok[500]};
  margin-bottom: 4px;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.55);
  }
`;

const FooterTopRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;

  @media (max-width: 640px) {
    flex-direction: column-reverse;
    align-items: flex-start;
    gap: 16px;
  }
`;

const FooterInfoCol = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const OniHoldingWrap = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  flex-shrink: 0;
  user-select: none;
  pointer-events: none;

  margin-bottom: -72px;
  margin-left: -80px;

  video, img {
    width: 400px;
    height: 400px;
    object-fit: contain;
    display: block;
    background: transparent;
    filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.18));
    transition: transform 0.3s ease;
  }

  [data-theme='dark'] & video {
    mix-blend-mode: screen;
  }

  ${FooterWrapper}:hover & video,
  ${FooterWrapper}:hover & img {
    transform: scale(1.05) translateY(-2px);
  }

  @media (max-width: 640px) {
    align-self: flex-end;
    margin-bottom: -16px;

    video, img {
      width: 150px;
      height: 150px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    video {
      display: none;
      transition: none;
    }

    ${FooterWrapper}:hover & video {
      transform: none;
    }
  }
`;

const BottomLayout = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 40px;
  overflow: hidden;

  @media (max-width: 768px) {
    overflow: visible;
  }
`;

const LeftInfoCol = styled.div`
  flex-shrink: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const MassiveWatermark = styled.div`
  width: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', 'Spoqa Han Sans Neo', sans-serif;
  font-size: clamp(1.8rem, 5.8vw, 5.8rem);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.045em;
  user-select: none;
  pointer-events: none;
  margin: 16px 0 0;
  white-space: nowrap;
  word-break: keep-all;
  overflow: hidden;
  text-overflow: clip;
  transition: color 0.4s ease, transform 0.4s ease;
  margin: 36px 0 0;

  color: rgba(25, 31, 40, 0.05);

  ${FooterWrapper}:hover & {
    color: rgba(25, 31, 40, 0.085);
    transform: translateY(-4px);
  }

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.08);
  }

  [data-theme='dark'] ${FooterWrapper}:hover & {
    color: rgba(255, 255, 255, 0.15);
    transform: translateY(-4px);
  }

  @media (max-width: 768px) {
    font-size: clamp(2rem, 10vw, 3.8rem);
    letter-spacing: -0.03em;
    white-space: normal;
    overflow: visible;
  }
`;

export default function Footer() {
  const pathname = usePathname();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [activePolicyTab, setActivePolicyTab] = useState<PolicyTabKey | null>(null);

  const isApple = useIsAppleDevice();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.defaultMuted = true;
    video.muted = true;
    const p = video.play?.();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  if (pathname.startsWith('/map') || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <FooterWrapper
        aria-label="서비스 안내 및 정책"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
      >
        <CursorSpotlight $x={mousePos.x} $y={mousePos.y} $visible={isHovered} aria-hidden="true" />

        <FooterInner>
          <ContentArea>
            <BottomLayout>
              <LeftInfoCol>
                <BusinessInfo>
                  <p>온마루 · 한국관광공사 공공데이터(TourAPI · Odii) 기반 한옥 큐레이션 서비스</p>
                </BusinessInfo>

                <PolicyLinksRow>
                  <PolicyButton type="button" $bold onClick={() => setActivePolicyTab('privacy')}>
                    개인정보 처리방침
                  </PolicyButton>
                  <PolicyButton type="button" onClick={() => setActivePolicyTab('terms')}>
                    서비스 이용약관
                  </PolicyButton>
                  <PolicyButton type="button" onClick={() => setActivePolicyTab('publicData')}>
                    공공데이터 이용지침
                  </PolicyButton>
                  <PolicyButton type="button" onClick={() => setActivePolicyTab('openSource')}>
                    오픈소스 라이선스
                  </PolicyButton>
                </PolicyLinksRow>

                <Copyright>
                  © OnMaru. All rights reserved.
                </Copyright>

                <MassiveWatermark aria-hidden="true">
                  한옥의 숨결과 소리를 잇다
                </MassiveWatermark>
              </LeftInfoCol>

              <OniHoldingWrap>
                {isApple || videoError ? (
                  <img
                    src="/images/character/Oni_holding.png"
                    alt="소중한 것을 품에 안은 마스코트 온이"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    aria-label="소중한 것을 품에 안은 마스코트 온이"
                    onError={() => setVideoError(true)}
                    onCanPlay={(e) => {
                      e.currentTarget.muted = true;
                      const p = e.currentTarget.play?.();
                      if (p && typeof p.catch === 'function') p.catch(() => {});
                    }}
                  >
                    <source src="/videos/Oni_holding.webm" type="video/webm" onError={() => setVideoError(true)} />
                  </video>
                )}
              </OniHoldingWrap>
            </BottomLayout>
          </ContentArea>
        </FooterInner>
      </FooterWrapper>

      {}
      {activePolicyTab && (
        <PolicyModal
          initialTab={activePolicyTab}
          onClose={() => setActivePolicyTab(null)}
        />
      )}
    </>
  );
}
