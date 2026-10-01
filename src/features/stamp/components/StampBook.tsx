'use client';

import { useState, useRef, useEffect } from 'react';
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

/* ── 수결첩 디자인 토큰 ── */
const NIGHT    = '#0B0D13';
const INK_LIGHT = '#E8DFC8';
const INK       = INK_LIGHT;
const INK_DIM   = 'rgba(232, 223, 200, 0.42)';
const CINNABAR  = '#C9221A';
const AMBER     = '#E09240';

const getStampRotation = (id: string) =>
  ((id.charCodeAt(Math.floor(id.length / 2)) % 7) - 3) * 0.75;

const Root = styled.div`
  width: 100%;
  padding: clamp(32px, 4vw, 48px) 0 120px;
  color: ${INK_LIGHT};
  background: ${NIGHT};
  visibility: hidden;
  border-radius: 16px;
`;

const Header = styled.header`
  margin-bottom: clamp(32px, 4vw, 48px);
`;

const TitleBlock = styled.div`
  margin-bottom: 18px;
`;

const Title = styled.h1`
  font-family: var(--font-traditional);
  font-size: clamp(30px, 4.5vw, 48px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
  margin: 0 0 14px 0;
  color: ${INK_LIGHT};
`;

const TitleRule = styled.div`
  width: 48px;
  height: 2px;
  background: ${CINNABAR};
`;

const SingleStat = styled.div`
  font-size: 13px;
  color: ${INK_DIM};
  margin-bottom: 8px;

  strong {
    font-family: var(--font-traditional);
    font-size: 15px;
    font-weight: 700;
    color: ${INK_LIGHT};
  }
`;

const UserLine = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: rgba(232, 223, 200, 0.3);
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
  align-items: flex-start;
  gap: 16px;

  @media (max-width: 900px) {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 24px;
  }
`;

/* ── 인장형 진행 스탯 ── */
const ProgressSealWrap = styled.div`
  position: relative;
  width: 160px;
  height: 160px;
  flex-shrink: 0;

  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    circle { transition: none !important; }
  }
`;

const ProgressSealCenter = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
`;

const ProgressNum = styled.span`
  font-family: var(--font-traditional);
  font-size: 52px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  color: ${AMBER};
`;

const ProgressOf = styled.span`
  font-size: 12px;
  color: ${INK_DIM};
  letter-spacing: -0.01em;
`;

const ProgressMeta = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${INK_DIM};
  letter-spacing: 0.01em;
`;

/* ── tabs ── */

const TabRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 2px;
  overflow-x: auto;
  padding-bottom: 0;
  margin-bottom: 36px;
  border-bottom: 1px solid rgba(232, 223, 200, 0.1);
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }
`;

const Divider = styled.span`
  width: 1px;
  height: 14px;
  background: rgba(232, 223, 200, 0.1);
  margin: 0 6px 10px;
  flex-shrink: 0;
`;

const TabButton = styled.button<{ $active: boolean }>`
  height: 36px;
  padding: 0 12px;
  border: none;
  border-bottom: 2px solid ${({ $active }) => ($active ? CINNABAR : 'transparent')};
  margin-bottom: -1px;
  background: transparent;
  font-family: var(--font-traditional);
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  cursor: pointer;
  white-space: nowrap;
  color: ${({ $active }) => ($active ? CINNABAR : INK_DIM)};
  transition: color 0.12s ease, border-color 0.12s ease;

  &:hover { color: ${INK_LIGHT}; }
`;

/* ── stamp grid ── */

const StampsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 44px 20px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 32px 16px;
  }
`;

const LeaderboardHeader = styled.div`
  font-family: var(--font-traditional);
  font-size: 18px;
  font-weight: 700;
  color: ${INK_LIGHT};
  margin-bottom: 16px;
`;

const RetryButton = styled.button`
  height: 40px;
  padding: 0 18px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(232, 223, 200, 0.15);
  border-radius: 8px;
  background: rgba(232, 223, 200, 0.06);
  color: ${INK_LIGHT};
  font-family: var(--font-traditional);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.12s ease;

  &:hover { background: rgba(232, 223, 200, 0.1); }
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

  const [displayCount, setDisplayCount] = useState(0);
  useEffect(() => {
    if (unlockedCount === 0) { setDisplayCount(0); return; }
    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: unlockedCount,
      duration: 1.4,
      ease: 'power2.out',
      delay: 0.6,
      onUpdate: () => setDisplayCount(Math.round(obj.val)),
    });
    return () => { tween.kill(); };
  }, [unlockedCount]);

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
              <HugeiconsIcon icon={RefreshCwIcon} size={15} /> 다시 시도하기
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
          title="수결첩을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={
            <RetryButton type="button" onClick={() => void refreshBook().catch(() => undefined)}>
              <HugeiconsIcon icon={RefreshCwIcon} size={15} /> 다시 시도하기
            </RetryButton>
          }
        />
      </Root>
    );
  }

  return (
    <Root ref={containerRef}>
      <Header>
        <TitleBlock>
          <Title className="header-elem">나의 한옥 수결첩</Title>
          <TitleRule className="header-elem" />
        </TitleBlock>
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
          <ProgressSealWrap
            className="stat-item"
            aria-label={`${unlockedCount}개 수결 달성, 달성률 ${progressPercent}%`}
          >
            <svg viewBox="0 0 160 160" aria-hidden="true">
              <circle
                cx="80" cy="80" r="66"
                fill="none"
                stroke="rgba(232,223,200,0.08)"
                strokeWidth="1"
              />
              <circle
                cx="80" cy="80" r="66"
                fill="none"
                stroke={AMBER}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${(progressPercent / 100) * 414.7} 414.7`}
                transform="rotate(-90 80 80)"
                style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1)' }}
              />
            </svg>
            <ProgressSealCenter>
              <ProgressNum>{displayCount}</ProgressNum>
              <ProgressOf>/ {totalStampsCount}개</ProgressOf>
            </ProgressSealCenter>
          </ProgressSealWrap>
          <ProgressMeta className="stat-item">전국 달성률 {progressPercent}%</ProgressMeta>
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
            <div
              key={stamp.id}
              className="stamp-card-elem"
              style={{ transform: `rotate(${getStampRotation(stamp.id)}deg)` }}
            >
              <StampCard
                stamp={stamp}
                collected={stamp.collected ?? undefined}
                onClick={() => {
                  if (stamp.collected) {
                    openStampModal(stamp);
                  } else if (!isLoggedIn) {
                    toast.info('로그인하면 현장에서 도장을 모을 수 있어요.');
                    loginWithKakao();
                  } else {
                    toast.info('한옥 현장 근처에서 도장을 찍을 수 있어요.');
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
