'use client';

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText, Database, Code2 } from 'lucide-react';
import { meok, palette, lightPalette, surface, fontSize } from '@/design-system/tokens';

export type PolicyTabKey = 'privacy' | 'terms' | 'publicData' | 'openSource';

interface PolicyModalProps {
  initialTab?: PolicyTabKey;
  onClose: () => void;
}

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(14, 16, 22, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;

  @media (max-width: 640px) {
    padding: 0;
    align-items: flex-end;
  }
`;

const ModalCard = styled(motion.div)`
  position: relative;
  width: 100%;
  max-width: 720px;
  height: min(85vh, 760px);
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.24);
  overflow: hidden;

  [data-theme='dark'] & {
    background: ${surface.dark.card};
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
  }

  @media (max-width: 640px) {
    height: 88vh;
    max-height: 88vh;
    border-radius: 24px 24px 0 0;
    border-bottom: none;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  [data-theme='dark'] & {
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
`;

const HeaderTitle = styled.h2`
  font-size: ${fontSize.lg};
  font-weight: 700;
  color: ${meok[900]};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const CloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(78, 89, 104, 0.06);
  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(78, 89, 104, 0.12);
    color: ${meok[900]};
    transform: rotate(90deg);
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
    color: ${meok[200]};

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }
  }
`;

const TabBar = styled.div`
  display: flex;
  gap: 6px;
  padding: 12px 24px;
  overflow-x: auto;
  background: rgba(78, 89, 104, 0.02);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  [data-theme='dark'] & {
    background: rgba(0, 0, 0, 0.15);
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 9999px;
  border: none;
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;

  background: ${({ $active }) => ($active ? palette.kobalt[500] : 'transparent')};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[600])};

  &:hover {
    background: ${({ $active }) => ($active ? palette.kobalt[500] : 'rgba(78, 89, 104, 0.08)')};
  }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? palette.kobalt[500] : 'transparent')};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[300])};

    &:hover {
      background: ${({ $active }) => ($active ? palette.kobalt[500] : 'rgba(255, 255, 255, 0.08)')};
    }
  }
`;

const ContentBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px clamp(20px, 3.5vw, 32px);
  color: ${meok[800]};
  font-size: ${fontSize.sm};
  line-height: 1.7;

  [data-theme='dark'] & {
    color: ${meok[200]};
  }

  /* 커스텀 스크롤바 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(78, 89, 104, 0.2);
    border-radius: 4px;
  }
`;

const Section = styled.div`
  margin-bottom: 28px;

  h3 {
    font-size: ${fontSize.base};
    font-weight: 700;
    color: ${meok[900]};
    margin: 0 0 10px;
    letter-spacing: -0.01em;

    [data-theme='dark'] & {
      color: ${meok[100]};
    }
  }

  h4 {
    font-size: ${fontSize.sm};
    font-weight: 600;
    color: ${meok[800]};
    margin: 14px 0 6px;

    [data-theme='dark'] & {
      color: ${meok[200]};
    }
  }

  p {
    margin: 0 0 8px;
    color: ${meok[700]};

    [data-theme='dark'] & {
      color: ${meok[300]};
    }
  }

  ul, ol {
    margin: 0 0 12px;
    padding-left: 20px;
    color: ${meok[700]};

    [data-theme='dark'] & {
      color: ${meok[300]};
    }
  }

  li {
    margin-bottom: 4px;
  }
`;

const CodeBlock = styled.div`
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(78, 89, 104, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5;
  margin: 10px 0 16px;
  word-break: break-all;
  white-space: pre-wrap;

  [data-theme='dark'] & {
    background: rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.06);
    color: ${meok[200]};
  }
`;

const MetaDate = styled.div`
  font-size: ${fontSize.xs};
  color: ${meok[500]};
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);

  [data-theme='dark'] & {
    border-top-color: rgba(255, 255, 255, 0.08);
  }
`;

const TABS = [
  { key: 'privacy' as PolicyTabKey, label: '개인정보 처리방침', icon: ShieldCheck },
  { key: 'terms' as PolicyTabKey, label: '서비스 이용약관', icon: FileText },
  { key: 'publicData' as PolicyTabKey, label: '공공데이터 이용지침', icon: Database },
  { key: 'openSource' as PolicyTabKey, label: '오픈소스 라이선스', icon: Code2 },
];

