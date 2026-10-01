'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react'
import { Bookmark01Icon, Cancel01Icon, Car01Icon, ChevronLeftIcon, ChevronRightIcon, Clock01Icon, Coffee01Icon, ExternalLinkIcon, Flower01Icon, GlobeIcon, Home01Icon, Image02Icon, Layers01Icon, Leaf01Icon, MapPinIcon, Navigation01Icon, PhoneIcon, SnowflakeIcon, SparklesIcon, SproutIcon, WindIcon, ZoomInIcon } from '@hugeicons/core-free-icons'
import { meok, palette, surface , fontSize } from '@/design-system/tokens';
import { useBookmarkStore } from '@/features/map/hooks/useBookmarkStore';
import type { Village } from '@/features/hanok-archive/types';
import { filterLabel } from '@/features/hanok-archive/filterLabels';
import { useStayDetail } from '@/features/hanok-archive/hooks/useStayDetail';
import { inferSeasonTags } from '@/features/hanok-archive/utils/villageInsights';
import ContentTagChips from '@/shared/components/ContentTagChips';
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
  StoryContainer,
  StoryParagraph,
  SectionTitle,
  InfoGrid,
  InfoCard,
  InfoIconBox,
  InfoContentBox,
  InfoLabel,
  InfoVal,
  GallerySection,
  GalleryGrid,
  GalleryThumb,
  ActionRow,
  MapBtn,
  BookingModalBtn,
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
} from './VillageDetailModal.styles';
import styled from '@emotion/styled';

const SEASON_ICON: Record<string, React.ReactElement> = {
  '봄꽃': <HugeiconsIcon icon={Flower01Icon} size={12} strokeWidth={2} />,
  '단풍': <HugeiconsIcon icon={Leaf01Icon} size={12} strokeWidth={2} />,
  '설경': <HugeiconsIcon icon={SnowflakeIcon} size={12} strokeWidth={2} />,
  '억새': <HugeiconsIcon icon={SproutIcon} size={12} strokeWidth={2} />,
  '여름녹음': <HugeiconsIcon icon={WindIcon} size={12} strokeWidth={2} />,
};

interface HanokStayDetailModalProps {
  stay: Village;
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
      return { url: rawUrl, label: '공식 예약처 바로가기' };
    }
  }
  return { url: null, label: '' };
}

