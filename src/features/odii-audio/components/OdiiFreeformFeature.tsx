'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { LocalMiniPlayer } from './LocalMiniPlayer';
import { SavedSoundDrawer } from './SavedSoundDrawer';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { OdiiStoryItem, IOdiiApiService } from '../types/odii.types';
import { useOdiiApiService } from '../context/OdiiDependencyContext';

interface OdiiFreeformFeatureProps {
  apiService?: IOdiiApiService;
}

const TOPICS = [
  { keyword: '한옥', label: '#한옥', note: '나무와 종이가 호흡하는 집' },
  { keyword: '시장', label: '#시장', note: '사람 사이로 흐르는 온기' },
  { keyword: '골목', label: '#골목', note: '발끝으로 읽는 동네의 시간' },
  { keyword: '궁', label: '#궁궐', note: '오래된 권위가 남긴 장면' },
  { keyword: '소리', label: '#소리', note: '장소보다 먼저 도착하는 것' },
  { keyword: '길', label: '#길', note: '천천히 걷게 하는 풍경' },
];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=1200&q=82';

function excerpt(script = ''): string {
  const text = script.split(/\r?\n/).find((line) => line.trim())?.trim() || '장소에 머무는 시간을 소리로 만나보세요.';
  return text.length > 90 ? `${text.slice(0, 89)}…` : text;
}

function uniqueStories(stories: OdiiStoryItem[]): OdiiStoryItem[] {
  const seen = new Set<string>();
  return stories.filter((story) => {
    if (!story.stid || seen.has(story.stid)) return false;
    seen.add(story.stid);
    return true;
  });
}

function storyMatchesTopic(story: OdiiStoryItem, keyword: string): boolean {
  return [story.category, story.title, story.audioTitle, story.locationName, story.script]
    .filter(Boolean)
    .join(' ')
    .includes(keyword);
}

function PlayGlyph({ playing = false }: { playing?: boolean }) {
  return playing ? (
    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" /></svg>
  ) : (
    <svg className="ml-0.5 h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
  );
}

const placeholderStory: OdiiStoryItem = {
  tid: '',
  tlid: '',
  stid: '',
  stlid: '',
  title: '한국의 문화유산',
  audioTitle: '오디오로 걷는 고택 산책',
  speaker: '문화해설사',
  category: '한옥',
  mapX: '126.9780',
  mapY: '37.5665',
  script: '장소에 머무는 시간을 소리로 만나보세요.',
  playTime: '300',
  audioUrl: '',
  imageUrl: FALLBACK_IMAGE,
};

