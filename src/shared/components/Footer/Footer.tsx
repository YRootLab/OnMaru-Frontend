'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from '@emotion/styled';
import { fontSize, meok } from '@/design-system/tokens';
import PolicyModal, { type PolicyTabKey } from './PolicyModal';

const FooterWrapper = styled.footer`
  position: relative;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  font-family: 'Spoqa Han Sans Neo', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  padding: clamp(36px, 4vw, 52px) clamp(20px, 3.5vw, 48px) clamp(16px, 2vw, 24px);


  background:
    radial-gradient(circle at 85% 15%, rgba(255, 110, 25, 0.08) 0%, transparent 55%),
    radial-gradient(circle at 15% 85%, rgba(255, 175, 50, 0.07) 0%, transparent 60%),
    linear-gradient(180deg, #faf9f8 0%, #f3f1ee 100%);
  color: ${meok[700]};
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  transition:
    background 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.4s ease;

  &:hover {
    background:
      radial-gradient(circle at 85% 15%, rgba(255, 110, 25, 0.13) 0%, transparent 55%),
      radial-gradient(circle at 15% 85%, rgba(255, 175, 50, 0.11) 0%, transparent 60%),
      linear-gradient(180deg, #fdfcfb 0%, #f6f4f1 100%);
    border-top-color: rgba(255, 110, 25, 0.16);
  }


  [data-theme='dark'] & {
    background:
      radial-gradient(circle at 80% 20%, rgba(255, 95, 10, 0.13) 0%, transparent 55%),
      radial-gradient(circle at 18% 85%, rgba(255, 165, 40, 0.09) 0%, transparent 60%),
      linear-gradient(180deg, #1C1A17 0%, #131210 100%);
    color: rgba(255, 255, 255, 0.7);
    border-top: 1px solid rgba(255, 255, 255, 0.07);
  }

  [data-theme='dark'] &:hover {
    background:
      radial-gradient(circle at 80% 20%, rgba(255, 95, 10, 0.20) 0%, transparent 55%),
      radial-gradient(circle at 18% 85%, rgba(255, 165, 40, 0.15) 0%, transparent 60%),
      linear-gradient(180deg, #22201c 0%, #161512 100%);
    border-top-color: rgba(255, 105, 15, 0.22);
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
  margin-bottom: 16px;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.55);
  }
`;




const MassiveWatermark = styled.div`
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', 'Spoqa Han Sans Neo', sans-serif;
  font-size: clamp(2rem, 8.5vw, 8rem);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.045em;
  user-select: none;
  pointer-events: none;
  margin: 16px 0 0;
  white-space: normal;
  word-break: keep-all;
  overflow-wrap: break-word;
  transition: color 0.4s ease, transform 0.4s ease;


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

  @media (max-width: 640px) {
    font-size: clamp(2rem, 11vw, 4rem);
    letter-spacing: -0.03em;
    margin: 12px 0 0;
  }
`;

export default function Footer() {
  const pathname = usePathname();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [activePolicyTab, setActivePolicyTab] = useState<PolicyTabKey | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);


  if (pathname.startsWith('/map')) {
    return null;
  }

  return (
    <>
      <FooterWrapper
        aria-label="푸터 네비게이션"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
      >
        {}
        <CursorSpotlight $x={mousePos.x} $y={mousePos.y} $visible={isHovered} aria-hidden="true" />

        <FooterInner>
          <ContentArea>


            {}
            <BusinessInfo>
              <p>온마루 (OnMaru) · 한국관광공사 공공데이터(TourAPI 4.0 · Odii API) 기반 한옥 몰입형 관광 큐레이션</p>
            </BusinessInfo>

            {}
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
                오픈소스 라이선스 고지
              </PolicyButton>
            </PolicyLinksRow>

            {}
            <Copyright>
              © OnMaru. All rights reserved.
            </Copyright>

            {}
            <MassiveWatermark aria-hidden="true">
              한옥의 숨결과 소리를 잇다
            </MassiveWatermark>
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