function getBookingUrl(item: Village): string {
  if (item.overview) {
    const match = item.overview.match(/https?:\/\/[^\s"']+/i);
    if (match) return match[0];
  }
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(item.name + ' 예약')}`;
}

export default function HanokStayDetailModal({ stay, onClose }: HanokStayDetailModalProps) {
  const detailData = useStayDetail(stay.id);
  const [activeImageIdx, setActiveImageIdx] = useState<number | null>(null);
  const [zoomedImageIdx, setZoomedImageIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 640);
  }, []);

  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const bookmarked = isBookmarked(stay.id);

  const handleBookmarkToggle = () => {
    toggleBookmark({
      id: stay.id,
      name: stay.name,
      category: '한옥스테이',
      addr: stay.addr,
      image: stay.image || undefined,
      lat: stay.lat ?? undefined,
      lng: stay.lng ?? undefined,
    });
  };

  const stayIntroText = useMemo(() => {
    const fetched = detailData?.overview ? cleanTourApiHtml(detailData.overview) : null;
    return fetched || stay.overview || stay.summary || '';
  }, [detailData, stay]);

  const galleryImages = useMemo(() => {
    const imgs = new Set<string>();
    const addImage = (value: unknown) => {
      if (typeof value !== 'string') return;
      const image = value.trim();
      if (image) imgs.add(image);
    };
    if (stay.hasImage) addImage(stay.image);
    if (detailData?.images) {
      detailData.images.forEach(addImage);
    }
    return Array.from(imgs);
  }, [stay, detailData]);

  const currentHeroImage = useMemo(() => {
    if (activeImageIdx !== null && galleryImages[activeImageIdx]) {
      return galleryImages[activeImageIdx];
    }
    return stay.hasImage ? stay.image : galleryImages[0] || null;
  }, [activeImageIdx, galleryImages, stay]);

  const homepageInfo = useMemo(() => extractHomepageUrl(detailData?.homepage), [detailData]);
  const seasonTags = useMemo(() => inferSeasonTags(stay), [stay]);

  const kakaoMapUrl = stay.lat && stay.lng
    ? `https://map.kakao.com/link/map/${encodeURIComponent(stay.name)},${stay.lat},${stay.lng}`
    : `https://map.kakao.com/link/search/${encodeURIComponent(stay.name)}`;

  return (
    <AnimatePresence>
      <Overlay
        key="hanok-stay-detail"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <ModalCard
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
              <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2.5} />
            </CloseBtn>

            <HeroContent>
              <HeroRegion>{stay.region} · 고즈넉한 하룻밤</HeroRegion>
              <HeroTitle>{stay.name}</HeroTitle>
            </HeroContent>

            {currentHeroImage && (
              <HeroZoomBadge
                type="button"
                onClick={() => setZoomedImageIdx(activeImageIdx ?? 0)}
                title="사진 크게 보기"
              >
                <HugeiconsIcon icon={ZoomInIcon} size={13} strokeWidth={2} /> 사진 크게 보기
              </HeroZoomBadge>
            )}
          </ImageHero>

          <Body>
            {}
            <MetaRow>
              <TypeBadge>한옥스테이</TypeBadge>
              <AddrText>
                <HugeiconsIcon icon={MapPinIcon} size={13} strokeWidth={2} style={{ display: 'inline', marginRight: 4 }} />
                {stay.addr}
              </AddrText>
            </MetaRow>

            {}
            <ContentTagChips tags={detailData?.contentTags} />

            {}
            <InsightRow>
              <InsightBadge $color="#2e5f7c">
                <HugeiconsIcon icon={Home01Icon} size={12} strokeWidth={2} />
                {detailData?.roomtype
                  ? cleanTourApiHtml(detailData.roomtype).split('/')[0].trim()
                  : '전통 한옥'}
              </InsightBadge>
              <InsightBadge $color="#7c5c2e">
                <HugeiconsIcon icon={Layers01Icon} size={12} strokeWidth={2} />
                온돌 마루
              </InsightBadge>
              {seasonTags.map((tag) => (
                <InsightBadge key={tag} $color="#2e7d5e">
                  {SEASON_ICON[tag] ?? <HugeiconsIcon icon={Leaf01Icon} size={12} strokeWidth={2} />}
                  {tag}
                </InsightBadge>
              ))}
            </InsightRow>

            {}
            <CuratorsNoteSection>
              <NoteHeader>
                <HeaderBadge>
                  <HugeiconsIcon icon={SparklesIcon} size={16} color={palette.cheongrok[500]} />
                  <span>숙소 소개</span>
                </HeaderBadge>
              </NoteHeader>
              <StoryContainer $isExpanded={true}>
                <StoryParagraph>
                  {stayIntroText || '한옥의 온돌과 마루에서 사계절 정취를 느끼며 머물 수 있는 곳이에요.'}
                </StoryParagraph>
              </StoryContainer>
            </CuratorsNoteSection>

            {}
            <MapPreviewCard
              href={kakaoMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${stay.name} 카카오맵에서 보기`}
            >
              <MapDotGrid aria-hidden="true" />
              <MapPreviewContent>
                <MapPreviewLabel>
                  <HugeiconsIcon icon={MapPinIcon} size={13} strokeWidth={2} /> 위치
                </MapPreviewLabel>
                <MapPreviewName>{stay.name}</MapPreviewName>
                <MapPreviewAddr>{stay.addr}</MapPreviewAddr>
              </MapPreviewContent>
              <MapPreviewAction>
                카카오맵으로 보기 <HugeiconsIcon icon={ChevronRightIcon} size={14} strokeWidth={2.5} />
              </MapPreviewAction>
            </MapPreviewCard>

            {}
            <SectionTitle>
              <HugeiconsIcon icon={SparklesIcon} size={16} strokeWidth={2} /> 이용 안내
            </SectionTitle>
            <InfoGrid>
              <InfoCard>
                <InfoIconBox>
                  <HugeiconsIcon icon={Clock01Icon} size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>입실 · 퇴실</InfoLabel>
                  <InfoVal>
                    {detailData?.checkin || detailData?.checkout
                      ? `입실 ${detailData.checkin || '15:00'} · 퇴실 ${detailData.checkout || '11:00'}`
                      : '입실 15:00 이후 · 퇴실 11:00 이전'}
                  </InfoVal>
                </InfoContentBox>
              </InfoCard>

              <InfoCard>
                <InfoIconBox>
                  <HugeiconsIcon icon={Home01Icon} size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>객실 구조</InfoLabel>
                  <InfoVal>
                    {detailData?.roomtype
                      ? `${cleanTourApiHtml(detailData.roomtype)}${detailData?.roomcount ? ` (${cleanTourApiHtml(detailData.roomcount)})` : ''}`
                      : '전통 온돌방 · 대청마루 · 독채/별채'}
                  </InfoVal>
                </InfoContentBox>
              </InfoCard>

              <InfoCard>
                <InfoIconBox>
                  <HugeiconsIcon icon={Car01Icon} size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>주차</InfoLabel>
                  <InfoVal>
                    {cleanTourApiHtml(detailData?.parking) || '숙소 전용 또는 인근 주차 가능'}
                  </InfoVal>
                </InfoContentBox>
              </InfoCard>

              <InfoCard>
                <InfoIconBox>
                  <HugeiconsIcon icon={Coffee01Icon} size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>편의시설</InfoLabel>
                  <InfoVal>
                    {cleanTourApiHtml(detailData?.subfacility) ||
                      `${detailData?.barbecue ? '바비큐 가능 · ' : ''}전통차 다도 체험 · 정원 마당 · Wi-Fi`}
                  </InfoVal>
                </InfoContentBox>
              </InfoCard>

              <InfoCard>
                <InfoIconBox>
                  <HugeiconsIcon icon={PhoneIcon} size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>문의 전화</InfoLabel>
                  <InfoVal>
                    {cleanTourApiHtml(detailData?.tel) || '사전 온라인 예약 및 유선 문의'}
                  </InfoVal>
                </InfoContentBox>
              </InfoCard>

              <InfoCard>
                <InfoIconBox>
                  <HugeiconsIcon icon={GlobeIcon} size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>예약 링크</InfoLabel>
                  <InfoVal>
                    {homepageInfo.url ? (
                      <a href={homepageInfo.url} target="_blank" rel="noopener noreferrer">
                        {homepageInfo.label} <HugeiconsIcon icon={ExternalLinkIcon} size={12} style={{ display: 'inline' }} />
                      </a>
                    ) : (
                      <a href={getBookingUrl(stay)} target="_blank" rel="noopener noreferrer">
                        예약 정보 찾아보기 <HugeiconsIcon icon={ExternalLinkIcon} size={12} style={{ display: 'inline' }} />
                      </a>
                    )}
                  </InfoVal>
                </InfoContentBox>
              </InfoCard>
            </InfoGrid>


            {}
            {galleryImages.length > 1 && (
              <GallerySection>
                <SectionTitle>
                  <HugeiconsIcon icon={Image02Icon} size={16} strokeWidth={2} /> 숙소 사진 ({galleryImages.length}장)
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
                      <img src={img} alt={`${stay.name} 사진 ${idx + 1}`} loading="lazy" />
                    </GalleryThumb>
                  ))}
                </GalleryGrid>
              </GallerySection>
            )}

            {}
            <ActionRow>
              <DirectBookingButton
                href={getBookingUrl(stay)}
                target="_blank"
                rel="noopener noreferrer"
              >
                예약 정보 확인하기 <HugeiconsIcon icon={ExternalLinkIcon} size={15} strokeWidth={2} />
              </DirectBookingButton>

              <MapGuideBtn
                href={`https://map.naver.com/v5/search/${encodeURIComponent(stay.name)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <HugeiconsIcon icon={Navigation01Icon} size={14} strokeWidth={2} /> 길찾기
              </MapGuideBtn>

              <BookmarkActionBtn
                type="button"
                $bookmarked={bookmarked}
                onClick={handleBookmarkToggle}
                title={bookmarked ? '저장 목록에서 제거' : '숙소 저장'}
              >
                <HugeiconsIcon icon={Bookmark01Icon} size={15} strokeWidth={2} fill={bookmarked ? 'currentColor' : 'none'} />
                {bookmarked ? '저장됨' : '저장하기'}
              </BookmarkActionBtn>
            </ActionRow>
          </Body>
        </ModalCard>
      </Overlay>

      {}
      {zoomedImageIdx !== null && galleryImages[zoomedImageIdx] && (
        <LightboxOverlay
          key="hanok-stay-lightbox"
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
            <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={2.5} />
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
              <HugeiconsIcon icon={ChevronLeftIcon} size={24} strokeWidth={2.5} />
            </LightboxNavBtn>
          )}

          <LightboxImageWrapper onClick={(e) => e.stopPropagation()}>
            { }
            <LightboxImg
              src={galleryImages[zoomedImageIdx]}
              alt={`${stay.name} 확대 사진`}
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
              <HugeiconsIcon icon={ChevronRightIcon} size={24} strokeWidth={2.5} />
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

const DirectBookingButton = styled.a`
  flex: 1.5;
  height: 48px;
  border-radius: 9999px;
  background: ${palette.cheongrok[700]};
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
    background: ${palette.cheongrok[900]};
    transform: translateY(-1px);
  }

  [data-theme='dark'] & {
    background: ${palette.cheongrok[500]};
    color: #ffffff;
    &:hover {
      background: ${palette.cheongrok[400]};
    }
  }
`;

const MapGuideBtn = styled.a`
  height: 48px;
  padding: 0 18px;
  border-radius: 9999px;
  background: #f5f5f4;
  color: ${meok[900]};
  font-size: ${fontSize.sm};
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: #e5e5e3;
    transform: translateY(-1px);
  }

  [data-theme='dark'] & {
    background: #171E2B;
    color: ${meok[100]};
    &:hover {
      background: #2E2A25;
    }
  }
`;
