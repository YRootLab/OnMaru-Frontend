'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, MapPin, ChevronDown, ArrowRight, Sparkles, BookOpen, Clock, Calendar, Car, Phone, Globe, Info, Images } from 'lucide-react';
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
} from './VillageDetailModal.styles';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<VillageDetailResponse | null>(null);
  // key로 마을마다 새로 마운트되므로, 뜨는 순간이 곧 불러오기 시작이다.
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);

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
              <X size={18} strokeWidth={2} />
            </CloseBtn>

            <ImageHero $bg={currentHeroImage}>
              <HeroContent>
                <HeroRegion>{village.region}</HeroRegion>
                <HeroTitle>{village.name}</HeroTitle>
              </HeroContent>
            </ImageHero>

            <Body>
              <MetaRow>
                <TypeBadge>{filterLabel(village.type)}</TypeBadge>
                <AddrText>
                  <MapPin size={13} strokeWidth={2} style={{ display: 'inline', marginRight: 4 }} />
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
                      {fetchedOverview ? <BookOpen size={16} strokeWidth={2} /> : <Sparkles size={16} strokeWidth={2} />}
                      <span>
                        {fetchedOverview
                          ? '한국관광공사 원문'
                          : '온마루 한옥도감 에디토리얼'}
                      </span>
                    </HeaderBadge>
                    {fetchedOverview && <SourceTag>한국관광공사 관광정보 API(TourAPI 4.0)</SourceTag>}
                  </NoteHeader>
                  <StoryContainer $isExpanded={isExpanded}>
                    {paragraphs.map((p, idx) => (
                      <StoryParagraph key={idx}>{p}</StoryParagraph>
                    ))}
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

              {!isLoadingOverview && hasOperationalInfo && (
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
                    <BookOpen size={16} strokeWidth={2} /> 세부 관람 및 이용 요금 안내
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
                    <Images size={16} strokeWidth={2} /> 문화유산 화보 갤러리 ({galleryImages.length})
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
                  <BadgeTitle>특징 태그</BadgeTitle>
                  <BadgeList>
                    {village.badges.map((b) => (
                      <TagBadge key={b}>#{filterLabel(b)}</TagBadge>
                    ))}
                  </BadgeList>
                </>
              )}

              <ActionRow>
                <MapBtn href={`/map?lat=${village.lat}&lng=${village.lng}`}>
                  <MapPin size={15} strokeWidth={2} /> 지도에서 위치 보기 <ArrowRight size={14} strokeWidth={2} />
                </MapBtn>
              </ActionRow>
            </Body>
          </ModalCard>
        </Overlay>
      )}
    </AnimatePresence>
  );
}
