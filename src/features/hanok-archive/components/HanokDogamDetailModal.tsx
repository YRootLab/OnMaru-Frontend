'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  ChevronDown,
  ArrowRight,
  BookOpen,
  Clock,
  Calendar,
  Car,
  Phone,
  Globe,
  Info,
  Images,
  Bookmark,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Navigation,
} from 'lucide-react';
import { meok, palette, surface , fontSize } from '@/design-system/tokens';
import { useBookmarkStore } from '@/features/map/hooks/useBookmarkStore';
import type { Village, VillageDetailResponse } from '@/features/hanok-archive/types';
import { filterLabel } from '@/features/hanok-archive/filterLabels';
import { useHanokAudioGuide } from '@/features/hanok-archive/hooks/useHanokAudioGuide';
import { useHanokTranquility } from '@/features/hanok-archive/hooks/useHanokTranquility';
import SoriMaruBridgeCard from './SoriMaruBridgeCard';
import TranquilityGauge from './TranquilityGauge';
import {
  Overlay,
  ModalCard,
  ImageHero,
  CloseBtn,
  HeroContent,
  HeroRegion,
  HeroTitle,
  Body,
  MetaRow,
  TypeBadge,
  AddrText,
  CuratorsNoteSection,
  NoteHeader,
  HeaderBadge,
  SourceTag,
  StoryContainer,
  StoryParagraph,
  ExpandBtn,
  SectionTitle,
  InfoGrid,
  InfoCard,
  InfoIconBox,
  InfoContentBox,
  InfoLabel,
  InfoVal,
  RepeatList,
  RepeatItemCard,
  RepeatTitleText,
  RepeatContentText,
  GallerySection,
  GalleryGrid,
  GalleryThumb,
  OverviewSkeleton,
  SkeletonLine,
  BadgeTitle,
  BadgeList,
  TagBadge,
  ActionRow,
  MapBtn,
  BookmarkActionBtn,
  HeroZoomBadge,
  LightboxOverlay,
  LightboxCloseBtn,
  LightboxImageWrapper,
  LightboxImg,
  LightboxNavBtn,
  LightboxFooter,
  LightboxCounter,
} from './VillageDetailModal.styles';
import styled from '@emotion/styled';

interface HanokDogamDetailModalProps {
  village: Village;
  onClose: () => void;
}

