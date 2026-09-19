'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Share2,
  Navigation,
  RotateCcw,
  AlertCircle,
  Check,
  Award,
  Compass,
  Play,
  Headphones,
  Flame,
  Car,
  Ticket,
  Camera,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';
import { logger } from '@/lib/log';
import { lightPalette, meok } from '@/design-system/tokens';
import { useSorimaruPlaceStory } from '@/features/sorimaru-audio/hooks/useSorimaruPlaceStory';
import { useCinematicTourStore } from '@/features/cinematic-tour/store/useCinematicTourStore';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { useBookmarkStore } from '@/features/map/hooks/useBookmarkStore';
import { usePlaceDetail } from '@/features/map/hooks/usePlaceDetail';
import { useStampStore } from '@/features/stamp/hooks/useStampStore';
import { stampAudio } from '@/features/stamp/utils/sound';
import { calculateTravelEstimate, isTraditionalPlace } from '@/features/map/utils/geo';
import { createKakaoNavigationLinks } from '@/features/map/utils/navigation';
import PlaceDetailCarousel from './detail/PlaceDetailCarousel';
import PlaceWarmthSection from '@/private/core-ui/map-warmth/PlaceWarmthSection';
import RoadviewModal from './detail/RoadviewModal';
import {
  DetailWrapper,
  HeaderBar,
  HeaderBadge,
  BackToPopularBtn,
  HeaderActionGroup,
  CloseButton,
  ScrollBody,
  TitleSection,
  PlaceTitle,
  PlaceAddress,
  BadgeRow,
  Badge,
  SmartFeatureRow,
  SmartFeatureChip,
  LiveWarmthMeter,
  LiveWarmthStatus,
  LiveWarmthPulse,
  LiveWarmthCount,
  HeroActionGrid,
  HeroActionTile,
  HeroActionLink,
  StampCheckInBanner,
  StampBannerLeft,
  StampBannerText,
  StampBannerTitle,
  StampBannerSub,
  StampActionBtn,
  CoreInfoBox,
  CoreRow,
  CoreLabel,
  CoreValue,
  OverviewSection,
  SectionTitle,
  OverviewText,
  ToggleMoreBtn,
  BottomActionArea,
  BookmarkButton,
  ShareButton,
  NavButton,
  SkeletonBox,
  SkeletonImg,
  SkeletonLine,
  ErrorBox,
  CinematicBanner,
  CinematicHeader,
  CinematicBadge,
  CinematicDuration,
  CinematicTitle,
  CinematicDesc,
  CinematicStartButton,
} from './detail/PlaceDetail.styles';

const log = logger('map');

