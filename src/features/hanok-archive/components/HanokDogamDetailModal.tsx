'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
  Layers,
  Award,
  Leaf,
  Flower2,
  Snowflake,
  Sprout,
  Wind,
  Copy,
  Check,
  Sparkles,
  Building,
} from 'lucide-react';
import { inferStructureTags, extractHeritageGrade, inferSeasonTags } from '@/features/hanok-archive/utils/villageInsights';
import { meok, palette, surface , fontSize } from '@/design-system/tokens';
import { useBookmarkStore } from '@/features/map/hooks/useBookmarkStore';
import type { Village } from '@/features/hanok-archive/types';
import { filterLabel } from '@/features/hanok-archive/filterLabels';
import { useHanokAudioGuide } from '@/features/hanok-archive/hooks/useHanokAudioGuide';
import { useHanokTranquility } from '@/features/hanok-archive/hooks/useHanokTranquility';
import { useHanokDetail } from '@/features/hanok-archive/hooks/useHanokDetail';
import ContentTagChips from '@/shared/components/ContentTagChips';
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
  RepeatList,
  RepeatItemCard,
  RepeatTitleText,
  RepeatContentText,
  GallerySection,
  GalleryGrid,
  GalleryThumb,
  OverviewSkeleton,
  SkeletonLine,
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
  InsightRow,
  InsightBadge,
  MapPreviewCard,
  MapDotGrid,
  MapPreviewContent,
  MapPreviewLabel,
  MapPreviewName,
  MapPreviewAddr,
  MapPreviewAction,
  QuickInfoContainer,
  QuickInfoHeader,
  QuickInfoTitle,
  QuickInfoGrid,
  QuickInfoCard,
  QuickInfoIcon,
  QuickInfoBody,
  QuickInfoItemLabel,
  QuickInfoItemValue,
  CopyBtn,
} from './VillageDetailModal.styles';
import styled from '@emotion/styled';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const SEASON_ICON: Record<string, React.ReactElement> = {
  '봄꽃': <Flower2 size={12} strokeWidth={2} />,
  '단풍': <Leaf size={12} strokeWidth={2} />,
  '설경': <Snowflake size={12} strokeWidth={2} />,
  '억새': <Sprout size={12} strokeWidth={2} />,
  '여름녹음': <Wind size={12} strokeWidth={2} />,
};