function cleanTourApiHtml(str?: string | null): string {
  if (!str) return '';
  return str
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractHomepageUrl(homepageHtml?: string | null): { url: string | null; label: string } {
  if (!homepageHtml) return { url: null, label: '' };
  const hrefMatch = homepageHtml.match(/href=["']([^"']+)["']/i);
  if (hrefMatch && hrefMatch[1]) {
    const rawUrl = hrefMatch[1].trim();
    try {
      const parsed = new URL(rawUrl);
      return { url: rawUrl, label: parsed.hostname.replace(/^www\./, '') };
    } catch {
      return { url: rawUrl, label: '공식 누리집 바로가기' };
    }
  }
  return { url: null, label: '' };
}

export default function HanokDogamDetailModal({ village, onClose }: HanokDogamDetailModalProps) {
  const [detailData, setDetailData] = useState<VillageDetailResponse | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState<number | null>(null);
  const [zoomedImageIdx, setZoomedImageIdx] = useState<number | null>(null);

  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const bookmarked = isBookmarked(village.id);

  // 소리마루 오디오 도슨트 (문화재/도감 전용 정밀 매칭)
  const { stories: audioGuideStories } = useHanokAudioGuide(village.name, village.lat, village.lng, false);

  // 한국관광공사 데이터랩 실시간 고즈넉 지수
  const { data: tranquilityData, loading: isLoadingTranquility } = useHanokTranquility(
    village.lat,
    village.lng,
    village.addr
  );

  const handleBookmarkToggle = () => {
    toggleBookmark({
      id: village.id,
      name: village.name,
      category: village.type,
      addr: village.addr,
      image: village.image || undefined,
      lat: village.lat ?? undefined,
      lng: village.lng ?? undefined,
    });
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoadingOverview(true);

    fetch(`/api/village/${village.id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: VillageDetailResponse) => {
        if (isMounted) {
          setDetailData(data);
          setIsLoadingOverview(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDetailData(null);
          setIsLoadingOverview(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [village]);

  const fetchedOverview = detailData?.overview ? cleanTourApiHtml(detailData.overview) : null;
  // 설명이 있는 건축물이면 TourAPI 원문이나 도감 summary를 풍성하게 노출
  const currentStoryText = fetchedOverview || village.overview || village.summary || '';

  const paragraphs = useMemo(() => {
    if (!currentStoryText) return [];
    return currentStoryText
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);
  }, [currentStoryText]);

  const isLongContent = currentStoryText.length > 280;

  const galleryImages = useMemo(() => {
    const imgs: string[] = [];
    if (village.hasImage && village.image) imgs.push(village.image);
    if (detailData?.images) {
      detailData.images.forEach((img) => {
        if (typeof img === 'string' && !imgs.includes(img)) imgs.push(img);
      });
    }
    return imgs;
  }, [village, detailData]);

  const currentHeroImage = useMemo(() => {
    if (activeImageIdx !== null && galleryImages[activeImageIdx]) {
      return galleryImages[activeImageIdx];
    }
    return village.hasImage ? village.image : galleryImages[0] || null;
  }, [activeImageIdx, galleryImages, village]);

  const homepageInfo = useMemo(() => extractHomepageUrl(detailData?.homepage), [detailData]);

  const hasOperationalInfo = Boolean(
    detailData?.usetime ||
      detailData?.restdate ||
      detailData?.parking ||
      detailData?.tel ||
      homepageInfo.url
  );

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <ModalCard
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 12 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 상단 히어로 이미지 */}
          <ImageHero $bg={currentHeroImage}>
            <CloseBtn onClick={onClose} aria-label="닫기">
              <X size={18} strokeWidth={2.5} />
            </CloseBtn>

            <HeroContent>
              <HeroRegion>{village.region} · 한국의 전통 공간</HeroRegion>
              <HeroTitle>{village.name}</HeroTitle>
            </HeroContent>

            {currentHeroImage && (
              <HeroZoomBadge
                type="button"
                onClick={() => setZoomedImageIdx(activeImageIdx ?? 0)}
                title="사진 크게 보기"
              >
                <ZoomIn size={13} strokeWidth={2} /> 사진 크게 보기
              </HeroZoomBadge>
            )}
          </ImageHero>

          <Body>
            {/* 메타 분류 및 주소 */}
            <MetaRow>
              <TypeBadge>{filterLabel(village.type)}</TypeBadge>
              <AddrText>
                <MapPin size={13} strokeWidth={2} style={{ display: 'inline', marginRight: 4 }} />
                {village.addr}
              </AddrText>
            </MetaRow>

            {/* 소리마루 오디오 도슨트 연계 (소리 관련은 모두 소리마루에서 일원화 청취) */}
            <SoriMaruBridgeCard stories={audioGuideStories} hanokName={village.name} />

            {/* 한국관광공사 DataLab 실시간 고즈넉 지수 & 골든타임 */}
            <TranquilityGauge data={tranquilityData} loading={isLoadingTranquility} />

            {/* 🏛️ 전통 건축 및 역사 해설 (사용자 요청: 설명이 있는 건축물이면 풍성하게 노출) */}
            {isLoadingOverview && !village.summary ? (
              <OverviewSkeleton>
                <SkeletonLine style={{ width: '100%' }} />
                <SkeletonLine style={{ width: '92%' }} />
                <SkeletonLine style={{ width: '96%' }} />
                <SkeletonLine style={{ width: '78%' }} />
              </OverviewSkeleton>
            ) : (
              <CuratorsNoteSection>
                <NoteHeader>
                  <HeaderBadge>
                    <BookOpen size={16} strokeWidth={2} />
                    <span>전통 건축 및 역사 해설</span>
                  </HeaderBadge>
                  {fetchedOverview && (
                    <SourceTag>한국관광공사 관광정보 API(TourAPI 4.0)</SourceTag>
                  )}
                </NoteHeader>

                <StoryContainer $isExpanded={isExpanded}>
                  {paragraphs.length > 0 ? (
                    paragraphs.map((p, idx) => (
                      <StoryParagraph key={idx}>{p}</StoryParagraph>
                    ))
                  ) : (
                    <StoryParagraph>
                      {village.name}의 건축 양식과 문화유산 기록을 수록 중입니다.
                    </StoryParagraph>
                  )}
                </StoryContainer>

                {isLongContent && (
                  <ExpandBtn onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? '접기' : '전문 읽기'}{' '}
                    <ChevronDown
                      size={14}
                      strokeWidth={2}
                      style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'none',
                      }}
                    />
                  </ExpandBtn>
                )}
              </CuratorsNoteSection>
            )}

            {/* 관람 및 개방 안내 */}
            {!isLoadingOverview && hasOperationalInfo && (
              <>
                <SectionTitle>
                  <Info size={16} strokeWidth={2} /> 관람 안내
                </SectionTitle>
                <InfoGrid>
                  {detailData?.usetime && (
                    <InfoCard>
                      <InfoIconBox>
                        <Clock size={16} strokeWidth={2} />
                      </InfoIconBox>
                      <InfoContentBox>
                        <InfoLabel>관람 시간</InfoLabel>
                        <InfoVal>{cleanTourApiHtml(detailData.usetime)}</InfoVal>
                      </InfoContentBox>
                    </InfoCard>
                  )}

                  {detailData?.restdate && (
                    <InfoCard>
                      <InfoIconBox>
                        <Calendar size={16} strokeWidth={2} />
                      </InfoIconBox>
                      <InfoContentBox>
                        <InfoLabel>쉬는 날</InfoLabel>
                        <InfoVal>{cleanTourApiHtml(detailData.restdate)}</InfoVal>
                      </InfoContentBox>
                    </InfoCard>
                  )}

                  {detailData?.parking && (
                    <InfoCard>
                      <InfoIconBox>
                        <Car size={16} strokeWidth={2} />
                      </InfoIconBox>
                      <InfoContentBox>
                        <InfoLabel>주차</InfoLabel>
                        <InfoVal>{cleanTourApiHtml(detailData.parking)}</InfoVal>
                      </InfoContentBox>
                    </InfoCard>
                  )}

                  {detailData?.tel && (
                    <InfoCard>
                      <InfoIconBox>
                        <Phone size={16} strokeWidth={2} />
                      </InfoIconBox>
                      <InfoContentBox>
                        <InfoLabel>문의처</InfoLabel>
                        <InfoVal>{cleanTourApiHtml(detailData.tel)}</InfoVal>
                      </InfoContentBox>
                    </InfoCard>
                  )}

                  {homepageInfo.url && (
                    <InfoCard>
                      <InfoIconBox>
                        <Globe size={16} strokeWidth={2} />
                      </InfoIconBox>
                      <InfoContentBox>
                        <InfoLabel>홈페이지</InfoLabel>
                        <InfoVal>
                          <a href={homepageInfo.url} target="_blank" rel="noopener noreferrer">
                            {homepageInfo.label}{' '}
                            <ArrowRight size={12} strokeWidth={2} style={{ display: 'inline' }} />
                          </a>
                        </InfoVal>
                      </InfoContentBox>
                    </InfoCard>
                  )}
                </InfoGrid>
              </>
            )}

            {/* 부속 건축물 및 주요 공간 안내 (반복 정보) */}
            {!isLoadingOverview && detailData?.repeatInfo && detailData.repeatInfo.length > 0 && (
              <>
                <SectionTitle>
                  <Landmark size={16} strokeWidth={2} /> 주요 공간
                </SectionTitle>
                <RepeatList>
                  {detailData.repeatInfo.map((item, idx) => (
                    <RepeatItemCard key={idx}>
                      <RepeatTitleText>{cleanTourApiHtml(item.title)}</RepeatTitleText>
                      <RepeatContentText>{cleanTourApiHtml(item.content)}</RepeatContentText>
                    </RepeatItemCard>
                  ))}
                </RepeatList>
              </>
            )}

            {/* 건축 갤러리 */}
            {galleryImages.length > 1 && (
              <GallerySection>
                <SectionTitle>
                  <Images size={16} strokeWidth={2} /> 사진 둘러보기 ({galleryImages.length}장)
                </SectionTitle>
                <GalleryGrid>
                  {galleryImages.map((img, idx) => (
                    <GalleryThumb
                      key={idx}
                      type="button"
                      $active={activeImageIdx === idx}
                      onClick={() => {
                        setActiveImageIdx(idx);
                        setZoomedImageIdx(idx);
                      }}
                      title="사진 크게 보기"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`${village.name} 사진 ${idx + 1}`} loading="lazy" />
                    </GalleryThumb>
                  ))}
                </GalleryGrid>
              </GallerySection>
            )}

            {/* 문화유산 태그 */}
            {village.badges.length > 0 && (
              <div>
                <BadgeTitle>문화유산 분류</BadgeTitle>
                <BadgeList>
                  {village.badges.map((b) => (
                    <TagBadge key={b}>#{filterLabel(b)}</TagBadge>
                  ))}
                </BadgeList>
              </div>
            )}

            {/* 하단 액션 버튼 바 */}
            <ActionRow>
              <NaverDirectionsBtn
                href={`https://map.naver.com/v5/search/${encodeURIComponent(village.name)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation size={15} strokeWidth={2} /> 길찾기
              </NaverDirectionsBtn>

              <BookmarkActionBtn
                type="button"
                $bookmarked={bookmarked}
                onClick={handleBookmarkToggle}
                title={bookmarked ? '저장 목록에서 제거' : '도감에 저장'}
              >
                <Bookmark size={15} strokeWidth={2} fill={bookmarked ? 'currentColor' : 'none'} />
                {bookmarked ? '저장됨' : '저장하기'}
              </BookmarkActionBtn>
            </ActionRow>
          </Body>
        </ModalCard>
      </Overlay>

      {/* 라이트박스 전체화면 뷰어 */}
      {zoomedImageIdx !== null && galleryImages[zoomedImageIdx] && (
        <LightboxOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setZoomedImageIdx(null)}
        >
          <LightboxCloseBtn
            type="button"
            onClick={() => setZoomedImageIdx(null)}
            aria-label="사진 닫기"
          >
            <X size={20} strokeWidth={2.5} />
          </LightboxCloseBtn>

          {galleryImages.length > 1 && (
            <LightboxNavBtn
              type="button"
              $dir="left"
              onClick={(e) => {
                e.stopPropagation();
                setZoomedImageIdx((prev) =>
                  prev !== null ? (prev - 1 + galleryImages.length) % galleryImages.length : 0
                );
              }}
              aria-label="이전 사진"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </LightboxNavBtn>
          )}

          <LightboxImageWrapper onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <LightboxImg
              src={galleryImages[zoomedImageIdx]}
              alt={`${village.name} 확대 사진`}
            />
          </LightboxImageWrapper>

          {galleryImages.length > 1 && (
            <LightboxNavBtn
              type="button"
              $dir="right"
              onClick={(e) => {
                e.stopPropagation();
                setZoomedImageIdx((prev) =>
                  prev !== null ? (prev + 1) % galleryImages.length : 0
                );
              }}
              aria-label="다음 사진"
            >
              <ChevronRight size={24} strokeWidth={2.5} />
            </LightboxNavBtn>
          )}

          <LightboxFooter onClick={(e) => e.stopPropagation()}>
            <LightboxCounter>
              {zoomedImageIdx + 1} / {galleryImages.length}
            </LightboxCounter>
          </LightboxFooter>
        </LightboxOverlay>
      )}
    </AnimatePresence>
  );
}

const NaverDirectionsBtn = styled.a`
  flex: 1.5;
  height: 48px;
  border-radius: 9999px;
  background: ${palette.kobalt[500]};
  color: #ffffff;
  font-size: ${fontSize.sm};
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: ${palette.kobalt[700]};
    transform: translateY(-1px);
  }

  [data-theme='dark'] & {
    background: ${palette.kobalt[500]};
    color: #ffffff;
    &:hover {
      background: ${palette.kobalt[400]};
    }
  }
`;