export const OdiiFreeformFeature: React.FC<OdiiFreeformFeatureProps> = ({ apiService }) => {
  const activeApiService = useOdiiApiService(apiService);
  const [storyPool, setStoryPool] = useState<OdiiStoryItem[]>([]);
  const [topicStories, setTopicStories] = useState<OdiiStoryItem[]>([]);
  const [nearbyStories, setNearbyStories] = useState<OdiiStoryItem[]>([]);
  const [activeTopic, setActiveTopic] = useState('한옥');
  const [activeIndex, setActiveIndex] = useState(0);
  const [nearbyIndex, setNearbyIndex] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locationMessage, setLocationMessage] = useState('내 위치를 허용하면 가까운 이야기를 먼저 보여드려요.');
  const [savedStories, setSavedStories] = useState<OdiiStoryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('onmaru_saved_odii_stories');
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const currentStory = useOdiiAudioStore((state) => state.currentStory);
  const isPlaying = useOdiiAudioStore((state) => state.isPlaying);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useOdiiAudioStore((state) => state.setIsPlaying);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      activeApiService.getStoryPage('전체', '', 1, 24),
      activeApiService.getNearbyStories(),
    ]).then(([page, nearby]) => {
      if (!isMounted) return;
      if (page.items.length) setStoryPool(uniqueStories(page.items));
      if (nearby.length) setNearbyStories(uniqueStories(nearby).slice(0, 6));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadTopic() {
      const localMatches = storyPool.filter((story) => storyMatchesTopic(story, activeTopic));
      const remoteStories = await activeApiService.getStoryList(undefined, activeTopic);
      const nextStories = uniqueStories([
        ...(remoteStories.length ? remoteStories : localMatches),
        ...storyPool,
      ]).filter((story) => story.audioUrl);

      if (isMounted) setTopicStories(nextStories.slice(0, 6));
    }

    loadTopic();
    return () => {
      isMounted = false;
    };
  }, [activeTopic, storyPool]);

  const safeActiveIndex = Math.min(activeIndex, Math.max(topicStories.length - 1, 0));
  const activeStory = topicStories[safeActiveIndex] || topicStories[0] || placeholderStory;
  const activeTopicMeta = TOPICS.find((topic) => topic.keyword === activeTopic) || TOPICS[0];
  const savedIds = useMemo(() => new Set(savedStories.map((story) => story.stid)), [savedStories]);
  const archiveStories = useMemo(() => uniqueStories(storyPool), [storyPool]);
  const safeNearbyIndex = Math.min(nearbyIndex, Math.max(nearbyStories.length - 1, 0));
  const nearbyStory = nearbyStories[safeNearbyIndex] || nearbyStories[0] || placeholderStory;
  const isActivePlaying = currentStory.stid === activeStory.stid && isPlaying;
  const isNearbyPlaying = currentStory.stid === nearbyStory.stid && isPlaying;

  const playStory = (story: OdiiStoryItem) => {
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  const toggleBookmark = (story: OdiiStoryItem) => {
    setSavedStories((previous) => {
      const next = previous.some((saved) => saved.stid === story.stid)
        ? previous.filter((saved) => saved.stid !== story.stid)
        : [story, ...previous];
      try {
        localStorage.setItem('onmaru_saved_odii_stories', JSON.stringify(next));
      } catch {
        // 저장소를 사용할 수 없는 환경에서도 현재 화면은 유지합니다.
      }
      return next;
    });
  };

  const removeBookmark = (storyId: string) => {
    setSavedStories((previous) => {
      const next = previous.filter((story) => story.stid !== storyId);
      try {
        localStorage.setItem('onmaru_saved_odii_stories', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setLocationMessage('이 브라우저에서는 위치를 사용할 수 없어요. 전국의 이야기를 보여드릴게요.');
      return;
    }

    setIsLocating(true);
    setLocationMessage('지금 있는 곳을 살펴보는 중…');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const stories = await activeApiService.getNearbyStories(String(coords.longitude), String(coords.latitude));
        if (stories.length) {
          setNearbyStories(uniqueStories(stories).slice(0, 6));
          setLocationMessage(`${stories.length}개의 이야기가 가까이에 있어요.`);
        } else {
          setLocationMessage('아직 가까운 이야기가 없어요. 전국의 장면을 먼저 둘러보세요.');
        }
        setIsLocating(false);
      },
      () => {
        setLocationMessage('위치를 확인하지 못했어요. 전국의 장면을 먼저 둘러보세요.');
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  const moveNearby = (direction: number) => {
    if (!nearbyStories.length) return;
    setNearbyIndex((previous) => (previous + direction + nearbyStories.length) % nearbyStories.length);
  };

  const reloadArchive = async () => {
    setIsRefreshing(true);
    try {
      const page = await activeApiService.getStoryPage('전체', '', 1, 24);
      setStoryPool(uniqueStories(page.items));
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="odii-free relative min-h-screen overflow-hidden bg-[#e9e9e3] text-[#171717] selection:bg-[#2454ff] selection:text-white">
      <div className="pointer-events-none absolute left-[7%] top-24 h-36 w-36 rounded-full bg-[#d5f05a] mix-blend-multiply blur-[1px] sm:h-56 sm:w-56" aria-hidden="true" />
      <div className="pointer-events-none absolute right-[-8%] top-[30rem] h-64 w-64 rounded-full bg-[#2454ff] opacity-90 mix-blend-multiply sm:h-[30rem] sm:w-[30rem]" aria-hidden="true" />

      <div className="relative z-10 w-full">
        <header className="border-b-2 border-[#171717]">
          <div className="flex min-h-14 items-center justify-between gap-4 text-[10px] font-semibold uppercase tracking-[0.16em]">
            <Link href="/odii" className="shrink-0 transition-colors hover:text-[#2454ff]">ONMARU / ODII</Link>
            <span className="hidden sm:block">Field notes for a slower Korea</span>
            <Link href="/odii" className="shrink-0 border-b border-[#171717] pb-0.5 normal-case tracking-normal transition-colors hover:border-[#2454ff] hover:text-[#2454ff]">
              기존 버전 보기 ↗
            </Link>
          </div>
        </header>

        <main>
          <section className="relative grid gap-10 border-b-2 border-[#171717] py-14 sm:py-20 lg:grid-cols-[minmax(0,1.12fr)_minmax(300px,0.88fr)] lg:gap-16 lg:py-24">
            <div className="relative z-10">
              <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.22em] text-[#2454ff]">AUDIO TRAVEL / 01</p>
              <h1 className="max-w-4xl font-odii-sans text-[clamp(3.5rem,9vw,8.8rem)] font-black leading-[0.83] tracking-[-0.09em]">
                한국의<br />
                <span className="relative inline-block text-[#2454ff]">
                  장면
                  <span className="absolute -right-3 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#f45b3d] sm:-right-5 sm:h-5 sm:w-5" />
                </span>을
                <br />귀로 걷는 중
              </h1>
              <p className="mt-8 max-w-md text-sm leading-7 text-[#4d4d49] sm:text-base">
                장소를 검색하기 전에, 마음이 먼저 반응하는 단어를 골라보세요.
                한 줄의 소리가 다음 산책의 방향을 바꿀 수도 있으니까요.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#listen" className="inline-flex items-center gap-3 bg-[#171717] px-5 py-3 text-xs font-bold text-[#d5f05a] transition-transform hover:-translate-y-1">
                  지금 듣기 <span className="text-base leading-none">↓</span>
                </a>
                <span className="text-[10px] text-[#6d6d66]">소리는 장소보다 먼저 도착한다</span>
              </div>
            </div>

            <div className="relative min-h-[330px] lg:min-h-[470px]">
              <motion.div
                initial={{ opacity: 0, rotate: 4, y: 18 }}
                animate={{ opacity: 1, rotate: -3, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-x-4 top-4 bottom-0 overflow-hidden border-2 border-[#171717] bg-[#d5f05a] p-3 shadow-[12px_12px_0_#2454ff] sm:inset-x-12 sm:p-4"
              >
                <img src={activeStory.imageUrl || FALLBACK_IMAGE} alt={activeStory.title} className="h-full w-full object-cover grayscale-[0.2]" />
                <div className="absolute inset-3 flex flex-col justify-between bg-gradient-to-b from-[#171717]/45 via-transparent to-[#171717]/70 p-4 text-white sm:inset-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.18em]">
                    <span>{activeTopicMeta.label}</span>
                    <span>VOL. {String(activeStory.stid).padStart(2, '0')}</span>
                  </div>
                  <div>
                    <p className="text-xs text-white/75">{activeStory.locationName || '대한민국의 어느 장소'}</p>
                    <p className="mt-2 max-w-xs font-odii-sans text-2xl font-bold leading-tight tracking-[-0.045em] sm:text-3xl">{activeStory.title}</p>
                  </div>
                </div>
              </motion.div>
              <span className="absolute bottom-0 left-0 z-20 bg-[#f45b3d] px-3 py-2 text-[10px] font-bold text-[#171717]">LISTEN / WALK / STAY</span>
            </div>
          </section>

          <section className="grid border-b-2 border-[#171717] lg:grid-cols-[190px_minmax(0,1fr)]" id="listen">
            <aside className="border-b-2 border-[#171717] py-7 lg:border-b-0 lg:border-r-2 lg:py-10">
              <div className="flex items-center justify-between lg:sticky lg:top-20 lg:block">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d6d66]">Choose a feeling</p>
                <p className="font-mono text-xs text-[#2454ff]">{String(TOPICS.length).padStart(2, '0')} themes</p>
              </div>
              <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-3 lg:overflow-visible" aria-label="오디오 주제">
                {TOPICS.map((topic) => (
                  <button
                    key={topic.keyword}
                    type="button"
                    onClick={() => setActiveTopic(topic.keyword)}
                    className={`group flex shrink-0 items-center gap-2 text-left text-sm transition-colors lg:w-full ${activeTopic === topic.keyword ? 'font-bold text-[#2454ff]' : 'text-[#6d6d66] hover:text-[#171717]'}`}
                  >
                    <span className={`h-2 w-2 rounded-full border border-current transition-transform ${activeTopic === topic.keyword ? 'scale-125 bg-[#2454ff]' : 'group-hover:scale-125'}`} />
                    {topic.label}
                  </button>
                ))}
              </nav>
            </aside>

            <div className="min-w-0 py-10 lg:pl-10">
              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f45b3d]">Today’s sound</p>
                  <h2 className="mt-2 font-odii-sans text-3xl font-bold tracking-[-0.065em] sm:text-5xl">{activeTopicMeta.note}</h2>
                </div>
                <span className="hidden font-mono text-xs text-[#6d6d66] sm:block">0{safeActiveIndex + 1} / 0{Math.max(topicStories.length, 1)}</span>
              </div>

              <div className="mt-9 grid gap-8 xl:grid-cols-[minmax(0,1fr)_250px]">
                <AnimatePresence mode="wait">
                  <motion.article
                    key={activeStory.stid}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.35 }}
                    className="grid gap-6 sm:grid-cols-[minmax(180px,0.76fr)_minmax(0,1fr)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden border-2 border-[#171717] bg-[#d5f05a] sm:aspect-auto sm:min-h-[310px]">
                      <img src={activeStory.imageUrl || FALLBACK_IMAGE} alt={activeStory.title} className="h-full w-full object-cover grayscale-[0.15] transition-transform duration-700 hover:scale-105" />
                      <span className="absolute bottom-3 left-3 bg-[#d5f05a] px-2 py-1 font-mono text-[10px] font-bold text-[#171717]">{activeStory.formattedDuration || 'audio'}</span>
                    </div>
                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#6d6d66]">
                          <span className="font-bold text-[#2454ff]">{activeTopicMeta.label}</span>
                          <span>{activeStory.locationName || '대한민국 문화유산'}</span>
                        </div>
                        <h3 className="mt-3 font-odii-sans text-3xl font-bold leading-[0.98] tracking-[-0.065em] sm:text-5xl">{activeStory.title}</h3>
                        <p className="mt-3 text-sm font-medium leading-6 text-[#4d4d49]">{activeStory.audioTitle}</p>
                        <blockquote className="mt-7 border-l-2 border-[#f45b3d] pl-4 text-base leading-7 text-[#4d4d49]">“{excerpt(activeStory.script)}”</blockquote>
                      </div>
                      <div className="mt-8 flex flex-wrap items-center gap-4 border-t-2 border-[#171717] pt-4">
                        <button type="button" onClick={() => playStory(activeStory)} className="inline-flex items-center gap-2 bg-[#2454ff] px-4 py-2.5 text-xs font-bold text-white transition-transform hover:-translate-y-1">
                          <PlayGlyph playing={isActivePlaying} />
                          {isActivePlaying ? '잠시 멈추기' : '이야기 듣기'}
                        </button>
                        <button type="button" onClick={() => toggleBookmark(activeStory)} className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${savedIds.has(activeStory.stid) ? 'text-[#f45b3d]' : 'text-[#6d6d66] hover:text-[#171717]'}`}>
                          <Heart size={14} className={savedIds.has(activeStory.stid) ? 'fill-current' : ''} />
                          <span>{savedIds.has(activeStory.stid) ? '담아둔 소리' : '마음에 담기'}</span>
                        </button>
                      </div>
                    </div>
                  </motion.article>
                </AnimatePresence>

                <div className="border-t-2 border-[#171717] xl:border-l-2 xl:border-t-0 xl:pl-6">
                  <div className="flex items-center justify-between pt-5 xl:pt-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d6d66]">More from this feeling</p>
                    <span className="font-mono text-xs text-[#2454ff]">{String(topicStories.length).padStart(2, '0')}</span>
                  </div>
                  <div className="mt-3 divide-y-2 divide-[#171717]">
                    {topicStories.slice(0, 4).map((story, index) => (
                      <button key={story.stid} type="button" onClick={() => setActiveIndex(index)} className={`group flex w-full gap-3 py-4 text-left ${story.stid === activeStory.stid ? 'text-[#2454ff]' : 'text-[#171717]'}`}>
                        <span className="font-mono text-[10px] text-[#6d6d66]">0{index + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[10px] text-[#6d6d66]">{story.locationName || '소리의 장소'}</span>
                          <span className="mt-1 block truncate font-odii-sans text-sm font-bold group-hover:text-[#2454ff]">{story.title}</span>
                        </span>
                        <span className="pt-1 text-xs">↗</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="relative border-b-2 border-[#171717] bg-[#2454ff] py-12 text-white sm:py-16">
            <div className="absolute right-8 top-8 text-7xl font-black leading-none text-[#d5f05a]/80 sm:text-9xl" aria-hidden="true">03</div>
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d5f05a]">Local signal</p>
                <h2 className="mt-3 max-w-md font-odii-sans text-4xl font-bold leading-[0.9] tracking-[-0.07em] sm:text-6xl">오늘,<br />여기에서</h2>
                <p className="mt-5 max-w-xs text-xs leading-5 text-white/75">{locationMessage}</p>
                <button type="button" onClick={locate} disabled={isLocating} className="mt-6 border border-white/60 px-4 py-2.5 text-xs font-bold transition-colors hover:border-[#d5f05a] hover:bg-[#d5f05a] hover:text-[#171717] disabled:opacity-50">
                  {isLocating ? '살펴보는 중…' : '내 위치 사용 ↗'}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {nearbyStories.slice(0, 4).map((story, index) => {
                  const isCurrent = currentStory.stid === story.stid;
                  return (
                    <button key={story.stid} type="button" onClick={() => { setNearbyIndex(index); playStory(story); }} className={`group grid grid-cols-[72px_minmax(0,1fr)] gap-3 border border-white/35 p-2 text-left transition-transform hover:-translate-y-1 ${story.stid === nearbyStory.stid ? 'bg-[#d5f05a] text-[#171717]' : 'bg-white/10'}`}>
                      <img src={story.imageUrl || FALLBACK_IMAGE} alt="" className="h-[72px] w-[72px] object-cover grayscale-[0.2]" />
                      <span className="min-w-0 self-center">
                        <span className={`font-mono text-[10px] ${story.stid === nearbyStory.stid ? 'text-[#f45b3d]' : 'text-[#d5f05a]'}`}>0{index + 1} / {story.distance || 'near'}</span>
                        <span className="mt-1 block truncate font-odii-sans text-sm font-bold">{story.title}</span>
                        <span className={`mt-1 block text-[10px] ${story.stid === nearbyStory.stid ? 'text-[#4d4d49]' : 'text-white/65'}`}>{isCurrent && isPlaying ? '재생 중' : '이야기 듣기'} ↗</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 flex flex-col gap-4 border-t border-white/35 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d5f05a]">Selected nearby sound</p>
                  <p className="mt-1 truncate text-sm font-bold">{nearbyStory.title}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => moveNearby(-1)} aria-label="이전 주변 이야기" className="flex h-9 w-9 items-center justify-center border border-white/50 text-lg transition-colors hover:border-[#d5f05a] hover:bg-[#d5f05a] hover:text-[#171717]">←</button>
                  <button type="button" onClick={() => playStory(nearbyStory)} aria-label={isNearbyPlaying ? '주변 이야기 일시정지' : '주변 이야기 재생'} className="flex h-9 min-w-24 items-center justify-center gap-2 bg-[#d5f05a] px-3 text-[11px] font-bold text-[#171717] transition-transform hover:-translate-y-0.5">
                    <PlayGlyph playing={isNearbyPlaying} />
                    {isNearbyPlaying ? '일시정지' : '재생'}
                  </button>
                  <button type="button" onClick={() => moveNearby(1)} aria-label="다음 주변 이야기" className="flex h-9 w-9 items-center justify-center border border-white/50 text-lg transition-colors hover:border-[#d5f05a] hover:bg-[#d5f05a] hover:text-[#171717]">→</button>
                  <span className="ml-1 font-mono text-[10px] text-white/70">{String(safeNearbyIndex + 1).padStart(2, '0')} / {String(Math.max(nearbyStories.length, 1)).padStart(2, '0')}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="py-14 sm:py-20" id="archive">
            <div className="flex flex-col justify-between gap-5 border-b-2 border-[#171717] pb-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f45b3d]">The archive</p>
                <h2 className="mt-2 font-odii-sans text-4xl font-bold tracking-[-0.07em] sm:text-6xl">계속 걷기</h2>
              </div>
              <div className="flex items-end justify-between gap-4 sm:block sm:text-right">
                <p className="max-w-xs text-xs leading-5 text-[#6d6d66]">한 번에 다 보지 않아도 좋아요. 오늘 마음에 걸린 장면만 골라두세요.</p>
                <button type="button" onClick={reloadArchive} disabled={isRefreshing} className="mt-3 shrink-0 border-b border-[#171717] pb-0.5 text-[10px] font-bold text-[#2454ff] transition-colors hover:border-[#f45b3d] hover:text-[#f45b3d] disabled:opacity-50">
                  {isRefreshing ? '다시 읽는 중…' : '장면 다시 읽기 ↻'}
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {archiveStories.slice(0, 9).map((story, index) => {
                const isSaved = savedIds.has(story.stid);
                return (
                  <article key={story.stid} className={`group ${index === 1 ? 'lg:mt-16' : ''} ${index === 4 ? 'lg:-mt-10' : ''}`}>
                    <div className={`relative overflow-hidden border-2 border-[#171717] bg-[#d5f05a] ${index === 0 ? 'aspect-[4/5]' : 'aspect-[4/3]'}`}>
                      <img src={story.imageUrl || FALLBACK_IMAGE} alt={story.title} className="h-full w-full object-cover grayscale-[0.18] transition-transform duration-700 group-hover:scale-105" />
                      <span className="absolute left-3 top-3 bg-[#171717] px-2 py-1 font-mono text-[10px] text-[#d5f05a]">0{index + 1}</span>
                      <button type="button" onClick={() => toggleBookmark(story)} aria-label={isSaved ? `${story.title} 담아두기 취소` : `${story.title} 마음에 담기`} className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center border-2 border-[#171717] transition-colors ${isSaved ? 'bg-[#f45b3d] text-[#171717]' : 'bg-[#e9e9e3] text-[#171717] hover:bg-[#d5f05a]'}`}>
                        <Heart size={14} className={isSaved ? 'fill-current' : ''} />
                      </button>
                      <button type="button" onClick={() => playStory(story)} className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#2454ff] text-white opacity-0 transition-opacity group-hover:opacity-100" aria-label={`${story.title} 재생`}>
                        <PlayGlyph playing={currentStory.stid === story.stid && isPlaying} />
                      </button>
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-[#2454ff]">{story.category}</p>
                        <h3 className="mt-1 font-odii-sans text-xl font-bold leading-tight tracking-[-0.045em] group-hover:text-[#2454ff]">{story.title}</h3>
                        <p className="mt-1 truncate text-xs text-[#6d6d66]">{story.locationName || '대한민국 문화유산'}</p>
                      </div>
                      <span className="shrink-0 pt-1 font-mono text-[10px] text-[#6d6d66]">{story.formattedDuration || 'audio'}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <footer className="flex flex-col justify-between gap-6 border-t-2 border-[#171717] py-8 text-xs sm:flex-row sm:items-center">
            <p className="font-odii-sans text-lg font-bold tracking-[-0.04em]">천천히 들어도, 여행입니다.</p>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.15em]">
              <Link href="/map" className="hover:text-[#2454ff]">Map ↗</Link>
              <Link href="/" className="hover:text-[#2454ff]">Onmaru ↗</Link>
            </div>
          </footer>
        </main>
      </div>

      <SavedSoundDrawer savedStories={savedStories} onRemoveBookmark={removeBookmark} />
      <LocalMiniPlayer />
    </div>
  );
};
