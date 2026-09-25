'use client';

import { useState, useRef } from 'react';
import styled from '@emotion/styled';
import { ShieldCheck, User } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { meok } from '@/design-system/tokens';
import { useStampStore } from '../hooks/useStampStore';
import { STAMP_DEFINITIONS, REGIONS } from '../data/stampDefs';
import type { RegionCode } from '../types';
import KoreaMapCanvas from './KoreaMapCanvas';
import StampCard from './StampCard';
import StampLeaderboard from './StampLeaderboard';
import StampSealAnimation from './StampSealAnimation';
import { useAuth } from '@/features/auth/hooks/useAuth';

gsap.registerPlugin(useGSAP);

const Root = styled.div`
  position: relative;
  width: 100%;
  overflow-x: hidden;
  padding: clamp(80px, 10vw, 120px) clamp(16px, 5vw, 64px) 120px;
  color: inherit;
  visibility: hidden;
`;

/* 지도는 배경 — 위젯이 아님 */
const MapBackdrop = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 85%;
  max-width: 700px;
  pointer-events: none;
  z-index: 0;
  opacity: 0.055;
  mask-image: linear-gradient(to bottom, black 25%, transparent 80%);
  -webkit-mask-image: linear-gradient(to bottom, black 25%, transparent 80%);

  [data-theme='dark'] & {
    opacity: 0.04;
  }
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
`;

const Header = styled.header`
  margin-bottom: clamp(48px, 7vw, 80px);
`;

const Title = styled.h1`
  font-family: var(--font-traditional);
  font-size: clamp(60px, 10vw, 140px);
  font-weight: 900;
  letter-spacing: -0.045em;
  line-height: 0.92;
  margin: 0 0 clamp(20px, 3vw, 36px) 0;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const SingleStat = styled.div`
  font-family: var(--font-traditional);
  font-size: clamp(15px, 2vw, 20px);
  color: ${meok[400]};
  letter-spacing: -0.01em;
  margin-bottom: 10px;

  strong {
    color: ${meok[800]};
    font-weight: 700;
  }

  [data-theme='dark'] & {
    color: ${meok[500]};
    strong { color: ${meok[200]}; }
  }
`;

const UserLine = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: ${meok[400]};

  [data-theme='dark'] & {
    color: ${meok[500]};
  }
`;

/* ── tabs ── */

const TabRow = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  overflow-x: auto;
  padding-bottom: 14px;
  margin-bottom: 40px;
  border-bottom: 1px solid rgba(25, 31, 40, 0.08);
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }

  [data-theme='dark'] & {
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
`;

const Divider = styled.span`
  width: 1px;
  height: 16px;
  background: rgba(25, 31, 40, 0.1);
  margin: 0 6px;
  flex-shrink: 0;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  height: 30px;
  padding: 0 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  cursor: pointer;
  white-space: nowrap;
  color: ${({ $active }) => ($active ? meok[900] : meok[400])};
  transition: color 0.12s ease;

  [data-theme='dark'] & {
    color: ${({ $active }) => ($active ? '#ffffff' : meok[400])};
  }

  &:hover {
    color: ${meok[700]};
    [data-theme='dark'] & { color: ${meok[200]}; }
  }
`;

/* ── stamp grid ── */

const StampsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 48px 20px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 32px 12px;
  }
`;

const LeaderboardHeader = styled.div`
  font-family: var(--font-traditional);
  font-size: 18px;
  font-weight: 700;
  color: ${meok[900]};
  margin-bottom: 16px;

  [data-theme='dark'] & { color: #ffffff; }
`;

export default function StampBook() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const collectedStamps = useStampStore((s) => s.collectedStamps);
  const activeModalStamp = useStampStore((s) => s.activeStampModal);
  const openStampModal = useStampStore((s) => s.openStampModal);
  const closeStampModal = useStampStore((s) => s.closeStampModal);

  const [selectedRegion, setSelectedRegion] = useState<RegionCode>('all');
  const [activeTab, setActiveTab] = useState<'stamps' | 'leaderboard'>('stamps');

  const totalStampsCount = STAMP_DEFINITIONS.length;
  const unlockedCount = Object.keys(collectedStamps).length;

  const unlockedRegions = new Set<string>();
  Object.keys(collectedStamps).forEach((sid) => {
    const def = STAMP_DEFINITIONS.find((d) => d.id === sid);
    if (def && def.region !== 'all') unlockedRegions.add(def.region);
  });

  const filteredStamps = STAMP_DEFINITIONS.filter((stamp) => {
    if (selectedRegion === 'all') return true;
    if (selectedRegion === 'seoul' || selectedRegion === 'gyeonggi') {
      return stamp.region === 'seoul' || stamp.region === 'gyeonggi' || stamp.region === 'all';
    }
    return stamp.region === selectedRegion || stamp.region === 'all';
  });

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.set(containerRef.current, { visibility: 'visible' });

    gsap.from('.header-elem', {
      y: 28,
      opacity: 0,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power3.out',
    });
  }, { scope: containerRef });

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      '.stamp-card-elem',
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.03, ease: 'power2.out', clearProps: 'all' },
    );
  }, { scope: containerRef, dependencies: [activeTab, selectedRegion] });

  return (
    <Root ref={containerRef}>
      <MapBackdrop>
        <KoreaMapCanvas
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
          unlockedRegions={unlockedRegions}
        />
      </MapBackdrop>

      <Content>
        <Header>
          <Title className="header-elem">
            나의<br />한옥 수결첩
          </Title>
          <SingleStat className="header-elem">
            <strong>{unlockedCount}</strong> / {totalStampsCount}개
          </SingleStat>
          <UserLine className="header-elem">
            <User size={12} />
            {user ? (
              <>
                <span>{user.displayName} 님</span>
                <ShieldCheck size={12} color="#059669" />
              </>
            ) : (
              <span>로그인하면 도장을 안전하게 보관할 수 있어요</span>
            )}
          </UserLine>
        </Header>

        <TabRow className="header-elem">
          <TabButton $active={activeTab === 'stamps'} onClick={() => setActiveTab('stamps')}>
            도장 모음
          </TabButton>
          <TabButton $active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')}>
            탐방 랭킹
          </TabButton>

          {activeTab === 'stamps' && (
            <>
              <Divider />
              {REGIONS.map((reg) => (
                <TabButton
                  key={reg.id}
                  $active={selectedRegion === reg.id}
                  onClick={() => setSelectedRegion(reg.id)}
                >
                  {reg.label}
                </TabButton>
              ))}
            </>
          )}
        </TabRow>

        {activeTab === 'stamps' ? (
          <StampsGrid>
            {filteredStamps.map((stamp) => (
              <div key={stamp.id} className="stamp-card-elem">
                <StampCard
                  stamp={stamp}
                  collected={collectedStamps[stamp.id]}
                  onClick={() => openStampModal(stamp)}
                />
              </div>
            ))}
          </StampsGrid>
        ) : (
          <div className="stamp-card-elem">
            <LeaderboardHeader>탐방 랭킹</LeaderboardHeader>
            <StampLeaderboard />
          </div>
        )}
      </Content>

      <StampSealAnimation stamp={activeModalStamp} onClose={closeStampModal} />
    </Root>
  );
}
