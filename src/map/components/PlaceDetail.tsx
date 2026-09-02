'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Share2,
  Navigation,
  RefreshCw,
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
} from 'lucide-react';
import { logger } from '@/lib/log';
import { lightPalette, meok } from '@/design-system/tokens';
import { useOdiiPlaceStory } from '@/features/odii-audio/hooks/useOdiiPlaceStory';
import { useCinematicTourStore } from '@/features/cinematic-tour/store/useCinematicTourStore';
import { useMapStore } from '@/map/hooks/useMapStore';
import { usePlaceDetail } from '@/map/hooks/usePlaceDetail';
import { formatDistance } from '@/map/utils/formatters';
import { createKakaoNavigationLinks } from '@/map/utils/navigation';
import PlaceDetailCarousel from './detail/PlaceDetailCarousel';
import PlaceWarmthSection from './warmth/PlaceWarmthSection';
import RoadviewModal from './detail/RoadviewModal';
import {
  DetailWrapper,
  HeaderBar,
  HeaderBadge,
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
  CoreInfoBox,
  CoreRow,
  CoreLabel,
  CoreValue,
  OverviewSection,
  SectionTitle,
  OverviewText,
  ToggleMoreBtn,
  BottomActionArea,
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

  const title = data?.title || selectedItem?.name || '장소 상세';
  const addr = data?.addr1 || selectedItem?.addr || '';
  const tel = data?.tel || selectedItem?.tel;

  const badges = useMemo(() => {
    const list: string[] = [];
    if (selectedItem?.category === 'stay') list.push('한옥스테이');
    else if (selectedItem?.category === 'experience') list.push('전통체험');
    else if (selectedItem?.category === 'culture') list.push('문화유산');
    else if (selectedItem?.category === 'festival') list.push('야행축제');
    else if (selectedItem?.category === 'food') list.push('향토음식');
    else if (selectedItem?.category === 'cafe') list.push('전통찻집');
    else if (selectedItem?.category === 'market') list.push('전통시장');
    else list.push('명소고택');

    if (selectedItem?.dist !== undefined && selectedItem?.dist !== null) {
      list.push(formatDistance(selectedItem.dist));
    }
    return list;
  }, [selectedItem]);

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

  const { story: matchedOdiiStory } = useOdiiPlaceStory(
    title,
    hasValidCoords ? lat : undefined,
    hasValidCoords ? lng : undefined,
  );

  const smartFeatures = useMemo(() => {
    const list: { label: string; type: 'free' | 'parking' | 'audio' | 'general' }[] = [];
    if (matchedOdiiStory) {
      list.push({ label: '오디 도슨트 해설', type: 'audio' });
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
  }, [matchedOdiiStory, data?.intro, selectedItem?.category, tel]);

  const startTour = useCinematicTourStore((s) => s.startTour);

  const handleStartCinematicTour = () => {
    if (!matchedOdiiStory) return;
    startTour(matchedOdiiStory);
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
  const warmthStatusLabel =
    warmthCount === 0
      ? '방문객 온기를 기다리는 고즈넉한 명소'
      : isBusy
        ? '실시간 체감: 북적이고 활기찬 분위기'
        : '실시간 체감: 고즈넉하고 한적한 분위기';

  return (
    <DetailWrapper tabIndex={-1} role="region" aria-label="장소 상세 정보">
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
                      {feat.type === 'audio' && <Headphones size={11} />}
                      {feat.type === 'free' && <Ticket size={11} />}
                      {feat.type === 'parking' && <Car size={11} />}
                      <span>{feat.label}</span>
                    </SmartFeatureChip>
                  ))}
                </SmartFeatureRow>
              )}
            </TitleSection>

            {/* 실시간 현장 체감 분위기 바 */}
            <LiveWarmthMeter>
              <LiveWarmthStatus>
                <LiveWarmthPulse $busy={isBusy} />
                <span>{warmthStatusLabel}</span>
              </LiveWarmthStatus>
              <LiveWarmthCount>{warmthCount > 0 ? `온기 ${warmthCount}건` : '첫 온기 남기기'}</LiveWarmthCount>
            </LiveWarmthMeter>

            {/* 원클릭 4단 퀵 액션 타일 바 */}
            <HeroActionGrid>
              <HeroActionTile
                type="button"
                $highlight={Boolean(matchedOdiiStory)}
                onClick={() => {
                  if (matchedOdiiStory) {
                    handleStartCinematicTour();
                  } else {
                    window.open(`/odii?search=${encodeURIComponent(title)}`, '_self');
                  }
                }}
                title={matchedOdiiStory ? '시네마틱 오디오 투어 시작' : '소리마루 오디 둘러보기'}
              >
                <Headphones size={18} />
                <span>{matchedOdiiStory ? '오디 투어' : '소리 해설'}</span>
              </HeroActionTile>

              <HeroActionTile
                type="button"
                onClick={() => setIsRoadviewOpen(true)}
                title="카카오 현장 360도 거리 풍경 둘러보기"
              >
                <Camera size={18} />
                <span>거리 풍경</span>
              </HeroActionTile>

              {hasValidCoords ? (
                <HeroActionLink
                  href={navLinks.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleNavClick}
                  title="카카오맵 길찾기"
                >
                  <Navigation size={18} />
                  <span>길찾기</span>
                </HeroActionLink>
              ) : (
                <HeroActionTile type="button" disabled title="좌표 정보 없음">
                  <Navigation size={18} />
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
                <Flame size={18} />
                <span>온기 남기기</span>
              </HeroActionTile>
            </HeroActionGrid>

            {matchedOdiiStory && (
              <CinematicBanner>
                <CinematicHeader>
                  <CinematicBadge>
                    <Compass size={13} />
                    <span>시네마틱 공간 오디오 투어</span>
                  </CinematicBadge>
                  <CinematicDuration>
                    {matchedOdiiStory.formattedDuration || '약 10분'}
                  </CinematicDuration>
                </CinematicHeader>
                <CinematicTitle>{matchedOdiiStory.audioTitle}</CinematicTitle>
                <CinematicDesc>
                  {matchedOdiiStory.speaker ?? '도슨트'}와 함께 지도를 따라 걷는 {matchedOdiiStory.waypoints?.length || 4}대 경유지 코스
                </CinematicDesc>
                <CinematicStartButton type="button" onClick={handleStartCinematicTour}>
                  <Play size={15} fill="currentColor" />
                  <span>시네마틱 투어 시작하기</span>
                </CinematicStartButton>
              </CinematicBanner>
            )}

            <CoreInfoBox>
              <CoreRow>
                <CoreLabel>카테고리</CoreLabel>
                <CoreValue>
                  {selectedItem?.category === 'stay'
                    ? '한옥숙소'
                    : selectedItem?.category === 'experience'
                      ? '한복·전통체험'
                      : selectedItem?.category === 'culture'
                        ? '문화재·서원'
                        : selectedItem?.category === 'festival'
                          ? '야행·문화축제'
                          : selectedItem?.category === 'food'
                            ? '향토음식'
                            : selectedItem?.category === 'cafe'
                              ? '한옥카페·디저트'
                              : selectedItem?.category === 'market'
                                ? '전통시장'
                                : '고택·명소'}
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
                    {isOverviewExpanded ? '접기 ▲' : '더보기 ▼'}
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
