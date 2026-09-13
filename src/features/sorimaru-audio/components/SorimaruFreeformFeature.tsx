'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play, Heart } from 'lucide-react';
import { LocalMiniPlayer } from './LocalMiniPlayer';
import { SavedSoundDrawer } from './SavedSoundDrawer';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SorimaruStoryItem, ISorimaruApiService } from '@/features/sorimaru-audio/types/sorimaru.types';
import { useSorimaruApiService } from '@/features/sorimaru-audio/context/SorimaruDependencyContext';
import { palette, meok, fontSize } from '@/design-system/tokens';

interface SorimaruFreeformFeatureProps {
  apiService?: ISorimaruApiService;
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

function uniqueStories(stories: SorimaruStoryItem[]): SorimaruStoryItem[] {
  const seen = new Set<string>();
  return stories.filter((story) => {
    if (!story.stid || seen.has(story.stid)) return false;
    seen.add(story.stid);
    return true;
  });
}

function storyMatchesTopic(story: SorimaruStoryItem, keyword: string): boolean {
  return [story.category, story.title, story.audioTitle, story.locationName, story.script]
    .filter(Boolean)
    .join(' ')
    .includes(keyword);
}

function PlayGlyph({ playing = false }: { playing?: boolean }) {
  return playing ? (
    <Pause size={14} strokeWidth={2} />
  ) : (
    <Play size={14} fill="currentColor" style={{ marginLeft: 2 }} />
  );
}

const placeholderStory: SorimaruStoryItem = {
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

// ==========================================
// Styled Components
// ==========================================
const PageContainer = styled.div`
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background-color: #e9e9e3;
  color: ${meok[900]};
  padding: 0 1.5rem;
  @media (min-width: 640px) {
    padding: 0 2.5rem;
  }

  &::selection {
    background-color: ${palette.kobalt[500]};
    color: #ffffff;
  }
`;

const BgBlob1 = styled.div`
  pointer-events: none;
  position: absolute;
  left: 7%;
  top: 6rem;
  width: 9rem;
  height: 9rem;
  border-radius: 9999px;
  background-color: #d5f05a;
  mix-blend-mode: multiply;
  filter: blur(1px);
  @media (min-width: 640px) {
    width: 14rem;
    height: 14rem;
  }
`;

const BgBlob2 = styled.div`
  pointer-events: none;
  position: absolute;
  right: -8%;
  top: 30rem;
  width: 16rem;
  height: 16rem;
  border-radius: 9999px;
  background-color: ${palette.kobalt[500]};
  opacity: 0.9;
  mix-blend-mode: multiply;
  @media (min-width: 640px) {
    width: 30rem;
    height: 30rem;
  }
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 10;
  width: 100%;
`;

const Header = styled.header`
  border-bottom: 2px solid ${meok[900]};
`;

const HeaderInner = styled.div`
  display: flex;
  min-height: 3.5rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.16em;
`;

const HeaderLink = styled(Link)`
  flex-shrink: 0;
  color: inherit;
  text-decoration: none;
  transition: color 0.2s ease;
  &:hover {
    color: ${palette.kobalt[500]};
  }
`;

const HeaderSubLink = styled(Link)`
  flex-shrink: 0;
  color: inherit;
  text-decoration: none;
  padding-bottom: 2px;
  text-transform: none;
  letter-spacing: normal;
  transition: color 0.2s ease;
  &:hover {
    color: ${palette.kobalt[500]};
  }
`;

const HeroSection = styled.section`
  position: relative;
  display: grid;
  gap: 2.5rem;
  border-bottom: 2px solid ${meok[900]};
  padding: 3.5rem 0;
  @media (min-width: 640px) {
    padding: 5rem 0;
  }
  @media (min-width: 1024px) {
    grid-template-columns: minmax(0, 1.12fr) minmax(300px, 0.88fr);
    gap: 4rem;
    padding: 6rem 0;
  }
`;

const HeroBadge = styled.p`
  margin-bottom: 1.5rem;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  color: ${palette.kobalt[500]};
`;

const HeroTitle = styled.h1`
  max-width: 56rem;
  font-size: clamp(3.5rem, 9vw, 8.8rem);
  font-weight: 900;
  line-height: 0.83;
  letter-spacing: -0.09em;
`;

const HighlightWord = styled.span`
  position: relative;
  display: inline-block;
  color: ${palette.kobalt[500]};
`;

const AccentDot = styled.span`
  position: absolute;
  right: -0.75rem;
  top: 50%;
  width: 0.75rem;
  height: 0.75rem;
  transform: translateY(-50%);
  border-radius: 9999px;
  background-color: ${palette.danpung[500]};
  @media (min-width: 640px) {
    right: -1.25rem;
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const HeroDesc = styled.p`
  margin-top: 2rem;
  max-width: 28rem;
  font-size: ${fontSize.sm};
  line-height: 1.75;
  color: ${meok[700]};
  @media (min-width: 640px) {
    font-size: ${fontSize.base};
  }
`;

const HeroActions = styled.div`
  margin-top: 2rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
`;

const ListenBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background-color: ${meok[900]};
  padding: 0.75rem 1.25rem;
  font-size: ${fontSize.xs};
  font-weight: 700;
  color: #d5f05a;
  text-decoration: none;
  transition: transform 0.2s ease;
  &:hover {
    transform: translateY(-4px);
  }
`;

const ListenMotto = styled.span`
  font-size: 10px;
  color: ${meok[500]};
`;

const VisualStage = styled.div`
  position: relative;
  min-height: 330px;
  @media (min-width: 1024px) {
    min-height: 470px;
  }
`;

const VisualCard = styled(motion.div)`
  position: absolute;
  left: 1rem;
  right: 1rem;
  top: 1rem;
  bottom: 0;
  overflow: hidden;
  background-color: #d5f05a;
  padding: 0.75rem;
  border: 2px solid ${meok[900]};
  @media (min-width: 640px) {
    left: 3rem;
    right: 3rem;
    padding: 1rem;
  }

  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(0.2);
  }
`;

const VisualOverlay = styled.div`
  position: absolute;
  inset: 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(to bottom, rgba(23, 23, 23, 0.45), transparent, rgba(23, 23, 23, 0.7));
  padding: 1rem;
  color: #ffffff;
  @media (min-width: 640px) {
    inset: 1rem;
    padding: 1.5rem;
  }
`;

const VisualPill = styled.span`
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 20;
  background-color: ${palette.danpung[500]};
  padding: 0.5rem 0.75rem;
  font-size: 10px;
  font-weight: 700;
  color: ${meok[900]};
`;

const ListenSection = styled.section`
  display: grid;
  border-bottom: 2px solid ${meok[900]};
  @media (min-width: 1024px) {
    grid-template-columns: 190px minmax(0, 1fr);
  }
`;

const TopicSidebar = styled.aside`
  border-bottom: 2px solid ${meok[900]};
  padding: 1.75rem 0;
  @media (min-width: 1024px) {
    border-bottom: none;
    border-right: 2px solid ${meok[900]};
    padding: 2.5rem 0;
  }
`;

const TopicNav = styled.nav`
  margin-top: 1.25rem;
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  @media (min-width: 1024px) {
    display: block;
    overflow-x: visible;
    & > * + * {
      margin-top: 0.75rem;
    }
  }
`;

const TopicButton = styled.button<{ isActive: boolean }>`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.5rem;
  text-align: left;
  font-size: ${fontSize.sm};
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
  color: ${(props) => (props.isActive ? palette.kobalt[500] : meok[500])};
  font-weight: ${(props) => (props.isActive ? '700' : '400')};

  &:hover {
    color: ${(props) => (props.isActive ? palette.kobalt[500] : meok[900])};
  }

  @media (min-width: 1024px) {
    width: 100%;
  }
`;

const TopicIndicator = styled.span<{ isActive: boolean }>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  border: 1px solid ${meok[900]};
  background-color: ${(props) => (props.isActive ? palette.kobalt[500] : 'transparent')};
  transform: ${(props) => (props.isActive ? 'scale(1.25)' : 'none')};
  transition: transform 0.2s ease;
`;

const TopicMain = styled.div`
  min-width: 0;
  padding: 2.5rem 0;
  @media (min-width: 1024px) {
    padding-left: 2.5rem;
  }
`;

const StoryArticle = styled(motion.article)`
  display: grid;
  gap: 1.5rem;
  @media (min-width: 640px) {
    grid-template-columns: minmax(180px, 0.76fr) minmax(0, 1fr);
  }
`;

const StoryThumb = styled.div`
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background-color: #d5f05a;
  border: 2px solid ${meok[900]};
  @media (min-width: 640px) {
    aspect-ratio: auto;
    min-height: 310px;
  }

  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(0.15);
    transition: transform 0.7s ease;
    &:hover {
      transform: scale(1.05);
    }
  }
`;

const StoryQuote = styled.blockquote`
  margin-top: 1.75rem;
  border-left: 2px solid ${meok[900]};
  padding-left: 1rem;
  font-size: ${fontSize.base};
  line-height: 1.75;
  color: ${meok[700]};
`;

const PlayActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${palette.kobalt[500]};
  padding: 0.625rem 1rem;
  font-size: ${fontSize.xs};
  font-weight: 700;
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease;
  &:hover {
    transform: translateY(-2px);
  }
`;

const BookmarkActionButton = styled.button<{ isSaved: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: ${fontSize.xs};
  font-weight: 700;
  background: none;
  border: none;
  cursor: pointer;
  color: ${(props) => (props.isSaved ? palette.danpung[500] : meok[500])};
  transition: color 0.2s ease;
  &:hover {
    color: ${(props) => (props.isSaved ? palette.danpung[500] : meok[900])};
  }
`;

const SidebarStoryButton = styled.button<{ isActive: boolean }>`
  display: flex;
  width: 100%;
  gap: 0.75rem;
  padding: 1rem 0;
  text-align: left;
  background: none;
  border: none;
  border-top: 2px solid ${meok[900]};
  cursor: pointer;
  color: ${(props) => (props.isActive ? palette.kobalt[500] : meok[900])};

  &:hover .story-title {
    color: ${palette.kobalt[500]};
  }
`;

const LocalSignalSection = styled.section`
  position: relative;
  border-bottom: 2px solid ${meok[900]};
  background-color: ${palette.kobalt[500]};
  padding: 3rem 0;
  color: #ffffff;
  @media (min-width: 640px) {
    padding: 4rem 0;
  }
`;

const WatermarkNumber = styled.div`
  position: absolute;
  right: 2rem;
  top: 2rem;
  font-size: 4.5rem;
  font-weight: 900;
  line-height: 1;
  color: rgba(213, 240, 90, 0.8);
  pointer-events: none;
  @media (min-width: 640px) {
    font-size: 8rem;
  }
`;

const NearbyCard = styled.button<{ isSelected: boolean }>`
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem;
  text-align: left;
  transition: transform 0.2s ease;
  background-color: ${(props) => (props.isSelected ? '#d5f05a' : 'rgba(255, 255, 255, 0.1)')};
  color: ${(props) => (props.isSelected ? meok[900] : '#ffffff')};
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
  }

