'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';
import { IOdiiApiService, OdiiStoryItem } from '../types/odii.types';
import { ODII_THEME_CATEGORIES } from '../data/odiiCategoryData';
import { useOdiiApiService } from '../context/OdiiDependencyContext';

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
  const isVisible = distance <= 4;
  const isActive = offset === 0;
  const nextImageSrc = story.imageUrl || fallbackImageFor(story);
  const [displayedImageSrc, setDisplayedImageSrc] = useState(nextImageSrc);
  const tilt = isActive ? 0 : offset < 0
    ? (Math.abs(offset) % 2 === 1 ? 1.6 : -1.6)
    : (offset % 2 === 1 ? -1.6 : 1.6);
  const lift = isActive ? 0 : offset < 0
    ? (Math.abs(offset) % 2 === 1 ? -6 : 6)
    : (offset % 2 === 1 ? 6 : -6);

  useEffect(() => {
    if (nextImageSrc === displayedImageSrc) return undefined;

    let cancelled = false;
    const image = new window.Image();
    image.decoding = 'async';
    image.onload = () => {
      if (!cancelled) setDisplayedImageSrc(nextImageSrc);
    };
    image.onerror = () => {
      if (!cancelled) setDisplayedImageSrc(FALLBACK_IMAGE_SETS.default[0]);
    };
    image.src = nextImageSrc;

    return () => {
      cancelled = true;
    };
  }, [displayedImageSrc, nextImageSrc]);

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
      className={`relative h-[250px] w-[135px] shrink-0 select-none overflow-hidden border bg-white text-left outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 sm:h-[330px] sm:w-[200px] lg:h-[370px] lg:w-[225px] ${isActive ? 'z-20 border-[#f84e76] shadow-[0_22px_48px_rgba(33,30,25,0.18),0_8px_24px_rgba(248,78,118,0.13)]' : 'z-10 border-[#211e19]/12 shadow-[0_18px_35px_rgba(33,30,25,0.16)] grayscale-[0.15] hover:grayscale-0'}`}
      draggable={false}
      onMouseDown={(event) => event.preventDefault()}
      aria-label={`${story.title}${isActive ? ' 현재 선택됨' : ''}`}
    >
      <img
        src={displayedImageSrc}
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
            setDisplayedImageSrc(FALLBACK_IMAGE_SETS.default[0]);
            return;
          }
          image.dataset.fallbackApplied = 'true';
          setDisplayedImageSrc(fallbackImageFor(story));
        }}
      />
      {!story.imageUrl && <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-black/25 px-2 py-1 text-[9px] font-medium text-white/90 backdrop-blur-sm">참고용 이미지</span>}
      <div className="absolute inset-0 bg-gradient-to-t from-white/55 via-transparent to-black/5" />
      <span className="pointer-events-none absolute left-4 top-4 z-10 text-[10px] font-semibold tabular-nums text-white mix-blend-difference drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
        {String((position % featuredLength) + 1).padStart(2, '0')}
      </span>
      <div className={`absolute inset-x-0 bottom-0 px-4 py-4 text-[#211e19] backdrop-blur-[24px] sm:px-5 sm:py-5 ${isActive ? 'bg-[#fff0f5]/[0.68] shadow-[0_-8px_20px_rgba(248,78,118,0.08)]' : 'bg-white/[0.46] shadow-[0_-8px_20px_rgba(255,255,255,0.12)]'}`}>
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
const RAIL_VISIBLE_BUFFER = 4;

export const OdiiEditorialRail = React.memo<OdiiEditorialRailProps>(({ stories, storySets, apiService, isLoading = false, onApiError }) => {
  const activeApiService = useOdiiApiService(apiService);
  const setCurrentStory = useOdiiAudioStore((state) => state.setCurrentStory);
  const [selectedKeyword, setSelectedKeyword] = useState(ODII_THEME_CATEGORIES[0].keyword);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  const [categoryStories, setCategoryStories] = useState<OdiiStoryItem[] | null>(null);
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
  const [activePosition, setActivePosition] = useState(0);
  const [trackTransitionEnabled, setTrackTransitionEnabled] = useState(true);
  const [autoResetToken, setAutoResetToken] = useState(0);
  const resetTimerRef = useRef<number | null>(null);
  const inputLockedRef = useRef(false);
  const unlockTimerRef = useRef<number | null>(null);
  const cardInteractionRef = useRef<(position: number) => void>(() => undefined);
  const [trackMetrics, setTrackMetrics] = useState({ cardWidth: 225, cardStep: 245 });
  const featured = useMemo(() => {
    const category = ODII_THEME_CATEGORIES.find((item) => item.keyword === selectedKeyword) ?? ODII_THEME_CATEGORIES[0];
    const localCategoryStories = storySets?.[category.label] ?? stories.filter((story) => {
      const searchable = `${story.category} ${story.title} ${story.locationName}`.toLowerCase();
      return searchable.includes(category.keyword.toLowerCase());
    });
    const recommendationStories = storySets?.['추천'];
    const source = categoryStories !== null
      ? categoryStories
      : localCategoryStories.length
        ? localCategoryStories
        : (recommendationStories?.length ? recommendationStories : stories);
    // 오디오 섹션에는 실제 재생 가능한 레코드만 들어와야 한다.
    return source.filter((story) => Boolean(story.audioUrl)).slice(0, 10).map((story) => (
      !story.imageUrl && cachedImageUrls[story.stid]
        ? { ...story, imageUrl: cachedImageUrls[story.stid] }
        : story
    ));
  }, [cachedImageUrls, categoryStories, selectedKeyword, stories, storySets]);
  const activeIndex = featured.length ? ((activePosition % featured.length) + featured.length) % featured.length : 0;
  const activeStory = featured[activeIndex] ?? featured[0];
  const trackStories = useMemo(() => Array.from({ length: featured.length * RAIL_COPY_COUNT }, (_, position) => ({
    story: featured[position % featured.length],
    position,
  })), [featured]);

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
      setActivePosition(featured.length);
      setTrackTransitionEnabled(true);
    }, 0);
    return () => window.clearTimeout(resetId);
  }, [featured.length, selectedKeyword]);

  useEffect(() => {
    if (categoryStories !== null) return;
    let isMounted = true;
    const requestId = categoryRequestRef.current + 1;
    categoryRequestRef.current = requestId;
    const loadingId = window.setTimeout(() => setIsCategoryLoading(true), 0);

    activeApiService.getStoryList(undefined, selectedKeyword)
      .then((nextStories) => {
        if (!isMounted || requestId !== categoryRequestRef.current) return;
        setCategoryStories(nextStories.filter((story) => story.audioUrl));
      })
      .catch(() => {
        if (!isMounted || requestId !== categoryRequestRef.current) return;
        onApiError?.();
        setCategoryStories([]);
      })
      .finally(() => {
        if (!isMounted || requestId !== categoryRequestRef.current) return;
        setIsCategoryLoading(false);
        setTrackTransitionEnabled(true);
      });

    return () => {
      isMounted = false;
      window.clearTimeout(loadingId);
    };
  }, [activeApiService, categoryStories, onApiError, selectedKeyword]);

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

  // 무한 트랙 보정 시 새로 노출되는 물리 슬롯에서 이미지 decode가 발생하지 않도록 미리 준비한다.
  useEffect(() => {
    const imageSources = new Set(
      featured.map((story) => story.imageUrl || fallbackImageFor(story)),
    );
      imageSources.forEach((source) => {
      const image = new window.Image();
      image.decoding = 'async';
      image.src = source;
    });
  }, [featured]);

  const lockInputForTransition = useCallback(() => {
    inputLockedRef.current = true;
    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current);
    }
    // transitionend가 브라우저/렌더링 상황에 따라 누락되어도 영구 잠금되지 않게 한다.
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
    if (event.target !== event.currentTarget || event.propertyName !== 'transform' || featured.length < 2) return;
    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }

    const middleCopyStart = featured.length;
    const middleCopyEnd = featured.length * 2;
    const needsRightCorrection = activePosition > middleCopyEnd - RAIL_VISIBLE_BUFFER;
    const needsLeftCorrection = activePosition < middleCopyStart + RAIL_VISIBLE_BUFFER;

    if (!needsRightCorrection && !needsLeftCorrection) {
      unlockTimerRef.current = window.setTimeout(() => {
        inputLockedRef.current = false;
        unlockTimerRef.current = null;
      }, POSITION_CORRECTION_COOLDOWN_MS);
      return;
    }

    setTrackTransitionEnabled(false);
    setActivePosition((position) => needsRightCorrection ? position - featured.length : position + featured.length);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setTrackTransitionEnabled(true);
        unlockTimerRef.current = window.setTimeout(() => {
          inputLockedRef.current = false;
          unlockTimerRef.current = null;
        }, POSITION_CORRECTION_COOLDOWN_MS);
      });
    });
  }, [activePosition, featured.length]);

  const handleCategoryChange = (keyword: string) => {
    if (keyword === selectedKeyword || isCategoryLoading || inputLockedRef.current) return;
    if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
    setIsCategoryLoading(true);
    setTrackTransitionEnabled(false);
    setActivePosition(featured.length);
    setSelectedKeyword(keyword);
    const requestId = categoryRequestRef.current + 1;
    categoryRequestRef.current = requestId;
    activeApiService.getStoryList(undefined, keyword)
      .then((nextStories) => {
        if (requestId !== categoryRequestRef.current) return;
        setCategoryStories(nextStories.filter((story) => story.audioUrl));
      })
      .catch(() => {
        if (requestId !== categoryRequestRef.current) return;
        onApiError?.();
        setCategoryStories([]);
      })
      .finally(() => {
        if (requestId !== categoryRequestRef.current) return;
        resetTimerRef.current = window.setTimeout(() => {
          setIsCategoryLoading(false);
          setTrackTransitionEnabled(true);
        }, 260);
      });
  };

  cardInteractionRef.current = (position) => {
    const offset = position - activePosition;
    const story = trackStories.find((item) => item.position === position)?.story;
    moveBy(offset);
    if (offset === 0 && story) setCurrentStory(story);
  };

  // 실제 playable 카드가 있으면 카테고리 API 지연/실패가 카드를 가리지 않게 한다.
  const showSkeleton = !activeStory && (isLoading || isCategoryLoading);

  if (!activeStory && !showSkeleton) {
    return (
      <section aria-label="오디 셀렉션" className="relative left-1/2 flex min-h-[355px] w-screen -translate-x-1/2 items-center justify-center py-3 sm:min-h-[430px] sm:py-5 lg:min-h-[465px]">
        <p className="text-sm text-[#8c7e6c]">이 주제의 오디오 이야기를 찾지 못했습니다.</p>
      </section>
    );
  }

  return (
    <section aria-label="오디 셀렉션" aria-busy={showSkeleton} className="relative left-1/2 w-screen -translate-x-1/2 py-3 sm:py-5">
      <div className="w-full px-0">
        <div className="relative px-1 pb-2 pt-1 sm:px-3 sm:pt-2">
          <div className="mx-auto mb-3 w-full max-w-6xl px-4 sm:px-8">
            <nav aria-label="장면 카테고리" className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max items-center gap-4">
                {ODII_THEME_CATEGORIES.map((category) => {
                  const isSelected = selectedKeyword === category.keyword;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryChange(category.keyword)}
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
          <div className="relative mt-0 h-[355px] overflow-hidden sm:h-[430px] lg:h-[465px]">
            {showSkeleton && (
              <div className="absolute inset-x-0 top-3 flex items-start justify-center gap-4 px-4 sm:gap-5 lg:gap-5">
                {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                  <div
                    key={index}
                    className={`h-[250px] w-[135px] shrink-0 animate-pulse overflow-hidden border border-[#211e19]/8 bg-white/70 shadow-[0_18px_35px_rgba(33,30,25,0.10)] sm:h-[330px] sm:w-[200px] lg:h-[370px] lg:w-[225px] ${index % 2 ? 'translate-y-2 rotate-[1.2deg]' : '-translate-y-1 rotate-[-1.2deg]'}`}
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
              className="absolute left-1/2 top-3 flex items-start gap-4 sm:gap-5 lg:gap-5"
              style={{
                transform: `translate3d(${-(trackMetrics.cardStep * activePosition + trackMetrics.cardWidth / 2)}px, 0, 0)`,
                transition: trackTransitionEnabled ? 'transform 480ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
              }}
              onTransitionEnd={handleTrackTransitionEnd}
            >
              {trackStories.map(({ story, position }) => (
                <EditorialRailCard
                  key={position}
                  story={story}
                  position={position}
                  offset={position - activePosition}
                  featuredLength={featured.length}
                  trackTransitionEnabled={trackTransitionEnabled}
                  onInteractRef={cardInteractionRef}
                />
              ))}
            </div>}
          </div>

          <div className="relative z-30 flex items-center justify-center gap-5">
            <button type="button" onClick={() => moveBy(-1)} onDragStart={(event) => event.preventDefault()} draggable={false} className="select-none text-sm text-[#786d5e] transition-colors hover:text-[#211e19]" aria-label="이전 이야기">←</button>
            <div className="flex items-center gap-1.5">
              {featured.map((story, index) => (
                <button key={story.stid} type="button" onClick={() => moveTo(index)} className={`h-1 rounded-full transition-all duration-300 ${index === activeIndex ? 'w-8 bg-[#f84e76]' : 'w-1.5 bg-[#211e19]/20 hover:bg-[#211e19]/50'}`} aria-label={`${index + 1}번째 이야기 선택`} />
              ))}
            </div>
            <button type="button" onClick={() => moveBy(1)} onDragStart={(event) => event.preventDefault()} draggable={false} className="select-none text-sm text-[#786d5e] transition-colors hover:text-[#211e19]" aria-label="다음 이야기">→</button>
          </div>
        </div>
      </div>
    </section>
  );
});