gsap.registerPlugin(ScrollTrigger);

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
  const modalRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { detailData, isLoadingOverview } = useHanokDetail(village);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState<number | null>(null);
  const [zoomedImageIdx, setZoomedImageIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 640);
  }, []);

  const handleCopyAddress = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch {
      // fallback
    }
  };

  const isStayType = village.type === 'stay' || village.type === '한옥스테이';

  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const bookmarked = isBookmarked(village.id);

  const { stories: audioGuideStories } = useHanokAudioGuide(village.name, village.lat, village.lng, false);

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

  const fetchedOverview = detailData?.overview ? cleanTourApiHtml(detailData.overview) : null;

  const currentStoryText = useMemo(() => {
    if (fetchedOverview) return fetchedOverview;
    if (village.overview) return village.overview;
    if (village.summary) {
      if (village.summary.endsWith('…')) {
        return village.summary.replace(/[\s\.]+…$/, ' 전해지는 유서 깊은 한국의 대표적인 전통 공간입니다.');
      }
      return village.summary;
    }
    return `${village.name}의 건축 양식과 문화유산 기록을 수록 중입니다.`;
  }, [fetchedOverview, village]);

  const paragraphs = useMemo(() => {
    if (!currentStoryText) return [];
    return currentStoryText
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);
  }, [currentStoryText]);

  const isLongContent = currentStoryText.length > 280;

  useGSAP(() => {
    const story = storyRef.current;
    if (!story) return;

    // Keep story text crisp, high-contrast, and completely readable without blur
    const paragraphsInView = gsap.utils.toArray<HTMLElement>('[data-reading-paragraph]', story);
    gsap.set(paragraphsInView, { opacity: 1, filter: 'none' });
  }, {
    scope: storyRef,
    dependencies: [paragraphs, isExpanded],
    revertOnUpdate: true,
  });

  const galleryImages = useMemo(() => {
    const imgs = new Set<string>();
    const addImage = (value: unknown) => {
      if (typeof value !== 'string') return;
      const image = value.trim();
      if (image) imgs.add(image);
    };
    if (village.hasImage) addImage(village.image);
    if (detailData?.images) {
      detailData.images.forEach(addImage);
    }
    return Array.from(imgs);
  }, [village, detailData]);

  const currentHeroImage = useMemo(() => {
    if (activeImageIdx !== null && galleryImages[activeImageIdx]) {
      return galleryImages[activeImageIdx];
    }
    return village.hasImage ? village.image : galleryImages[0] || null;
  }, [activeImageIdx, galleryImages, village]);

  const homepageInfo = useMemo(() => extractHomepageUrl(detailData?.homepage), [detailData]);

  const structureTags = useMemo(() => inferStructureTags(village), [village]);
  const heritageGrade = useMemo(() => extractHeritageGrade(village), [village]);
  const seasonTags = useMemo(() => inferSeasonTags(village), [village]);

  const kakaoMapUrl = village.lat && village.lng
    ? `https://map.kakao.com/link/map/${encodeURIComponent(village.name)},${village.lat},${village.lng}`
    : `https://map.kakao.com/link/search/${encodeURIComponent(village.name)}`;

  return (
    <AnimatePresence>
      <Overlay
        key="hanok-dogam-detail"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <ModalCard
          ref={modalRef}
          initial={isMobile ? { y: '100%', opacity: 1 } : { scale: 0.94, opacity: 0, y: 16 }}
          animate={isMobile ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
          exit={isMobile ? { y: '100%', opacity: 1 } : { scale: 0.96, opacity: 0, y: 12 }}
          transition={isMobile
            ? { type: 'spring', damping: 32, stiffness: 300 }
            : { type: 'spring', damping: 28, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
        >
          {}
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
            {}
            <MetaRow>
              <TypeBadge>{filterLabel(village.type)}</TypeBadge>
              <AddrText>
                <MapPin size={13} strokeWidth={2} style={{ display: 'inline', marginRight: 4 }} />
                {village.addr}
              </AddrText>
            </MetaRow>

            {}
            <ContentTagChips tags={detailData?.contentTags} />

            {}
            <InsightRow>
              {heritageGrade && (
                <InsightBadge $color="#c0392b">
                  <Award size={12} strokeWidth={2} />
                  {heritageGrade}
                </InsightBadge>
              )}
              <InsightBadge $color="#7c5c2e">
                <Layers size={12} strokeWidth={2} />
                {structureTags[0]}
              </InsightBadge>
              {structureTags.slice(1).map((tag) => (
                <InsightBadge key={tag} $color="#595550">
                  <Layers size={12} strokeWidth={2} />
                  {tag}
                </InsightBadge>
              ))}
              {seasonTags.map((tag) => (
                <InsightBadge key={tag} $color="#8a6538">
                  {SEASON_ICON[tag] ?? <Leaf size={12} strokeWidth={2} />}
                  {tag}
                </InsightBadge>
              ))}
            </InsightRow>

            {/* 한눈에 보는 기본 정보 (Quick Essential Info) */}
            <QuickInfoContainer>
              <QuickInfoHeader>
                <QuickInfoTitle>
                  <Info size={16} strokeWidth={2.2} /> 한눈에 보는 기본 정보
                </QuickInfoTitle>
              </QuickInfoHeader>

              <QuickInfoGrid>
                {/* 1. 소재지 / 주소 */}
                <QuickInfoCard $fullWidth>
                  <QuickInfoIcon>
                    <MapPin size={16} strokeWidth={2} />
                  </QuickInfoIcon>
                  <QuickInfoBody>
                    <QuickInfoItemLabel>소재지 (주소)</QuickInfoItemLabel>
                    <QuickInfoItemValue>
                      {village.addr || '주소 정보 확인 중'}
                      {village.addr && (
                        <CopyBtn
                          type="button"
                          onClick={() => handleCopyAddress(village.addr)}
                          title="주소 복사"
                          aria-label="주소 복사"
                        >
                          {copiedAddress ? (
                            <>
                              <Check size={12} strokeWidth={2.5} /> 복사됨
                            </>
                          ) : (
                            <>
                              <Copy size={12} strokeWidth={2} /> 복사
                            </>
                          )}
                        </CopyBtn>
                      )}
                    </QuickInfoItemValue>
                  </QuickInfoBody>
                </QuickInfoCard>

                {/* 2. 주차 시설 */}
                <QuickInfoCard>
                  <QuickInfoIcon>
                    <Car size={16} strokeWidth={2} />
                  </QuickInfoIcon>
                  <QuickInfoBody>
                    <QuickInfoItemLabel>주차 안내</QuickInfoItemLabel>
                    <QuickInfoItemValue>
                      {detailData?.parking
                        ? cleanTourApiHtml(detailData.parking)
                        : (isStayType ? '숙박객 전용 주차 가능' : '인근 공영주차장 이용 권장')}
                    </QuickInfoItemValue>
                  </QuickInfoBody>
                </QuickInfoCard>

                {/* 3. 이용 / 운영 시간 */}
                <QuickInfoCard>
                  <QuickInfoIcon>
                    <Clock size={16} strokeWidth={2} />
                  </QuickInfoIcon>
                  <QuickInfoBody>
                    <QuickInfoItemLabel>
                      {isStayType ? '입·퇴실 시간' : '관람 / 이용 시간'}
                    </QuickInfoItemLabel>
                    <QuickInfoItemValue>
                      {isStayType
                        ? (detailData?.checkin
                            ? `입실 ${detailData.checkin} · 퇴실 ${detailData.checkout || '11:00'}`
                            : '입실 15:00 · 퇴실 11:00 (사전 확인 권장)')
                        : (detailData?.usetime
                            ? cleanTourApiHtml(detailData.usetime)
                            : '상시 관람 가능 (일출~일몰)')}
                    </QuickInfoItemValue>
                  </QuickInfoBody>
                </QuickInfoCard>

                {/* 4. 쉬는 날 / 휴무 */}
                <QuickInfoCard>
                  <QuickInfoIcon>
                    <Calendar size={16} strokeWidth={2} />
                  </QuickInfoIcon>
                  <QuickInfoBody>
                    <QuickInfoItemLabel>쉬는 날 (휴무)</QuickInfoItemLabel>
                    <QuickInfoItemValue>
                      {detailData?.restdate
                        ? cleanTourApiHtml(detailData.restdate)
                        : '연중무휴 (명절 및 기상상황별 변동 가능)'}
                    </QuickInfoItemValue>
                  </QuickInfoBody>
                </QuickInfoCard>

                {/* 5. 문의처 */}
                <QuickInfoCard>
                  <QuickInfoIcon>
                    <Phone size={16} strokeWidth={2} />
                  </QuickInfoIcon>
                  <QuickInfoBody>
                    <QuickInfoItemLabel>문의처</QuickInfoItemLabel>
                    <QuickInfoItemValue>
                      {detailData?.tel ? (
                        <a href={`tel:${detailData.tel.replace(/[^0-9-]/g, '')}`}>
                          {cleanTourApiHtml(detailData.tel)}
                        </a>
                      ) : (
                        '현장 안내소 / 사전 확인 권장'
                      )}
                    </QuickInfoItemValue>
                  </QuickInfoBody>
                </QuickInfoCard>

                {/* 6. 관람료 / 체험 안내 */}
                {detailData?.expguide && (
                  <QuickInfoCard $fullWidth>
                    <QuickInfoIcon>
                      <Sparkles size={16} strokeWidth={2} />
                    </QuickInfoIcon>
                    <QuickInfoBody>
                      <QuickInfoItemLabel>체험 및 이용 안내</QuickInfoItemLabel>
                      <QuickInfoItemValue>
                        {cleanTourApiHtml(detailData.expguide)}
                      </QuickInfoItemValue>
                    </QuickInfoBody>
                  </QuickInfoCard>
                )}

                {/* 7. 공식 누리집 */}
                {homepageInfo.url && (
                  <QuickInfoCard $fullWidth>
                    <QuickInfoIcon>
                      <Globe size={16} strokeWidth={2} />
                    </QuickInfoIcon>
                    <QuickInfoBody>
                      <QuickInfoItemLabel>공식 누리집</QuickInfoItemLabel>
                      <QuickInfoItemValue>
                        <a href={homepageInfo.url} target="_blank" rel="noopener noreferrer">
                          {homepageInfo.label} <ArrowRight size={12} strokeWidth={2} style={{ display: 'inline' }} />
                        </a>
                      </QuickInfoItemValue>
                    </QuickInfoBody>
                  </QuickInfoCard>
                )}

                {/* 8. 객실 및 부대시설 (한옥스테이) */}
                {isStayType && (detailData?.subfacility || detailData?.roomcount || detailData?.chkcooking) && (
                  <QuickInfoCard $fullWidth>
                    <QuickInfoIcon>
                      <Building size={16} strokeWidth={2} />
                    </QuickInfoIcon>
                    <QuickInfoBody>
                      <QuickInfoItemLabel>객실 및 편의시설</QuickInfoItemLabel>
                      <QuickInfoItemValue>
                        {[
                          detailData?.roomcount ? `객실 ${detailData.roomcount}실` : null,
                          detailData?.subfacility ? cleanTourApiHtml(detailData.subfacility) : null,
                          detailData?.chkcooking ? `취사 ${cleanTourApiHtml(detailData.chkcooking)}` : null,
                          detailData?.barbecue ? `바비큐 ${cleanTourApiHtml(detailData.barbecue)}` : null,
                        ].filter(Boolean).join(' · ')}
                      </QuickInfoItemValue>
                    </QuickInfoBody>
                  </QuickInfoCard>
                )}
              </QuickInfoGrid>
            </QuickInfoContainer>

            {}
            {isLoadingOverview && !fetchedOverview ? (
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

                <StoryContainer ref={storyRef} $isExpanded={isExpanded}>
                  {paragraphs.length > 0 ? (
                    paragraphs.map((p, idx) => (
                      <StoryParagraph data-reading-paragraph key={idx}>{p}</StoryParagraph>
                    ))
                  ) : (
                    <StoryParagraph data-reading-paragraph>
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

            {}
            <MapPreviewCard
              href={kakaoMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${village.name} 카카오맵에서 보기`}
            >
              <MapDotGrid aria-hidden="true" />
              <MapPreviewContent>
                <MapPreviewLabel>
                  <MapPin size={13} strokeWidth={2} /> 위치
                </MapPreviewLabel>
                <MapPreviewName>{village.name}</MapPreviewName>
                <MapPreviewAddr>{village.addr}</MapPreviewAddr>
              </MapPreviewContent>
              <MapPreviewAction>
                카카오맵으로 보기 <ChevronRight size={14} strokeWidth={2.5} />
              </MapPreviewAction>
            </MapPreviewCard>

            {}
            <SoriMaruBridgeCard stories={audioGuideStories} hanokName={village.name} />

            {}
            <TranquilityGauge data={tranquilityData} loading={isLoadingTranquility} />



            {}
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

            {}
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
                      { }
                      <img src={img} alt={`${village.name} 사진 ${idx + 1}`} loading="lazy" />
                    </GalleryThumb>
                  ))}
                </GalleryGrid>
              </GallerySection>
            )}

            {}
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

      {}
      {zoomedImageIdx !== null && galleryImages[zoomedImageIdx] && (
        <LightboxOverlay
          key="hanok-dogam-lightbox"
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
            { }
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
  background: ${palette.juhong[500]};
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
    background: ${palette.juhong[700]};
    transform: translateY(-1px);
  }

  [data-theme='dark'] & {
    background: ${palette.juhong[500]};
    color: #ffffff;
    &:hover {
      background: ${palette.juhong[400]};
    }
  }
`;
