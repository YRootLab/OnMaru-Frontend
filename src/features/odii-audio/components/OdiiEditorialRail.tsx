'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { IOdiiApiService, OdiiStoryItem } from '@/features/odii-audio/types/odii.types';
import { ODII_THEME_CATEGORIES } from '@/features/odii-audio/data/odiiCategoryData';
import { useOdiiApiService } from '@/features/odii-audio/context/OdiiDependencyContext';
import { ODII_RAIL_VISIBLE_BUFFER, getVisibleRailPositions, shouldFetchRailCategory } from './odiiEditorialRailModel';

interface OdiiEditorialRailProps {
  stories: OdiiStoryItem[];
  storySets?: Record<string, OdiiStoryItem[]>;
  apiService?: IOdiiApiService;
  isLoading?: boolean;
  onApiError?: () => void;
}

const FALLBACK_IMAGE_SETS = {
  hanok: [
    '/images/hanok/hanok-main.png',
    '/images/hanok/hanok-exterior.png',
    '/images/hanok/hanok-interior.png',
  ],
  market: [
    '/images/hanok/maru-detail.png',
    '/images/hanok/hanok-porch.png',
    '/images/hanok/giwa-detail.png',
  ],
  village: [
    '/images/hanok/hanok-exterior.png',
    '/images/hanok/hanok-porch.png',
    '/images/hanok/changho-detail.png',
  ],
  palace: [
    '/images/hanok/giwa-detail.png',
    '/images/hanok/hanok-main.png',
    '/images/hanok/changho-detail.png',
  ],
  nature: [
    '/images/hanok/hanok-porch.png',
    '/images/hanok/maru-detail.png',
    '/images/hanok/ondol-detail.png',
  ],
  sound: [
    '/images/hanok/maru-detail.png',
    '/images/hanok/changho-detail.png',
    '/images/hanok/ondol-detail.png',
  ],
  default: [
    '/images/hanok/hanok-main.png',
    '/images/hanok/hanok-exterior.png',
    '/images/hanok/giwa-detail.png',
  ],
} as const;

const getFallbackImageSet = (story: OdiiStoryItem) => {
  const category = `${story.category} ${story.title} ${story.locationName || ''}`;
  if (category.includes('한옥') || category.includes('고택')) return FALLBACK_IMAGE_SETS.hanok;
  if (category.includes('시장') || category.includes('장터')) return FALLBACK_IMAGE_SETS.market;
  if (category.includes('마을') || category.includes('골목')) return FALLBACK_IMAGE_SETS.village;
  if (category.includes('궁') || category.includes('역사')) return FALLBACK_IMAGE_SETS.palace;
  if (category.includes('자연') || category.includes('길')) return FALLBACK_IMAGE_SETS.nature;
  if (category.includes('소리') || category.includes('문화')) return FALLBACK_IMAGE_SETS.sound;
  return FALLBACK_IMAGE_SETS.default;
};

const fallbackImageFor = (story: OdiiStoryItem) => {
  const imageSet = getFallbackImageSet(story);
  const seed = Array.from(story.stid || story.title).reduce((total, char) => total + char.charCodeAt(0), 0);
  return imageSet[seed % imageSet.length];
};

const isTrustedOdiiImage = (imageUrl: string) => (
  /^https?:\/\//i.test(imageUrl)
  && !imageUrl.includes('unsplash.com')
  && !imageUrl.includes('pixabay.com')
);

const durationFor = (story: OdiiStoryItem) => story.formattedDuration || `${Math.floor((Number(story.playTime) || 0) / 60)}:${String((Number(story.playTime) || 0) % 60).padStart(2, '0')}`;

interface EditorialRailCardProps {
  story: OdiiStoryItem;
  position: number;
  offset: number;
  featuredLength: number;
  trackTransitionEnabled: boolean;
  onInteractRef: React.MutableRefObject<(position: number) => void>;
}

