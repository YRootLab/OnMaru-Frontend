'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Bookmark01Icon,
  FlameIcon,
  ChevronRightIcon,
  MapPinIcon,
  Cancel01Icon,
  SparklesIcon,
  HeartIcon,
  Music01Icon,
  PenLineIcon,
  CheckIcon,
  Compass01Icon,
  Comment01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import type { SavedJourneyDetail } from '@/features/journey-curator/types/exploration.types';
import { useAuth } from '@/features/auth';
import { useAuthSessionStore } from '@/features/auth/store/useAuthSessionStore';
import { OniAvatar } from '@/features/profile/OniAvatar';
import { CHARACTER_IDS, BACKGROUND_IDS, PROFILE_BACKGROUNDS, PROFILE_CHARACTER_NAMES } from '@/features/profile/assets';
import { defaultMemberRepository } from '@/features/auth/api/memberApi';
import { useBookmarkStore } from '@/features/map/hooks/useBookmarkStore';
import { loadWarmth } from '@/features/map/warmth/warmthRepo';
import { formatRelativeTime } from '@/features/map/utils/formatters';
import type { Warmth } from '@/features/map/types';
import { ThemeModeSwitch } from '@/design-system/components';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { ringShadow, type OnmaruTheme } from '@/design-system/tokens';
import { useIsAppleDevice } from '@/shared/hooks/useIsAppleDevice';
import { useSavedJourneyStore } from '@/features/journey-curator/store/useSavedJourneyStore';
import { useJourneyStore } from '@/features/journey-curator/store/useJourneyStore';
import { useSavedExplorationStore } from '@/features/journey-curator/store/useSavedExplorationStore';
import MonthlyTimeline from '@/features/member-timeline/components/MonthlyTimeline';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { defaultJourneyThreadsRepository } from '@/features/journey-curator/api/journeyThreadsApi';
import type { JourneyThreadSummary } from '@/features/journey-curator/api/journeyThreadsApi';
import { defaultSavedResourcesRepository } from '@/features/saved-resources/api/savedResourcesApi';
import type { SavedPlaceSummary } from '@/features/saved-resources/api/savedResourcesContract';
import { defaultVisitReviewRepository } from '@/features/visit-review/api/visitReviewApi';
import type { VisitReview } from '@/features/visit-review/api/visitReviewContract';

type FilterTab = 'ALL' | 'TIMELINE' | 'EXPLORATION' | 'JOURNEY' | 'SOUND' | 'BOOKMARK' | 'COMMUNITY';

/* -------------------------------------------------------------------------- */
/* STYLED COMPONENTS (Awwwards Modern Korean Architectural Sanctuary Theme)  */
/* -------------------------------------------------------------------------- */

const PageContainer = styled.div`
  width: min(calc(100% - 40px), 1140px);
  margin: 0 auto;
  padding-top: 104px;
  padding-bottom: 96px;

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
    padding-top: 84px;
    padding-bottom: 64px;
  }
`;

const PageHeader = styled.header`
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;


const HeaderTitle = styled.h1`
  margin: 0;
  font-family: var(--font-traditional-title, 'Dohyun', sans-serif);
  font-size: 34px;
  font-weight: 800;
  color: var(--foreground, inherit);
  letter-spacing: -0.025em;

  @media (max-width: 640px) {
    font-size: 26px;
  }
