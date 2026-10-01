'use client';

import { useState, useRef } from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, RefreshCwIcon, ShieldCheckIcon, UserIcon } from '@hugeicons/core-free-icons'
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { toast } from 'sonner';
import { meok } from '@/design-system/tokens';
import { useStampStore } from '../presentation/useStampStore';
import { useStampSession } from '../presentation/useStampSession';
import { useStampRanking } from '../presentation/useStampRanking';
import { mergeStampCatalog, resolveStampBookViewState } from '../domain/stampRules';
import { REGIONS } from '../data/stampDefs';
import type { RegionCode, StampCatalogResponse } from '../domain/models';
import KoreaMapCanvas from './KoreaMapCanvas';
import StampCard from './StampCard';
import StampLeaderboard from './StampLeaderboard';
import StampSealAnimation from './StampSealAnimation';
import StampBookSkeleton from './StampBookSkeleton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import OniSearchEmpty from '@/shared/components/OniSearchEmpty/OniSearchEmpty';

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
  font-size: clamp(80px, 11vw, 116px);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.05em;
  color: #D9281C;

  span {
    font-family: var(--font-traditional-body);
    font-size: clamp(16px, 2vw, 22px);
    font-weight: 400;
    letter-spacing: 0;
    color: ${meok[400]};
    margin-left: 8px;
  }

  [data-theme='dark'] & {
    color: #ff5a4d;
    span { color: ${meok[400]}; }
  }
`;

const StatCaption = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${meok[500]};
  margin-top: 4px;
  letter-spacing: -0.01em;
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

const ProgressInk = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => `${$percent}%`};
  background: ${meok[700]};
  transition: width 1s cubic-bezier(0.22, 1, 0.36, 1);

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.7);
  }

  @media (prefers-reduced-motion: reduce) { transition: none; }
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

const ErrorState = styled.div`
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  text-align: center;
  color: ${meok[600]};
  background: #f8f8f7;
  border-radius: 20px;

  [data-theme='dark'] & { background: rgba(255, 255, 255, 0.04); }
`;

const RetryButton = styled.button`
  height: 40px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #cdcdca;
  border-radius: 10px;
  background: #ffffff;
  color: ${meok[800]};
  cursor: pointer;
`;

interface StampBookProps {
  initialCatalog: StampCatalogResponse | null;
}

export default function StampBook({ initialCatalog }: StampBookProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { user, isLoading: authLoading, isLoggedIn, loginWithKakao } = useAuth();
  const activeModalStamp = useStampStore((s) => s.activeStampModal);
  const openStampModal = useStampStore((s) => s.openStampModal);
  const closeStampModal = useStampStore((s) => s.closeStampModal);
  const {
    catalog,
    book,
    catalogError,
    bookError,
    refreshCatalog,
    refreshBook,
  } = useStampSession({ authLoading, loggedIn: isLoggedIn, initialCatalog });

  const [selectedRegion, setSelectedRegion] = useState<RegionCode>('all');
  const [activeTab, setActiveTab] = useState<'stamps' | 'leaderboard'>('stamps');
  const ranking = useStampRanking({
    enabled: activeTab === 'leaderboard',
    loggedIn: isLoggedIn,
  });

  const effectiveCatalog = catalog ?? initialCatalog;
  const viewState = resolveStampBookViewState({
    authLoading,
    loggedIn: isLoggedIn,
    hasCatalog: Boolean(effectiveCatalog),
    hasBook: Boolean(book),
    catalogError: Boolean(catalogError),
    bookError: Boolean(bookError),
  });

  const collection = effectiveCatalog
    ? mergeStampCatalog(effectiveCatalog, isLoggedIn ? book : null)
    : {
        summary: {
          collectedCount: 0,
          totalCount: 0,
          visitedRegionCount: 0,
          requiredRegionCount: 0,
          completionRate: 0,
        },
        stamps: [],
      };
  const totalStampsCount = collection.summary.totalCount;
  const unlockedCount = collection.summary.collectedCount;
  const progressPercent = collection.summary.completionRate;

  const unlockedRegions = new Set<string>();
  collection.stamps.forEach((stamp) => {
    if (stamp.collected && stamp.region !== 'all') unlockedRegions.add(stamp.region);
  });

  const filteredStamps = collection.stamps.filter((stamp) => {
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
  }, { scope: containerRef, dependencies: [viewState] });

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      '.stamp-card-elem',
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.025, ease: 'power2.out', clearProps: 'all' },
    );
  }, { scope: containerRef, dependencies: [viewState] });

  if (viewState === 'loading') return <StampBookSkeleton />;

  if (!effectiveCatalog || viewState === 'catalog-error') {
    return (
      <Root style={{ visibility: 'visible' }}>
        <Header><Title>나의 한옥 수결첩</Title></Header>
        <OniSearchEmpty
          size="md"
          title="수결 목록을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={
            <RetryButton type="button" onClick={() => void refreshCatalog().catch(() => undefined)}>
              <HugeiconsIcon icon={RefreshCwIcon} size={15} /> 다시 시도
            </RetryButton>
          }
        />
      </Root>
    );
  }

  if (viewState === 'book-error') {
    return (
      <Root style={{ visibility: 'visible' }}>
        <Header><Title>나의 한옥 수결첩</Title></Header>
        <OniSearchEmpty
          size="md"
          title="내 수결첩을 불러오지 못했어요"
          description="이전 데모 도장은 표시하지 않습니다. 다시 시도해 주세요."
          action={
            <RetryButton type="button" onClick={() => void refreshBook().catch(() => undefined)}>
              <HugeiconsIcon icon={RefreshCwIcon} size={15} /> 다시 시도
            </RetryButton>
          }
        />
      </Root>
    );
  }

  return (
    <Root ref={containerRef}>
      <Header>
        <Title className="header-elem">나의 한옥 수결첩</Title>
        <SingleStat className="header-elem">
          <strong>{unlockedCount}</strong> / {totalStampsCount}개
        </SingleStat>
        <UserLine className="header-elem">
          <HugeiconsIcon icon={UserIcon} size={12} />
          {user ? (
            <>
              <span>{user.displayName} 님</span>
              <HugeiconsIcon icon={ShieldCheckIcon} size={12} color="#059669" />
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
              <ProgressInk className="progress-ink" $percent={progressPercent} />
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
                collected={stamp.collected ?? undefined}
                onClick={() => {
                  if (stamp.collected) {
                    openStampModal(stamp);
                  } else if (!isLoggedIn) {
                    toast.info('로그인하면 현장에서 수결을 모을 수 있어요.');
                    loginWithKakao();
                  } else {
                    toast.info('한옥 장소 가까이에서 지도 탭의 도장 찍기를 이용해 주세요.');
                  }
                }}
              />
            </div>
          ))}
        </StampsGrid>
      ) : (
        <div className="stamp-card-elem">
          <LeaderboardHeader>탐방 랭킹</LeaderboardHeader>
          <StampLeaderboard
            entries={ranking.leaderboard?.entries ?? []}
            myRanking={ranking.myRanking}
            isLoggedIn={isLoggedIn}
            loading={ranking.loading}
            hasError={Boolean(ranking.error)}
            mutationPending={ranking.mutationPending}
            retryAfterSeconds={ranking.retryAfterSeconds}
            onLogin={loginWithKakao}
            onJoin={() => void ranking.join().catch(() => undefined)}
            onWithdraw={() => void ranking.withdraw().catch(() => undefined)}
            onRetry={() => void ranking.reload()}
          />
        </div>
      )}

      <StampSealAnimation stamp={activeModalStamp} onClose={closeStampModal} />
    </Root>
  );
}
