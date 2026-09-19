'use client';

import React, { useMemo, useState } from 'react';
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
  Compass,
} from 'lucide-react';
import { meok, palette, surface , fontSize } from '@/design-system/tokens';
import { useBookmarkStore } from '@/features/map/hooks/useBookmarkStore';
import type { Village } from '@/features/hanok-archive/types';
import { filterLabel } from '@/features/hanok-archive/filterLabels';
import { useStayDetail } from '@/features/hanok-archive/hooks/useStayDetail';
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
  const detailData = useStayDetail(stay.id);
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

            {/* 이슈 #82: BE가 설명에서 자동 추출한 콘텐츠 태그 */}
            <ContentTagChips tags={detailData?.contentTags} />

            {/* 숙소 소개 섹션 */}
            <StayStorySection>
              <StoryHeader>
                <Sparkles size={16} color={palette.cheongrok[500]} />
                <StoryHeaderTitle>숙소 소개</StoryHeaderTitle>
              </StoryHeader>
              <StoryText>
                {stayIntroText || '한옥의 온돌과 마루에서 사계절 정취를 느끼며 머물 수 있는 곳이에요.'}
              </StoryText>
            </StayStorySection>

            {/* 숙박 이용 안내 (체크인/아웃, 주차, 편의시설) */}
            <SectionTitle>
              <Sparkles size={16} strokeWidth={2} /> 이용 안내
            </SectionTitle>
            <InfoGrid>
              <InfoCard>
                <InfoIconBox>
                  <Clock size={16} strokeWidth={2} />
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
                  <Home size={16} strokeWidth={2} />
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
                  <Car size={16} strokeWidth={2} />
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
                  <Coffee size={16} strokeWidth={2} />
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
                  <Phone size={16} strokeWidth={2} />
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
                  <Globe size={16} strokeWidth={2} />
                </InfoIconBox>
                <InfoContentBox>
                  <InfoLabel>예약 링크</InfoLabel>
                  <InfoVal>
                    {homepageInfo.url ? (
                      <a href={homepageInfo.url} target="_blank" rel="noopener noreferrer">
                        {homepageInfo.label} <ExternalLink size={12} style={{ display: 'inline' }} />
                      </a>
                    ) : (
                      <a href={getBookingUrl(stay)} target="_blank" rel="noopener noreferrer">
                        예약 정보 찾아보기 <ExternalLink size={12} style={{ display: 'inline' }} />
                      </a>
                    )}
                  </InfoVal>
                </InfoContentBox>
              </InfoCard>
            </InfoGrid>

            {/* 당근/토스 스타일: 숙소 반경 2km 1박 2일 몰입형 시공간 코스 */}
            <ItinerarySection>
              <ItineraryHeader>
                <Compass size={16} color={palette.cheongrok[500]} />
                <ItineraryHeaderTitle>이 고택을 품은 1박 2일 시공간 코스</ItineraryHeaderTitle>
              </ItineraryHeader>
              <ItinerarySubtitle>
                숙소 반경 2km 이내의 문화재 산책, 종가 미식, 온마루 사운드스케이프를 엮은 동선입니다.
              </ItinerarySubtitle>
              
              <TimelineBox>
                <TimelineDay>
                  <TimelineDayTitle>DAY 1 · 고택의 낮과 밤</TimelineDayTitle>
                  <TimelineStep>
                    <TimelineDot />
                    <TimelineContent>
                      <strong>14:00 인근 문화재·서원 산책</strong>
                      <span>고즈넉한 서원 툇마루에서 즐기는 여유 (반경 1.5km)</span>
                    </TimelineContent>
                  </TimelineStep>
                  <TimelineStep>
                    <TimelineDot />
                    <TimelineContent>
                      <strong>16:00 {stay.name} 입실 & 마루 쉼</strong>
                      <span>전통 온돌방 짐 풀기 및 웰컴 전통차 한 잔</span>
                    </TimelineContent>
                  </TimelineStep>
                  <TimelineStep>
                    <TimelineDot />
                    <TimelineContent>
                      <strong>18:30 지역 향토 미식 & 종가 밥상</strong>
                      <span>발효 장독대의 깊은 맛을 담은 저녁 식사</span>
                    </TimelineContent>
                  </TimelineStep>
                  <TimelineStep>
                    <TimelineDot />
                    <TimelineContent>
                      <strong>20:30 달빛 고택 산책 & 소리마루 오디오</strong>
                      <span>처마 밑 풀벌레 소리와 은은한 청사초롱 밤 정취</span>
                    </TimelineContent>
                  </TimelineStep>
                </TimelineDay>

                <TimelineDay>
                  <TimelineDayTitle>DAY 2 · 햇살과 아침의 정취</TimelineDayTitle>
                  <TimelineStep>
                    <TimelineDot />
                    <TimelineContent>
                      <strong>08:30 처마 일조 산책 & 아침 조식</strong>
                      <span>계절 햇살이 드는 마당 거닐기</span>
                    </TimelineContent>
                  </TimelineStep>
                  <TimelineStep>
                    <TimelineDot />
                    <TimelineContent>
                      <strong>11:00 체크아웃 & 로컬 장터 둘러보기</strong>
                      <span>지역 특산품과 전통 공예품을 만나는 시간</span>
                    </TimelineContent>
                  </TimelineStep>
                </TimelineDay>
              </TimelineBox>
            </ItinerarySection>

            {/* 숙소 사진 갤러리 */}
            {galleryImages.length > 1 && (
              <GallerySection>
                <SectionTitle>
                  <Images size={16} strokeWidth={2} /> 숙소 사진 ({galleryImages.length}장)
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
                예약 정보 확인하기 <ExternalLink size={15} strokeWidth={2} />
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
                {bookmarked ? '저장됨' : '저장하기'}
              </BookmarkActionBtn>
            </ActionRow>
          </Body>
        </ModalCard>
      </Overlay>

      {/* 라이트박스 전체화면 뷰어 */}
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
  font-size: ${fontSize.xs};
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

const ItinerarySection = styled.div`
  background: #fbfbfa;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 18px;
  padding: 20px 22px;
  margin-top: 14px;
  margin-bottom: 24px;

  [data-theme='dark'] & {
    background: #201D1A;
    border-color: rgba(255, 255, 255, 0.08);
  }
`;

const ItineraryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
`;

const ItineraryHeaderTitle = styled.h4`
  margin: 0;
  font-size: ${fontSize.sm};
  font-weight: 700;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const ItinerarySubtitle = styled.p`
  margin: 0 0 16px;
  font-size: ${fontSize.xs};
  color: ${meok[500]};
  line-height: 1.5;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const TimelineBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TimelineDay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TimelineDayTitle = styled.div`
  font-size: ${fontSize.xs};
  font-weight: 700;
  color: ${palette.cheongrok[700]};

  [data-theme='dark'] & {
    color: ${palette.cheongrok[400]};
  }
`;

const TimelineStep = styled.div`
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding-left: 14px;
  border-left: 2px solid rgba(0, 0, 0, 0.08);

  [data-theme='dark'] & {
    border-left-color: rgba(255, 255, 255, 0.12);
  }
`;

const TimelineDot = styled.div`
  position: absolute;
  left: -5px;
  top: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${palette.cheongrok[500]};
`;

const TimelineContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: ${fontSize.xs};

  strong {
    font-weight: 600;
    color: ${meok[900]};
  }

  span {
    color: ${meok[600]};
    line-height: 1.4;
  }

  [data-theme='dark'] & {
    strong {
      color: ${meok[100]};
    }
    span {
      color: ${meok[300]};
    }
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
  font-size: ${fontSize.sm};
  font-weight: 700;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const StoryText = styled.p`
  margin: 0;
  font-size: ${fontSize.sm};
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
    background: #24211D;
    color: ${meok[100]};
    &:hover {
      background: #2E2A25;
    }
  }
`;
