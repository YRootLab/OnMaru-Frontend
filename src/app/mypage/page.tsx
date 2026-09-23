'use client';

// ============================================================
// 마이페이지 — 로그인 완료 확인 + 내 활동 (src/app/mypage/page.tsx)
// ============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Bookmark, Flame, ChevronRight, MapPin, X, Compass, Sparkles, Heart, Music, PenLine, Check } from 'lucide-react';
import type { SavedJourneyDetail } from '@/features/journey-curator/types/exploration.types';
import { useAuth } from '@/features/auth';
import { useBookmarkStore } from '@/features/map/hooks/useBookmarkStore';
import { loadWarmth, filterWarmth } from '@/features/map/warmth/warmthRepo';
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

export default function MyPage() {
  const router = useRouter();
  const { theme } = useOnmaruTheme();
  const { user, isLoading, isLoggedIn, logout, deleteAccount } = useAuth();
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);
  const [myWarmths, setMyWarmths] = useState<Warmth[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
    setMyWarmths(filterWarmth(loadWarmth(), 'mine'));
  }, []);

  if (isLoading || !user) return null;

  const c = theme.colors;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 20px' }}>
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* 프로필 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: c.action.primaryBg,
              color: c.action.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 800,
            }}
          >
            {user.displayName.slice(0, 1)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: c.success.primary }}>
              카카오 로그인 완료
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: c.text.primary }}>
              {user.displayName}님, 환영합니다
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            style={{
              height: '36px',
              padding: '0 18px',
              borderRadius: '8px',
              border: `1px solid ${c.border.subtle}`,
              backgroundColor: c.bg.card,
              color: c.text.secondary,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            로그아웃
          </button>
        </div>

        {/* 화면 모드 */}
        <SectionRow title="화면 모드" theme={theme}>
          <ThemeModeSwitch />
        </SectionRow>

        <MonthlyTimeline />

        {/* 저장한 여정 (이야기길 — 실데이터 board) */}
        <Section title={`저장한 여정 ${savedExplorations.length > 0 ? `(${savedExplorations.length})` : ''}`} theme={theme}>
          {savedExplorations.length === 0 ? (
            <EmptyState text="아직 저장한 여정이 없어요." linkHref="/" linkText="홈에서 여정 찾기" theme={theme} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

        {/* 보관한 AI 여정 코스 (옛 계약) */}
        <Section title={`보관한 AI 여정 코스 ${savedJourneys.length > 0 ? `(${savedJourneys.length})` : ''}`} theme={theme}>
          {savedJourneys.length === 0 ? (
            <EmptyState text="아직 보관한 맞춤 여정이 없어요." linkHref="/" linkText="홈에서 여정 짓기" theme={theme} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {savedJourneys.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: c.bg.surface,
                    gap: '10px',
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

        {/* 마음에 담은 소리 */}
        <Section title={`마음에 담은 소리 ${savedSounds.length > 0 ? `(${savedSounds.length})` : ''}`} theme={theme}>
          {savedSounds.length === 0 ? (
            <EmptyState text="소리마루에서 마음에 드는 소리를 담아보세요." linkHref="/sorimaru" linkText="소리마루 둘러보기" theme={theme} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {savedSounds.map((sound) => (
                <div
                  key={sound.stid || sound.title}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: c.bg.surface,
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
                    {sound.locationName && (
                      <div style={{ fontSize: '11.5px', color: c.text.muted, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                        <MapPin size={10} />
                        {sound.locationName}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={`${sound.title} 마음 담기 취소`}
                    onClick={() => {
                      removeSavedSound(sound.stid);
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

        {/* 북마크한 장소 */}
        <Section title={`북마크한 장소 ${bookmarks.length > 0 ? `(${bookmarks.length})` : ''}`} theme={theme}>
          {bookmarks.length === 0 ? (
            <EmptyState text="아직 북마크한 장소가 없어요." linkHref="/map" linkText="지도에서 장소 둘러보기" theme={theme} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {bookmarks.map((place) => (
                <Link
                  key={place.id}
                  href="/map"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: c.bg.surface,
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

        {/* 내가 남긴 온기 */}
        <Section title={`내가 남긴 온기 ${myWarmths.length > 0 ? `(${myWarmths.length})` : ''}`} theme={theme}>
          {myWarmths.length === 0 ? (
            <EmptyState text="아직 남긴 온기 한줄평이 없어요." linkHref="/map" linkText="온기 남기러 가기" theme={theme} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myWarmths.map((w) => {
                const moodColor = w.mood === '북적' ? c.action : c.success;
                return (
                  <div key={w.id} style={{ padding: '14px', borderRadius: '12px', backgroundColor: c.bg.surface }}>
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

        {/* 회원 탈퇴 */}
        <div style={{ textAlign: 'center', borderTop: `1px solid ${c.border.subtle}`, paddingTop: '20px' }}>
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
                    border: `1px solid ${c.border.subtle}`,
                    backgroundColor: c.bg.card,
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
        padding: '12px 14px',
        borderRadius: '12px',
        backgroundColor: c.bg.surface,
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
              border: `1px solid ${c.border.subtle}`,
              borderRadius: '6px',
              padding: '4px 8px',
              background: c.bg.card,
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: theme.colors.text.primary }}>{title}</h2>
      {children}
    </div>
  );
}

function SectionRow({ title, theme, children }: { title: string; theme: OnmaruTheme; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: theme.colors.text.primary }}>{title}</h2>
      {children}
    </div>
  );
}

function EmptyState({ text, linkHref, linkText, theme }: { text: string; linkHref: string; linkText: string; theme: OnmaruTheme }) {
  return (
    <div
      style={{
        padding: '24px 16px',
        borderRadius: '12px',
        backgroundColor: theme.colors.bg.surface,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <p style={{ margin: 0, fontSize: '13px', color: theme.colors.text.muted }}>{text}</p>
      <Link href={linkHref} style={{ fontSize: '12.5px', fontWeight: 600, color: theme.colors.action.primary }}>
        {linkText} →
      </Link>
    </div>
  );
}
