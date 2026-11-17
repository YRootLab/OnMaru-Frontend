'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react'
import { Bookmark01Icon, Cancel01Icon, Car01Icon, ChevronLeftIcon, ChevronRightIcon, Clock01Icon, Coffee01Icon, ExternalLinkIcon, Flower01Icon, GlobeIcon, Home01Icon, Image02Icon, Layers01Icon, Leaf01Icon, MapPinIcon, Navigation01Icon, PhoneIcon, SnowflakeIcon, SparklesIcon, SproutIcon, WindIcon, ZoomInIcon } from '@hugeicons/core-free-icons'
import { meok, surface, typographyRole } from '@/design-system/tokens';
import { useBookmarkStore } from '@/features/map/hooks/useBookmarkStore';
import type { Village } from '@/features/hanok-archive/types';
import { filterLabel } from '@/features/hanok-archive/filterLabels';
import { useStayDetail } from '@/features/hanok-archive/hooks/useStayDetail';
import { inferSeasonTags } from '@/features/hanok-archive/utils/villageInsights';
import ContentTagChips from '@/shared/components/ContentTagChips';
import { livelyModalSpring, livelyBottomSheetSpring, modalOverlayTransition } from '@/shared/motion/modalMotion';
import {
  Overlay,
  ModalCard,
  ModalScrollContent,
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

function extractHomepageUrl(homepageHtml?: string | null, fallbackLabel: string = '공식 예약처 바로가기'): { url: string | null; label: string } {
  if (!homepageHtml) return { url: null, label: '' };
  const hrefMatch = homepageHtml.match(/href=["']([^"']+)["']/i);
  if (hrefMatch && hrefMatch[1]) {
    const rawUrl = hrefMatch[1].trim();
    try {
      const parsed = new URL(rawUrl);
      return { url: rawUrl, label: parsed.hostname.replace(/^www\./, '') };
    } catch {
      return { url: rawUrl, label: fallbackLabel };
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
  const tStay = useTranslations('hanok.stay');
  const tCommon = useTranslations('hanok.common');
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

  const homepageInfo = useMemo(
    () => extractHomepageUrl(detailData?.homepage, tStay('officialBookingSite')),
    [detailData, tStay]
  );
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
        transition={modalOverlayTransition}
        onClick={onClose}
      >
        <ModalCard
          initial={isMobile ? { y: '100%', opacity: 1 } : { scale: 0.93, opacity: 0, y: 16 }}
          animate={isMobile ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
          exit={isMobile ? { y: '100%', opacity: 1 } : { scale: 0.95, opacity: 0, y: 12 }}
          transition={isMobile ? livelyBottomSheetSpring : livelyModalSpring}
          onClick={(e) => e.stopPropagation()}
        >
          <CloseBtn onClick={onClose} aria-label={tCommon('close')}>
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2.5} />
          </CloseBtn>

          <ModalScrollContent>
          {}
          <ImageHero $bg={currentHeroImage}>
            <HeroContent>
              <HeroRegion>{stay.region} · {tStay('heroSubtitle')}</HeroRegion>
              <HeroTitle>{stay.name}</HeroTitle>
            </HeroContent>

            {currentHeroImage && (
              <HeroZoomBadge
                type="button"
                onClick={() => setZoomedImageIdx(activeImageIdx ?? 0)}
                title={tCommon('zoomPhoto')}
              >
                <HugeiconsIcon icon={ZoomInIcon} size={13} strokeWidth={2} /> {tCommon('zoomPhoto')}
              </HeroZoomBadge>
            )}
          </ImageHero>

          <Body>
            {}
            <MetaRow>
              <TypeBadge>{tStay('hanokStayType')}</TypeBadge>
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
                  : tStay('traditionalHanok')}
              </InsightBadge>
              <InsightBadge $color="#7c5c2e">
                <HugeiconsIcon icon={Layers01Icon} size={12} strokeWidth={2} />
                {tStay('ondolMaru')}
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
                  <HugeiconsIcon icon={SparklesIcon} size={16} color="var(--color-action-secondary)" />
                  <span>{tStay('stayIntro')}</span>
                </HeaderBadge>
              </NoteHeader>
              <StoryContainer $isExpanded={true}>
                <StoryParagraph>
                  {stayIntroText || tStay('stayIntroDefault')}
                </StoryParagraph>
              </StoryContainer>
            </CuratorsNoteSection>

            {}
            <MapPreviewCard
              href={kakaoMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${stay.name} ${tCommon('viewOnKakaoMap')}`}
            >
              <MapDotGrid aria-hidden="true" />
              <MapPreviewContent>
                <MapPreviewLabel>
                  <HugeiconsIcon icon={MapPinIcon} size={13} strokeWidth={2} /> {tCommon('location')}
                </MapPreviewLabel>
                <MapPreviewName>{stay.name}</MapPreviewName>
                <MapPreviewAddr>{stay.addr}</MapPreviewAddr>
              </MapPreviewContent>
              <MapPreviewAction>
                {tCommon('viewOnKakaoMap')} <HugeiconsIcon icon={ChevronRightIcon} size={14} strokeWidth={2.5} />
              </MapPreviewAction>
            </MapPreviewCard>

            {}
            <SectionTitle>
              <HugeiconsIcon icon={SparklesIcon} size={16} strokeWidth={2} /> {tStay('usageGuide')}
            </SectionTitle>
            <InfoGrid>
              <InfoCard>
                <InfoIconBox>
                  <HugeiconsIcon icon={Clock01Icon} size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>{tStay('checkInOut')}</InfoLabel>
                  <InfoVal>
                    {detailData?.checkin || detailData?.checkout
                      ? tStay('checkInOutValue', {
                          checkin: detailData.checkin || '15:00',
                          checkout: detailData.checkout || '11:00',
                        })
                      : tStay('checkInOutDefault')}
                  </InfoVal>
                </InfoContentBox>
              </InfoCard>

              <InfoCard>
                <InfoIconBox>
                  <HugeiconsIcon icon={Home01Icon} size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>{tStay('roomStructure')}</InfoLabel>
                  <InfoVal>
                    {detailData?.roomtype
                      ? `${cleanTourApiHtml(detailData.roomtype)}${detailData?.roomcount ? ` (${cleanTourApiHtml(detailData.roomcount)})` : ''}`
                      : tStay('roomDefault')}
                  </InfoVal>
                </InfoContentBox>
              </InfoCard>

              <InfoCard>
                <InfoIconBox>
                  <HugeiconsIcon icon={Car01Icon} size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>{tStay('parking')}</InfoLabel>
                  <InfoVal>
                    {cleanTourApiHtml(detailData?.parking) || tStay('parkingDefault')}
                  </InfoVal>
                </InfoContentBox>
              </InfoCard>

              <InfoCard>
                <InfoIconBox>
                  <HugeiconsIcon icon={Coffee01Icon} size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>{tStay('amenities')}</InfoLabel>
                  <InfoVal>
                    {cleanTourApiHtml(detailData?.subfacility) || tStay('amenitiesDefault')}
                  </InfoVal>
                </InfoContentBox>
              </InfoCard>

              <InfoCard>
                <InfoIconBox>
                  <HugeiconsIcon icon={PhoneIcon} size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>{tStay('contactPhone')}</InfoLabel>
                  <InfoVal>
                    {cleanTourApiHtml(detailData?.tel) || tStay('contactDefault')}
                  </InfoVal>
                </InfoContentBox>
              </InfoCard>

              <InfoCard>
                <InfoIconBox>
                  <HugeiconsIcon icon={GlobeIcon} size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>{tStay('bookingLink')}</InfoLabel>
                  <InfoVal>
                    {homepageInfo.url ? (
                      <a href={homepageInfo.url} target="_blank" rel="noopener noreferrer">
                        {homepageInfo.label} <HugeiconsIcon icon={ExternalLinkIcon} size={12} style={{ display: 'inline' }} />
                      </a>
                    ) : (
                      <a href={getBookingUrl(stay)} target="_blank" rel="noopener noreferrer">
                        {tStay('checkBooking')} <HugeiconsIcon icon={ExternalLinkIcon} size={12} style={{ display: 'inline' }} />
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
                  <HugeiconsIcon icon={Image02Icon} size={16} strokeWidth={2} /> {tStay('stayPhotos', { count: galleryImages.length })}
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
                      title={tCommon('zoomPhoto')}
                    >
                      { }
                      <img src={img} alt={tStay('photoAlt', { name: stay.name, index: idx + 1 })} loading="lazy" />
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
                {tStay('checkBooking')} <HugeiconsIcon icon={ExternalLinkIcon} size={15} strokeWidth={2} />
              </DirectBookingButton>

              <MapGuideBtn
                href={`https://map.naver.com/v5/search/${encodeURIComponent(stay.name)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <HugeiconsIcon icon={Navigation01Icon} size={14} strokeWidth={2} /> {tCommon('directions')}
              </MapGuideBtn>

              <BookmarkActionBtn
                type="button"
                $bookmarked={bookmarked}
                onClick={handleBookmarkToggle}
                title={bookmarked ? tStay('removeFromSaved') : tStay('saveStay')}
              >
                <HugeiconsIcon icon={Bookmark01Icon} size={15} strokeWidth={2} fill={bookmarked ? 'currentColor' : 'none'} />
                {bookmarked ? tCommon('saved') : tCommon('save')}
              </BookmarkActionBtn>
            </ActionRow>
          </Body>
          </ModalScrollContent>
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
            aria-label={tCommon('closePhoto')}
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
              aria-label={tCommon('prevPhoto')}
            >
              <HugeiconsIcon icon={ChevronLeftIcon} size={24} strokeWidth={2.5} />
            </LightboxNavBtn>
          )}

          <LightboxImageWrapper onClick={(e) => e.stopPropagation()}>
            { }
            <LightboxImg
              src={galleryImages[zoomedImageIdx]}
              alt={tStay('enlargedPhoto', { name: stay.name })}
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
              aria-label={tCommon('nextPhoto')}
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
  background: var(--color-action-secondary);
  color: #ffffff;
  font-size: ${typographyRole.bodySm.fontSize};
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-action-secondary-pressed);
    transform: translateY(-1px);
  }
`;

const MapGuideBtn = styled.a`
  height: 48px;
  padding: 0 18px;
  border-radius: 9999px;
  background: #f5f5f4;
  color: ${meok[900]};
  font-size: ${typographyRole.bodySm.fontSize};
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
    background: ${surface.dark.surface};
    color: ${meok[100]};
    &:hover {
      background: #2E2A25;
    }
  }
`;

