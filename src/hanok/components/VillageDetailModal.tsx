'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  ChevronDown,
  ArrowRight,
  Sparkles,
  BookOpen,
  Clock,
  Calendar,
  Car,
  Phone,
  Globe,
  Info,
  Images,
  Home,
  ExternalLink,
  Coffee,
  Bookmark,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { meok } from '@/design-system/tokens';
import { useBookmarkStore } from '@/map/hooks/useBookmarkStore';
import { STAY_TYPE } from '@/hanok/types';
import type { Village, VillageDetailResponse } from '@/hanok/types';
import { filterLabel } from '@/hanok/filterLabels';
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
  BookingModalBtn,
  BookmarkBtn,
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

function getBookingUrl(item: Village): string {
  if (item.overview) {
    const match = item.overview.match(/https?:\/\/[^\s"']+/i);
    if (match) return match[0];
  }
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(item.name + ' 예약')}`;
}

interface VillageDetailModalProps {
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
    const cleanUrl = rawUrl.startsWith('http://') ? `https://${rawUrl.slice(7)}` : rawUrl;
    return { url: cleanUrl, label: '공식 웹사이트' };
  }
  const cleanText = cleanTourApiHtml(homepageHtml);
  if (cleanText.startsWith('http')) {
    return { url: cleanText, label: '공식 웹사이트' };
  }
  return { url: null, label: '' };
}