  & img {
    width: 72px;
    height: 72px;
    object-fit: cover;
    filter: grayscale(0.2);
  }
`;

const ArchiveGrid = styled.div`
  margin-top: 2rem;
  display: grid;
  gap: 3rem 1.5rem;
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const ArchiveArticle = styled.article<{ offsetType?: 'top' | 'bottom' }>`
  ${(props) =>
    props.offsetType === 'top' &&
    `
    @media (min-width: 1024px) {
      margin-top: 4rem;
    }
  `}
  ${(props) =>
    props.offsetType === 'bottom' &&
    `
    @media (min-width: 1024px) {
      margin-top: -2.5rem;
    }
  `}

  &:hover .play-btn {
    opacity: 1;
  }

  &:hover .poster-img {
    transform: scale(1.05);
  }

  &:hover .story-card-title {
    color: ${palette.kobalt[500]};
  }
`;

const ArchivePoster = styled.div<{ isFirst?: boolean }>`
  position: relative;
  overflow: hidden;
  background-color: #d5f05a;
  border: 2px solid ${meok[900]};
  aspect-ratio: ${(props) => (props.isFirst ? '4 / 5' : '4 / 3')};

  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(0.18);
    transition: transform 0.7s ease;
  }
`;

const ArchiveIndexBadge = styled.span`
  position: absolute;
  left: 0.75rem;
  top: 0.75rem;
  background-color: ${meok[900]};
  padding: 0.25rem 0.5rem;
  font-family: monospace;
  font-size: 10px;
  color: #d5f05a;
`;

const ArchiveBookmarkBtn = styled.button<{ isSaved: boolean }>`
  position: absolute;
  right: 0.75rem;
  top: 0.75rem;
  display: flex;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border: 1px solid ${meok[900]};
  cursor: pointer;
  background-color: ${(props) => (props.isSaved ? palette.danpung[500] : '#e9e9e3')};
  color: ${meok[900]};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #d5f05a;
  }
`;

const ArchivePlayBtn = styled.button`
  position: absolute;
  bottom: 0.75rem;
  left: 0.75rem;
  display: flex;
  width: 2.25rem;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background-color: ${palette.kobalt[500]};
  color: #ffffff;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
`;

const FreeformFooter = styled.footer`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.5rem;
  border-top: 2px solid ${meok[900]};
  padding: 2rem 0;
  font-size: ${fontSize.xs};
  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
  }
`;

export const SorimaruFreeformFeature: React.FC<SorimaruFreeformFeatureProps> = ({ apiService }) => {
  const activeApiService = useSorimaruApiService(apiService);
  const [storyPool, setStoryPool] = useState<SorimaruStoryItem[]>([]);
  const [topicStories, setTopicStories] = useState<SorimaruStoryItem[]>([]);
  const [nearbyStories, setNearbyStories] = useState<SorimaruStoryItem[]>([]);
  const [activeTopic, setActiveTopic] = useState('한옥');
  const [activeIndex, setActiveIndex] = useState(0);
  const [nearbyIndex, setNearbyIndex] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locationMessage, setLocationMessage] = useState('내 위치를 허용하면 가까운 이야기를 먼저 보여드려요.');
  const [savedStories, setSavedStories] = useState<SorimaruStoryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('onmaru_saved_sorimaru_stories');
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const currentStory = useSorimaruAudioStore((state) => state.currentStory);
  const isPlaying = useSorimaruAudioStore((state) => state.isPlaying);
  const setCurrentStory = useSorimaruAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useSorimaruAudioStore((state) => state.setIsPlaying);

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