`;

const HeaderDescription = styled.p`
  margin: 0;
  font-size: 14.5px;
  color: var(--color-text-muted, #8e8e93);
  line-height: 1.5;
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 32px;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const SidebarWrapper = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: sticky;
  top: 96px;

  @media (max-width: 1024px) {
    position: static;
  }
`;

const ContentWrapper = styled.main`
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
`;

const SurfaceCard = styled.div<{ $bg: string; $borderColor?: string }>`
  background-color: ${({ $bg }) => $bg};
  border-radius: 24px;
  border: 1px solid ${({ $borderColor }) => $borderColor || 'rgba(255, 255, 255, 0.06)'};
  backdrop-filter: blur(12px);
  overflow: hidden;
  box-shadow: ${ringShadow.light.card};
  transition: box-shadow 0.2s ease, border-color 0.2s ease;

  [data-theme='dark'] & {
    box-shadow: ${ringShadow.dark.card};
  }
`;

const ProfileCardInner = styled.div`
  padding: 32px 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const AvatarRing = styled.div<{ $borderColor: string }>`
  position: relative;
  padding: 4px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${({ $borderColor }) => $borderColor} 0%, rgba(212, 175, 55, 0.2) 100%);
  box-shadow: ${ringShadow.light.card};
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  [data-theme='dark'] & {
    box-shadow: ${ringShadow.dark.card};
  }

  &:hover {
    transform: scale(1.04);
  }
`;

const StatGrid = styled.div<{ $bg: string }>`
  display: flex;
  width: 100%;
  margin-top: 24px;
  border-radius: 16px;
  background-color: ${({ $bg }) => $bg};
  overflow: hidden;
`;

const StatItem = styled.div`
  flex: 1;
  padding: 16px 0;
  text-align: center;

  & + & {
    border-left: 1px solid rgba(128, 128, 128, 0.1);
  }
`;

const StatValue = styled.div<{ $color: string }>`
  font-size: 22px;
  font-weight: 800;
  color: ${({ $color }) => $color};
  letter-spacing: -0.02em;
`;

const StatLabel = styled.div<{ $color: string }>`
  font-size: 11.5px;
  color: ${({ $color }) => $color};
  margin-top: 4px;
  font-weight: 500;
`;

const TabContainer = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabButton = styled.button<{ $active: boolean; $activeBg: string; $activeColor: string; $inactiveColor: string; $cardBg: string }>`
  height: 40px;
  padding: 0 18px;
  border-radius: 9999px;
  border: 1px solid ${({ $active, $activeBg }) => ($active ? $activeBg : 'transparent')};
  background-color: ${({ $active, $activeBg, $cardBg }) => ($active ? $activeBg : $cardBg)};
  color: ${({ $active, $activeColor, $inactiveColor }) => ($active ? $activeColor : $inactiveColor)};
  font-size: 13.5px;
  font-weight: ${({ $active }) => ($active ? 700 : 600)};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const SectionTitle = styled.h2<{ $color: string }>`
  margin: 0 0 14px 4px;
  font-size: 16px;
  font-weight: 700;
  color: ${({ $color }) => $color};
  letter-spacing: -0.015em;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CardListRow = styled.div<{ $hoverBg: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 14px 22px;
  gap: 12px;
  transition: background-color 0.15s ease;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(128, 128, 128, 0.08);
  }

  &:hover {
    background-color: ${({ $hoverBg }) => $hoverBg};
  }
`;

const SkeletonBox = styled.div`
  background: linear-gradient(90deg, rgba(128, 128, 128, 0.1) 25%, rgba(128, 128, 128, 0.18) 50%, rgba(128, 128, 128, 0.1) 75%);
  background-size: 200% 100%;
  animation: mp-shimmer-anim 1.6s ease-in-out infinite;
  border-radius: 12px;

  @keyframes mp-shimmer-anim {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export default function MyPage() {
  const router = useRouter();
  const { theme } = useOnmaruTheme();
  const { user, isLoading, isLoggedIn, logout, deleteAccount } = useAuth();

  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);

  const [myWarmths, setMyWarmths] = useState<Warmth[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isApple = useIsAppleDevice();
  const [oniVideoError, setOniVideoError] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftCharacter, setDraftCharacter] = useState('');
  const [draftBackground, setDraftBackground] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const savedJourneys = useSavedJourneyStore((s) => s.savedJourneys);
  const removeJourney = useSavedJourneyStore((s) => s.removeJourney);
  const loadSavedJourneys = useSavedJourneyStore((s) => s.loadSaved);

  const savedExplorations = useSavedExplorationStore((s) => s.details);
  const removeSavedExploration = useSavedExplorationStore((s) => s.removeSaved);
  const renameSavedExploration = useSavedExplorationStore((s) => s.renameSaved);
  const loadSavedExplorations = useSavedExplorationStore((s) => s.loadSaved);

  const savedSounds = useSorimaruAudioStore((s) => s.savedStories);
  const hydrateSounds = useSorimaruAudioStore((s) => s.hydrateSavedStories);
  const removeSavedSound = useSorimaruAudioStore((s) => s.removeSavedStory);

  const [journeyThreads, setJourneyThreads] = useState<JourneyThreadSummary[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlaceSummary[]>([]);
  const [myVisitReviews, setMyVisitReviews] = useState<VisitReview[]>([]);

  useEffect(() => {
    loadSavedJourneys();
  }, [loadSavedJourneys]);

  useEffect(() => {
    loadSavedExplorations();
  }, [loadSavedExplorations]);

  useEffect(() => {
    hydrateSounds();
  }, [hydrateSounds]);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [isLoading, isLoggedIn, router]);

  useEffect(() => {
    setMyWarmths(loadWarmth());
  }, []);

  useEffect(() => {
    const loadServerData = async () => {
      try {
        const [threads, places, reviews] = await Promise.all([
          defaultJourneyThreadsRepository.listThreads({ limit: 10 }).then((r) => r.items),
          defaultSavedResourcesRepository.listPlaces({ limit: 10 }).then((r) => r.items),
          defaultVisitReviewRepository.listReviews({ scope: 'MY', limit: 10 }).then((r) => r.items),
        ]);
        setJourneyThreads(threads ?? []);
        setSavedPlaces(places ?? []);
        setMyVisitReviews(reviews ?? []);
      } catch (err) {
        console.warn('[MyPage] 서버 데이터 로드 실패:', err);
      }
    };
    loadServerData();
  }, []);

  /* -------------------------------------------------------------------------- */
  /* LOADING SKELETON STATE                                                     */
  /* -------------------------------------------------------------------------- */
  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader>
          <SkeletonBox style={{ width: 120, height: 24, borderRadius: 9999 }} />
          <SkeletonBox style={{ width: 220, height: 38 }} />
          <SkeletonBox style={{ width: 340, height: 18 }} />
        </PageHeader>

        <MainGrid>
          <SidebarWrapper>
            <SurfaceCard $bg="rgba(128,128,128,0.05)">
              <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <SkeletonBox style={{ width: 96, height: 96, borderRadius: '50%' }} />
                <SkeletonBox style={{ width: 80, height: 14 }} />
                <SkeletonBox style={{ width: 140, height: 24 }} />
                <SkeletonBox style={{ width: 110, height: 36, borderRadius: 12 }} />
                <SkeletonBox style={{ width: '100%', height: 60, borderRadius: 16 }} />
              </div>
            </SurfaceCard>
          </SidebarWrapper>

          <ContentWrapper>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[80, 90, 100, 80].map((w, i) => (
                <SkeletonBox key={i} style={{ width: w, height: 40, borderRadius: 9999 }} />
              ))}
            </div>
            {[220, 180, 240].map((h, i) => (
              <SurfaceCard key={i} $bg="rgba(128,128,128,0.05)">
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <SkeletonBox style={{ width: 120, height: 20 }} />
                  <SkeletonBox style={{ width: '100%', height: h - 60, borderRadius: 12 }} />
                </div>
              </SurfaceCard>
            ))}
          </ContentWrapper>
        </MainGrid>
      </PageContainer>
    );
  }

  if (!user) return null;

  const c = theme.colors;

  /* -------------------------------------------------------------------------- */
  /* RENDER MAIN PAGE                                                           */
  /* -------------------------------------------------------------------------- */
  return (
    <PageContainer>
      {/* 상단 타이틀 & 뱃지 영역 */}
      <PageHeader>
        <HeaderTitle>마이페이지</HeaderTitle>
        <HeaderDescription>
          {user.displayName || '길손'}님의 여정 기록, 저장한 풍경과 소리, 그리고 발자취가 모인 공간입니다.
        </HeaderDescription>
      </PageHeader>

      <MainGrid>
        {/* LEFT COLUMN (Sidebar: Profile Card & Companion Intro) */}
        <SidebarWrapper>
          {/* 프로필 보기 모드 */}
          {!editingProfile && (
            <SurfaceCard $bg={c.bg.surface} $borderColor="rgba(255, 255, 255, 0.08)">
              <ProfileCardInner>
                <AvatarRing $borderColor={c.action.primary}>
                  <OniAvatar characterId={user.characterId} backgroundId={user.backgroundId} size={92} />
                </AvatarRing>

                <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color: c.action.primary }}>
                  {PROFILE_CHARACTER_NAMES[user.characterId as keyof typeof PROFILE_CHARACTER_NAMES] ?? '온이'}
                </div>

                <div style={{ marginTop: '4px', fontSize: '24px', fontWeight: 800, color: c.text.primary, letterSpacing: '-0.025em' }}>
                  {user.displayName || '길손'}님
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', width: '100%' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftName(user.displayName || '');
                      setDraftCharacter(user.characterId || 'CHARACTER_01');
                      setDraftBackground(user.backgroundId || 'BACKGROUND_01');
                      setEditingProfile(true);
                    }}
                    style={{
                      flex: 1,
                      height: '38px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: c.bg.card,
                      color: c.text.primary,
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <HugeiconsIcon icon={PenLineIcon} size={14} />
                    프로필 변경
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    style={{
                      height: '38px',
                      padding: '0 16px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: c.bg.card,
                      color: c.text.muted,
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'color 0.15s ease',
                    }}
                  >
                    로그아웃
                  </button>
                </div>

                <StatGrid $bg={c.bg.card}>
                  <StatItem>
                    <StatValue $color={c.text.primary}>{savedExplorations.length}</StatValue>
                    <StatLabel $color={c.text.muted}>저장 여정</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue $color={c.text.primary}>{bookmarks.length}</StatValue>
                    <StatLabel $color={c.text.muted}>북마크</StatLabel>
                  </StatItem>
                  <StatItem>
                    <StatValue $color={c.text.primary}>{savedSounds.length}</StatValue>
                    <StatLabel $color={c.text.muted}>담은 소리</StatLabel>
                  </StatItem>
                </StatGrid>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(128,128,128,0.1)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: c.text.secondary }}>화면 테마 설정</span>
                  <ThemeModeSwitch />
                </div>
              </ProfileCardInner>
            </SurfaceCard>
          )}

          {/* 프로필 편집 모드 */}
          {editingProfile && (
            <SurfaceCard $bg={c.bg.surface} $borderColor={c.action.primary}>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: c.text.primary }}>프로필 수정</h3>
                </div>

                {/* 실시간 아바타 미리보기 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '16px', backgroundColor: c.bg.card, borderRadius: '16px' }}>
                  <OniAvatar characterId={draftCharacter} backgroundId={draftBackground} size={64} />
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: c.action.primary, marginBottom: '2px' }}>
                      {PROFILE_CHARACTER_NAMES[draftCharacter as keyof typeof PROFILE_CHARACTER_NAMES] ?? '온이'}
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: c.text.primary, letterSpacing: '-0.02em' }}>
                      {draftName || '닉네임 입력'}
                    </div>
                  </div>
                </div>

                {/* 닉네임 입력 */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: c.text.secondary, marginBottom: '8px' }}>닉네임</label>
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    maxLength={20}
                    placeholder="2~20자 닉네임"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      border: `1.5px solid ${c.bg.card}`,
                      backgroundColor: c.bg.app,
                      color: c.text.primary,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = c.action.primary; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = c.bg.card; }}
                  />
                </div>

                {/* 캐릭터 선택 (5종) */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: c.text.secondary, marginBottom: '10px' }}>캐릭터 선택</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                    {CHARACTER_IDS.map((id) => (
                      <button
                        key={id}
                        type="button"
                        aria-label={PROFILE_CHARACTER_NAMES[id]}
                        aria-pressed={draftCharacter === id}
                        onClick={() => setDraftCharacter(id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 2px',
                          border: `2px solid ${draftCharacter === id ? c.action.primary : 'transparent'}`,
                          borderRadius: '14px',
                          cursor: 'pointer',
                          background: draftCharacter === id ? `${c.action.primary}15` : 'transparent',
                          outline: 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <OniAvatar characterId={id} backgroundId={draftBackground} size={44} />
                        <span style={{ fontSize: '9px', fontWeight: 700, color: draftCharacter === id ? c.action.primary : c.text.muted, textAlign: 'center', lineHeight: 1.1, wordBreak: 'keep-all' }}>
                          {PROFILE_CHARACTER_NAMES[id].replace('온이', '')}온이
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 배경색 선택 */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: c.text.secondary, marginBottom: '10px' }}>배경색 선택</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {BACKGROUND_IDS.map((id) => (
                      <button
                        key={id}
                        type="button"
                        aria-label={`배경 ${id}`}
                        aria-pressed={draftBackground === id}
                        onClick={() => setDraftBackground(id)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: PROFILE_BACKGROUNDS[id],
                          border: `3px solid ${draftBackground === id ? c.action.primary : 'transparent'}`,
                          cursor: 'pointer',
                          outline: 'none',
                          boxShadow: draftBackground === id ? `0 0 0 2px ${c.action.primary}` : 'none',
                          transition: 'transform 0.15s ease',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* 저장 / 취소 버튼 */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={profileSaving || !draftName.trim()}
                    onClick={async () => {
                      if (!draftName.trim()) return;
                      setProfileSaving(true);
                      try {
                        const updated = await defaultMemberRepository.updateMyProfile({
                          displayName: draftName.trim(),
                          characterId: draftCharacter || undefined,
                          backgroundId: draftBackground || undefined,
                        });
                        useAuthSessionStore.getState().applyProfile(updated);
                        toast.success('프로필을 변경했어요.');
                        setEditingProfile(false);
                      } catch {
                        toast.error('프로필 변경에 실패했어요. 잠시 후 다시 시도해주세요.');
                      } finally {
                        setProfileSaving(false);
                      }
                    }}
                    style={{
                      flex: 1,
                      height: '42px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: c.action.primary,
                      color: c.text.inverse,
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: (profileSaving || !draftName.trim()) ? 'not-allowed' : 'pointer',
                      opacity: (profileSaving || !draftName.trim()) ? 0.6 : 1,
                    }}
                  >
                    {profileSaving ? '저장 중…' : '저장'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    style={{
                      height: '42px',
                      padding: '0 18px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: c.bg.card,
                      color: c.text.secondary,
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            </SurfaceCard>
          )}

          {/* 길잡이 온이 소개 카드 */}
          <SurfaceCard $bg={c.bg.surface} $borderColor="rgba(255, 255, 255, 0.08)">
            <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '160px', height: '160px', flexShrink: 0, filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.15))' }}>
                {isApple || oniVideoError ? (
                  <img src="/images/character/Oni_hi.png" alt="온이" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    onError={() => setOniVideoError(true)}
                    onCanPlay={(e) => {
                      e.currentTarget.muted = true;
                      e.currentTarget.play().catch(() => {});
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'transparent' }}
                  >
                    <source src="/videos/Oni_hi.webm" type="video/webm" onError={() => setOniVideoError(true)} />
                  </video>
                )}
              </div>
              <div style={{ fontFamily: 'var(--font-traditional-title, "Dohyun", sans-serif)', fontSize: '20px', fontWeight: 800, color: c.text.primary, marginTop: '8px', marginBottom: '8px' }}>
                길잡이 온이
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: c.text.secondary, lineHeight: 1.6, wordBreak: 'keep-all' }}>
                한옥의 숨결과 소리를 전하는 온마루의 길잡이, 온이예요. 여정 중에 궁금한 점이 생기면 언제든 찾아주세요 👋
              </p>
            </div>
          </SurfaceCard>

          {/* 회원 탈퇴 */}
          <div style={{ textAlign: 'center', paddingTop: '8px' }}>
            {confirmingDelete ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', borderRadius: '16px', backgroundColor: `${c.error.primary}10`, border: `1px solid ${c.error.primary}30` }}>
                <p style={{ margin: 0, fontSize: '12.5px', color: c.error.primary, lineHeight: 1.5 }}>
                  정말 떠나시겠어요? 계정 정보는 즉시 삭제되며 작성하신 기록은 보존됩니다.
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    style={{ height: '32px', padding: '0 14px', borderRadius: '8px', border: 'none', backgroundColor: c.bg.card, color: c.text.secondary, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteAccount()}
                    style={{ height: '32px', padding: '0 14px', borderRadius: '8px', border: 'none', backgroundColor: c.error.primary, color: c.text.inverse, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    탈퇴확인
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                style={{ border: 'none', background: 'transparent', color: c.text.muted, fontSize: '12px', textDecoration: 'underline', cursor: 'pointer' }}
              >
                회원 탈퇴
              </button>
            )}
          </div>
        </SidebarWrapper>

        {/* RIGHT COLUMN (Content: Navigation Tabs & Collection Cards) */}
        <ContentWrapper>
          {/* 탭 필터 바 */}
          <TabContainer aria-label="기록 유형 필터">
            {[
              { id: 'ALL', label: '전체', icon: Compass01Icon, count: null },
              { id: 'TIMELINE', label: '월간 기록', icon: SparklesIcon, count: null },
              { id: 'EXPLORATION', label: '저장 여정', icon: MapPinIcon, count: savedExplorations.length },
              { id: 'JOURNEY', label: 'AI 코스', icon: SparklesIcon, count: savedJourneys.length },
              { id: 'SOUND', label: '담은 소리', icon: Music01Icon, count: savedSounds.length },
              { id: 'BOOKMARK', label: '북마크', icon: Bookmark01Icon, count: bookmarks.length },
              { id: 'COMMUNITY', label: '질문 & 온기', icon: Comment01Icon, count: journeyThreads.length + myWarmths.length + myVisitReviews.length },
            ].map((t) => (
              <TabButton
                key={t.id}
                $active={activeTab === t.id}
                $activeBg={c.action.primary}
                $activeColor={c.text.inverse}
                $inactiveColor={c.text.secondary}
                $cardBg={c.bg.surface}
                onClick={() => setActiveTab(t.id as FilterTab)}
              >
                <HugeiconsIcon icon={t.icon} size={14} />
                {t.label}
                {t.count !== null && t.count > 0 && (
                  <span style={{ fontSize: '11px', opacity: 0.85, fontWeight: 700 }}>({t.count})</span>
                )}
              </TabButton>
            ))}
          </TabContainer>

          {/* 1. 월간 여정 타임라인 */}
          {(activeTab === 'ALL' || activeTab === 'TIMELINE') && (
            <MonthlyTimeline />
          )}

          {/* 2. 저장한 여정 */}
          {(activeTab === 'ALL' || activeTab === 'EXPLORATION') && (
            <div>
              <SectionTitle $color={c.text.primary}>
                <HugeiconsIcon icon={MapPinIcon} size={18} color={c.action.primary} />
                저장한 여정 {savedExplorations.length > 0 && `(${savedExplorations.length})`}
              </SectionTitle>
              <SurfaceCard $bg={c.bg.surface}>
                {savedExplorations.length === 0 ? (
                  <EmptyState text="아직 저장한 여정이 없어요." linkHref="/" linkText="홈에서 여정 탐색하기" theme={theme} />
                ) : (
                  <div>
                    {savedExplorations.map((item) => (
                      <SavedExplorationRow
                        key={item.id}
                        item={item}
                        theme={theme}
                        onOpen={() => {
                          useJourneyStore
                            .getState()
                            .hydrateBoard(
                              item.board,
                              item.pinnedRefs,
                              { hanokDogan: [], nearbyAudio: [], nearbyFood: [] },
                              item.savedAt,
                            );
                          router.push('/');
                        }}
                        onRemove={() => {
                          removeSavedExploration(item.id);
                          toast.success(`'${item.title}' 저장을 취소했어요.`);
                        }}
                        onRename={(title) => renameSavedExploration(item.id, title)}
                      />
                    ))}
                  </div>
                )}
              </SurfaceCard>
            </div>
          )}

          {/* 3. 보관한 AI 여정 코스 */}
          {(activeTab === 'ALL' || activeTab === 'JOURNEY') && (
            <div>
              <SectionTitle $color={c.text.primary}>
                <HugeiconsIcon icon={SparklesIcon} size={18} color={c.action.primary} />
                보관한 AI 여정 코스 {savedJourneys.length > 0 && `(${savedJourneys.length})`}
              </SectionTitle>
              <SurfaceCard $bg={c.bg.surface}>
                {savedJourneys.length === 0 ? (
                  <EmptyState text="아직 보관한 맞춤 여정이 없어요." linkHref="/" linkText="홈에서 AI 여정 짓기" theme={theme} />
                ) : (
                  <div>
                    {savedJourneys.map((item) => (
                      <CardListRow key={item.id} $hoverBg={`${c.action.primary}0D`}>
                        <div
                          onClick={() => {
                            useJourneyStore.setState({ currentPlan: item.plan, hasSearched: true });
                            router.push('/');
                          }}
                          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 700, color: c.action.primary }}>
                              {item.plan.region}
                            </span>
                            {item.plan.routeCard.days && item.plan.routeCard.days.length > 1 && (
                              <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.12)', padding: '1px 8px', borderRadius: '9999px' }}>
                                {item.plan.routeCard.duration}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: c.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.plan.title}
                          </div>
                        </div>

                        <button
                          type="button"
                          aria-label={`${item.plan.title} 보관 취소`}
                          onClick={() => {
                            removeJourney(item.id);
                            toast.success(`'${item.plan.title}' 보관을 취소했어요.`);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'transparent',
                            color: c.text.muted,
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={15} />
                        </button>
                      </CardListRow>
                    ))}
                  </div>
                )}
              </SurfaceCard>
            </div>
          )}

          {/* 4. 마음에 담은 소리 */}
          {(activeTab === 'ALL' || activeTab === 'SOUND') && (
            <div>
              <SectionTitle $color={c.text.primary}>
                <HugeiconsIcon icon={Music01Icon} size={18} color={c.action.primary} />
                마음에 담은 소리 {savedSounds.length > 0 && `(${savedSounds.length})`}
              </SectionTitle>
              <SurfaceCard $bg={c.bg.surface}>
                {savedSounds.length === 0 ? (
                  <EmptyState text="소리마루에서 마음에 드는 한옥 소리를 담아보세요." linkHref="/sorimaru" linkText="소리마루 둘러보기" theme={theme} />
                ) : (
                  <div>
                    {savedSounds.map((sound) => (
                      <CardListRow key={sound.storyId} $hoverBg={`${c.action.primary}0D`}>
                        {sound.imageUrl ? (
                          <img
                            src={sound.imageUrl}
                            alt=""
                            style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '10px',
                              backgroundColor: c.bg.card,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <HugeiconsIcon icon={Music01Icon} size={18} color={c.text.muted} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: c.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {sound.title}
                          </div>
                          {sound.region.name && (
                            <div style={{ fontSize: '12px', color: c.text.muted, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <HugeiconsIcon icon={MapPinIcon} size={11} />
                              {sound.region.name}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          aria-label={`${sound.title} 마음 담기 취소`}
                          onClick={() => {
                            removeSavedSound(sound.storyId);
                            toast.success(`'${sound.title}' 소리를 목록에서 제거했어요.`);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'transparent',
                            color: c.text.muted,
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={15} />
                        </button>
                      </CardListRow>
                    ))}
                  </div>
                )}
              </SurfaceCard>
            </div>
          )}

          {/* 5. 북마크한 장소 */}
          {(activeTab === 'ALL' || activeTab === 'BOOKMARK') && (
            <div>
              <SectionTitle $color={c.text.primary}>
                <HugeiconsIcon icon={Bookmark01Icon} size={18} color={c.action.primary} />
                북마크한 장소 {bookmarks.length > 0 && `(${bookmarks.length})`}
              </SectionTitle>
              <SurfaceCard $bg={c.bg.surface}>
                {bookmarks.length === 0 ? (
                  <EmptyState text="아직 북마크한 한옥 장소가 없어요." linkHref="/map" linkText="지도에서 장소 둘러보기" theme={theme} />
                ) : (
                  <div>
                    {bookmarks.map((place) => (
                      <CardListRow key={place.id} $hoverBg={`${c.action.primary}0D`}>
                        <HugeiconsIcon icon={Bookmark01Icon} size={18} color={c.action.primary} fill={c.action.primary} />
                        <Link
                          href="/map"
                          style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}
                        >
                          <div style={{ fontSize: '14px', fontWeight: 700, color: c.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {place.name}
                          </div>
                          {place.addr && (
                            <div style={{ fontSize: '12px', color: c.text.muted, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <HugeiconsIcon icon={MapPinIcon} size={11} />
                              {place.addr}
                            </div>
                          )}
                        </Link>
                        <HugeiconsIcon icon={ChevronRightIcon} size={16} color={c.text.muted} />
                        <button
                          type="button"
                          aria-label={`${place.name} 북마크 삭제`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeBookmark(place.id);
                            toast.success(`'${place.name}' 북마크를 삭제했어요.`);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'transparent',
                            color: c.text.muted,
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={15} />
                        </button>
                      </CardListRow>
                    ))}
                  </div>
                )}
              </SurfaceCard>
            </div>
          )}

          {/* 6. 질문 & 커뮤니티 (질문 기록, 방문후기, 온기) */}
          {(activeTab === 'ALL' || activeTab === 'COMMUNITY') && (
            <>
              {/* 질문 기록 */}
              <div>
                <SectionTitle $color={c.text.primary}>
                  <HugeiconsIcon icon={Comment01Icon} size={18} color={c.action.primary} />
                  내 질문 기록 {journeyThreads.length > 0 && `(${journeyThreads.length})`}
                </SectionTitle>
                <SurfaceCard $bg={c.bg.surface}>
                  {journeyThreads.length === 0 ? (
                    <EmptyState text="아직 생성한 질문 기록이 없어요." linkHref="/" linkText="홈에서 여정 만들기" theme={theme} />
                  ) : (
                    <div>
                      {journeyThreads.map((thread) => (
                        <CardListRow key={thread.threadId} $hoverBg={`${c.action.primary}0D`} style={{ cursor: 'pointer' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: c.text.primary, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {thread.title}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: c.text.muted, marginLeft: '8px', flexShrink: 0 }}>
                                대화 {thread.turnCount}회
                              </span>
                            </div>
                            <div style={{ fontSize: '12.5px', color: c.text.secondary, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {thread.lastQuery}
                            </div>
                            <div style={{ fontSize: '11.5px', color: c.text.muted }}>
                              {formatRelativeTime(thread.updatedAt)}
                            </div>
                          </div>
                        </CardListRow>
                      ))}
                    </div>
                  )}
                </SurfaceCard>
              </div>

              {/* 내 방문후기 & 온기 한줄평 */}
              <div>
                <SectionTitle $color={c.text.primary}>
                  <HugeiconsIcon icon={FlameIcon} size={18} color={c.action.primary} />
                  내가 남긴 방문후기 & 온기
                </SectionTitle>
                <SurfaceCard $bg={c.bg.surface}>
                  {myVisitReviews.length === 0 && myWarmths.length === 0 ? (
                    <EmptyState text="아직 남긴 방문후기나 온기가 없어요." linkHref="/map" linkText="지도에서 후기 남기기" theme={theme} />
                  ) : (
                    <div>
                      {myVisitReviews.map((review) => (
                        <CardListRow key={review.id} $hoverBg={`${c.action.primary}0D`}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: c.text.primary }}>{review.placeName}</span>
                              <span style={{ fontSize: '11.5px', color: c.action.primary, display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
                                <HugeiconsIcon icon={HeartIcon} size={12} fill={c.action.primary} color={c.action.primary} />
                                {review.likeCount}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '13.5px', color: c.text.secondary, lineHeight: 1.5 }}>{review.text}</p>
                            <div style={{ marginTop: '6px', fontSize: '11.5px', color: c.text.muted }}>
                              방문후기 · {formatRelativeTime(review.createdAt)}
                            </div>
                          </div>
                        </CardListRow>
                      ))}

                      {myWarmths.map((w) => {
                        const moodColor = w.mood === '북적' ? c.action : c.success;
                        return (
                          <CardListRow key={w.id} $hoverBg={`${c.action.primary}0D`}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: c.text.primary }}>{w.placeName}</span>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    color: moodColor.primary,
                                    backgroundColor: moodColor.primaryBg,
                                  }}
                                >
                                  <HugeiconsIcon icon={FlameIcon} size={11} style={{ verticalAlign: '-1px', marginRight: '2px' }} />
                                  {w.mood}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '13.5px', color: c.text.secondary, lineHeight: 1.5 }}>{w.text}</p>
                              <div style={{ marginTop: '6px', fontSize: '11.5px', color: c.text.muted }}>
                                온기 한줄평 · {formatRelativeTime(w.createdAt)}
                              </div>
                            </div>
                          </CardListRow>
                        );
                      })}
                    </div>
                  )}
                </SurfaceCard>
              </div>
            </>
          )}
        </ContentWrapper>
      </MainGrid>
    </PageContainer>
  );
}

/* -------------------------------------------------------------------------- */
/* HELPER SUB-COMPONENTS                                                      */
/* -------------------------------------------------------------------------- */

function SavedExplorationRow({
  item,
  theme,
  onOpen,
  onRemove,
  onRename,
}: {
  item: SavedJourneyDetail;
  theme: OnmaruTheme;
  onOpen: () => void;
  onRemove: () => void;
  onRename: (title: string) => void;
}) {
  const c = theme.colors;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(item.title);

  function commitRename() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== item.title) onRename(trimmed);
    setIsEditing(false);
  }

  return (
    <CardListRow $hoverBg={`${c.action.primary}0D`}>
      {isEditing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            commitRename();
          }}
          style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: '14px',
              fontWeight: 700,
              color: c.text.primary,
              border: 'none',
              borderRadius: '8px',
              padding: '6px 10px',
              background: c.bg.app,
              outline: 'none',
              boxShadow: `0 0 0 2px ${c.action.primary}`,
            }}
          />
          <button
            type="submit"
            aria-label="이름 저장"
            style={{ display: 'flex', border: 'none', background: 'transparent', color: c.success.primary, cursor: 'pointer', flexShrink: 0 }}
          >
            <HugeiconsIcon icon={CheckIcon} size={18} />
          </button>
        </form>
      ) : (
        <div onClick={onOpen} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: c.action.primary, marginBottom: '3px' }}>
            후보 {item.board.candidates.length}곳 탐색 완료
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: c.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.title}
          </div>
        </div>
      )}

      {!isEditing && (
        <button
          type="button"
          aria-label={`${item.title} 이름 수정`}
          onClick={() => {
            setDraft(item.title);
            setIsEditing(true);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: c.text.muted,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <HugeiconsIcon icon={PenLineIcon} size={14} />
        </button>
      )}

      <button
        type="button"
        aria-label={`${item.title} 저장 취소`}
        onClick={onRemove}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: 'none',
          background: 'transparent',
          color: c.text.muted,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <HugeiconsIcon icon={Cancel01Icon} size={15} />
      </button>
    </CardListRow>
  );
}

function EmptyState({ text, linkHref, linkText, theme }: { text: string; linkHref: string; linkText: string; theme: OnmaruTheme }) {
  const c = theme.colors;
  return (
    <div style={{ padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px' }}>
      <p style={{ margin: 0, fontSize: '14px', color: c.text.muted }}>{text}</p>
      <Link href={linkHref} style={{ fontSize: '13px', fontWeight: 700, color: c.action.primary, textDecoration: 'none' }}>
        {linkText} →
      </Link>
    </div>
  );
}