export default function VillageDetailModal({ village, onClose }: VillageDetailModalProps) {
  // 숙소는 관람 시설이 아니다 — '관람', '문화유산 화보' 같은 말은 고궁·고택·민속마을에 맞는
  // 말이지, 묵어가는 곳에는 맞지 않는다. 여기서만 문구를 바꿔 끼운다.
  const isStay = village.type === STAY_TYPE;
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState<number | null>(null);
  const [zoomedImageIdx, setZoomedImageIdx] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<VillageDetailResponse | null>(null);
  // key로 마을마다 새로 마운트되므로, 뜨는 순간이 곧 불러오기 시작이다.
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);

  const isBookmarked = useBookmarkStore((s) => s.isBookmarked(village.id));
  const toggleBookmark = useBookmarkStore((s) => s.toggleBookmark);

  const handleToggleBookmark = (e?: React.MouseEvent) => {
    e?.stopPropagation();
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

  const galleryImages = useMemo(() => {
    const list: string[] = [];
    if (village.image) list.push(village.image);
    if (detailData?.images && detailData.images.length > 0) {
      for (const img of detailData.images) {
        if (!list.includes(img)) list.push(img);
      }
    }
    return list;
  }, [village, detailData]);

  useEffect(() => {
    if (zoomedImageIdx === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZoomedImageIdx(null);
      } else if (e.key === 'ArrowLeft') {
        setZoomedImageIdx((prev) =>
          prev !== null && prev > 0 ? prev - 1 : galleryImages.length - 1,
        );
      } else if (e.key === 'ArrowRight') {
        setZoomedImageIdx((prev) =>
          prev !== null && prev < galleryImages.length - 1 ? prev + 1 : 0,
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedImageIdx, galleryImages.length]);

  /*
    마을이 바뀌면 부모가 key로 이 컴포넌트를 다시 마운트한다 — 그래서 여기서 상태를
    되돌릴 필요가 없다. 예전에는 effect 본문에서 setDetailData(null)로 직접 되돌렸는데,
    그건 렌더가 연쇄로 겹치는 패턴이다.
  */
  useEffect(() => {
    let isMounted = true;

    fetch(`/api/tourapi/detail?id=${village.id}`)
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
  const currentStoryText = fetchedOverview || village.overview || village.summary || '';

  const paragraphs = useMemo(() => {
    if (!currentStoryText) return [];
    return currentStoryText
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);
  }, [currentStoryText]);

  const isLongContent = currentStoryText.length > 250;

  const currentHeroImage = useMemo(() => {
    if (activeImageIdx !== null && galleryImages[activeImageIdx]) {
      return galleryImages[activeImageIdx];
    }
    return village.hasImage ? village.image : galleryImages[0] || null;
  }, [activeImageIdx, galleryImages, village]);

  const homepageInfo = useMemo(() => {
    return extractHomepageUrl(detailData?.homepage);
  }, [detailData]);

  const hasOperationalInfo = Boolean(
    detailData?.usetime ||
      detailData?.restdate ||
      detailData?.parking ||
      detailData?.tel ||
      homepageInfo.url ||
      detailData?.expguide,
  );

  const mapUrl = useMemo(() => {
    const targetLat = village.lat ?? detailData?.lat ?? null;
    const targetLng = village.lng ?? detailData?.lng ?? null;
    const targetAddr = village.addr || detailData?.addr || '';

    const params = new URLSearchParams();
    if (targetLat != null) params.set('lat', String(targetLat));
    if (targetLng != null) params.set('lng', String(targetLng));
    if (village.id) params.set('id', village.id);
    if (village.name) params.set('title', village.name);
    if (targetAddr) params.set('addr', targetAddr);
    if (village.image) params.set('image', village.image);
    params.set('category', village.type === STAY_TYPE ? 'stay' : 'spot');
    return `/map?${params.toString()}`;
  }, [village, detailData]);

  return (
    <AnimatePresence>
      {village && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <ModalCard
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <BookmarkBtn
              type="button"
              $bookmarked={isBookmarked}
              onClick={handleToggleBookmark}
              title={isBookmarked ? '북마크 해제' : '북마크 저장'}
              aria-label={isBookmarked ? '북마크 해제' : '북마크 저장'}
            >
              <Bookmark
                size={18}
                strokeWidth={2}
                fill={isBookmarked ? '#1c52e0' : 'none'}
                color={isBookmarked ? '#1c52e0' : meok[900]}
              />
            </BookmarkBtn>

            <CloseBtn onClick={onClose} aria-label="닫기">
              <X size={18} strokeWidth={2} />
            </CloseBtn>

            <ImageHero $bg={currentHeroImage}>
              <HeroContent>
                <HeroRegion>{village.region}</HeroRegion>
                <HeroTitle>{village.name}</HeroTitle>
              </HeroContent>
              {currentHeroImage && (
                <HeroZoomBadge
                  type="button"
                  onClick={() => setZoomedImageIdx(activeImageIdx ?? 0)}
                  title="사진 크게 보기"
                >
                  <ZoomIn size={13} strokeWidth={2} /> 크게 보기
                </HeroZoomBadge>
              )}
            </ImageHero>

            <Body>
              <MetaRow>
                <TypeBadge>{filterLabel(village.type)}</TypeBadge>
                <AddrText>
                  <MapPin size={13} strokeWidth={2} style={{ display: 'inline', marginRight: 4 }} />
                  {village.addr}
                </AddrText>
              </MetaRow>

              {!isStay && (
                isLoadingOverview ? (
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
                        {fetchedOverview ? (
                          <BookOpen size={16} strokeWidth={2} />
                        ) : (
                          <Sparkles size={16} strokeWidth={2} />
                        )}
                        <span>
                          {fetchedOverview
                            ? '한국관광공사 원문'
                            : '온마루 한옥도감 에디토리얼'}
                        </span>
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
                        <StoryParagraph>상세 소개 정보를 준비 중입니다.</StoryParagraph>
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
                )
              )}

              {isStay && (
                <>
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
                              {homepageInfo.label}{' '}
                              <ArrowRight size={12} strokeWidth={2} style={{ display: 'inline' }} />
                            </a>
                          ) : (
                            <a href={getBookingUrl(village)} target="_blank" rel="noopener noreferrer">
                              실시간 예약 현황 보기{' '}
                              <ArrowRight size={12} strokeWidth={2} style={{ display: 'inline' }} />
                            </a>
                          )}
                        </InfoVal>
                      </InfoContentBox>
                    </InfoCard>
                  </InfoGrid>
                </>
              )}

              {!isLoadingOverview && !isStay && hasOperationalInfo && (
                <>
                  <SectionTitle>
                    <Info size={16} strokeWidth={2} /> 관람 및 이용 안내
                  </SectionTitle>
                  <InfoGrid>
                    {detailData?.usetime && (
                      <InfoCard>
                        <InfoIconBox>
                          <Clock size={16} strokeWidth={2} />
                        </InfoIconBox>
                        <InfoContentBox>
                          <InfoLabel>이용 시간</InfoLabel>
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
                          <InfoLabel>휴무일</InfoLabel>
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
                          <InfoLabel>문의 전화</InfoLabel>
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
                          <InfoLabel>공식 웹사이트</InfoLabel>
                          <InfoVal>
                            <a href={homepageInfo.url} target="_blank" rel="noopener noreferrer">
                              {homepageInfo.label} <ArrowRight size={12} strokeWidth={2} style={{ display: 'inline' }} />
                            </a>
                          </InfoVal>
                        </InfoContentBox>
                      </InfoCard>
                    )}
                  </InfoGrid>
                </>
              )}

              {!isLoadingOverview && detailData?.repeatInfo && detailData.repeatInfo.length > 0 && (
                <>
                  <SectionTitle>
                    <BookOpen size={16} strokeWidth={2} /> {isStay ? '이용 요금 안내' : '세부 관람 및 이용 요금 안내'}
                  </SectionTitle>
                  <RepeatList>
                    {detailData.repeatInfo.map((info, idx) => (
                      <RepeatItemCard key={idx}>
                        <RepeatTitleText>{info.title}</RepeatTitleText>
                        <RepeatContentText>{cleanTourApiHtml(info.content)}</RepeatContentText>
                      </RepeatItemCard>
                    ))}
                  </RepeatList>
                </>
              )}

              {galleryImages.length > 1 && (
                <GallerySection>
                  <SectionTitle>
                    <Images size={16} strokeWidth={2} /> {isStay ? '사진' : '문화유산 화보 갤러리'} ({galleryImages.length})
                  </SectionTitle>
                  <GalleryGrid>
                    {galleryImages.map((img, idx) => (
                      <GalleryThumb
                        key={idx}
                        $active={activeImageIdx === idx || (activeImageIdx === null && idx === 0)}
                        onClick={() => {
                          setActiveImageIdx(idx);
                          setZoomedImageIdx(idx);
                        }}
                        title="클릭하여 사진 크게 보기"
                        type="button"
                      >
                        <img src={img} alt={`${village.name} 사진 ${idx + 1}`} />
                      </GalleryThumb>
                    ))}
                  </GalleryGrid>
                </GallerySection>
              )}

              {village.badges.length > 0 && (
                <>
                  <BadgeTitle>특징 태그</BadgeTitle>
                  <BadgeList>
                    {village.badges.map((b) => (
                      <TagBadge key={b}>#{filterLabel(b)}</TagBadge>
                    ))}
                  </BadgeList>
                </>
              )}

              <ActionRow>
                <BookmarkActionBtn
                  type="button"
                  $bookmarked={isBookmarked}
                  onClick={handleToggleBookmark}
                  title={isBookmarked ? '북마크 해제' : '북마크 저장'}
                >
                  <Bookmark
                    size={16}
                    strokeWidth={2}
                    fill={isBookmarked ? 'currentColor' : 'none'}
                  />
                  {isBookmarked ? '저장됨' : '북마크'}
                </BookmarkActionBtn>

                {isStay && (
                  <BookingModalBtn
                    href={getBookingUrl(village)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    지금 예약하기 <ExternalLink size={15} strokeWidth={2} />
                  </BookingModalBtn>
                )}
                <MapBtn href={mapUrl}>
                  <MapPin size={15} strokeWidth={2} /> 지도에서 위치 보기 <ArrowRight size={14} strokeWidth={2} />
                </MapBtn>
              </ActionRow>
            </Body>
          </ModalCard>
        </Overlay>
      )}

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
            aria-label="확대 닫기"
          >
            <X size={22} strokeWidth={2} />
          </LightboxCloseBtn>

          {galleryImages.length > 1 && (
            <>
              <LightboxNavBtn
                $dir="left"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomedImageIdx((prev) =>
                    prev !== null && prev > 0 ? prev - 1 : galleryImages.length - 1,
                  );
                }}
                aria-label="이전 사진"
              >
                <ChevronLeft size={24} strokeWidth={2} />
              </LightboxNavBtn>

              <LightboxNavBtn
                $dir="right"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomedImageIdx((prev) =>
                    prev !== null && prev < galleryImages.length - 1 ? prev + 1 : 0,
                  );
                }}
                aria-label="다음 사진"
              >
                <ChevronRight size={24} strokeWidth={2} />
              </LightboxNavBtn>
            </>
          )}

          <LightboxImageWrapper onClick={(e) => e.stopPropagation()}>
            <LightboxImg
              key={zoomedImageIdx}
              src={galleryImages[zoomedImageIdx]}
              alt={`${village.name} 확대 사진 ${zoomedImageIdx + 1}`}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </LightboxImageWrapper>

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
