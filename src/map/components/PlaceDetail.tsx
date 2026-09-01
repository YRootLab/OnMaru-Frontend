'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import {
  X,
  Share2,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Home,
  Utensils,
  Coffee,
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  Check,
  Award,
} from 'lucide-react';
import { logger } from '@/lib/log';
import { lightPalette, meok } from '@/design-system/tokens';
import { useMapStore } from '../hooks/useMapStore';
import { usePlaceDetail } from '../hooks/usePlaceDetail';
import type { PlaceCategory } from '../types';
import { toHttps, formatDistance } from '../utils/formatters';
import { createKakaoNavigationLinks } from '../utils/navigation';

const log = logger('map');

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`;

const DetailWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  overflow: hidden;
  outline: none;
`;

/* ── 1. 상단 고정 헤더 (52px sticky) ── */
const HeaderBar = styled.header`
  flex: none;
  height: 52px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  z-index: 5;
`;

const HeaderBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 9999px;
  background: rgba(40, 110, 95, 0.08);
  color: ${lightPalette.cheongrok[700]};
  font-size: 11.5px;
  font-weight: 700;
`;

const CloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(25, 31, 40, 0.04);
  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(25, 31, 40, 0.08);
    color: ${meok[900]};
  }

  &:active {
    transform: scale(0.92);
  }
`;

/* ── 2. 본문 스크롤 영역 ── */
const ScrollBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  animation: ${fadeIn} 0.2s ease-out;
`;

/* ── 이미지 영역 ── */
const ImageContainer = styled.div<{ $hasImages: boolean }>`
  position: relative;
  width: 100%;
  aspect-ratio: ${({ $hasImages }) => ($hasImages ? '4 / 3' : '16 / 9')};
  background: #f0eae0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CarouselTrack = styled.div<{ $index: number }>`
  display: flex;
  width: 100%;
  height: 100%;
  transform: ${({ $index }) => `translateX(-${$index * 100}%)`};
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
`;

const CarouselSlide = styled.div`
  position: relative;
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
`;

const SlideImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const CarouselNavBtn = styled.button<{ $pos: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${({ $pos }) => ($pos === 'left' ? 'left: 8px;' : 'right: 8px;')}
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(25, 31, 40, 0.5);
  color: #ffffff;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 0.15s ease;

  &:hover {
    background: rgba(25, 31, 40, 0.8);
  }
`;

const DotsWrapper = styled.div`
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
`;

const Dot = styled.div<{ $active: boolean }>`
  width: ${({ $active }) => ($active ? '14px' : '5px')};
  height: 5px;
  border-radius: 9999px;
  background: ${({ $active }) => ($active ? '#ffffff' : 'rgba(255, 255, 255, 0.5)')};
  transition: all 0.2s ease;
`;

/* ── 제목 영역 ── */
const TitleSection = styled.div`
  padding: 16px 16px 12px;
`;

const PlaceTitle = styled.h2`
  margin: 0 0 4px;
  font-size: 19px;
  font-weight: 700;
  color: ${meok[900]};
  line-height: 1.35;
  letter-spacing: -0.02em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  outline: none;
`;

const PlaceAddress = styled.p`
  margin: 0 0 10px;
  font-size: 13px;
  color: ${meok[500]};
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Badge = styled.span`
  padding: 3px 9px;
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 500;
  color: ${meok[700]};
  background: rgba(78, 89, 104, 0.07);
`;

/* ── 핵심 정보 박스 (#F7F1E6, no-border) ── */
const CoreInfoBox = styled.div`
  margin: 0 16px;
  padding: 16px;
  background: #f7f1e6;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  gap: 11px;
`;

const CoreRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const CoreLabel = styled.span`
  font-size: 13px;
  color: ${meok[500]};
  flex-shrink: 0;
`;

const CoreValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${meok[900]};
  text-align: right;
  word-break: keep-all;
`;

/* ── 소개 영역 ── */
const OverviewSection = styled.div`
  padding: 16px;
  margin-top: 6px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: ${meok[900]};
`;

