'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  IoCloseOutline,
  IoLocationOutline,
  IoChevronDownOutline,
  IoArrowForwardOutline,
  IoSparklesOutline,
  IoBookOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoCarOutline,
  IoCallOutline,
  IoGlobeOutline,
  IoInformationCircleOutline,
  IoImagesOutline,
} from 'react-icons/io5';
import type { Village, VillageDetailResponse } from '@/hanok/types';
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
} from './VillageDetailModal.styles';

interface VillageDetailModalProps {
  village: Village | null;
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
    return { url: cleanUrl, label: '공식 웹사이트 바로가기' };
  }
  const cleanText = cleanTourApiHtml(homepageHtml);
  if (cleanText.startsWith('http')) {
    return { url: cleanText, label: '공식 웹사이트 바로가기' };
  }
  return { url: null, label: '' };
}

export default function VillageDetailModal({ village, onClose }: VillageDetailModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<VillageDetailResponse | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

  useEffect(() => {
    if (!village) {
      setDetailData(null);
      setActiveImageIdx(null);
      setIsExpanded(false);
      return;
    }

    let isMounted = true;
    setIsLoadingOverview(true);

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
  const currentStoryText = fetchedOverview || village?.overview || village?.summary || '';

  const paragraphs = useMemo(() => {
    if (!currentStoryText) return [];
    return currentStoryText
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);
  }, [currentStoryText]);

  const isLongContent = currentStoryText.length > 250;

  const galleryImages = useMemo(() => {
    const list: string[] = [];
    if (village?.image) list.push(village.image);
    if (detailData?.images && detailData.images.length > 0) {
      for (const img of detailData.images) {
        if (!list.includes(img)) list.push(img);
      }
    }
    return list;
  }, [village, detailData]);

  const currentHeroImage = useMemo(() => {
    if (activeImageIdx !== null && galleryImages[activeImageIdx]) {
      return galleryImages[activeImageIdx];
    }
    return village?.hasImage ? village.image : galleryImages[0] || null;
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
            <CloseBtn onClick={onClose} aria-label="닫기">
              <IoCloseOutline size={18} />
            </CloseBtn>

            <ImageHero $bg={currentHeroImage}>
              <HeroContent>
                <HeroRegion>{village.region}</HeroRegion>
                <HeroTitle>{village.name}</HeroTitle>
              </HeroContent>
            </ImageHero>

            <Body>
              <MetaRow>
                <TypeBadge>{village.type}</TypeBadge>
                <AddrText>
                  <IoLocationOutline size={13} style={{ display: 'inline', marginRight: 4 }} />
                  {village.addr}
                </AddrText>
              </MetaRow>

              {isLoadingOverview ? (
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
                      {fetchedOverview ? <IoBookOutline size={16} /> : <IoSparklesOutline size={16} />}
                      <span>
                        {fetchedOverview
                          ? '한국관광공사 문화유산 & 한옥 원본 상세 글'
                          : '온마루 한옥 도감 에디토리얼'}
                      </span>
                    </HeaderBadge>
                    {fetchedOverview && <SourceTag>TourAPI 4.0 실시간 연동</SourceTag>}
                  </NoteHeader>
                  <StoryContainer $isExpanded={isExpanded}>
                    {paragraphs.map((p, idx) => (
                      <StoryParagraph key={idx}>{p}</StoryParagraph>
                    ))}
                  </StoryContainer>
                  {isLongContent && (
                    <ExpandBtn onClick={() => setIsExpanded(!isExpanded)}>
                      {isExpanded ? '접기' : '더보기 (스토리 전문 읽기)'}{' '}
                      <IoChevronDownOutline
                        size={14}
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'none',
                        }}
                      />
                    </ExpandBtn>
                  )}
                </CuratorsNoteSection>
              )}

              {!isLoadingOverview && hasOperationalInfo && (
                <>
                  <SectionTitle>
                    <IoInformationCircleOutline size={16} /> 관람 및 이용 안내
                  </SectionTitle>
                  <InfoGrid>
                    {detailData?.usetime && (
                      <InfoCard>
                        <InfoIconBox>
                          <IoTimeOutline size={16} />
                        </InfoIconBox>
                        <InfoContentBox>
                          <InfoLabel>관람 / 이용 시간</InfoLabel>
                          <InfoVal>{cleanTourApiHtml(detailData.usetime)}</InfoVal>
                        </InfoContentBox>
                      </InfoCard>
                    )}

                    {detailData?.restdate && (
                      <InfoCard>
                        <InfoIconBox>
                          <IoCalendarOutline size={16} />
                        </InfoIconBox>
                        <InfoContentBox>
                          <InfoLabel>정기 휴무일</InfoLabel>
                          <InfoVal>{cleanTourApiHtml(detailData.restdate)}</InfoVal>
                        </InfoContentBox>
                      </InfoCard>
                    )}

                    {detailData?.parking && (
                      <InfoCard>
                        <InfoIconBox>
                          <IoCarOutline size={16} />
                        </InfoIconBox>
                        <InfoContentBox>
                          <InfoLabel>주차 시설</InfoLabel>
                          <InfoVal>{cleanTourApiHtml(detailData.parking)}</InfoVal>
                        </InfoContentBox>
                      </InfoCard>
                    )}

                    {detailData?.tel && (
                      <InfoCard>
                        <InfoIconBox>
                          <IoCallOutline size={16} />
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
                          <IoGlobeOutline size={16} />
                        </InfoIconBox>
                        <InfoContentBox>
                          <InfoLabel>공식 웹사이트</InfoLabel>
                          <InfoVal>
                            <a href={homepageInfo.url} target="_blank" rel="noopener noreferrer">
                              {homepageInfo.label} <IoArrowForwardOutline size={12} style={{ display: 'inline' }} />
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
                    <IoBookOutline size={16} /> 세부 관람 및 이용 요금 안내
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
                    <IoImagesOutline size={16} /> 문화유산 화보 갤러리 ({galleryImages.length})
                  </SectionTitle>
                  <GalleryGrid>
                    {galleryImages.map((img, idx) => (
                      <GalleryThumb
                        key={idx}
                        $active={activeImageIdx === idx || (activeImageIdx === null && idx === 0)}
                        onClick={() => setActiveImageIdx(idx)}
                      >
                        <img src={img} alt={`${village.name} 사진 ${idx + 1}`} />
                      </GalleryThumb>
                    ))}
                  </GalleryGrid>
                </GallerySection>
              )}

              {village.badges.length > 0 && (
                <>
                  <BadgeTitle>주요 특징 태그</BadgeTitle>
                  <BadgeList>
                    {village.badges.map((b) => (
                      <TagBadge key={b}>#{b}</TagBadge>
                    ))}
                  </BadgeList>
                </>
              )}

              <ActionRow>
                <MapBtn href={`/map?lat=${village.lat}&lng=${village.lng}`}>
                  <IoLocationOutline size={15} /> 지도에서 위치 탐색하기 <IoArrowForwardOutline size={14} />
                </MapBtn>
              </ActionRow>
            </Body>
          </ModalCard>
        </Overlay>
      )}
    </AnimatePresence>
  );
}
