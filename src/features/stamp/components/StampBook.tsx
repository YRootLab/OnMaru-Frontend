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
  width: 100%;
  padding: clamp(80px, 10vw, 120px) clamp(16px, 4vw, 48px) 100px;
  color: inherit;
  visibility: hidden;
`;

const Header = styled.header`
  margin-bottom: clamp(32px, 4vw, 48px);
`;

const Title = styled.h1`
  font-family: var(--font-traditional);
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0 0 8px 0;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const SingleStat = styled.div`
  font-size: 14px;
  color: ${meok[400]};
  margin-bottom: 8px;

  strong {
    font-family: var(--font-traditional);
    font-size: 16px;
    font-weight: 700;
    color: ${meok[800]};
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

/* ── hero: 지도 + 스탯 ── */

const HeroLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, 1.2fr) minmax(220px, 0.8fr);
  gap: 40px;
  align-items: center;
  margin-bottom: 48px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 24px;
    margin-bottom: 32px;
  }
`;

const StatsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const BigNumber = styled.div`
  font-family: var(--font-traditional);
  font-size: clamp(52px, 7vw, 80px);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.04em;
  color: ${meok[900]};

  span {
    font-family: var(--font-traditional-body);
    font-size: clamp(14px, 1.8vw, 18px);
    font-weight: 400;
    letter-spacing: 0;
    color: ${meok[400]};
    margin-left: 6px;
  }

  [data-theme='dark'] & {
    color: #ffffff;
    span { color: ${meok[400]}; }
  }
`;

const StatCaption = styled.div`
  font-size: 12px;
  color: ${meok[500]};
  margin-top: 2px;
`;

const ProgressWrap = styled.div``;

const ProgressHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
`;

const ProgressLabel = styled.span`
  font-size: 12px;
  color: ${meok[500]};
`;

const ProgressPct = styled.span`
  font-family: var(--font-traditional);
  font-size: 13px;
  font-weight: 700;
  color: ${meok[700]};

  [data-theme='dark'] & { color: ${meok[300]}; }
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 2px;
  background: rgba(25, 31, 40, 0.1);

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ProgressInk = styled.div`
  height: 100%;
  width: 0%;
  background: ${meok[700]};

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.7);
  }
`;

/* ── tabs ── */

const TabRow = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  overflow-x: auto;
  padding-bottom: 14px;
  margin-bottom: 28px;
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
  gap: 40px 16px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 28px 12px;
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
  const progressPercent = Math.round((unlockedCount / totalStampsCount) * 100);

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

    const tl = gsap.timeline();
    tl.from('.header-elem', {
      y: 18,
      opacity: 0,
      duration: 0.55,
      stagger: 0.09,
      ease: 'power2.out',
    })
    .from('.stat-item', {
      y: 10,
      opacity: 0,
      duration: 0.4,
      stagger: 0.08,
      ease: 'power2.out',
    }, '-=0.3')
    .to('.progress-ink', {
      width: `${progressPercent}%`,
      duration: 1.0,
      ease: 'power3.out',
    }, '-=0.2');
  }, { scope: containerRef, dependencies: [progressPercent] });

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      '.stamp-card-elem',
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.025, ease: 'power2.out', clearProps: 'all' },
    );
  }, { scope: containerRef, dependencies: [activeTab, selectedRegion] });

  return (
    <Root ref={containerRef}>
      <Header>
        <Title className="header-elem">나의 한옥 수결첩</Title>
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

      <HeroLayout>
        <KoreaMapCanvas
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
          unlockedRegions={unlockedRegions}
        />

        <StatsSection>
          <BigNumber className="stat-item">
            {unlockedCount}
            <span>/ {totalStampsCount}개</span>
          </BigNumber>
          <StatCaption>모은 도장</StatCaption>

          <ProgressWrap className="stat-item">
            <ProgressHead>
              <ProgressLabel>전국 달성률</ProgressLabel>
              <ProgressPct>{progressPercent}%</ProgressPct>
            </ProgressHead>
            <ProgressTrack>
              <ProgressInk className="progress-ink" />
            </ProgressTrack>
          </ProgressWrap>
        </StatsSection>
      </HeroLayout>

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

      <StampSealAnimation stamp={activeModalStamp} onClose={closeStampModal} />
    </Root>
  );
}