const OverviewText = styled.p<{ $expanded: boolean }>`
  margin: 0;
  font-size: 13.5px;
  line-height: 1.7;
  color: ${meok[700]};
  word-break: keep-all;
  white-space: pre-line;

  ${({ $expanded }) =>
    !$expanded &&
    `
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
`;

const ToggleMoreBtn = styled.button`
  margin-top: 6px;
  padding: 0;
  border: none;
  background: transparent;
  color: ${lightPalette.cheongrok[700]};
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

/* ── 3. 하단 고정 액션 바 ── */
const BottomActionArea = styled.div`
  flex: none;
  padding: 12px 16px;
  background: #ffffff;
  display: flex;
  gap: 8px;
`;

const ShareButton = styled.button`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 48px;
  border: none;
  border-radius: 16px;
  background: rgba(78, 89, 104, 0.08);
  color: ${meok[900]};
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(78, 89, 104, 0.14);
  }

  &:active {
    transform: scale(0.97);
  }
`;

const NavButton = styled.a`
  flex: 1.6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 48px;
  border-radius: 16px;
  background: ${meok[900]};
  color: #ffffff;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${meok[700]};
  }

  &:active {
    transform: scale(0.97);
  }
`;

/* ── 스켈레톤 로딩 ── */
const SkeletonBox = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const SkeletonImg = styled.div`
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 16px;
  background: rgba(78, 89, 104, 0.08);
`;

const SkeletonLine = styled.div<{ $w: string; $h: string }>`
  width: ${({ $w }) => $w};
  height: ${({ $h }) => $h};
  border-radius: 4px;
  background: rgba(78, 89, 104, 0.08);
`;

/* ── 에러 상태 ── */
const ErrorBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

/** 카테고리 SVG 폴백 아이콘 */
function renderCategoryFallback(category?: PlaceCategory | string) {
  switch (category) {
    case 'stay':
      return <Home size={44} color={meok[400]} />;
    case 'food':
      return <Utensils size={44} color={meok[400]} />;
    case 'cafe':
      return <Coffee size={44} color={meok[400]} />;
    case 'market':
      return <ShoppingBag size={44} color={meok[400]} />;
    default:
      return <Landmark size={44} color={meok[400]} />;
  }
}

