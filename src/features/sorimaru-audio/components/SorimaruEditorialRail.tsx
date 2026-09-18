'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { ISorimaruApiService, SorimaruStoryItem } from '@/features/sorimaru-audio/types/sorimaru.types';
import { SORIMARU_THEME_CATEGORIES } from '@/features/sorimaru-audio/data/sorimaruCategoryData';
import { useSorimaruApiService } from '@/features/sorimaru-audio/context/SorimaruDependencyContext';
import { SORIMARU_RAIL_VISIBLE_BUFFER, getVisibleRailPositions, shouldFetchRailCategory } from './sorimaruEditorialRailModel';
import { palette, meok, surface, fontSize } from '@/design-system/tokens';

interface SorimaruEditorialRailProps {
  stories: SorimaruStoryItem[];
  storySets?: Record<string, SorimaruStoryItem[]>;
  apiService?: ISorimaruApiService;
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
    '/images/hanok/hanok-interior.png',
  ],
  nature: [
    '/images/hanok/hanok-porch.png',
    '/images/hanok/hanok-interior.png',
    '/images/hanok/maru-detail.png',
  ],
  sound: [
    '/images/hanok/changho-detail.png',
    '/images/hanok/giwa-detail.png',
    '/images/hanok/hanok-main.png',
  ],
  default: [
    '/images/hanok/hanok-main.png',
    '/images/hanok/hanok-exterior.png',
    '/images/hanok/hanok-interior.png',
  ],
};

const getFallbackImageSet = (story: SorimaruStoryItem) => {
  const category = `${story.category} ${story.title} ${story.locationName || ''}`;
  if (category.includes('한옥') || category.includes('고택')) return FALLBACK_IMAGE_SETS.hanok;
  if (category.includes('시장') || category.includes('장터')) return FALLBACK_IMAGE_SETS.market;
  if (category.includes('마을') || category.includes('골목')) return FALLBACK_IMAGE_SETS.village;
  if (category.includes('궁') || category.includes('역사')) return FALLBACK_IMAGE_SETS.palace;
  if (category.includes('자연') || category.includes('길')) return FALLBACK_IMAGE_SETS.nature;
  if (category.includes('소리') || category.includes('문화')) return FALLBACK_IMAGE_SETS.sound;
  return FALLBACK_IMAGE_SETS.default;
};

const fallbackImageFor = (story: SorimaruStoryItem) => {
  const imageSet = getFallbackImageSet(story);
  const seed = Array.from(story.stid || story.title).reduce((total, char) => total + char.charCodeAt(0), 0);
  return imageSet[seed % imageSet.length];
};

const isTrustedSorimaruImage = (imageUrl: string) =>
  /^https?:\/\//i.test(imageUrl) &&
  !imageUrl.includes('unsplash.com') &&
  !imageUrl.includes('pixabay.com');

const durationFor = (story: SorimaruStoryItem) =>
  story.formattedDuration ||
  `${Math.floor((Number(story.playTime) || 0) / 60)}:${String((Number(story.playTime) || 0) % 60).padStart(2, '0')}`;



const CardMotionButton = styled(motion.button)<{ $isActive: boolean }>`
  position: relative;
  height: 250px;
  width: 135px;
  flex-shrink: 0;
  user-select: none;
  overflow: hidden;
  border-radius: 1.25rem;
  isolation: isolate;
  background-color: transparent;
  text-align: left;
  outline: none;
  border: none;
  cursor: pointer;
  z-index: ${({ $isActive }) => ($isActive ? 20 : 10)};
  box-shadow: ${({ $isActive }) =>
    $isActive ? '0 12px 28px rgba(0, 0, 0, 0.12)' : '0 4px 14px rgba(0, 0, 0, 0.04)'};
  filter: ${({ $isActive }) => ($isActive ? 'none' : 'grayscale(0.12)')};
  transition: box-shadow 0.3s ease, filter 0.3s ease;

  [data-theme='dark'] & {
    background-color: ${surface.dark.card};
    box-shadow: ${({ $isActive }) =>
      $isActive ? '0 14px 32px rgba(0, 0, 0, 0.45)' : '0 4px 14px rgba(0, 0, 0, 0.25)'};
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  &:hover {
    filter: grayscale(0);
  }

  @media (min-width: 640px) {
    height: 330px;
    width: 200px;
  }
  @media (min-width: 1024px) {
    height: 370px;
    width: 225px;
  }
`;

