'use client';

import { useState } from 'react';
import styled from '@emotion/styled';
import { Award, MapPin, Trophy, Sparkles, User, ShieldCheck } from 'lucide-react';
import { meok } from '@/design-system/tokens';
import { useStampStore } from '../hooks/useStampStore';
import { STAMP_DEFINITIONS, REGIONS } from '../data/stampDefs';
import type { RegionCode, StampDef } from '../types';
import KoreaMapCanvas from './KoreaMapCanvas';
import StampCard from './StampCard';
import StampLeaderboard from './StampLeaderboard';
import StampSealAnimation from './StampSealAnimation';
import { useAuth } from '@/features/auth/hooks/useAuth';

const Root = styled.div`
  width: 100%;
  padding: 16px 0 80px;
  background: transparent;
  color: inherit;
`;

const Header = styled.header`
  margin-bottom: 28px;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 9999px;
  background: rgba(212, 175, 55, 0.14);
  color: #b45309;
  font-size: 11.5px;
  font-weight: 700;
  margin-bottom: 8px;

  [data-theme='dark'] & {
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.18);
  }
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.02em;
  margin: 0 0 8px 0;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const Subtitle = styled.p`
  font-size: 14.5px;
  color: ${meok[500]};
  margin: 0;
  line-height: 1.5;

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

const ProgressBarFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => Math.min(100, Math.max(0, $percent))}%;
  border-radius: 9999px;
  background: linear-gradient(90deg, #d4af37, #f59e0b);
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
`;

const GuideNote = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(212, 175, 55, 0.08);
  color: #92400e;
  font-size: 12.5px;
  line-height: 1.5;

  [data-theme='dark'] & {
    background: rgba(245, 158, 11, 0.1);
    color: #fde68a;
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
`;

export default function StampBook() {
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

  // Unlocked region set
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

  return (
    <Root>
      <Header>
        <Badge>
          <Award size={13} />
          <span>전국 한옥 수결첩 (手決帖)</span>
        </Badge>
        <Title>나의 한옥 탐방 인장첩</Title>
        <Subtitle>
          전국 8도의 유서 깊은 고택과 한옥 명소를 거닐며 획득한 나만의 전통 수결(인장)입니다.
        </Subtitle>

        <UserSyncBanner>
          <UserSyncLeft>
            <User size={14} />
            <span>{user ? `${user.nickname || user.email} 님의 계정과 안전하게 동기화됨` : '비로그인 상태 — 브라우저에 임시 보관 중'}</span>
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
            <StatBox>
              <StatLabel>
                <Award size={12} />
                <span>수집한 인장</span>
              </StatLabel>
              <StatValue>
                {unlockedCount} <span>/ {totalStampsCount}</span>
              </StatValue>
            </StatBox>

            <StatBox>
              <StatLabel>
                <MapPin size={12} />
                <span>탐방한 권역</span>
              </StatLabel>
              <StatValue>
                {unlockedRegions.size} <span>/ 7도</span>
              </StatValue>
            </StatBox>
          </StatRow>

          <StatBox>
            <StatLabel>
              <Sparkles size={12} />
              <span>전국 완파 달성률</span>
            </StatLabel>
            <StatValue>{progressPercent}%</StatValue>
            <ProgressBarTrack>
              <ProgressBarFill $percent={progressPercent} />
            </ProgressBarTrack>
          </StatBox>

          <GuideNote>
            <MapPin size={15} style={{ flexShrink: 0 }} />
            <span>지도의 각 권역을 누르면 해당 지역의 한옥 인장만 모아볼 수 있습니다.</span>
          </GuideNote>
        </StatsContainer>
      </HeroGrid>

      {/* Tabs */}
      <TabRow>
        <TabButton
          $active={activeTab === 'stamps'}
          onClick={() => setActiveTab('stamps')}
        >
          스탬프 모음
        </TabButton>
        <TabButton
          $active={activeTab === 'leaderboard'}
          onClick={() => setActiveTab('leaderboard')}
        >
          전국 순례 랭킹
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

      {/* Tab Content */}
      {activeTab === 'stamps' ? (
        <StampsGrid>
          {filteredStamps.map((stamp) => (
            <StampCard
              key={stamp.id}
              stamp={stamp}
              collected={collectedStamps[stamp.id]}
              onClick={() => openStampModal(stamp)}
            />
          ))}
        </StampsGrid>
      ) : (
        <StampLeaderboard />
      )}

      {/* Seal Animation / Detail Modal */}
      <StampSealAnimation
        stamp={activeModalStamp}
        onClose={closeStampModal}
      />
    </Root>
  );
}
