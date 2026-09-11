'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Clock,
  Car,
  Phone,
  Globe,
  Images,
  Home,
  ExternalLink,
  Coffee,
  Bookmark,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Navigation,
} from 'lucide-react';
import { meok, palette, surface } from '@/design-system/tokens';
import { useBookmarkStore } from '@/features/map/hooks/useBookmarkStore';
import type { Village, VillageDetailResponse } from '@/features/hanok-archive/types';
import { filterLabel } from '@/features/hanok-archive/filterLabels';
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
} from './VillageDetailModal.styles';
import styled from '@emotion/styled';

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
  const [detailData, setDetailData] = useState<VillageDetailResponse | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState<number | null>(null);
  const [zoomedImageIdx, setZoomedImageIdx] = useState<number | null>(null);

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

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/village/${stay.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: VillageDetailResponse | null) => {
        if (isMounted && data) setDetailData(data);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [stay.id]);

  const stayIntroText = useMemo(() => {
    const fetched = detailData?.overview ? cleanTourApiHtml(detailData.overview) : null;
    return fetched || stay.overview || stay.summary || '';
  }, [detailData, stay]);

  const galleryImages = useMemo(() => {
    const imgs: string[] = [];
    if (stay.hasImage && stay.image) imgs.push(stay.image);
    if (detailData?.images) {
      detailData.images.forEach((img) => {
        if (typeof img === 'string' && !imgs.includes(img)) imgs.push(img);
      });
    }
    return imgs;
  }, [stay, detailData]);

  const currentHeroImage = useMemo(() => {
    if (activeImageIdx !== null && galleryImages[activeImageIdx]) {
      return galleryImages[activeImageIdx];
    }
    return stay.hasImage ? stay.image : galleryImages[0] || null;
  }, [activeImageIdx, galleryImages, stay]);

  const homepageInfo = useMemo(() => extractHomepageUrl(detailData?.homepage), [detailData]);

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
          {/* 상단 숙소 히어로 이미지 */}
          <ImageHero $bg={currentHeroImage}>
            <CloseBtn onClick={onClose} aria-label="닫기">
              <X size={18} strokeWidth={2.5} />
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
                <ZoomIn size={13} strokeWidth={2} /> 사진 크게 보기
              </HeroZoomBadge>
            )}
          </ImageHero>

          <Body>
            {/* 메타 정보 행 */}
            <MetaRow>
              <StayBadge>
                <Home size={12} strokeWidth={2.5} />
                <span>한옥스테이</span>
              </StayBadge>
              <AddrText>
                <MapPin size={13} strokeWidth={2} style={{ display: 'inline', marginRight: 4 }} />
                {stay.addr}
              </AddrText>
            </MetaRow>

            {/* 숙소 소개 섹션 */}
            <StayStorySection>
              <StoryHeader>
                <Sparkles size={16} color={palette.cheongrok[500]} />
                <StoryHeaderTitle>숙소 소개 및 머뭄의 정취</StoryHeaderTitle>
              </StoryHeader>
              <StoryText>
                {stayIntroText || '전통 한옥의 온돌과 대청마루에서 사계절의 정취를 느끼며 묵어갈 수 있는 전통 숙소입니다.'}
              </StoryText>
            </StayStorySection>

            {/* 숙박 이용 안내 (체크인/아웃, 주차, 편의시설) */}
            <SectionTitle>
              <Sparkles size={16} strokeWidth={2} /> 손님 이용 안내 및 숙소 정보
            </SectionTitle>
            <InfoGrid>
              <InfoCard>
                <InfoIconBox>
                  <Clock size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>입실 / 퇴실 시간</InfoLabel>
                  <InfoVal>
                    {detailData?.checkin || detailData?.checkout
                      ? `입실 ${detailData.checkin || '15:00'} · 퇴실 ${detailData.checkout || '11:00'}`
                      : '입실 15:00 이후 · 퇴실 11:00 이전'}
                  </InfoVal>
                </InfoContentBox>
              </InfoCard>

              <InfoCard>
                <InfoIconBox>
                  <Home size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>객실 및 구조</InfoLabel>
                  <InfoVal>
                    {detailData?.roomtype
                      ? `${cleanTourApiHtml(detailData.roomtype)}${detailData?.roomcount ? ` (${cleanTourApiHtml(detailData.roomcount)})` : ''}`
                      : '전통 온돌방 · 대청마루 · 독채/별채'}
                  </InfoVal>
                </InfoContentBox>
              </InfoCard>

              <InfoCard>
                <InfoIconBox>
                  <Car size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>주차 시설</InfoLabel>
                  <InfoVal>
                    {cleanTourApiHtml(detailData?.parking) || '숙소 전용 또는 인근 주차 가능'}
                  </InfoVal>
                </InfoContentBox>
              </InfoCard>

              <InfoCard>
                <InfoIconBox>
                  <Coffee size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>편의시설 및 서비스</InfoLabel>
                  <InfoVal>
                    {cleanTourApiHtml(detailData?.subfacility) ||
                      `${detailData?.barbecue ? '바비큐 가능 · ' : ''}전통차 다도 체험 · 정원 마당 · Wi-Fi`}
                  </InfoVal>
                </InfoContentBox>
              </InfoCard>

              <InfoCard>
                <InfoIconBox>
                  <Phone size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>예약 및 문의 전화</InfoLabel>
                  <InfoVal>
                    {cleanTourApiHtml(detailData?.tel) || '사전 온라인 예약 및 유선 문의'}
                  </InfoVal>
                </InfoContentBox>
              </InfoCard>

              <InfoCard>
                <InfoIconBox>
                  <Globe size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>온라인 예약처</InfoLabel>
                  <InfoVal>
                    {homepageInfo.url ? (
                      <a href={homepageInfo.url} target="_blank" rel="noopener noreferrer">
                        {homepageInfo.label} <ExternalLink size={12} style={{ display: 'inline' }} />
                      </a>
                    ) : (
                      <a href={getBookingUrl(stay)} target="_blank" rel="noopener noreferrer">
                        실시간 예약 현황 보기 <ExternalLink size={12} style={{ display: 'inline' }} />
                      </a>
                    )}
                  </InfoVal>
                </InfoContentBox>
              </InfoCard>
            </InfoGrid>

            {/* 숙소 사진 갤러리 */}
            {galleryImages.length > 1 && (
              <GallerySection>
                <SectionTitle>
                  <Images size={16} strokeWidth={2} /> 숙소 및 마당 사진 ({galleryImages.length}장)
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
                      <img src={img} alt={`${stay.name} 사진 ${idx + 1}`} loading="lazy" />
                    </GalleryThumb>
                  ))}
                </GalleryGrid>
              </GallerySection>
            )}

            {/* 하단 액션 버튼 바 */}
            <ActionRow>
              <DirectBookingButton
                href={getBookingUrl(stay)}
                target="_blank"
                rel="noopener noreferrer"
              >
                지금 예약하기 <ExternalLink size={15} strokeWidth={2} />
              </DirectBookingButton>

              <MapGuideBtn
                href={`https://map.naver.com/v5/search/${encodeURIComponent(stay.name)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation size={14} strokeWidth={2} /> 길찾기
              </MapGuideBtn>

              <BookmarkActionBtn
                type="button"
                $bookmarked={bookmarked}
                onClick={handleBookmarkToggle}
                title={bookmarked ? '저장 목록에서 제거' : '숙소 저장'}
              >
                <Bookmark size={15} strokeWidth={2} fill={bookmarked ? 'currentColor' : 'none'} />
                {bookmarked ? '저장됨' : '저장'}
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

const StayBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: ${palette.cheongrok[50]};
  color: ${palette.cheongrok[700]};
  font-size: 11.5px;
  font-weight: 600;
  padding: 4px 11px;
  border-radius: 9999px;

  [data-theme='dark'] & {
    background: rgba(0, 196, 113, 0.15);
    color: ${palette.cheongrok[400]};
  }
`;

const StayStorySection = styled.div`
  background: #f8f8f7;
  border-radius: 18px;
  padding: 20px 22px;
  margin-top: 14px;
  margin-bottom: 24px;
  border: none;

  [data-theme='dark'] & {
    background: #24211D;
  }
`;

const StoryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
`;

const StoryHeaderTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const StoryText = styled.p`
  margin: 0;
  font-size: 13.5px;
  line-height: 1.7;
  color: ${meok[700]};
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[200]};
  }
`;

const DirectBookingButton = styled.a`
  flex: 1.5;
  height: 48px;
  border-radius: 9999px;
  background: ${palette.cheongrok[700]};
  color: #ffffff;
  font-size: 14px;
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
  font-size: 13.5px;
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
    background: #24211D;
    color: ${meok[100]};
    &:hover {
      background: #2E2A25;
    }
  }
`;