const CardBottomPanel = styled.div<{ $isActive: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  box-sizing: border-box;
  width: 100%;
  padding: 1rem;
  color: ${meok[900]};
  backdrop-filter: blur(24px);
  border-bottom-left-radius: 1.25rem;
  border-bottom-right-radius: 1.25rem;
  overflow: hidden;

  background-color: ${({ $isActive }) =>
    $isActive ? 'rgba(255, 240, 246, 0.68)' : 'rgba(255, 255, 255, 0.46)'};

  [data-theme='dark'] & {
    color: ${meok[100]};
    background-color: ${({ $isActive }) =>
      $isActive ? 'rgba(45, 41, 36, 0.92)' : 'rgba(36, 33, 29, 0.85)'};
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  @media (min-width: 640px) {
    padding: 1.25rem;
  }
`;

const CarouselStageWrapper = styled.div`
  position: relative;
  isolation: isolate;
  margin-top: 0;
  width: 100%;
  height: 380px;
  overflow: hidden;
  background-color: transparent;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  border-radius: 1.25rem;
  transition: background-color 0.3s ease;

  @media (min-width: 640px) {
    height: 430px;
  }
  @media (min-width: 1024px) {
    height: 460px;
  }

  [data-theme='dark'] & {
    background-color: ${surface.dark.surface};
  }
`;

const CategoryTabButton = styled.button<{ $isSelected: boolean }>`
  user-select: none;
  white-space: nowrap;
  font-size: 0.75rem;
  transition: color 0.3s ease;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: ${({ $isSelected }) => ($isSelected ? 600 : 400)};
  color: ${({ $isSelected }) => ($isSelected ? palette.jangmi[400] : meok[700])};

  [data-theme='dark'] & {
    color: ${({ $isSelected }) => ($isSelected ? palette.jangmi[400] : meok[400])};

    &:hover {
      color: ${({ $isSelected }) => ($isSelected ? palette.jangmi[400] : meok[200])};
    }
  }
`;

interface EditorialRailCardProps {
  story: SorimaruStoryItem;
  position: number;
  offset: number;
  trackTransitionEnabled: boolean;
  onInteractRef: React.MutableRefObject<(position: number) => void>;
}

const EditorialRailCard = React.memo<EditorialRailCardProps>(
  function EditorialRailCard({ story, position, offset, trackTransitionEnabled, onInteractRef }) {
    const distance = Math.abs(offset);
    const isVisible = distance <= SORIMARU_RAIL_VISIBLE_BUFFER;
    const isActive = offset === 0;
    const initialImageSrc = story.imageUrl || fallbackImageFor(story);
    const tilt = isActive
      ? 0
      : offset < 0
      ? Math.abs(offset) % 2 === 1
        ? 1.6
        : -1.6
      : offset % 2 === 1
      ? -1.6
      : 1.6;
    const lift = isActive
      ? 0
      : offset < 0
      ? Math.abs(offset) % 2 === 1
        ? -6
        : 6
      : offset % 2 === 1
      ? 6
      : -6;

    return (
      <CardMotionButton
        type="button"
        animate={{
          opacity: isVisible ? 1 : 0,
          y: lift,
          rotate: tilt,
          scale: isActive ? 1 : distance === 1 ? 0.92 : 0.84,
        }}
        transition={{ duration: trackTransitionEnabled && isVisible ? 0.48 : 0, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => onInteractRef.current(position)}
        $isActive={isActive}
        draggable={false}
        onMouseDown={(event) => event.preventDefault()}
        aria-label={`${story.title}${isActive ? ' 현재 선택됨' : ''}`}
      >
        <motion.div
          style={{ position: 'absolute', inset: 0, borderRadius: '1.25rem', overflow: 'hidden' }}
          animate={{ opacity: isActive ? 1 : 0.54 }}
          transition={{ duration: trackTransitionEnabled && isVisible ? 0.48 : 0, ease: [0.16, 1, 0.3, 1] }}
        >
          <img
            src={initialImageSrc}
            alt=""
            draggable={false}
            loading={distance <= 3 ? 'eager' : 'lazy'}
            decoding="async"
            style={{ height: '100%', width: '100%', objectFit: 'cover' }}
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
          <div
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(255, 255, 255, 0.55), transparent 60%, rgba(0, 0, 0, 0.05))',
            }}
          />
        </motion.div>

        <CardBottomPanel $isActive={isActive}>
          <p
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: fontSize.micro,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: palette.jangmi[400],
            }}
          >
            {story.category && story.category !== '오디 이야기' && story.category !== '소리 이야기' ? story.category : story.badgeText || '소리마루 해설'}
          </p>
          <CardTitle>
            {story.title}
          </CardTitle>
          <CardSub>
            {story.locationName || '대한민국 문화유산'}
          </CardSub>
          {isActive && (
            <span
              style={{
                marginTop: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: fontSize.micro,
                color: palette.jangmi[400],
              }}
            >
              {durationFor(story)} <span style={{ color: meok[700] }}>↗</span>
            </span>
          )}
        </CardBottomPanel>
      </CardMotionButton>
    );
  },
  (previous, next) => {
    const previousVisible = Math.abs(previous.offset) <= 4;
    const nextVisible = Math.abs(next.offset) <= 4;
    if (!previousVisible && !nextVisible) return previous.story === next.story;
    return (
      previous.story === next.story &&
      previous.offset === next.offset &&
      previous.trackTransitionEnabled === next.trackTransitionEnabled
    );
  }
);

const TRANSITION_SAFETY_TIMEOUT_MS = 900;

const NavSideButton = styled.button<{ $side: 'left' | 'right' }>`
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  width: 3.5rem;
  cursor: pointer;
  align-items: center;
  border: none;
  background: transparent;
  transition: all 0.2s ease;

  @media (min-width: 640px) {
    width: 4.5rem;
  }
  @media (min-width: 1024px) {
    width: 5.5rem;
  }

  ${({ $side }) =>
    $side === 'left'
      ? `
        left: 0;
        justify-content: flex-start;
        padding-left: 0.5rem;
        @media (min-width: 640px) {
          padding-left: 0.75rem;
        }
      `
      : `
        right: 0;
        justify-content: flex-end;
        padding-right: 0.5rem;
        @media (min-width: 640px) {
          padding-right: 0.75rem;
        }
      `}

  &:active {
    opacity: 0.8;
  }

  span.icon-box {
    display: flex;
    height: 2.75rem;
    width: 2.25rem;
    align-items: center;
    justify-content: center;
    border-radius: 0.75rem;
    background-color: rgba(255, 255, 255, 0.75);
    color: ${meok[900]};
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.6);
    transition: transform 0.3s ease, background-color 0.3s ease, color 0.3s ease;

    [data-theme='dark'] & {
      background-color: rgba(45, 41, 36, 0.85);
      color: ${meok[200]};
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
    }
  }

  &:hover span.icon-box {
    transform: scale(1.1);
    background-color: #ffffff;
    color: ${palette.jangmi[400]};

    [data-theme='dark'] & {
      background-color: ${surface.dark.elevated};
      color: ${palette.jangmi[400]};
    }
  }
`;

const CardTitle = styled.h3`
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: var(--font-hanok);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.03em;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const CardSub = styled.p`
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${fontSize.micro};
  line-height: 1rem;
  color: ${meok[700]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const IndicatorDot = styled.button<{ $active: boolean }>`
  height: 4px;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;

  ${({ $active }) =>
    $active
      ? `
        width: 2rem;
        background-color: ${palette.jangmi[500]};
      `
      : `
        width: 6px;
        background-color: rgba(33, 30, 25, 0.2);
        &:hover {
          background-color: rgba(33, 30, 25, 0.5);
        }
      `}
`;

export const SorimaruEditorialRail = React.memo<SorimaruEditorialRailProps>(
  function SorimaruEditorialRail({ stories, storySets, apiService, isLoading = false, onApiError }) {
    const activeApiService = useSorimaruApiService(apiService);
    const setCurrentStory = useSorimaruAudioStore((state) => state.setCurrentStory);
    const [selectedKeyword, setSelectedKeyword] = useState(SORIMARU_THEME_CATEGORIES[0].keyword);
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);
    const [categoryStories, setCategoryStories] = useState<SorimaruStoryItem[] | null>(null);
    const [isRailNearby, setIsRailNearby] = useState(false);
    const categoryCacheMapRef = useRef<Record<string, SorimaruStoryItem[]>>({});
    const categoryLoadPromisesRef = useRef<Record<string, Promise<SorimaruStoryItem[]>>>({});
    const [cachedImageUrls, setCachedImageUrls] = useState<Record<string, string>>(() => {
      if (typeof window === 'undefined') return {};
      try {
        const stored = window.localStorage.getItem('onmaru_sorimaru_story_images');
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

      const observer = new IntersectionObserver(([entry]) => setIsRailNearby(entry.isIntersecting), {
        rootMargin: '320px 0px',
      });
      observer.observe(rail);
      return () => observer.disconnect();
    }, []);

    const loadCategoryStories = useCallback(
      (keyword: string) => {
        const cached = categoryCacheMapRef.current[keyword];
        if (cached) return Promise.resolve(cached);

        const pending = categoryLoadPromisesRef.current[keyword];
        if (pending) return pending;

        const request = activeApiService.getStoryList(undefined, keyword).then((nextStories) => {
          const validStories = nextStories.filter((story) => story.audioUrl);
          categoryCacheMapRef.current[keyword] = validStories;
          return validStories;
        });
        categoryLoadPromisesRef.current[keyword] = request;
        void request.then(
          () => {
            if (categoryLoadPromisesRef.current[keyword] === request) {
              delete categoryLoadPromisesRef.current[keyword];
            }
          },
          () => {
            if (categoryLoadPromisesRef.current[keyword] === request) {
              delete categoryLoadPromisesRef.current[keyword];
            }
          }
        );
        return request;
      },
      [activeApiService]
    );

    const featured = useMemo(() => {
      const category =
        SORIMARU_THEME_CATEGORIES.find((item) => item.keyword === selectedKeyword) ??
        SORIMARU_THEME_CATEGORIES[0];
      const localCategoryStories =
        storySets?.[category.label] ??
        stories.filter((story) => {
          const searchable = `${story.category} ${story.title} ${story.locationName}`.toLowerCase();
          return searchable.includes(category.keyword.toLowerCase());
        });
      const recommendationStories = storySets?.['추천'];
      const cachedCategory = categoryCacheMapRef.current[selectedKeyword];

      const source =
        categoryStories !== null
          ? categoryStories
          : cachedCategory && cachedCategory.length
          ? cachedCategory
          : localCategoryStories.length
          ? localCategoryStories
          : recommendationStories?.length
          ? recommendationStories
          : stories;

      return source
        .filter((story) => Boolean(story.audioUrl))
        .slice(0, 10)
        .map((story) =>
          !story.imageUrl && cachedImageUrls[story.stid]
            ? { ...story, imageUrl: cachedImageUrls[story.stid] }
            : story
        );
    }, [cachedImageUrls, categoryStories, selectedKeyword, stories, storySets]);

    const activeIndex = featured.length
      ? ((activePosition % featured.length) + featured.length) % featured.length
      : 0;
    const activeStory = featured[activeIndex] ?? featured[0];

    const visibleVirtualPositions = useMemo(() => {
      const list: { pos: number; story: SorimaruStoryItem }[] = [];
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
      if (
        !shouldFetchRailCategory({ isRailNearby, isSelected: true, isInteracted: false }) ||
        categoryStories !== null ||
        categoryRequestPendingRef.current
      )
        return;
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
      const newlyCached = [...stories, ...(categoryStories || [])].reduce<Record<string, string>>(
        (result, story) => {
          if (story.stid && isTrustedSorimaruImage(story.imageUrl)) result[story.stid] = story.imageUrl;
          return result;
        },
        {}
      );
      if (!Object.keys(newlyCached).length) return;

      const cacheId = window.setTimeout(() => {
        setCachedImageUrls((previous) => {
          const next = { ...previous, ...newlyCached };
          try {
            window.localStorage.setItem('onmaru_sorimaru_story_images', JSON.stringify(next));
          } catch {
            // ignore
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

    const moveBy = useCallback(
      (delta: number, resetAuto = true) => {
        if (!delta || featured.length < 2 || inputLockedRef.current) return;
        if (resetAuto) lockInputForTransition();
        if (resetAuto) setAutoResetToken((token) => token + 1);
        setActivePosition((position) => position + delta);
      },
      [featured.length, lockInputForTransition]
    );

    const moveTo = useCallback(
      (index: number) => {
        let delta = index - activeIndex;
        if (delta > featured.length / 2) delta -= featured.length;
        if (delta < -featured.length / 2) delta += featured.length;
        moveBy(delta);
      },
      [activeIndex, featured.length, moveBy]
    );

    useEffect(() => {
      if (featured.length < 2) return;
      const timer = window.setInterval(() => moveBy(1, false), 7000);
      return () => window.clearInterval(timer);
    }, [autoResetToken, featured.length, moveBy]);

    useEffect(
      () => () => {
        if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
        if (unlockTimerRef.current !== null) window.clearTimeout(unlockTimerRef.current);
      },
      []
    );

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

    const preloadCategory = useCallback(
      (keyword: string) => {
        if (
          !shouldFetchRailCategory({
            isRailNearby,
            isSelected: keyword === selectedKeyword,
            isInteracted: true,
          })
        )
          return;
        if (categoryCacheMapRef.current[keyword]) return;

        loadCategoryStories(keyword).then((nextStories) => {
          categoryCacheMapRef.current[keyword] = nextStories;
        });
      },
      [isRailNearby, loadCategoryStories, selectedKeyword]
    );

    cardInteractionRef.current = (position) => {
      const offset = position - activePosition;
      const story = visibleVirtualPositions.find((item) => item.pos === position)?.story;
      moveBy(offset);
      if (offset === 0 && story) setCurrentStory(story);
    };

    const showSkeleton = !activeStory && (isLoading || isCategoryLoading);

    if (!activeStory && !showSkeleton) {
      return (
        <section
          ref={railRef}
          aria-label="소리마루 추천"
          style={{
            position: 'relative',
            marginLeft: 'auto',
            marginRight: 'auto',
            display: 'flex',
            minHeight: 355,
            width: '100%',
            maxWidth: '72rem',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: '0.75rem 0',
          }}
        >
          <p style={{ fontSize: '0.875rem', color: meok[700] }}>이 주제의 이야기를 찾지 못했어요.</p>
        </section>
      );
    }

    return (
      <section
        ref={railRef}
        aria-label="소리마루 추천"
        aria-busy={showSkeleton}
        style={{
          position: 'relative',
          marginLeft: 'auto',
          marginRight: 'auto',
          width: '100%',
          maxWidth: 'none',
          padding: '0.75rem 0 1.5rem',
        }}
      >
        <div style={{ width: '100%', padding: 0 }}>
          <div style={{ position: 'relative', paddingBottom: '0.5rem', paddingTop: '0.25rem' }}>
            <div style={{ marginLeft: 'auto', marginRight: 'auto', marginBottom: '0.75rem', width: '100%', maxWidth: '72rem' }}>
              <nav style={{ overflowX: 'auto', scrollbarWidth: 'none' }} aria-label="장면 카테고리">
                <div style={{ display: 'flex', minWidth: 'max-content', alignItems: 'center', gap: '1rem' }}>
                  {SORIMARU_THEME_CATEGORIES.map((category) => {
                    const isSelected = selectedKeyword === category.keyword;
                    return (
                      <CategoryTabButton
                        key={category.id}
                        type="button"
                        onClick={() => handleCategoryChange(category.keyword)}
                        onPointerEnter={() => preloadCategory(category.keyword)}
                        onFocus={() => preloadCategory(category.keyword)}
                        aria-pressed={isSelected}
                        $isSelected={isSelected}
                      >
                        #{category.keyword === '시장' ? '전통시장' : category.keyword === '마을' ? '전통마을' : category.keyword === '궁' ? '궁궐' : category.keyword === '길' ? '자연' : category.keyword}
                      </CategoryTabButton>
                    );
                  })}
                </div>
              </nav>
            </div>

            <CarouselStageWrapper>
              {/* 좌측 탐색 버튼 */}
              <NavSideButton
                type="button"
                onClick={() => moveBy(-1)}
                onDragStart={(event) => event.preventDefault()}
                draggable={false}
                aria-label="이전 이야기"
                $side="left"
              >
                <span className="icon-box">
                  <ChevronLeft size={22} strokeWidth={2} />
                </span>
              </NavSideButton>

              {/* 우측 탐색 버튼 */}
              <NavSideButton
                type="button"
                onClick={() => moveBy(1)}
                onDragStart={(event) => event.preventDefault()}
                draggable={false}
                aria-label="다음 이야기"
                $side="right"
              >
                <span className="icon-box">
                  <ChevronRight size={22} strokeWidth={2} />
                </span>
              </NavSideButton>

              {!showSkeleton && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    overflow: 'hidden',
                    maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '1.75rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      transform: `translate3d(${-trackMetrics.cardStep * activePosition}px, 0, 0)`,
                      transition: trackTransitionEnabled
                        ? 'transform 480ms cubic-bezier(0.16, 1, 0.3, 1)'
                        : 'none',
                      willChange: 'transform',
                      pointerEvents: 'auto',
                    }}
                    onTransitionEnd={handleTrackTransitionEnd}
                  >
                    {visibleVirtualPositions.map(({ pos, story: cardStory }) => (
                      <div
                        key={pos}
                        style={{
                          position: 'absolute',
                          left: `${pos * trackMetrics.cardStep - trackMetrics.cardWidth / 2}px`,
                          top: 0,
                        }}
                      >
                        <EditorialRailCard
                          story={cardStory}
                          position={pos}
                          offset={pos - activePosition}
                          trackTransitionEnabled={trackTransitionEnabled}
                          onInteractRef={cardInteractionRef}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CarouselStageWrapper>

            {/* 하단 인디케이터 바 */}
            <div style={{ position: 'relative', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '1.25rem', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {featured.map((storyItem, index) => (
                  <IndicatorDot
                    key={`${storyItem.stid}-${index}`}
                    type="button"
                    onClick={() => moveTo(index)}
                    $active={index === activeIndex}
                    aria-label={`${index + 1}번째 이야기 선택`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
);