  const playStory = (story: SorimaruStoryItem) => {
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  const toggleBookmark = (story: SorimaruStoryItem) => {
    setSavedStories((previous) => {
      const next = previous.some((saved) => saved.stid === story.stid)
        ? previous.filter((saved) => saved.stid !== story.stid)
        : [story, ...previous];
      try {
        localStorage.setItem('onmaru_saved_sorimaru_stories', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const removeBookmark = (storyId: string) => {
    setSavedStories((previous) => {
      const next = previous.filter((story) => story.stid !== storyId);
      try {
        localStorage.setItem('onmaru_saved_sorimaru_stories', JSON.stringify(next));
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
    <PageContainer>
      <BgBlob1 aria-hidden="true" />
      <BgBlob2 aria-hidden="true" />

      <ContentWrapper>
        <Header>
          <HeaderInner>
            <HeaderLink href="/sorimaru">ONMARU / SORIMARU</HeaderLink>
            <span style={{ display: 'none' }} className="sm-show">Field notes for a slower Korea</span>
            <HeaderSubLink href="/sorimaru">
              기존 버전 보기 ↗
            </HeaderSubLink>
          </HeaderInner>
        </Header>

        <main>
          <HeroSection>
            <div style={{ position: 'relative', zIndex: 10 }}>
              <HeroBadge>AUDIO TRAVEL / 01</HeroBadge>
              <HeroTitle>
                한국의<br />
                <HighlightWord>
                  장면
                  <AccentDot />
                </HighlightWord>을
                <br />귀로 걷는 중
              </HeroTitle>
              <HeroDesc>
                장소를 검색하기 전에, 마음이 먼저 반응하는 단어를 골라보세요.
                한 줄의 소리가 다음 산책의 방향을 바꿀 수도 있으니까요.
              </HeroDesc>
              <HeroActions>
                <ListenBtn href="#listen">
                  지금 듣기 <span style={{ fontSize: '1rem', lineHeight: 1 }}>↓</span>
                </ListenBtn>
                <ListenMotto>소리는 장소보다 먼저 도착한다</ListenMotto>
              </HeroActions>
            </div>

            <VisualStage>
              <VisualCard
                initial={{ opacity: 0, rotate: 4, y: 18 }}
                animate={{ opacity: 1, rotate: -3, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <img src={activeStory.imageUrl || FALLBACK_IMAGE} alt={activeStory.title} />
                <VisualOverlay>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
                    <span>{activeTopicMeta.label}</span>
                    <span>VOL. {String(activeStory.stid).padStart(2, '0')}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: fontSize.xs, color: 'rgba(255, 255, 255, 0.75)' }}>{activeStory.locationName || '대한민국의 어느 장소'}</p>
                    <p style={{ marginTop: '0.5rem', maxWidth: '20rem', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.045em' }}>{activeStory.title}</p>
                  </div>
                </VisualOverlay>
              </VisualCard>
              <VisualPill>LISTEN / WALK / STAY</VisualPill>
            </VisualStage>
          </HeroSection>

          <ListenSection id="listen">
            <TopicSidebar>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: meok[500] }}>Choose a feeling</p>
                <p style={{ fontFamily: 'monospace', fontSize: fontSize.xs, color: palette.kobalt[500] }}>{String(TOPICS.length).padStart(2, '0')} themes</p>
              </div>
              <TopicNav aria-label="오디오 주제">
                {TOPICS.map((topic) => (
                  <TopicButton
                    key={topic.keyword}
                    type="button"
                    isActive={activeTopic === topic.keyword}
                    onClick={() => setActiveTopic(topic.keyword)}
                  >
                    <TopicIndicator isActive={activeTopic === topic.keyword} />
                    {topic.label}
                  </TopicButton>
                ))}
              </TopicNav>
            </TopicSidebar>

            <TopicMain>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem' }}>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: palette.danpung[500] }}>Today’s sound</p>
                  <h2 style={{ marginTop: '0.5rem', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.065em' }}>{activeTopicMeta.note}</h2>
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: fontSize.xs, color: meok[500] }}>0{safeActiveIndex + 1} / 0{Math.max(topicStories.length, 1)}</span>
              </div>

              <div style={{ marginTop: '2.25rem', display: 'grid', gap: '2rem' }}>
                <AnimatePresence mode="wait">
                  <StoryArticle
                    key={activeStory.stid}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.35 }}
                  >
                    <StoryThumb>
                      <img src={activeStory.imageUrl || FALLBACK_IMAGE} alt={activeStory.title} />
                      <span style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', backgroundColor: '#d5f05a', padding: '0.25rem 0.5rem', fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, color: meok[900] }}>
                        {activeStory.formattedDuration || 'audio'}
                      </span>
                    </StoryThumb>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', fontSize: '10px', color: meok[500] }}>
                          <span style={{ fontWeight: 700, color: palette.kobalt[500] }}>{activeTopicMeta.label}</span>
                          <span>{activeStory.locationName || '대한민국 문화유산'}</span>
                        </div>
                        <h3 style={{ marginTop: '0.75rem', fontSize: '2rem', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.065em' }}>{activeStory.title}</h3>
                        <p style={{ marginTop: '0.75rem', fontSize: fontSize.sm, fontWeight: 500, lineHeight: 1.5, color: meok[700] }}>{activeStory.audioTitle}</p>
                        <StoryQuote>“{excerpt(activeStory.script)}”</StoryQuote>
                      </div>
                      <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', borderTop: `2px solid ${meok[900]}`, paddingTop: '1rem' }}>
                        <PlayActionButton type="button" onClick={() => playStory(activeStory)}>
                          <PlayGlyph playing={isActivePlaying} />
                          {isActivePlaying ? '잠시 멈추기' : '이야기 듣기'}
                        </PlayActionButton>
                        <BookmarkActionButton type="button" isSaved={savedIds.has(activeStory.stid)} onClick={() => toggleBookmark(activeStory)}>
                          {savedIds.has(activeStory.stid) ? <Heart size={14} strokeWidth={2} fill="currentColor" /> : <Heart size={14} strokeWidth={2} />}
                          <span>{savedIds.has(activeStory.stid) ? '담아둔 소리' : '마음에 담기'}</span>
                        </BookmarkActionButton>
                      </div>
                    </div>
                  </StoryArticle>
                </AnimatePresence>

                <div style={{ borderTop: `2px solid ${meok[900]}`, paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: meok[500] }}>More from this feeling</p>
                    <span style={{ fontFamily: 'monospace', fontSize: fontSize.xs, color: palette.kobalt[500] }}>{String(topicStories.length).padStart(2, '0')}</span>
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    {topicStories.slice(0, 4).map((story, index) => (
                      <SidebarStoryButton key={story.stid} type="button" isActive={story.stid === activeStory.stid} onClick={() => setActiveIndex(index)}>
                        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: meok[500] }}>0{index + 1}</span>
                        <span style={{ minWidth: 0, flex: 1 }}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '10px', color: meok[500] }}>{story.locationName || '소리의 장소'}</span>
                          <span className="story-title" style={{ marginTop: '0.25rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: fontSize.sm, fontWeight: 700, transition: 'color 0.2s' }}>{story.title}</span>
                        </span>
                        <span style={{ paddingTop: '0.25rem', fontSize: fontSize.xs }}>↗</span>
                      </SidebarStoryButton>
                    ))}
                  </div>
                </div>
              </div>
            </TopicMain>
          </ListenSection>

          <LocalSignalSection>
            <WatermarkNumber aria-hidden="true">03</WatermarkNumber>
            <div style={{ position: 'relative', display: 'grid', gap: '2rem' }}>
              <div>
                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#d5f05a' }}>Local signal</p>
                <h2 style={{ marginTop: '0.75rem', maxWidth: '28rem', fontSize: '2.5rem', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.07em' }}>오늘,<br />여기에서</h2>
                <p style={{ marginTop: '1.25rem', maxWidth: '20rem', fontSize: fontSize.xs, lineHeight: 1.5, color: 'rgba(255, 255, 255, 0.75)' }}>{locationMessage}</p>
                <button
                  type="button"
                  onClick={locate}
                  disabled={isLocating}
                  style={{ marginTop: '1.5rem', padding: '0.625rem 1rem', fontSize: fontSize.xs, fontWeight: 700, border: '1px solid #ffffff', backgroundColor: 'transparent', color: '#ffffff', cursor: isLocating ? 'not-allowed' : 'pointer', opacity: isLocating ? 0.5 : 1, transition: 'all 0.2s ease' }}
                >
                  {isLocating ? '살펴보는 중…' : '내 위치 사용 ↗'}
                </button>
              </div>
              <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                {nearbyStories.slice(0, 4).map((story, index) => {
                  const isCurrent = currentStory.stid === story.stid;
                  return (
                    <NearbyCard
                      key={story.stid}
                      type="button"
                      isSelected={story.stid === nearbyStory.stid}
                      onClick={() => { setNearbyIndex(index); playStory(story); }}
                    >
                      <img src={story.imageUrl || FALLBACK_IMAGE} alt="" />
                      <span style={{ minWidth: 0, alignSelf: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: story.stid === nearbyStory.stid ? palette.danpung[500] : '#d5f05a' }}>
                          0{index + 1} / {story.distance || 'near'}
                        </span>
                        <span style={{ marginTop: '0.25rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: fontSize.sm, fontWeight: 700 }}>
                          {story.title}
                        </span>
                        <span style={{ marginTop: '0.25rem', display: 'block', fontSize: '10px', color: story.stid === nearbyStory.stid ? meok[700] : 'rgba(255, 255, 255, 0.65)' }}>
                          {isCurrent && isPlaying ? '재생 중' : '이야기 듣기'} ↗
                        </span>
                      </span>
                    </NearbyCard>
                  );
                })}
              </div>
              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.3)', paddingTop: '1rem' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#d5f05a' }}>Selected nearby sound</p>
                  <p style={{ marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: fontSize.sm, fontWeight: 700 }}>{nearbyStory.title}</p>
                </div>
                <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: '0.5rem' }}>
                  <button type="button" onClick={() => moveNearby(-1)} aria-label="이전 주변 이야기" style={{ display: 'flex', width: '2.25rem', height: '2.25rem', alignItems: 'center', justifyContent: 'center', border: '1px solid #ffffff', background: 'none', color: '#ffffff', cursor: 'pointer' }}>←</button>
                  <button
                    type="button"
                    onClick={() => playStory(nearbyStory)}
                    aria-label={isNearbyPlaying ? '주변 이야기 일시정지' : '주변 이야기 재생'}
                    style={{ display: 'flex', height: '2.25rem', minWidth: '6rem', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#d5f05a', padding: '0 0.75rem', fontSize: '10px', fontWeight: 700, color: meok[900], border: 'none', cursor: 'pointer' }}
                  >
                    <PlayGlyph playing={isNearbyPlaying} />
                    {isNearbyPlaying ? '일시정지' : '재생'}
                  </button>
                  <button type="button" onClick={() => moveNearby(1)} aria-label="다음 주변 이야기" style={{ display: 'flex', width: '2.25rem', height: '2.25rem', alignItems: 'center', justifyContent: 'center', border: '1px solid #ffffff', background: 'none', color: '#ffffff', cursor: 'pointer' }}>→</button>
                  <span style={{ marginLeft: '0.25rem', fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    {String(safeNearbyIndex + 1).padStart(2, '0')} / {String(Math.max(nearbyStories.length, 1)).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
          </LocalSignalSection>

          <section style={{ padding: '3.5rem 0' }} id="archive">
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem', borderBottom: `2px solid ${meok[900]}`, paddingBottom: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: palette.danpung[500] }}>The archive</p>
                <h2 style={{ marginTop: '0.5rem', fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.07em' }}>계속 걷기</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
                <p style={{ maxWidth: '20rem', fontSize: fontSize.xs, lineHeight: 1.5, color: meok[500] }}>한 번에 다 보지 않아도 좋아요. 오늘 마음에 걸린 장면만 골라두세요.</p>
                <button
                  type="button"
                  onClick={reloadArchive}
                  disabled={isRefreshing}
                  style={{ marginTop: '0.75rem', flexShrink: 0, paddingBottom: '2px', fontSize: '10px', fontWeight: 700, color: palette.kobalt[500], background: 'none', border: 'none', borderBottom: `1px solid ${palette.kobalt[500]}`, cursor: isRefreshing ? 'not-allowed' : 'pointer', opacity: isRefreshing ? 0.5 : 1 }}
                >
                  {isRefreshing ? '다시 읽는 중…' : '장면 다시 읽기 ↻'}
                </button>
              </div>
            </div>

            <ArchiveGrid>
              {archiveStories.slice(0, 9).map((story, index) => {
                const isSaved = savedIds.has(story.stid);
                return (
                  <ArchiveArticle
                    key={story.stid}
                    offsetType={index === 1 ? 'top' : index === 4 ? 'bottom' : undefined}
                  >
                    <ArchivePoster isFirst={index === 0}>
                      <img className="poster-img" src={story.imageUrl || FALLBACK_IMAGE} alt={story.title} />
                      <ArchiveIndexBadge>0{index + 1}</ArchiveIndexBadge>
                      <ArchiveBookmarkBtn
                        type="button"
                        isSaved={isSaved}
                        onClick={() => toggleBookmark(story)}
                        aria-label={isSaved ? `${story.title} 담아두기 취소` : `${story.title} 마음에 담기`}
                      >
                        {isSaved ? <Heart size={14} strokeWidth={2} fill="currentColor" /> : <Heart size={14} strokeWidth={2} />}
                      </ArchiveBookmarkBtn>
                      <ArchivePlayBtn
                        className="play-btn"
                        type="button"
                        onClick={() => playStory(story)}
                        aria-label={`${story.title} 재생`}
                      >
                        <PlayGlyph playing={currentStory.stid === story.stid && isPlaying} />
                      </ArchivePlayBtn>
                    </ArchivePoster>
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: palette.kobalt[500] }}>{story.category}</p>
                        <h3 className="story-card-title" style={{ marginTop: '0.25rem', fontSize: fontSize.xl, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.045em', transition: 'color 0.2s' }}>{story.title}</h3>
                        <p style={{ marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: fontSize.xs, color: meok[500] }}>{story.locationName || '대한민국 문화유산'}</p>
                      </div>
                      <span style={{ flexShrink: 0, paddingTop: '0.25rem', fontFamily: 'monospace', fontSize: '10px', color: meok[500] }}>{story.formattedDuration || 'audio'}</span>
                    </div>
                  </ArchiveArticle>
                );
              })}
            </ArchiveGrid>
          </section>

          <FreeformFooter>
            <p style={{ fontSize: fontSize.lg, fontWeight: 700, letterSpacing: '-0.04em' }}>천천히 들어도, 여행입니다.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              <HeaderLink href="/map">Map ↗</HeaderLink>
              <HeaderLink href="/">Onmaru ↗</HeaderLink>
            </div>
          </FreeformFooter>
        </main>
      </ContentWrapper>

      <SavedSoundDrawer savedStories={savedStories} onRemoveBookmark={removeBookmark} />
      <LocalMiniPlayer />
    </PageContainer>
  );
};
