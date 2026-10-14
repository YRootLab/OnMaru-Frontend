'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { meok, fontSize, ringShadow } from '@/design-system/tokens';
import TopicTabBar from './presentation/components/TopicTabBar';
import DiscoveryPlacesSection from './presentation/components/DiscoveryPlacesSection';
import { useDiscoveryTopics } from './presentation/hooks/useDiscoveryTopics';
import { useDiscoveryPlaces } from './presentation/hooks/useDiscoveryPlaces';
import type { DiscoveryPlaceSummary, TopicCode } from './domain/types';

const PageWrap = styled.div`
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  margin: 0 auto;
  padding-top: 64px;
  padding-bottom: 80px;

  @media (min-width: 768px) {
    padding-top: 80px;
  }

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
  }

  @media (max-width: 640px) {
    width: calc(100% - 24px);
  }
`;

/* ─── hero ─── */
const Hero = styled.div`
  padding: 32px 0 24px;
`;

const HeroTitle = styled.h1`
  font-family: var(--font-hanok), serif;
  font-size: clamp(26px, 4vw, 38px);
  font-weight: 800;
  color: ${meok[900]};
  margin: 0 0 10px;
  letter-spacing: -0.04em;
  line-height: 1.2;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const HeroSub = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[500]};
  margin: 0;
  line-height: 1.6;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.45);
  }
`;

/* ─── search ─── */
const SearchRow = styled.div`
  padding: 16px 0 14px;
  position: relative;
`;

const SearchIconWrap = styled.span`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  color: ${meok[400]};
  pointer-events: none;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.30);
  }
`;

const SearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: ${meok[900]};
  background: ${meok[100]};
  border: none;
  border-radius: 12px;
  padding: 12px 16px 12px 42px;
  outline: none;
  letter-spacing: -0.01em;
  box-shadow: ${ringShadow.light.input};
  transition: box-shadow 0.15s ease, background 0.15s ease;

  &::placeholder {
    color: ${meok[400]};
    font-weight: 400;
  }

  &:focus {
    box-shadow: ${ringShadow.light.focusJuhong};
    background: #ffffff;
  }

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.90);
    background: rgba(255, 255, 255, 0.06);
    box-shadow: ${ringShadow.dark.input};

    &::placeholder {
      color: rgba(255, 255, 255, 0.28);
    }

    &:focus {
      box-shadow: ${ringShadow.dark.focusJuhong};
      background: rgba(255, 255, 255, 0.09);
    }
  }
`;

/* ─── actions ─── */
const ActionsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 0 16px;
`;

const WorksLink = styled(Link)`
  font-size: ${fontSize.xs};
  font-weight: 600;
  color: ${meok[500]};
  text-decoration: none;
  letter-spacing: -0.01em;
  transition: color 0.15s ease;

  &:hover {
    color: ${meok[800]};
  }

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.38);

    &:hover {
      color: rgba(255, 255, 255, 0.7);
    }
  }
`;

/* ─── unavailable ─── */
const UnavailableBox = styled.div`
  padding: 72px 24px;
  text-align: center;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.03);
  margin-top: 8px;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.04);
  }
`;

const UnavailableTitle = styled.p`
  font-weight: 700;
  font-size: ${fontSize.base};
  color: ${meok[700]};
  margin: 0 0 6px;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.55);
  }
`;

const UnavailableSub = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[400]};
  margin: 0;
  line-height: 1.65;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.28);
  }
`;

export interface KCultureDiscoveryProps {
  initialTopic?: TopicCode | 'all';
  workId?: string;
}

export default function KCultureDiscovery({ initialTopic = 'all', workId }: KCultureDiscoveryProps) {
  const router = useRouter();
  const [activeTopic, setActiveTopic] = useState<TopicCode | 'all'>(initialTopic);
  const [searchQuery, setSearchQuery] = useState('');

  const { topics, isLoading: topicsLoading } = useDiscoveryTopics();
  const { items, isLoading, isError, hasMore, loadMore } = useDiscoveryPlaces({
    topic: activeTopic === 'all' ? undefined : activeTopic,
    workId,
  });

  const handleTopicChange = (code: TopicCode | 'all') => {
    setActiveTopic(code);
    setSearchQuery('');
  };

  const handlePlaceClick = (place: DiscoveryPlaceSummary) =>
    router.push(`/discover/places/${encodeURIComponent(place.placeId)}`);

  const q = searchQuery.trim();
  const filteredItems = q ? items.filter(p => p.name.includes(q)) : items;

  const serviceDown = isError && items.length === 0 && !isLoading;

  return (
    <PageWrap>
      <Hero>
        <HeroTitle>공간이 된 문화의 기록</HeroTitle>
        <HeroSub>드라마·영화·K-팝의 실제 공간을 탐색하세요.</HeroSub>
      </Hero>

      {serviceDown ? (
        <UnavailableBox role="status">
          <UnavailableTitle>탐색 서비스 준비 중입니다</UnavailableTitle>
          <UnavailableSub>콘텐츠 검수 완료 후 공개 예정입니다.</UnavailableSub>
        </UnavailableBox>
      ) : (
        <>
          <SearchRow>
            <SearchIconWrap aria-hidden="true">
              <HugeiconsIcon icon={Search01Icon} size={17} strokeWidth={1.8} />
            </SearchIconWrap>
            <SearchInput
              type="text"
              placeholder="장소 이름으로 검색"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="장소 검색"
            />
          </SearchRow>

          <TopicTabBar
            topics={topics}
            activeCode={activeTopic}
            isLoading={topicsLoading}
            onChange={handleTopicChange}
          />

          <ActionsBar>
            <WorksLink href="/discover/works">작품 목록 →</WorksLink>
          </ActionsBar>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTopic}|${q}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            >
              <DiscoveryPlacesSection
                items={filteredItems}
                isLoading={isLoading}
                isError={isError}
                hasMore={hasMore && !q}
                filterKey={`${activeTopic}|${q}`}
                onLoadMore={loadMore}
                onPlaceClick={handlePlaceClick}
              />
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </PageWrap>
  );
}