export default function PolicyModal({ initialTab = 'privacy', onClose }: PolicyModalProps) {
  const [activeTab, setActiveTab] = useState<PolicyTabKey>(initialTab);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <ModalCard
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="policy-modal-title"
        >
          <ModalHeader>
            <HeaderTitle id="policy-modal-title">
              {activeTab === 'privacy' && <ShieldCheck size={20} color={lightPalette.kobalt[500]} />}
              {activeTab === 'terms' && <FileText size={20} color={lightPalette.kobalt[500]} />}
              {activeTab === 'publicData' && <Database size={20} color={lightPalette.kobalt[500]} />}
              {activeTab === 'openSource' && <Code2 size={20} color={lightPalette.kobalt[500]} />}
              <span>{TABS.find((t) => t.key === activeTab)?.label}</span>
            </HeaderTitle>
            <CloseButton type="button" onClick={onClose} aria-label="닫기">
              <X size={18} />
            </CloseButton>
          </ModalHeader>

          <TabBar role="tablist">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <TabButton
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  $active={isActive}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </TabButton>
              );
            })}
          </TabBar>

          <ContentBody>
            {/* 1. 개인정보 처리방침 */}
            {activeTab === 'privacy' && (
              <>
                <Section>
                  <h3>제1조 (총칙 및 목적)</h3>
                  <p>
                    온마루(이하 &apos;서비스&apos;)는 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하며, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다.
                  </p>
                </Section>

                <Section>
                  <h3>제2조 (처리하는 개인정보의 항목)</h3>
                  <p>서비스는 최소한의 개인정보만을 수집·이용합니다:</p>
                  <ul>
                    <li><strong>필수 수집 항목:</strong> 기기 식별값, 접속 로그, 서비스 이용 기록, 브라우저 환경 정보</li>
                    <li><strong>선택 수집 항목:</strong> 위치 정보(현재 위치 기반 주변 한옥 및 스테이 탐색 시), 저장/북마크 목록</li>
                  </ul>
                </Section>

                <Section>
                  <h3>제3조 (개인정보의 처리 및 보유기간)</h3>
                  <p>
                    서비스는 원칙적으로 이용자의 개인정보를 회원 탈퇴 시 또는 수집·이용 목적이 달성될 때까지 보유하며, 법령에 따른 보존 의무가 있는 경우 해당 기간 동안 안전하게 보관합니다.
                  </p>
                </Section>

                <Section>
                  <h3>제4조 (개인정보 보호책임자 및 문의)</h3>
                  <p>개인정보 처리와 관련한 문의, 불만 처리, 피해 구제 등은 아래 연락처로 문의해 주시기 바랍니다:</p>
                  <ul>
                    <li><strong>이메일:</strong> contact@onmaru.kr</li>
                    <li><strong>책임자:</strong> 온마루 개인정보 보호 담당팀</li>
                  </ul>
                </Section>
                <MetaDate>공고일자: 2026년 9월 1일 | 시행일자: 2026년 9월 17일</MetaDate>
              </>
            )}

            {/* 2. 서비스 이용약관 */}
            {activeTab === 'terms' && (
              <>
                <Section>
                  <h3>제1조 (목적)</h3>
                  <p>
                    본 약관은 온마루(OnMaru)가 제공하는 한옥 아카이브, 소리마루 오디오 도슨트, 3D 인터랙티브 공간 뷰어 등 제반 서비스의 이용 조건 및 절차에 관한 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
                  </p>
                </Section>

                <Section>
                  <h3>제2조 (서비스의 제공 및 변경)</h3>
                  <ul>
                    <li>한국관광공사 TourAPI 4.0 및 Odii 오디오 기반의 전통 한옥·스테이 정보 제공</li>
                    <li>실시간 남중고도 처마 일조량 시뮬레이션 및 7단계 부재 조립 3D 뷰어</li>
                    <li>K-컬처 및 지역 헤리티지 기반의 1박 2일 테마 여정 큐레이션</li>
                  </ul>
                </Section>

                <Section>
                  <h3>제3조 (지식재산권의 귀속)</h3>
                  <p>
                    서비스가 자체 제작한 3D 모델링, 디자인 시스템, UI/UX 인터랙션 코드에 대한 지식재산권은 온마루에 귀속됩니다. 공공데이터포털을 통해 연동된 공공데이터의 저작권은 각 원천 제공 기관에 귀속됩니다.
                  </p>
                </Section>

                <Section>
                  <h3>제4조 (면책조항)</h3>
                  <p>
                    서비스는 천재지변, 공공 API 서버 장애 등 불가항력으로 인해 서비스를 일시 제공할 수 없는 경우 이에 대한 책임을 면합니다. 또한 제공되는 관광 정보는 실시간 현장 사정에 따라 변동될 수 있습니다.
                  </p>
                </Section>
                <MetaDate>시행일자: 2026년 9월 17일</MetaDate>
              </>
            )}

            {/* 3. 공공데이터 이용지침 */}
            {activeTab === 'publicData' && (
              <>
                <Section>
                  <h3>🏛️ 한국관광공사 공공데이터 활용 고지</h3>
                  <p>
                    온마루는 문화체육관광부와 한국관광공사가 제공하는 공공누리(KOGL) 제1유형 출처표시 기준에 따라 신뢰할 수 있는 공공데이터를 연계·활용하고 있습니다.
                  </p>
                </Section>

                <Section>
                  <h3>연계 공공데이터 API 명세</h3>
                  <ul>
                    <li><strong>한국관광공사 국문 관광정보 서비스 (TourAPI 4.0 / KorService2)</strong>: 한옥 숙박, 관광지, 문화시설, 행사/축제 정보</li>
                    <li><strong>관광오디오가이드 개방 API (Odii)</strong>: 전국 주요 고택·궁궐·서원의 역사 스토리 및 오디오 도슨트 음원</li>
                    <li><strong>공공데이터포털(data.go.kr)</strong>: 문화재청 국가유산 메타데이터 및 지자체 문화관광 개방 데이터</li>
                  </ul>
                </Section>

                <Section>
                  <h3>출처 표기 및 저작권 안내</h3>
                  <p>
                    본 서비스에 수록된 한옥 이미지 및 해설 텍스트의 일부는 한국관광공사 TourAPI 4.0 및 Odii 서비스를 통해 제공받은 공공저작물(제1유형: 출처표시)을 기반으로 제작되었습니다.
                  </p>
                </Section>
                <MetaDate>데이터 갱신 주기: 매 시간 자동 동기화</MetaDate>
              </>
            )}

            {/* 4. 오픈소스 라이선스 */}
            {activeTab === 'openSource' && (
              <>
                <Section>
                  <h3>📦 오픈소스 소프트웨어 고지 (Open Source Licenses)</h3>
                  <p>
                    온마루 프론트엔드는 전 세계 개발자 커뮤니티의 오픈소스 생태계와 다음 라이브러리들을 기반으로 빌드되었습니다:
                  </p>
                </Section>

                <Section>
                  <h4>Next.js (App Router) & React 18</h4>
                  <CodeBlock>The MIT License (MIT) - Copyright (c) 2026 Vercel, Inc.</CodeBlock>
                </Section>

                <Section>
                  <h4>Three.js & React Three Fiber (@react-three/drei, @react-three/fiber)</h4>
                  <CodeBlock>The MIT License (MIT) - Copyright (c) 2010-2026 Three.js Authors, Poimandres</CodeBlock>
                </Section>

                <Section>
                  <h4>GSAP & ScrollTrigger</h4>
                  <CodeBlock>Standard GreenSock License - Copyright (c) 2026 GreenSock Inc.</CodeBlock>
                </Section>

                <Section>
                  <h4>Emotion CSS (@emotion/styled, @emotion/react) & Framer Motion</h4>
                  <CodeBlock>The MIT License (MIT) - Copyright (c) Emotion team, Framer B.V.</CodeBlock>
                </Section>

                <Section>
                  <h4>Lucide Icons</h4>
                  <CodeBlock>ISC License - Copyright (c) Lucide Contributors</CodeBlock>
                </Section>
                <MetaDate>라이선스 상세 문의: contact@onmaru.kr</MetaDate>
              </>
            )}
          </ContentBody>
        </ModalCard>
      </Overlay>
    </AnimatePresence>
  );
}