const EditorialRailCard = React.memo<EditorialRailCardProps>(({ story, position, offset, featuredLength, trackTransitionEnabled, onInteractRef }) => {
  const distance = Math.abs(offset);
  const isVisible = distance <= ODII_RAIL_VISIBLE_BUFFER;
  const isActive = offset === 0;
  const initialImageSrc = story.imageUrl || fallbackImageFor(story);
  const tilt = isActive ? 0 : offset < 0
    ? (Math.abs(offset) % 2 === 1 ? 1.6 : -1.6)
    : (offset % 2 === 1 ? -1.6 : 1.6);
  const lift = isActive ? 0 : offset < 0
    ? (Math.abs(offset) % 2 === 1 ? -6 : 6)
    : (offset % 2 === 1 ? 6 : -6);

  return (
    <motion.button
      type="button"
      animate={{
        opacity: isVisible ? (isActive ? 1 : 0.54) : 0,
        y: lift,
        rotate: tilt,
        scale: isActive ? 1 : distance === 1 ? 0.92 : 0.84,
      }}
      transition={{ duration: trackTransitionEnabled && isVisible ? 0.48 : 0, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onInteractRef.current(position)}
      className={`relative h-[250px] w-[135px] shrink-0 select-none overflow-hidden bg-white text-left outline-none focus:outline-none focus-visible:outline-none focus-visible: sm:h-[330px] sm:w-[200px] lg:h-[370px] lg:w-[225px] ${isActive ? 'z-20  ' : 'z-10   grayscale-[0.15] hover:grayscale-0'}`}
      draggable={false}
      onMouseDown={(event) => event.preventDefault()}
      aria-label={`${story.title}${isActive ? ' 현재 선택됨' : ''}`}
    >
      <img
        src={initialImageSrc}
        alt=""
        draggable={false}
        loading={distance <= 3 ? 'eager' : 'lazy'}
        decoding="async"
        className="h-full w-full object-cover"
        onError={(event) => {
          const image = event.currentTarget;
          if (image.dataset.fallbackApplied === 'true') {
            image.onerror = null;
            image.src = FALLBACK_IMAGE_SETS.default[0];
            return;
          }
          image.dataset.fallbackApplied = 'true';
          image.src = fallbackImageFor(story);
        }}
      />
      {!story.imageUrl && <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-black/25 px-2 py-1 text-[9px] font-medium text-white/90 backdrop-blur-sm">참고용 이미지</span>}
      <div className="absolute inset-0 bg-gradient-to-t from-white/55 via-transparent to-black/5" />
      <span className="pointer-events-none absolute left-4 top-4 z-10 text-[10px] font-semibold tabular-nums text-white mix-blend-difference drop-">
        {String((position % featuredLength) + 1).padStart(2, '0')}
      </span>
      <div className={`absolute inset-x-0 bottom-0 px-4 py-4 text-[#211e19] backdrop-blur-[24px] sm:px-5 sm:py-5 ${isActive ? 'bg-[#fff0f5]/[0.68] ' : 'bg-white/[0.46] '}`}>
        <p className="truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-[#F84E76]">{story.category !== '오디 이야기' ? story.category : story.badgeText || '오디오 가이드'}</p>
        <h3 className="mt-1 line-clamp-2 font-odii-sans text-base font-semibold leading-tight tracking-[-0.03em] sm:text-lg">{story.title}</h3>
        <p className="mt-1 line-clamp-1 text-[10px] leading-4 text-[#8c7e6c]">{story.locationName || '대한민국 문화유산'}</p>
        {isActive && <span className="mt-2 inline-flex items-center gap-2 text-[10px] text-[#f84e76]">{durationFor(story)} <span className="text-[#8c7e6c]">↗</span></span>}
      </div>
    </motion.button>
  );
}, (previous, next) => {
  const previousVisible = Math.abs(previous.offset) <= 4;
  const nextVisible = Math.abs(next.offset) <= 4;
  if (!previousVisible && !nextVisible) return previous.story === next.story;
  return previous.story === next.story
    && previous.offset === next.offset
    && previous.trackTransitionEnabled === next.trackTransitionEnabled;
});

const POSITION_CORRECTION_COOLDOWN_MS = 70;
const TRANSITION_SAFETY_TIMEOUT_MS = 900;
const RAIL_COPY_COUNT = 3;

export const OdiiEditorialRail = React.memo<OdiiEditorialRailProps>(({ stories, storySets, apiService, isLoading = false, onApiError }) => {
  const activeApiService = useOdiiApiService(apiService);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const [selectedKeyword, setSelectedKeyword] = useState(ODII_THEME_CATEGORIES[0].keyword);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [categoryStories, setCategoryStories] = useState<OdiiStoryItem[] | null>(null);
  const [isRailNearby, setIsRailNearby] = useState(false);
  const categoryCacheMapRef = useRef<Record<string, OdiiStoryItem[]>>({});
  const categoryLoadPromisesRef = useRef<Record<string, Promise<OdiiStoryItem[]>>>({});
  const [cachedImageUrls, setCachedImageUrls] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = window.localStorage.getItem('onmaru_odii_story_images');
      const parsed = stored ? JSON.parse(stored) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });
  const categoryRequestRef = useRef(0);
  const categoryRequestPendingRef = useRef(false);
  const [activePosition, setActivePosition] = useState(0);
  const [trackTransitionEnabled, setTrackTransitionEnabled] = useState(true);
  const [autoResetToken, setAutoResetToken] = useState(0);
  const resetTimerRef = useRef<number | null>(null);
  const inputLockedRef = useRef(false);
  const unlockTimerRef = useRef<number | null>(null);
  const cardInteractionRef = useRef<(position: number) => void>(() => undefined);
  const railRef = useRef<HTMLElement>(null);
  const [trackMetrics, setTrackMetrics] = useState({ cardWidth: 225, cardStep: 245 });

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsRailNearby(entry.isIntersecting),
      { rootMargin: '320px 0px' },
    );
    observer.observe(rail);
    return () => observer.disconnect();
  }, []);

  const loadCategoryStories = useCallback((keyword: string) => {
    const cached = categoryCacheMapRef.current[keyword];
    if (cached) return Promise.resolve(cached);

    const pending = categoryLoadPromisesRef.current[keyword];
    if (pending) return pending;

    const request = activeApiService.getStoryList(undefined, keyword)
      .then((nextStories) => {
        const validStories = nextStories.filter((story) => story.audioUrl);
        categoryCacheMapRef.current[keyword] = validStories;
        return validStories;
      });
    categoryLoadPromisesRef.current[keyword] = request;
    void request.then(() => {
      if (categoryLoadPromisesRef.current[keyword] === request) {
        delete categoryLoadPromisesRef.current[keyword];
      }
    }, () => {
      if (categoryLoadPromisesRef.current[keyword] === request) {
        delete categoryLoadPromisesRef.current[keyword];
      }
    });
    return request;
  }, [activeApiService]);

  const featured = useMemo(() => {
    const category = ODII_THEME_CATEGORIES.find((item) => item.keyword === selectedKeyword) ?? ODII_THEME_CATEGORIES[0];
    const localCategoryStories = storySets?.[category.label] ?? stories.filter((story) => {
      const searchable = `${story.category} ${story.title} ${story.locationName}`.toLowerCase();
      return searchable.includes(category.keyword.toLowerCase());
    });
    const recommendationStories = storySets?.['추천'];
    const cachedCategory = categoryCacheMapRef.current[selectedKeyword];

    const source = categoryStories !== null
      ? categoryStories
      : (cachedCategory && cachedCategory.length)
        ? cachedCategory
        : localCategoryStories.length
          ? localCategoryStories
          : (recommendationStories?.length ? recommendationStories : stories);

    return source.filter((story) => Boolean(story.audioUrl)).slice(0, 10).map((story) => (
      !story.imageUrl && cachedImageUrls[story.stid]
        ? { ...story, imageUrl: cachedImageUrls[story.stid] }
        : story
    ));
  }, [cachedImageUrls, categoryStories, selectedKeyword, stories, storySets]);

  const activeIndex = featured.length ? ((activePosition % featured.length) + featured.length) % featured.length : 0;
  const activeStory = featured[activeIndex] ?? featured[0];

  // React-Window 스타일 가상화(Virtualization): 현재 화면 중심(activePosition) 기준 ±4개 카드만 DOM에 유지
  const visibleVirtualPositions = useMemo(() => {
    const list: { pos: number; story: OdiiStoryItem }[] = [];
    if (!featured.length) return list;
    for (const pos of getVisibleRailPositions(activePosition)) {
      const index = ((pos % featured.length) + featured.length) % featured.length;
      list.push({ pos, story: featured[index] });
    }
    return list;
  }, [activePosition, featured]);

  useEffect(() => {
    const updateTrackMetrics = () => {
      if (window.innerWidth < 640) {
        setTrackMetrics({ cardWidth: 135, cardStep: 150 });
      } else if (window.innerWidth < 1024) {
        setTrackMetrics({ cardWidth: 200, cardStep: 220 });
      } else {
        setTrackMetrics({ cardWidth: 225, cardStep: 245 });
      }
    };
    updateTrackMetrics();
    window.addEventListener('resize', updateTrackMetrics);
    return () => window.removeEventListener('resize', updateTrackMetrics);
  }, []);

  useEffect(() => {
    const resetId = window.setTimeout(() => {
      setActivePosition(0);
      setTrackTransitionEnabled(true);
    }, 0);
    return () => window.clearTimeout(resetId);
  }, [selectedKeyword]);

  useEffect(() => {
    if (!shouldFetchRailCategory({ isRailNearby, isSelected: true, isInteracted: false }) || categoryStories !== null || categoryRequestPendingRef.current) return;
    let isMounted = true;
    const requestId = categoryRequestRef.current + 1;
    categoryRequestRef.current = requestId;
    categoryRequestPendingRef.current = true;

    setIsCategoryLoading(true);
    loadCategoryStories(selectedKeyword)
      .then((nextStories) => {
        if (!isMounted || requestId !== categoryRequestRef.current) return;
        setCategoryStories(nextStories);
      })
      .catch(() => {
        if (!isMounted || requestId !== categoryRequestRef.current) return;
        onApiError?.();
        setCategoryStories([]);
      })
      .finally(() => {
        if (!isMounted || requestId !== categoryRequestRef.current) return;
        categoryRequestPendingRef.current = false;
        setIsCategoryLoading(false);
        setTrackTransitionEnabled(true);
      });

    return () => {
      isMounted = false;
    };
  }, [categoryStories, isRailNearby, loadCategoryStories, onApiError, selectedKeyword]);

  useEffect(() => {
    const newlyCached = [...stories, ...(categoryStories || [])].reduce<Record<string, string>>((result, story) => {
      if (story.stid && isTrustedOdiiImage(story.imageUrl)) result[story.stid] = story.imageUrl;
      return result;
    }, {});
    if (!Object.keys(newlyCached).length) return;

    const cacheId = window.setTimeout(() => {
      setCachedImageUrls((previous) => {
        const next = { ...previous, ...newlyCached };
        try {
          window.localStorage.setItem('onmaru_odii_story_images', JSON.stringify(next));
        } catch {
          // ignore storage failures
        }
        return next;
      });
    }, 0);
    return () => window.clearTimeout(cacheId);
  }, [categoryStories, stories]);

  const lockInputForTransition = useCallback(() => {
    inputLockedRef.current = true;
    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current);
    }
    unlockTimerRef.current = window.setTimeout(() => {
      inputLockedRef.current = false;
      unlockTimerRef.current = null;
    }, TRANSITION_SAFETY_TIMEOUT_MS);
  }, []);

  const moveBy = useCallback((delta: number, resetAuto = true) => {
    if (!delta || featured.length < 2 || inputLockedRef.current) return;
    if (resetAuto) lockInputForTransition();
    if (resetAuto) setAutoResetToken((token) => token + 1);
    setActivePosition((position) => position + delta);
  }, [featured.length, lockInputForTransition]);

  const moveTo = useCallback((index: number) => {
    let delta = index - activeIndex;
    if (delta > featured.length / 2) delta -= featured.length;
    if (delta < -featured.length / 2) delta += featured.length;
    moveBy(delta);
  }, [activeIndex, featured.length, moveBy]);

  useEffect(() => {
    if (featured.length < 2) return;
    const timer = window.setInterval(() => moveBy(1, false), 7000);
    return () => window.clearInterval(timer);
  }, [autoResetToken, featured.length, moveBy]);

  useEffect(() => () => {
    if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
    if (unlockTimerRef.current !== null) window.clearTimeout(unlockTimerRef.current);
  }, []);

  const handleTrackTransitionEnd = useCallback((event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform') return;
    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
    inputLockedRef.current = false;
  }, []);

  const handleCategoryChange = (keyword: string) => {
    if (keyword === selectedKeyword || inputLockedRef.current) return;
    if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);

    setSelectedKeyword(keyword);

    // 0ms 캐시 즉시 적용 (가상화 윈도잉 0ms 렌더링)
    const cached = categoryCacheMapRef.current[keyword];
    if (cached && cached.length) {
      setCategoryStories(cached);
      setTrackTransitionEnabled(false);
      setActivePosition(0);
      window.requestAnimationFrame(() => {
        setTrackTransitionEnabled(true);
      });
      return;
    }

    setCategoryStories(null);
    setIsCategoryLoading(true);

    // 사용자가 선택한 카테고리만 요청한다.
    const requestId = categoryRequestRef.current + 1;
    categoryRequestRef.current = requestId;
    categoryRequestPendingRef.current = true;
    loadCategoryStories(keyword)
      .then((nextStories) => {
        if (requestId !== categoryRequestRef.current) return;
        setCategoryStories(nextStories);
        setTrackTransitionEnabled(false);
        setActivePosition(0);
        window.requestAnimationFrame(() => {
          setTrackTransitionEnabled(true);
        });
      })
      .catch(() => {
        if (requestId !== categoryRequestRef.current) return;
        onApiError?.();
      })
      .finally(() => {
        if (requestId !== categoryRequestRef.current) return;
        categoryRequestPendingRef.current = false;
        setIsCategoryLoading(false);
      });
  };

  const preloadCategory = useCallback((keyword: string) => {
    if (!shouldFetchRailCategory({ isRailNearby, isSelected: keyword === selectedKeyword, isInteracted: true })) return;
    if (categoryCacheMapRef.current[keyword]) return;

    loadCategoryStories(keyword)
      .then((nextStories) => {
        categoryCacheMapRef.current[keyword] = nextStories;
      })
      .catch(() => {
        // Hover/focus preloads are optional and must not surface an error.
      });
  }, [isRailNearby, loadCategoryStories, selectedKeyword]);

  cardInteractionRef.current = (position) => {
    const offset = position - activePosition;
    const story = visibleVirtualPositions.find((item) => item.pos === position)?.story;
    moveBy(offset);
    if (offset === 0 && story) setCurrentStory(story);
  };

  const showSkeleton = !activeStory && (isLoading || isCategoryLoading);

  if (!activeStory && !showSkeleton) {
    return (
      <section ref={railRef} aria-label="오디 셀렉션" className="relative mx-auto flex min-h-[355px] w-full max-w-6xl items-center justify-center overflow-hidden py-3 sm:min-h-[430px] sm:py-5 lg:min-h-[465px]">
        <p className="text-sm text-[#8c7e6c]">이 주제의 오디오 이야기를 찾지 못했습니다.</p>
      </section>
    );
  }

  return (
    <section ref={railRef} aria-label="오디 셀렉션" aria-busy={showSkeleton} style={{ contain: 'layout paint' }} className="relative mx-auto w-full max-w-6xl overflow-hidden py-3 sm:py-5">
      <div className="w-full px-0">
        <div className="relative pb-2 pt-1 sm:pt-2">
          <div className="mx-auto mb-3 w-full max-w-6xl">
            <nav aria-label="장면 카테고리" className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max items-center gap-4">
                {ODII_THEME_CATEGORIES.map((category) => {
                  const isSelected = selectedKeyword === category.keyword;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryChange(category.keyword)}
                      onPointerEnter={() => preloadCategory(category.keyword)}
                      onFocus={() => preloadCategory(category.keyword)}
                      aria-pressed={isSelected}
                      className={`select-none whitespace-nowrap text-xs transition-colors duration-300 sm:text-sm ${isSelected ? 'font-semibold text-[#f84e76]' : 'text-[#8c7e6c] hover:text-[#211e19]'}`}
                    >
                      #{category.keyword === '시장' ? '전통시장' : category.keyword === '마을' ? '전통마을' : category.keyword === '궁' ? '궁궐' : category.keyword === '길' ? '자연' : category.keyword}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
          <div className="relative isolate mt-0 h-[325px] overflow-hidden bg-white pt-2 pb-4 sm:h-[410px] lg:h-[455px]">
            {/* Leading (좌측) 풀 높이 리니어 그라데이션 탐색 버튼 */}
            <button
              type="button"
              onClick={() => moveBy(-1)}
              onDragStart={(event) => event.preventDefault()}
              draggable={false}
              aria-label="이전 이야기"
              className="group absolute left-0 top-0 bottom-0 z-30 flex w-12 sm:w-16 lg:w-20 cursor-pointer items-center justify-start pl-2 sm:pl-4 bg-gradient-to-r from-white via-white/80 to-transparent transition-opacity duration-200 hover:from-white hover:via-white/95 active:opacity-80"
            >
              <span className="flex h-11 w-9 items-center justify-center rounded-xl bg-white/40 text-[#211e19]  backdrop-blur-xs transition-transform duration-300 group-hover:scale-115 group-hover:bg-white group-hover:text-[#f84e76]">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </span>
            </button>

            {/* Trailing (우측) 풀 높이 리니어 그라데이션 탐색 버튼 */}
            <button
              type="button"
              onClick={() => moveBy(1)}
              onDragStart={(event) => event.preventDefault()}
              draggable={false}
              aria-label="다음 이야기"
              className="group absolute right-0 top-0 bottom-0 z-30 flex w-12 sm:w-16 lg:w-20 cursor-pointer items-center justify-end pr-2 sm:pr-4 bg-gradient-to-l from-white via-white/80 to-transparent transition-opacity duration-200 hover:from-white hover:via-white/95 active:opacity-80"
            >
              <span className="flex h-11 w-9 items-center justify-center rounded-xl bg-white/40 text-[#211e19]  backdrop-blur-xs transition-transform duration-300 group-hover:scale-115 group-hover:bg-white group-hover:text-[#f84e76]">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </span>
            </button>

            {showSkeleton && (
              <div className="absolute inset-x-0 top-7 flex items-start justify-center gap-4 px-4 sm:gap-5 lg:gap-5">
                {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                  <div
                    key={index}
                    className={`h-[250px] w-[135px] shrink-0 animate-pulse overflow-hidden  bg-white/70  sm:h-[330px] sm:w-[200px] lg:h-[370px] lg:w-[225px] ${index % 2 ? 'translate-y-2 rotate-[1.2deg]' : '-translate-y-1 rotate-[-1.2deg]'}`}
                  >
                    <div className="h-[62%] bg-gradient-to-br from-[#f4e8eb] via-[#eee7e3] to-[#e5dfe0]" />
                    <div className="space-y-3 bg-white/70 px-4 py-5 sm:px-5 sm:py-6">
                      <div className="h-2.5 w-16 rounded bg-[#f8b3c4]/55" />
                      <div className="h-4 w-4/5 rounded bg-[#d8d1cc]/70" />
                      <div className="h-3 w-3/5 rounded bg-[#e3dcd7]/75" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!showSkeleton && <div
              className="absolute left-1/2 top-7 flex items-start"
              style={{
                transform: `translate3d(${-trackMetrics.cardStep * activePosition}px, 0, 0)`,
                transition: trackTransitionEnabled ? 'transform 480ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                willChange: 'transform',
              }}
              onTransitionEnd={handleTrackTransitionEnd}
            >
              {visibleVirtualPositions.map(({ pos, story }) => (
                <div
                  key={pos}
                  style={{
                    position: 'absolute',
                    left: `${pos * trackMetrics.cardStep - trackMetrics.cardWidth / 2}px`,
                    top: 0,
                  }}
                >
                  <EditorialRailCard
                    story={story}
                    position={pos}
                    offset={pos - activePosition}
                    featuredLength={featured.length}
                    trackTransitionEnabled={trackTransitionEnabled}
                    onInteractRef={cardInteractionRef}
                  />
                </div>
              ))}
            </div>}
          </div>

          {/* 하단 인디케이터 바 */}
          <div className="relative z-30 flex items-center justify-center pt-1.5 sm:pt-2">
            <div className="flex items-center gap-1.5">
              {featured.map((story, index) => (
                <button key={`${story.stid}-${index}`} type="button" onClick={() => moveTo(index)} className={`h-1 rounded-full transition-all duration-300 ${index === activeIndex ? 'w-8 bg-[#f84e76]' : 'w-1.5 bg-[#211e19]/20 hover:bg-[#211e19]/50'}`} aria-label={`${index + 1}번째 이야기 선택`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
