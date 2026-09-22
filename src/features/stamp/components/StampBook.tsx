'use client';

import { useState, useRef } from 'react';
import styled from '@emotion/styled';
import { Award, MapPin, Trophy, Sparkles, User, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { meok } from '@/design-system/tokens';
import { useStampStore } from '../hooks/useStampStore';
import { STAMP_DEFINITIONS, REGIONS } from '../data/stampDefs';
import type { RegionCode, StampDef } from '../types';
import KoreaMapCanvas from './KoreaMapCanvas';
import StampCard from './StampCard';
import StampLeaderboard from './StampLeaderboard';
import StampSealAnimation from './StampSealAnimation';
import { useAuth } from '@/features/auth/hooks/useAuth';


gsap.registerPlugin(useGSAP);



const Root = styled.div`
  width: 100%;
  padding: 16px clamp(16px, 4vw, 48px) 80px;
  background: transparent;
  color: inherit;
  visibility: hidden;

  @media (max-width: 640px) {
    padding: 12px 16px 80px;
  }
`;

const Header = styled.header`
  margin-bottom: 28px;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 9999px;

  background: rgba(249, 115, 22, 0.12);
  color: #ea580c;
  font-family: var(--font-traditional);
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-bottom: 8px;

  [data-theme='dark'] & {
    color: #fdba74;
    background: rgba(249, 115, 22, 0.2);
  }
`;

const Title = styled.h1`
  font-family: var(--font-traditional);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 8px 0;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const Subtitle = styled.p`
  font-family: var(--font-traditional-body);
  font-size: 15px;
  color: ${meok[500]};
  margin: 0;
  line-height: 1.6;
  letter-spacing: -0.01em;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const UserSyncBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(25, 31, 40, 0.04);
  font-size: 12px;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const UserSyncLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${meok[700]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(420px, 1.25fr) minmax(300px, 0.95fr);
  gap: 36px;
  align-items: center;
  padding: 32px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(25, 31, 40, 0.06);
  margin-bottom: 36px;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
    padding: 20px;
    gap: 24px;
  }

  @media (max-width: 640px) {
    padding: 16px;
    gap: 16px;
    border-radius: 18px;
    margin-bottom: 24px;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
`;

const StatRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const StatBox = styled.div`
  padding: 14px;
  border-radius: 14px;
  background: rgba(25, 31, 40, 0.03);

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.04);
  }
`;

const StatLabel = styled.div`
  font-size: 11.5px;
  color: ${meok[500]};
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StatValue = styled.div`
  font-size: 22px;
  font-weight: 900;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: #ffffff;
  }

  span {
    font-size: 13px;
    font-weight: 500;
    color: ${meok[500]};
    margin-left: 2px;
  }
`;

const ProgressBarTrack = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 9999px;
  background: rgba(25, 31, 40, 0.08);
  margin-top: 10px;
  overflow: hidden;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ProgressBarFill = styled.div`
  height: 100%;
  width: 0%;
  border-radius: 9999px;

  background: linear-gradient(90deg, #f59e0b, #ea580c);

`;

const GuideNote = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;

  background: rgba(245, 158, 11, 0.08);
  color: #b45309;
  font-family: var(--font-traditional-body);
  font-size: 13px;
  line-height: 1.5;

  [data-theme='dark'] & {
    background: rgba(251, 191, 36, 0.1);
    color: #fcd34d;
  }
`;

const TabRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 20px;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  height: 34px;
  padding: 0 14px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
  white-space: nowrap;
  background: ${({ $active }) =>
    $active ? 'rgba(25, 31, 40, 0.08)' : 'transparent'};
  color: ${({ $active }) => ($active ? meok[900] : meok[500])};
  transition: background 0.15s ease, color 0.15s ease;

  [data-theme='dark'] & {
    background: ${({ $active }) =>
      $active ? 'rgba(255, 255, 255, 0.15)' : 'transparent'};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[400])};
  }

  &:hover {
    color: ${meok[900]};
    [data-theme='dark'] & {
      color: #ffffff;
    }
  }
`;

const StampsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
  }
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
    if (def && def.region !== 'all') {
      unlockedRegions.add(def.region);
    }
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
      y: 20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
    })

    .from('.stat-box', {
      scale: 0.9,
      opacity: 0,
      y: 10,
      duration: 0.4,
      stagger: 0.1,
      ease: 'back.out(1.5)',
    }, '-=0.2')

    .to('.progress-fill', {
      width: `${progressPercent}%`,
      duration: 1.2,
      ease: 'power3.out',
    }, '-=0.2');

  }, { scope: containerRef, dependencies: [progressPercent] });


  useGSAP(() => {
    if (!containerRef.current) return;

    gsap.fromTo('.stamp-card-elem',
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.03, ease: 'power2.out', clearProps: 'all' }
    );
  }, { scope: containerRef, dependencies: [activeTab, selectedRegion] });

  return (
    <Root ref={containerRef}>
      <Header>
        <Badge className="header-elem">
          <Award size={13} />
          <span>한옥 수결첩</span>
        </Badge>
        <Title className="header-elem">나의 한옥 방문 도장첩</Title>
        <Subtitle className="header-elem">
          전국 한옥을 여행하며 모은 방문 도장이에요.
        </Subtitle>

        <UserSyncBanner className="header-elem">
          <UserSyncLeft>
            <User size={14} />
            <span>{user ? `${user.nickname || user.email} 님과 안전하게 동기화됨` : '로그인하면 도장을 안전하게 보관할 수 있어요'}</span>
          </UserSyncLeft>
          {user && (
            <ShieldCheck size={16} color="#059669" />
          )}
        </UserSyncBanner>
      </Header>

      <HeroGrid>
        <KoreaMapCanvas
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
          unlockedRegions={unlockedRegions}
        />

        <StatsContainer>
          <StatRow>
            <StatBox className="stat-box">
              <StatLabel>
                <Award size={12} />
                <span>모은 도장</span>
              </StatLabel>
              <StatValue>
                {unlockedCount} <span>/ {totalStampsCount}</span>
              </StatValue>
            </StatBox>

            <StatBox className="stat-box">
              <StatLabel>
                <MapPin size={12} />
                <span>방문한 지역</span>
              </StatLabel>
              <StatValue>
                {unlockedRegions.size} <span>/ 7도</span>
              </StatValue>
            </StatBox>
          </StatRow>

          <StatBox className="stat-box">
            <StatLabel>
              <Sparkles size={12} />
              <span>전국 달성률</span>
            </StatLabel>
            <StatValue>{progressPercent}%</StatValue>
            <ProgressBarTrack>
              <ProgressBarFill className="progress-fill" />
            </ProgressBarTrack>
          </StatBox>

          <GuideNote className="stat-box">
            <MapPin size={15} style={{ flexShrink: 0 }} />
            <span>지도의 권역을 누르면 해당 지역의 도장만 모아볼 수 있어요.</span>
          </GuideNote>
        </StatsContainer>
      </HeroGrid>

      {}
      <TabRow className="header-elem">
        <TabButton
          $active={activeTab === 'stamps'}
          onClick={() => setActiveTab('stamps')}
        >
          도장 모음
        </TabButton>
        <TabButton
          $active={activeTab === 'leaderboard'}
          onClick={() => setActiveTab('leaderboard')}
        >
          탐방 랭킹
        </TabButton>

        {activeTab === 'stamps' && (
          <>
            <span style={{ width: '1px', height: '18px', background: 'rgba(25, 31, 40, 0.1)', margin: '0 4px' }} />
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

      {}
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
          <StampLeaderboard />
        </div>
      )}

      {}
      <StampSealAnimation
        stamp={activeModalStamp}
        onClose={closeStampModal}
      />
    </Root>
  );
}