export default function PlaceDetail() {
  const detailId = useMapStore((s) => s.detailId);
  const setDetailId = useMapStore((s) => s.setDetailId);
  const fromPopularRanking = useMapStore((s) => s.fromPopularRanking);
  const goBackToPopularRanking = useMapStore((s) => s.goBackToPopularRanking);
  const items = useMapStore((s) => s.items);
  const warmths = useMapStore((s) => s.warmths);

  const [isRoadviewOpen, setIsRoadviewOpen] = useState(false);

  const selectedItem = useMemo(
    () => items.find((i) => i.id === detailId),
    [items, detailId],
  );

  const { data, loading, error, reload } = usePlaceDetail(
    detailId,
    selectedItem?.category === 'stay'
      ? '32'
      : selectedItem?.category === 'experience'
        ? '28'
        : selectedItem?.category === 'culture'
          ? '14'
          : selectedItem?.category === 'festival'
            ? '15'
            : selectedItem?.category === 'food' || selectedItem?.category === 'cafe'
              ? '39'
              : selectedItem?.category === 'market'
                ? '38'
                : '12',
  );

  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (detailId && titleRef.current) {
      titleRef.current.focus();
    }
    setIsOverviewExpanded(false);
  }, [detailId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDetailId]);

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
        // 클립보드 폴백
      }
    }
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const images = useMemo(() => {
    const list: string[] = [];
    if (data?.images && data.images.length > 0) list.push(...data.images);
    if (selectedItem?.image && !list.includes(selectedItem.image)) {
      list.unshift(selectedItem.image);
    }
    return list
      .map((src) => (src.startsWith('http://') ? src.replace('http://', 'https://') : src))
      .filter(Boolean);
  }, [data?.images, selectedItem?.image]);

  const rawTitle = data?.title;
  const isGenericTitle = !rawTitle || rawTitle === '한옥 명소 상세' || rawTitle === '상세 정보';
  const title = isGenericTitle ? selectedItem?.name || rawTitle || '장소 상세' : rawTitle;
  const addr = data?.addr1 || selectedItem?.addr || '';
  const tel = data?.tel || selectedItem?.tel;

  const isRealTraditional = useMemo(() => {
    if (selectedItem?.isTraditional !== undefined) return selectedItem.isTraditional;
    return isTraditionalPlace(title);
  }, [selectedItem?.isTraditional, title]);

  const userLocation = useMapStore((s) => s.userLocation);
  const center = useMapStore((s) => s.center);

  const travelEstimate = useMemo(() => {
    return calculateTravelEstimate(selectedItem, userLocation, center);
  }, [selectedItem, userLocation, center]);

  const badges = useMemo(() => {
    const list: string[] = [];
    if (isRealTraditional) {
      list.push('정통 한옥');
    } else {
      list.push('주변 연계 시설');
    }

    if (selectedItem?.category === 'stay') list.push(isRealTraditional ? '정통 한옥숙소' : '주변 숙박');
    else if (selectedItem?.category === 'experience') list.push('전통체험');
    else if (selectedItem?.category === 'culture') list.push('문화유산');
    else if (selectedItem?.category === 'festival') list.push('야행축제');
    else if (selectedItem?.category === 'food') list.push(isRealTraditional ? '향토음식' : '일반음식');
    else if (selectedItem?.category === 'cafe') list.push(isRealTraditional ? '전통찻집' : '일반카페');
    else if (selectedItem?.category === 'market') list.push('전통시장');
    else list.push(isRealTraditional ? '고택명소' : '관광명소');

    if (travelEstimate.fullLabel) {
      list.push(travelEstimate.fullLabel);
    }
    return list;
  }, [selectedItem, isRealTraditional, travelEstimate]);

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

  const { story: matchedSorimaruStory } = useSorimaruPlaceStory(
    title,
    hasValidCoords ? lat : undefined,
    hasValidCoords ? lng : undefined,
  );

  const smartFeatures = useMemo(() => {
    const list: { label: string; type: 'free' | 'parking' | 'audio' | 'general' }[] = [];
    if (matchedSorimaruStory) {
      list.push({ label: '오디오 해설', type: 'audio' });
    }
    const fee = data?.intro?.['이용요금'] || '';
    if (fee.includes('무료') || (!fee && selectedItem?.category === 'spot')) {
      list.push({ label: '무료 관람', type: 'free' });
    } else if (fee) {
      list.push({ label: '관람요금 안내', type: 'general' });
    }
    const parking = data?.intro?.['주차시설'] || '';
    if (parking.includes('가능') || parking.includes('있음') || parking.includes('주차장')) {
      list.push({ label: '주차 가능', type: 'parking' });
    }
    if (tel) {
      list.push({ label: '유선 문의 가능', type: 'general' });
    }
    return list;
  }, [matchedSorimaruStory, data?.intro, selectedItem?.category, tel]);

  const startTour = useCinematicTourStore((s) => s.startTour);

  const handleStartCinematicTour = () => {
    if (!matchedSorimaruStory) return;
    startTour(matchedSorimaruStory);
    const store = useMapStore.getState();
    if (store.sheetSnap === 'full') {
      store.setSheetSnap('peek');
    }
  };

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

  const placeWarmths = useMemo(() => {
    return warmths.filter((w) => w.placeId === detailId || w.placeName === title);
  }, [warmths, detailId, title]);

  const warmthCount = placeWarmths.length;
  const busyCount = placeWarmths.filter((w) => w.mood === '북적').length;
  const isBusy = busyCount >= Math.max(1, warmthCount - busyCount);

  const warmthMetrics = useMemo(() => {
    if (warmthCount === 0) {
      return {
        temp: '36.5℃',
        label: '방문객 온기를 기다리는 고즈넉한 쉼터',
        countLabel: '첫 온기 남기기',
      };
    }
    const temp = (36.5 + (isBusy ? 1.2 : 0.6) + Math.min(warmthCount * 0.2, 1.2)).toFixed(1);

    return {
      temp: `${temp}℃`,
      label: isBusy ? `체감 ${temp}℃ · 북적이고 활기찬 온기` : `체감 ${temp}℃ · 고즈넉하고 따뜻한 쉼`,
      countLabel: `머문 온기 ${warmthCount}건`,
    };
  }, [warmthCount, isBusy]);

  const isBookmarked = useBookmarkStore((s) => s.isBookmarked(detailId || ''));
  const toggleBookmark = useBookmarkStore((s) => s.toggleBookmark);

  const isPlaceVisited = useStampStore((s) => s.isPlaceVisited(detailId || ''));
  const checkIn = useStampStore((s) => s.checkIn);
  const openStampModal = useStampStore((s) => s.openStampModal);

  const handleToggleBookmark = () => {
    if (!detailId) return;
    toggleBookmark({
      id: detailId,
      name: title,
      category: selectedItem?.category,
      addr,
      image: images[0],
      lat: hasValidCoords ? lat : undefined,
      lng: hasValidCoords ? lng : undefined,
    });
  };

  return (
    <DetailWrapper tabIndex={-1} role="region" aria-label="장소 상세 정보">
      <HeaderBar>
        {fromPopularRanking ? (
          <BackToPopularBtn
            type="button"
            onClick={goBackToPopularRanking}
            aria-label="실시간 인기 순위 목록으로 돌아가기"
            title="실시간 인기 순위 목록으로 뒤로가기"
          >
            <ChevronLeft size={16} strokeWidth={2} />
            <span>인기 순위</span>
          </BackToPopularBtn>
        ) : (
          <HeaderBadge>
            <Award size={13} strokeWidth={2} />
            <span>추천명소</span>
          </HeaderBadge>
        )}
        <HeaderActionGroup>
          <CloseButton
            type="button"
            onClick={handleToggleBookmark}
            aria-label={isBookmarked ? '마음에 둔 장소 저장 해제' : '마음에 둔 장소로 저장'}
            title={isBookmarked ? '저장됨 (마음에 둔 장소)' : '마음에 담기 (북마크)'}
            style={{
              color: isBookmarked ? lightPalette.juhong[500] : meok[700],
              background: isBookmarked ? 'rgba(232, 90, 24, 0.1)' : undefined,
            }}
          >
            <Bookmark size={16} strokeWidth={2} fill={isBookmarked ? 'currentColor' : 'none'} />
          </CloseButton>
          <CloseButton
            type="button"
            onClick={() => setDetailId(null)}
            aria-label="상세 정보 닫기"
            title="닫기 (ESC)"
          >
            <X size={20} strokeWidth={2} />
          </CloseButton>
        </HeaderActionGroup>
      </HeaderBar>

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
            <AlertCircle size={32} color={lightPalette.cheongrok[700]} strokeWidth={1.8} style={{ marginBottom: 12 }} />
            <p style={{ margin: '0 0 16px', fontSize: 14, color: meok[700] }}>{error}</p>
            <ShareButton type="button" onClick={reload}>
              <RotateCcw size={14} strokeWidth={2} />
              <span>다시 시도</span>
            </ShareButton>
          </ErrorBox>
        ) : (
          <>
            <PlaceDetailCarousel
              images={images}
              title={title}
              category={selectedItem?.category}
            />

            <TitleSection>
              <PlaceTitle ref={titleRef} tabIndex={-1}>
                {title}
              </PlaceTitle>
              {addr && <PlaceAddress>{addr}</PlaceAddress>}
              {badges.length > 0 && (
                <BadgeRow>
                  {badges.map((badge, idx) => (
                    <Badge key={idx}>{badge}</Badge>
                  ))}
                </BadgeRow>
              )}
              {smartFeatures.length > 0 && (
                <SmartFeatureRow>
                  {smartFeatures.map((feat, idx) => (
                    <SmartFeatureChip key={idx} $type={feat.type}>
                      {feat.type === 'audio' && <Headphones size={12} strokeWidth={2} />}
                      {feat.type === 'free' && <Ticket size={12} strokeWidth={2} />}
                      {feat.type === 'parking' && <Car size={12} strokeWidth={2} />}
                      <span>{feat.label}</span>
                    </SmartFeatureChip>
                  ))}
                </SmartFeatureRow>
              )}
            </TitleSection>

            {/* 실시간 현장 체감 온기 바 */}
            <LiveWarmthMeter>
              <LiveWarmthStatus>
                <LiveWarmthPulse $busy={isBusy} />
                <span>{warmthMetrics.label}</span>
              </LiveWarmthStatus>
              <LiveWarmthCount>{warmthMetrics.countLabel}</LiveWarmthCount>
            </LiveWarmthMeter>

            {/* 원클릭 퀵 액션 타일 바 (소리마루 오디오 해설이 지원되는 장소에만 '오디오 해설' 타일 노출) */}
            <HeroActionGrid>
              {matchedSorimaruStory && (
                <HeroActionTile
                  type="button"
                  $highlight
                  onClick={handleStartCinematicTour}
                  title="현장 오디오 해설 듣기"
                >
                  <Headphones size={18} strokeWidth={2} />
                  <span>오디오 해설</span>
                </HeroActionTile>
              )}

              <HeroActionTile
                type="button"
                onClick={() => setIsRoadviewOpen(true)}
                title="현장 360도 로드뷰 둘러보기"
              >
                <Camera size={18} strokeWidth={2} />
                <span>로드뷰</span>
              </HeroActionTile>

              {hasValidCoords ? (
                <HeroActionLink
                  href={navLinks.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleNavClick}
                  title="카카오맵 길찾기"
                >
                  <Navigation size={18} strokeWidth={2} />
                  <span>길찾기</span>
                </HeroActionLink>
              ) : (
                <HeroActionTile type="button" disabled title="좌표 정보 없음">
                  <Navigation size={18} strokeWidth={2} />
                  <span>길찾기</span>
                </HeroActionTile>
              )}

              <HeroActionTile
                type="button"
                $isWarmth
                onClick={() => {
                  const el = document.getElementById('place-warmth-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                title="방문객 온기(후기) 보기"
              >
                <Flame size={18} strokeWidth={2} />
                <span>온기 남기기</span>
              </HeroActionTile>
            </HeroActionGrid>

            {/* 정통 한옥·문화재 명소에만 수결첩 방문 스탬프 체크인 활성화 */}
            {isRealTraditional && (
              <StampCheckInBanner $isVisited={isPlaceVisited}>
                <StampBannerLeft>
                  <Award size={18} color={isPlaceVisited ? '#059669' : '#b45309'} />
                  <StampBannerText>
                    <StampBannerTitle>
                      {isPlaceVisited ? '수결첩에 보관된 한옥' : '한옥 수결첩 방문 기록'}
                    </StampBannerTitle>
                    <StampBannerSub>
                      {isPlaceVisited
                        ? '수결첩에 도장을 남겼어요 · 눌러서 확인하기'
                        : '이곳을 다녀오셨다면 방문 도장을 남겨보세요'}
                    </StampBannerSub>
                  </StampBannerText>
                </StampBannerLeft>
                <StampActionBtn
                  type="button"
                  $isVisited={isPlaceVisited}
                  onClick={() => {
                    if (!detailId) return;
                    const res = checkIn({
                      id: detailId,
                      name: title,
                      address: addr,
                      isTraditional: true,
                    });
                    stampAudio.playStampSound();
                    if (res.primaryStamp) {
                      openStampModal(res.primaryStamp);
                    }
                  }}
                >
                  {isPlaceVisited ? (
                    <>
                      <CheckCircle2 size={13} strokeWidth={2.5} />
                      <span>도장 보기</span>
                    </>
                  ) : (
                    <>
                      <Award size={13} strokeWidth={2} />
                      <span>도장 찍기</span>
                    </>
                  )}
                </StampActionBtn>
              </StampCheckInBanner>
            )}

            {matchedSorimaruStory && (
              <CinematicBanner>
                <CinematicHeader>
                  <CinematicBadge>
                    <Compass size={13} strokeWidth={2} />
                    <span>오디오 해설</span>
                  </CinematicBadge>
                  <CinematicDuration>
                    {matchedSorimaruStory.formattedDuration || '약 10분'}
                  </CinematicDuration>
                </CinematicHeader>
                <CinematicTitle>{matchedSorimaruStory.audioTitle}</CinematicTitle>
                <CinematicDesc>
                  {matchedSorimaruStory.speaker ?? '해설사'}와 함께 지도를 따라 걷는 코스
                </CinematicDesc>
                <CinematicStartButton type="button" onClick={handleStartCinematicTour}>
                  <Play size={15} strokeWidth={2} className="ml-0.5" />
                  <span>오디오 해설 듣기</span>
                </CinematicStartButton>
              </CinematicBanner>
            )}

            <CoreInfoBox>
              <CoreRow>
                <CoreLabel>공간 분류</CoreLabel>
                <CoreValue>
                  {isRealTraditional
                    ? '정통 한옥 및 전통 문화 공간'
                    : '주변 연계 편의 공간'}
                </CoreValue>
              </CoreRow>

              <CoreRow>
                <CoreLabel>카테고리</CoreLabel>
                <CoreValue>
                  {selectedItem?.category === 'stay'
                    ? isRealTraditional ? '한옥 숙소' : '주변 숙소'
                    : selectedItem?.category === 'experience'
                      ? '전통 체험'
                      : selectedItem?.category === 'culture'
                        ? '문화유산'
                        : selectedItem?.category === 'festival'
                          ? '축제'
                          : selectedItem?.category === 'food'
                            ? isRealTraditional ? '전통 맛집' : '일반 음식점'
                            : selectedItem?.category === 'cafe'
                              ? isRealTraditional ? '한옥 카페' : '일반 카페'
                              : selectedItem?.category === 'market'
                                ? '전통 시장'
                                : isRealTraditional ? '고택' : '명소'}
                </CoreValue>
              </CoreRow>

              {data?.intro?.['이용시간'] && (
                <CoreRow>
                  <CoreLabel>이용시간</CoreLabel>
                  <CoreValue>{data.intro['이용시간']}</CoreValue>
                </CoreRow>
              )}

              {data?.intro?.['쉬는날'] && (
                <CoreRow>
                  <CoreLabel>쉬는날</CoreLabel>
                  <CoreValue>{data.intro['쉬는날']}</CoreValue>
                </CoreRow>
              )}

              {data?.intro?.['주차시설'] && (
                <CoreRow>
                  <CoreLabel>주차</CoreLabel>
                  <CoreValue>{data.intro['주차시설']}</CoreValue>
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

            {data?.overview && (
              <OverviewSection>
                <SectionTitle>소개</SectionTitle>
                <OverviewText $expanded={isOverviewExpanded}>{data.overview}</OverviewText>
                {data.overview.length > 120 && (
                  <ToggleMoreBtn
                    type="button"
                    onClick={() => setIsOverviewExpanded((prev) => !prev)}
                  >
                    <span>{isOverviewExpanded ? '접기' : '더보기'}</span>
                    {isOverviewExpanded ? (
                      <ChevronUp size={12} strokeWidth={2} />
                    ) : (
                      <ChevronDown size={12} strokeWidth={2} />
                    )}
                  </ToggleMoreBtn>
                )}
              </OverviewSection>
            )}

            {detailId && (
              <PlaceWarmthSection
                placeId={detailId}
                placeName={title}
                lat={lat}
                lng={lng}
              />
            )}
          </>
        )}
      </ScrollBody>

      <BottomActionArea>
        <BookmarkButton
          type="button"
          $active={isBookmarked}
          onClick={handleToggleBookmark}
          aria-label={isBookmarked ? '마음에 담긴 장소' : '마음에 담기'}
          title={isBookmarked ? '저장 해제' : '마음에 담기'}
        >
          <Bookmark size={16} strokeWidth={2} fill={isBookmarked ? 'currentColor' : 'none'} />
          <span>{isBookmarked ? '저장됨' : '마음에 담기'}</span>
        </BookmarkButton>

        <ShareButton type="button" onClick={handleShare} aria-label="장소 링크 공유하기">
          {copied ? <Check size={16} color={lightPalette.cheongrok[700]} strokeWidth={2} /> : <Share2 size={16} strokeWidth={2} />}
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
            <Navigation size={16} strokeWidth={2} />
            <span>길찾기</span>
          </NavButton>
        )}
      </BottomActionArea>

      <RoadviewModal
        isOpen={isRoadviewOpen}
        onClose={() => setIsRoadviewOpen(false)}
        placeName={title}
        lat={lat}
        lng={lng}
      />
    </DetailWrapper>
  );
}
