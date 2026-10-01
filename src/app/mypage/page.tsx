'use client';


import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Bookmark, Flame, ChevronRight, MapPin, X, Compass, Sparkles, Heart, Music, PenLine, Check } from 'lucide-react';
import type { SavedJourneyDetail } from '@/features/journey-curator/types/exploration.types';
import { useAuth } from '@/features/auth';
import { useBookmarkStore } from '@/features/map/hooks/useBookmarkStore';
import { loadWarmth } from '@/features/map/warmth/warmthRepo';
import { formatRelativeTime } from '@/features/map/utils/formatters';
import type { Warmth } from '@/features/map/types';
import { ThemeModeSwitch } from '@/design-system/components';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import type { OnmaruTheme } from '@/design-system/tokens';
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

export default function MyPage() {
  const router = useRouter();
  const { theme } = useOnmaruTheme();
  const { user, isLoading, isLoggedIn, logout, deleteAccount } = useAuth();
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);
  const [myWarmths, setMyWarmths] = useState<Warmth[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [oniVideoError, setOniVideoError] = useState(false);

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

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 20px' }}>
      <style>{`@keyframes mp-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}.mp-skel{background:linear-gradient(90deg,#f0f0ee 25%,#e5e5e3 50%,#f0f0ee 75%);background-size:200% 100%;animation:mp-shimmer 1.6s ease-in-out infinite;border-radius:8px}[data-theme=dark] .mp-skel{background:linear-gradient(90deg,#2d2a26 25%,#3a3730 50%,#2d2a26 75%);background-size:200% 100%}`}</style>
      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div className="mp-skel" style={{ width: 64, height: 64, borderRadius: '50%' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
            <div className="mp-skel" style={{ width: 120, height: 14 }} />
            <div className="mp-skel" style={{ width: 200, height: 22 }} />
          </div>
          <div className="mp-skel" style={{ width: 80, height: 36, borderRadius: 8 }} />
        </div>
        {[180, 120, 200].map((h, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="mp-skel" style={{ width: 100, height: 18 }} />
            <div className="mp-skel" style={{ width: '100%', height: h, borderRadius: 12 }} />
          </div>
        ))}
      </div>
    </div>
  );

  if (!user) return null;

  const c = theme.colors;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 16px 80px' }}>
      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <div style={{ backgroundColor: c.bg.surface, borderRadius: '20px', padding: '36px 28px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: c.action.primaryBg,
              color: c.action.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 800,
            }}
          >
            {(user.displayName || '길')[0]}
          </div>

          <div style={{ marginTop: '16px', fontSize: '26px', fontWeight: 800, color: c.text.primary, letterSpacing: '-0.025em' }}>
            {user.displayName || '길손'}님
          </div>

          <div style={{ display: 'flex', width: '100%', marginTop: '24px', borderRadius: '14px', backgroundColor: c.bg.card, overflow: 'hidden' }}>
            {[
              { label: '저장 여정', value: savedExplorations.length },
              { label: '북마크', value: bookmarks.length },
              { label: '담은 소리', value: savedSounds.length },
            ].map((stat, i) => (
              <div key={stat.label} style={{ flex: 1, padding: '16px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: c.text.primary, letterSpacing: '-0.02em' }}>{stat.value}</div>
                <div style={{ fontSize: '11.5px', color: c.text.muted, marginTop: '3px', fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={logout}
            style={{
              marginTop: '20px',
              height: '36px',
              padding: '0 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: c.bg.card,
              color: c.text.secondary,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${c.action.primary}`; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            로그아웃
          </button>
        </div>

        {}
        <SectionRow title="화면 모드" theme={theme}>
          <ThemeModeSwitch />
        </SectionRow>

        <MonthlyTimeline />

        {}
        <Section title={`저장한 여정 ${savedExplorations.length > 0 ? `(${savedExplorations.length})` : ''}`} theme={theme}>
          {savedExplorations.length === 0 ? (
            <EmptyState text="아직 저장한 여정이 없어요." linkHref="/" linkText="홈에서 여정 찾기" theme={theme} />
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
        </Section>

        {}
        <Section title={`보관한 AI 여정 코스 ${savedJourneys.length > 0 ? `(${savedJourneys.length})` : ''}`} theme={theme}>
          {savedJourneys.length === 0 ? (
            <EmptyState text="아직 보관한 맞춤 여정이 없어요." linkHref="/" linkText="홈에서 여정 짓기" theme={theme} />
          ) : (
            <div>
              {savedJourneys.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '60px',
                    padding: '14px 20px',
                    gap: '12px',
                  }}
                >
                  <div
                    onClick={() => {
                      useJourneyStore.setState({ currentPlan: item.plan, hasSearched: true });
                      router.push('/');
                    }}
                    style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: c.action.primary }}>
                        {item.plan.region}
                      </span>
                      {item.plan.routeCard.days && item.plan.routeCard.days.length > 1 && (
                        <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '1px 6px', borderRadius: '9999px' }}>
                          {item.plan.routeCard.duration}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: c.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'transparent',
                      color: c.text.muted,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {}
        <Section title={`마음에 담은 소리 ${savedSounds.length > 0 ? `(${savedSounds.length})` : ''}`} theme={theme}>
          {savedSounds.length === 0 ? (
            <EmptyState text="소리마루에서 마음에 드는 소리를 담아보세요." linkHref="/sorimaru" linkText="소리마루 둘러보기" theme={theme} />
          ) : (
            <div>
              {savedSounds.map((sound) => (
                <div
                  key={sound.storyId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    minHeight: '64px',
                    padding: '12px 20px',
                  }}
                >
                  {sound.imageUrl ? (
                    <img
                      src={sound.imageUrl}
                      alt=""
                      style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: c.bg.card,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Music size={16} color={c.text.muted} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: c.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sound.title}
                    </div>
                    {sound.region.name && (
                      <div style={{ fontSize: '11.5px', color: c.text.muted, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                        <MapPin size={10} />
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
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'transparent',
                      color: c.text.muted,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {}
        <Section title={`북마크한 장소 ${bookmarks.length > 0 ? `(${bookmarks.length})` : ''}`} theme={theme}>
          {bookmarks.length === 0 ? (
            <EmptyState text="아직 북마크한 장소가 없어요." linkHref="/map" linkText="지도에서 장소 둘러보기" theme={theme} />
          ) : (
            <div>
              {bookmarks.map((place) => (
                <Link
                  key={place.id}
                  href="/map"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    minHeight: '64px',
                    padding: '12px 20px',
                    textDecoration: 'none',
                  }}
                >
                  <Bookmark size={16} color={c.action.primary} fill={c.action.primary} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: c.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {place.name}
                    </div>
                    {place.addr && (
                      <div style={{ fontSize: '12px', color: c.text.muted, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={11} />
                        {place.addr}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} color={c.text.muted} />
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
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'transparent',
                      color: c.text.muted,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <X size={14} />
                  </button>
                </Link>
              ))}
            </div>
          )}
        </Section>

        {}
        <Section title={`내 질문 기록 ${journeyThreads.length > 0 ? `(${journeyThreads.length})` : ''}`} theme={theme}>
          {journeyThreads.length === 0 ? (
            <EmptyState text="아직 질문 기록이 없어요." linkHref="/" linkText="홈에서 여정 만들기" theme={theme} />
          ) : (
            <div>
              {journeyThreads.map((thread) => (
                <div
                  key={thread.threadId}
                  style={{
                    padding: '14px 20px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.backgroundColor = `${c.action.primaryBg}`)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: c.text.primary, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {thread.title}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: c.text.muted, marginLeft: '8px', flexShrink: 0 }}>
                      {thread.turnCount}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: c.text.muted, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {thread.lastQuery}
                  </div>
                  <div style={{ fontSize: '11px', color: c.text.muted }}>
                    {formatRelativeTime(thread.updatedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {}
        <Section title={`저장한 장소 ${savedPlaces.length > 0 ? `(${savedPlaces.length})` : ''}`} theme={theme}>
          {savedPlaces.length === 0 ? (
            <EmptyState text="아직 저장한 장소가 없어요." linkHref="/map" linkText="지도에서 장소 둘러보기" theme={theme} />
          ) : (
            <div>
              {savedPlaces.map((place) => (
                <div
                  key={place.resourceId}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    minHeight: '64px',
                    padding: '12px 20px',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.backgroundColor = `${c.action.primaryBg}`)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent')}
                >
                  {place.thumbnailUrl ? (
                    <img
                      src={place.thumbnailUrl}
                      alt=""
                      style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: c.bg.card,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <MapPin size={16} color={c.text.muted} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: c.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {place.name}
                    </div>
                    {place.regionName && (
                      <div style={{ fontSize: '11.5px', color: c.text.muted, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                        <MapPin size={10} />
                        {place.regionName}
                      </div>
                    )}
                    {place.category && (
                      <div style={{ fontSize: '11px', color: c.text.muted, marginTop: '2px' }}>
                        {place.category}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {}
        <Section title={`내 방문후기 ${myVisitReviews.length > 0 ? `(${myVisitReviews.length})` : ''}`} theme={theme}>
          {myVisitReviews.length === 0 ? (
            <EmptyState text="아직 남긴 방문후기가 없어요." linkHref="/map" linkText="지도에서 후기 남기기" theme={theme} />
          ) : (
            <div>
              {myVisitReviews.map((review) => (
                <div key={review.id} style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: c.text.primary }}>{review.placeName}</span>
                    <span style={{ fontSize: '11px', color: c.text.muted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Heart size={11} fill={c.action.primary} color={c.action.primary} />
                      {review.likeCount}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: c.text.secondary, lineHeight: 1.5 }}>{review.text}</p>
                  <div style={{ marginTop: '8px', fontSize: '11.5px', color: c.text.muted }}>
                    {formatRelativeTime(review.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {}
        <Section title={`내가 남긴 온기 ${myWarmths.length > 0 ? `(${myWarmths.length})` : ''}`} theme={theme}>
          {myWarmths.length === 0 ? (
            <EmptyState text="아직 남긴 온기 한줄평이 없어요." linkHref="/map" linkText="온기 남기러 가기" theme={theme} />
          ) : (
            <div>
              {myWarmths.map((w) => {
                const moodColor = w.mood === '북적' ? c.action : c.success;
                return (
                  <div key={w.id} style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: c.text.primary }}>{w.placeName}</span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '9999px',
                          color: moodColor.primary,
                          backgroundColor: moodColor.primaryBg,
                        }}
                      >
                        <Flame size={10} style={{ verticalAlign: '-1px', marginRight: '2px' }} />
                        {w.mood}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13.5px', color: c.text.secondary, lineHeight: 1.5 }}>{w.text}</p>
                    <div style={{ marginTop: '8px', fontSize: '11.5px', color: c.text.muted }}>
                      {formatRelativeTime(w.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* 온이 캐릭터 소개 */}
        <div style={{ backgroundColor: c.bg.surface, borderRadius: '20px', padding: '40px 28px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center' }}>
          <div style={{ width: '180px', height: '180px', flexShrink: 0 }}>
            {oniVideoError ? (
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
          <div style={{ fontSize: '22px', fontWeight: 800, color: c.text.primary, marginBottom: '10px', marginTop: '8px', letterSpacing: '-0.025em' }}>온이</div>
          <p style={{ margin: 0, fontSize: '14px', color: c.text.secondary, lineHeight: 1.8, maxWidth: '300px' }}>
            온마루의 마스코트예요. 한옥의 숨결과<br />
            소리를 함께 잇고 싶어 오늘도<br />
            이렇게 반갑게 인사한답니다 👋
          </p>
        </div>

        <div style={{ textAlign: 'center', paddingBottom: '24px' }}>
          {confirmingDelete ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: c.error.primary }}>
                정말 탈퇴하시겠어요? 북마크·온기 기록은 남지만 로그인 정보는 삭제돼요.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  style={{
                    height: '34px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: c.bg.surface,
                    color: c.text.secondary,
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => void deleteAccount()}
                  style={{
                    height: '34px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: c.error.primary,
                    color: c.text.inverse,
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  탈퇴할게요
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              style={{
                border: 'none',
                background: 'transparent',
                color: c.text.muted,
                fontSize: '12.5px',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              회원 탈퇴
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '60px',
        padding: '12px 20px',
        gap: '10px',
      }}
    >
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
              fontSize: '13.5px',
              fontWeight: 700,
              color: c.text.primary,
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              background: c.bg.surface,
              outline: 'none',
              boxShadow: `0 0 0 2px ${c.action.primary}40`,
            }}
          />
          <button
            type="submit"
            aria-label="이름 저장"
            style={{ display: 'flex', border: 'none', background: 'transparent', color: c.success.primary, cursor: 'pointer', flexShrink: 0 }}
          >
            <Check size={16} />
          </button>
        </form>
      ) : (
        <div onClick={onOpen} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: c.action.primary, marginBottom: '3px' }}>
            후보 {item.board.candidates.length}곳
          </div>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: c.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: c.text.muted,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <PenLine size={13} />
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
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          border: 'none',
          background: 'transparent',
          color: c.text.muted,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function Section({ title, theme, children }: { title: string; theme: OnmaruTheme; children: React.ReactNode }) {
  const c = theme.colors;
  return (
    <div>
      <h2 style={{ margin: '0 0 10px 4px', fontSize: '14px', fontWeight: 700, color: c.text.primary, letterSpacing: '-0.01em' }}>{title}</h2>
      <div style={{ backgroundColor: c.bg.surface, borderRadius: '16px', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function SectionRow({ title, theme, children }: { title: string; theme: OnmaruTheme; children: React.ReactNode }) {
  const c = theme.colors;
  return (
    <div style={{ backgroundColor: c.bg.surface, borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: '60px', padding: '0 20px' }}>
        <h2 style={{ margin: 0, flex: 1, fontSize: '15px', fontWeight: 600, color: c.text.primary, letterSpacing: '-0.01em' }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function EmptyState({ text, linkHref, linkText, theme }: { text: string; linkHref: string; linkText: string; theme: OnmaruTheme }) {
  const c = theme.colors;
  return (
    <div style={{ padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ margin: 0, fontSize: '14px', color: c.text.muted }}>{text}</p>
      <Link href={linkHref} style={{ fontSize: '13px', fontWeight: 600, color: c.action.primary, textDecoration: 'none' }}>
        {linkText}
      </Link>
    </div>
  );
}