export default function PlaceDetail() {
  const detailId = useMapStore((s) => s.detailId);
  const setDetailId = useMapStore((s) => s.setDetailId);
  const items = useMapStore((s) => s.items);

  const selectedItem = useMemo(
    () => items.find((i) => i.id === detailId),
    [items, detailId],
  );

  const { data, loading, error, reload } = usePlaceDetail(
    detailId,
    selectedItem?.category === 'stay'
      ? '32'
      : selectedItem?.category === 'food' || selectedItem?.category === 'cafe'
        ? '39'
        : selectedItem?.category === 'market'
          ? '38'
          : '12',
  );

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const titleRef = useRef<HTMLHeadingElement>(null);

  // 상세가 열리면 제목으로 포커스
  useEffect(() => {
    if (detailId && titleRef.current) {
      titleRef.current.focus();
    }
    setCurrentSlide(0);
    setIsOverviewExpanded(false);
    setFailedImages({});
  }, [detailId]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDetailId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDetailId]);

  // 공유하기 핸들러
  const handleShare = async () => {
    if (typeof window === 'undefined') return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: data?.title || selectedItem?.name || '온마루',
          url: window.location.href,
        });
        return;
      } catch {
        // 취소 시 클립보드로 폴백
      }
    }

    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 이미지 목록 안전 추출 (TourAPI 응답 + 리스트 아이템 이미지 폴백 + HTTPS 변환)
  const images = useMemo(() => {
    const list: string[] = [];
    if (data?.images && data.images.length > 0) {
      list.push(...data.images);
    }
    if (selectedItem?.image && !list.includes(selectedItem.image)) {
      list.unshift(selectedItem.image);
    }
    return list
      .map((src) => (src.startsWith('http://') ? src.replace('http://', 'https://') : src))
      .filter(Boolean);
  }, [data?.images, selectedItem?.image]);

  const validImages = images.filter((_, idx) => !failedImages[idx]);

  const title = data?.title || selectedItem?.name || '장소 상세';
  const addr = data?.addr1 || selectedItem?.addr || '';
  const tel = data?.tel || selectedItem?.tel;

  const badges = useMemo(() => {
    const list: string[] = [];
    if (selectedItem?.category === 'stay') list.push('한옥스테이', '전통숙소');
    else if (selectedItem?.category === 'cafe') list.push('전통차', '디저트');
    else if (selectedItem?.category === 'food') list.push('전통한식', '향토음식');
    else list.push('전통문화', '역사명소');
    if (data?.intro?.['주차시설']) list.push('주차가능');
    return list.slice(0, 4);
  }, [selectedItem, data]);

  // 좌표 계산 및 위경도 반전 방어 가드
  let lat = Number(data?.mapy) || selectedItem?.lat || 0;
  let lng = Number(data?.mapx) || selectedItem?.lng || 0;
  if (lat > 100 && lng < 100) {
    const tmp = lat;
    lat = lng;
    lng = tmp;
  }

  const hasValidCoords =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= 33 &&
    lat <= 39 &&
    lng >= 124 &&
    lng <= 132;

  const navLinks = createKakaoNavigationLinks(title, lat, lng);

  // 모바일 카카오맵 앱 연동 핸들러
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    log.log('길찾기 실행', { name: title, lat, lng, url: navLinks.webUrl });
    if (typeof window === 'undefined') return;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      e.preventDefault();
      const t0 = Date.now();
      window.location.href = navLinks.appScheme;
      setTimeout(() => {
        if (Date.now() - t0 < 1500) {
          window.open(navLinks.webUrl, '_blank');
        }
      }, 1000);
    }
  };

  return (
    <DetailWrapper tabIndex={-1} role="region" aria-label="장소 상세 정보">
      {/* 1. 상단 고정 헤더 (52px) */}
      <HeaderBar>
        <HeaderBadge>
          <Award size={13} />
          <span>추천명소</span>
        </HeaderBadge>

        <CloseButton
          type="button"
          onClick={() => setDetailId(null)}
          aria-label="상세 정보 닫기"
          title="닫기 (ESC)"
        >
          <X size={20} />
        </CloseButton>
      </HeaderBar>

      {/* 2. 본문 스크롤 */}
      <ScrollBody key={detailId}>
        {loading && !data && !selectedItem ? (
          <SkeletonBox aria-busy="true">
            <SkeletonImg />
            <SkeletonLine $w="75%" $h="22px" />
            <SkeletonLine $w="40%" $h="14px" />
            <SkeletonLine $w="100%" $h="90px" />
          </SkeletonBox>
        ) : error && !data && !selectedItem ? (
          <ErrorBox role="alert">
            <AlertCircle size={32} color={lightPalette.cheongrok[700]} style={{ marginBottom: 12 }} />
            <p style={{ margin: '0 0 16px', fontSize: 14, color: meok[700] }}>{error}</p>
            <ShareButton type="button" onClick={reload}>
              <RefreshCw size={14} />
              <span>다시 시도</span>
            </ShareButton>
          </ErrorBox>
        ) : (
          <>
            {/* 이미지 캐러셀 */}
            <ImageContainer $hasImages={validImages.length > 0}>
              {validImages.length > 0 ? (
                <>
                  <CarouselTrack $index={currentSlide}>
                    {validImages.map((src, idx) => (
                      <CarouselSlide key={idx}>
                        <SlideImg
                          src={src}
                          alt={`${title} 사진 ${idx + 1}`}
                          onError={() => setFailedImages((prev) => ({ ...prev, [idx]: true }))}
                          loading={idx === 0 ? 'eager' : 'lazy'}
                        />
                      </CarouselSlide>
                    ))}
                  </CarouselTrack>

                  {validImages.length > 1 && (
                    <>
                      {currentSlide > 0 && (
                        <CarouselNavBtn
                          $pos="left"
                          type="button"
                          onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                          aria-label="이전 사진 보기"
                        >
                          <ChevronLeft size={18} />
                        </CarouselNavBtn>
                      )}
                      {currentSlide < validImages.length - 1 && (
                        <CarouselNavBtn
                          $pos="right"
                          type="button"
                          onClick={() => setCurrentSlide((prev) => Math.min(validImages.length - 1, prev + 1))}
                          aria-label="다음 사진 보기"
                        >
                          <ChevronRight size={18} />
                        </CarouselNavBtn>
                      )}
                      <DotsWrapper>
                        {validImages.map((_, idx) => (
                          <Dot key={idx} $active={idx === currentSlide} />
                        ))}
                      </DotsWrapper>
                    </>
                  )}
                </>
              ) : (
                renderCategoryFallback(selectedItem?.category)
              )}
            </ImageContainer>

            {/* 제목 영역 */}
            <TitleSection>
              <PlaceTitle ref={titleRef} tabIndex={-1}>
                {title}
              </PlaceTitle>
              {addr && <PlaceAddress>{addr}</PlaceAddress>}

              <BadgeRow>
                {badges.map((b, idx) => (
                  <Badge key={idx}>{b}</Badge>
                ))}
              </BadgeRow>
            </TitleSection>

            {/* 핵심 정보 박스 (#F7F1E6, 라벨-값 좌우 정렬, no-border) */}
            <CoreInfoBox>
              {(data?.intro?.['이용시간'] || data?.intro?.['영업시간']) && (
                <CoreRow>
                  <CoreLabel>{data?.intro?.['이용시간'] ? '이용시간' : '영업시간'}</CoreLabel>
                  <CoreValue>{data?.intro?.['이용시간'] || data?.intro?.['영업시간']}</CoreValue>
                </CoreRow>
              )}

              {data?.intro?.['체크인'] && (
                <CoreRow>
                  <CoreLabel>체크인/아웃</CoreLabel>
                  <CoreValue>{data.intro['체크인']} / {data.intro['체크아웃'] || '11:00'}</CoreValue>
                </CoreRow>
              )}

              {data?.intro?.['쉬는날'] && (
                <CoreRow>
                  <CoreLabel>휴무일</CoreLabel>
                  <CoreValue>{data.intro['쉬는날']}</CoreValue>
                </CoreRow>
              )}

              {data?.intro?.['주차시설'] && (
                <CoreRow>
                  <CoreLabel>주차</CoreLabel>
                  <CoreValue>{data.intro['주차시설']}</CoreValue>
                </CoreRow>
              )}

              {data?.intro?.['대표메뉴'] && (
                <CoreRow>
                  <CoreLabel>대표메뉴</CoreLabel>
                  <CoreValue>{data.intro['대표메뉴']}</CoreValue>
                </CoreRow>
              )}

              {data?.intro?.['이용요금'] && (
                <CoreRow>
                  <CoreLabel>이용요금</CoreLabel>
                  <CoreValue>{data.intro['이용요금']}</CoreValue>
                </CoreRow>
              )}

              {tel && (
                <CoreRow>
                  <CoreLabel>문의전화</CoreLabel>
                  <CoreValue>{tel}</CoreValue>
                </CoreRow>
              )}
            </CoreInfoBox>

            {/* 소개 영역 */}
            {data?.overview && (
              <OverviewSection>
                <SectionTitle>소개</SectionTitle>
                <OverviewText $expanded={isOverviewExpanded}>{data.overview}</OverviewText>
                {data.overview.length > 120 && (
                  <ToggleMoreBtn
                    type="button"
                    onClick={() => setIsOverviewExpanded((prev) => !prev)}
                  >
                    {isOverviewExpanded ? '접기 ▲' : '더보기 ▼'}
                  </ToggleMoreBtn>
                )}
              </OverviewSection>
            )}
          </>
        )}
      </ScrollBody>

      {/* 3. 하단 고정 액션 바 */}
      <BottomActionArea>
        <ShareButton type="button" onClick={handleShare} aria-label="장소 링크 공유하기">
          {copied ? <Check size={16} color={lightPalette.cheongrok[700]} /> : <Share2 size={16} />}
          <span>{copied ? '복사됨' : '공유하기'}</span>
        </ShareButton>

        {hasValidCoords && (
          <NavButton
            href={navLinks.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleNavClick}
            aria-label="카카오맵으로 길찾기"
          >
            <Navigation size={16} />
            <span>길찾기</span>
          </NavButton>
        )}
      </BottomActionArea>
    </DetailWrapper>
  );
}
