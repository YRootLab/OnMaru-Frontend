'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Script from 'next/script';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight01Icon,
  Building04Icon,
  MapPinIcon,
} from '@hugeicons/core-free-icons';
import { meok, lightPalette, ringShadow, fontSize } from '@/design-system/tokens';
import { KAKAO_SDK_SRC } from '@/features/map/hooks/useKakaoMap';
import { useWorkLocations, type WorkLocationItem } from '../hooks/useWorkLocations';
import { useTourApiImage } from '../hooks/useTourApiImage';
import { getLocalizedRegionName } from '../utils/regionLabel';

const MAP_LOAD_TIMEOUT_MS = 8000;

const shimmerAnim = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
`;

const Section = styled.section`
  margin-top: 28px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TitleLine = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionTitle = styled.h2`
  font-family: var(--font-hanok);
  font-size: ${fontSize.base};
  font-weight: 700;
  color: ${meok[900]};
  margin: 0;
  letter-spacing: -0.02em;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const CountPill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 999px;
  background: #f5f5f4;
  color: ${meok[600]};
  font-size: 11px;
  font-weight: 700;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.72);
  }
`;

const SectionSub = styled.p`
  margin: 0;
  font-size: ${fontSize.xs};
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.42);
  }
`;

const DiscoverAllLink = styled(Link)`
  font-size: ${fontSize.xs};
  font-weight: 600;
  color: ${meok[600]};
  text-decoration: none;
  padding-top: 2px;
  transition: color 0.14s ease;

  &:hover {
    color: ${lightPalette.juhong[600]};
  }

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.55);

    &:hover {
      color: ${lightPalette.juhong[400]};
    }
  }
`;

const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;

  @media (min-width: 900px) {
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
    align-items: stretch;
  }
`;

const MapPanel = styled.div`
  position: relative;
  width: 100%;
  height: 280px;
  border-radius: 16px;
  overflow: hidden;
  background: #f5f5f4;
  box-shadow: ${ringShadow.light.card};

  @media (min-width: 900px) {
    height: 380px;
  }

  [data-theme='dark'] & {
    background: #171e2b;
    box-shadow: ${ringShadow.dark.card};
  }
`;

const MapCanvas = styled.div`
  width: 100%;
  height: 100%;
`;

const MapOverlayNotice = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  text-align: center;
  background: #f5f5f4;
  color: ${meok[500]};
  font-size: ${fontSize.xs};
  line-height: 1.5;

  [data-theme='dark'] & {
    background: #171e2b;
    color: rgba(255, 255, 255, 0.48);
  }
`;

const StopList = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (min-width: 900px) {
    max-height: 380px;
    overflow-y: auto;
    padding-right: 4px;
  }
`;

const StopCard = styled.li<{ $focused: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: ${({ $focused }) => ($focused ? '#f5f5f4' : '#ffffff')};
  box-shadow: ${({ $focused }) =>
    $focused ? `0 0 0 1.5px ${lightPalette.juhong[500]}` : ringShadow.light.card};
  transition: background 0.16s ease, box-shadow 0.16s ease;
  cursor: pointer;

  &:hover {
    background: #f5f5f4;
  }

  [data-theme='dark'] & {
    background: ${({ $focused }) => ($focused ? '#282e3b' : '#1e2330')};
    box-shadow: ${({ $focused }) =>
      $focused ? `0 0 0 1.5px ${lightPalette.juhong[400]}` : ringShadow.dark.card};

    &:hover {
      background: #282e3b;
    }
  }
`;

const StopNumber = styled.span<{ $focused: boolean }>`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  background: ${({ $focused }) => ($focused ? lightPalette.juhong[500] : meok[900])};
  color: #ffffff;
  transition: background 0.16s ease, transform 0.16s ease;
  transform: ${({ $focused }) => ($focused ? 'scale(1.08)' : 'scale(1)')};

  [data-theme='dark'] & {
    background: ${({ $focused }) =>
      $focused ? lightPalette.juhong[500] : 'rgba(255, 255, 255, 0.16)'};
  }
`;

const ThumbBox = styled.div`
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  overflow: hidden;
  background: #e5e5e3;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${meok[400]};

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.28);
  }
`;

const ThumbImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const StopInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const StopName = styled.span`
  font-size: ${fontSize.sm};
  font-weight: 700;
  color: ${meok[900]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.02em;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.92);
  }
`;

const StopMeta = styled.span`
  font-size: 11px;
  color: ${meok[500]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.45);
  }
`;

const DetailLink = styled(Link)`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 6px 10px;
  border-radius: 8px;
  background: #f5f5f4;
  color: ${meok[700]};
  font-size: 11px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.14s ease, color 0.14s ease;

  &:hover {
    background: #e5e5e3;
    color: ${meok[900]};
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.78);

    &:hover {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
    }
  }
`;

const SkeletonBox = styled.div<{ $h: string }>`
  width: 100%;
  height: ${({ $h }) => $h};
  border-radius: 16px;
  background: linear-gradient(90deg, #f5f5f4 25%, #e5e5e3 50%, #f5f5f4 75%);
  background-size: 200% 100%;
  animation: ${shimmerAnim} 1.6s infinite ease-in-out;

  [data-theme='dark'] & {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.04) 25%,
      rgba(255, 255, 255, 0.09) 50%,
      rgba(255, 255, 255, 0.04) 75%
    );
    background-size: 200% 100%;
  }
`;

const EmptyNote = styled.p`
  margin: 0;
  font-size: ${fontSize.sm};
  color: ${meok[500]};
`;

interface StopItemProps {
  location: WorkLocationItem;
  index: number;
  focused: boolean;
  onFocus: (placeId: string) => void;
}

function WorkLocationStopCard({ location, index, focused, onFocus }: StopItemProps) {
  const t = useTranslations('kCulture');
  const resolvedImage = useTourApiImage(location.placeId, location.placeImage);
  const regionName = getLocalizedRegionName(location.region, t);
  const subParts = [regionName, location.address].filter(Boolean);

  return (
    <StopCard
      $focused={focused}
      onClick={() => onFocus(location.placeId)}
      aria-label={t('workMap.stopNumber', { num: index + 1 })}
    >
      <StopNumber $focused={focused}>{index + 1}</StopNumber>
      <ThumbBox>
        {resolvedImage ? (
          <ThumbImg src={resolvedImage} alt={location.name} loading="lazy" />
        ) : (
          <HugeiconsIcon icon={Building04Icon} size={18} strokeWidth={1.5} aria-hidden="true" />
        )}
      </ThumbBox>
      <StopInfo>
        <StopName>{location.name}</StopName>
        {subParts.length > 0 && <StopMeta>{subParts.join(' · ')}</StopMeta>}
      </StopInfo>
      <DetailLink
        href={`/discover/places/${encodeURIComponent(location.placeId)}`}
        onClick={(e) => e.stopPropagation()}
      >
        {t('workMap.viewPlace')}
        <HugeiconsIcon icon={ArrowRight01Icon} size={12} strokeWidth={2.2} aria-hidden="true" />
      </DetailLink>
    </StopCard>
  );
}

interface WorkLocationsKakaoMapProps {
  workTitle: string;
  locations: WorkLocationItem[];
  focusedId: string | null;
  onFocus: (placeId: string) => void;
}

function WorkLocationsKakaoMap({
  workTitle,
  locations,
  focusedId,
  onFocus,
}: WorkLocationsKakaoMapProps) {
  const t = useTranslations('kCulture');
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const markersRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;

  const [mapState, setMapState] = useState<'loading' | 'ready' | 'error'>('loading');

  const coordEntries = useMemo(
    () =>
      locations
        .map((loc, idx) => ({ loc, order: idx + 1 }))
        .filter(
          (entry) =>
            entry.loc.coordinates &&
            Number.isFinite(entry.loc.coordinates.latitude) &&
            Number.isFinite(entry.loc.coordinates.longitude),
        ),
    [locations],
  );

  const buildMap = useCallback(() => {
    const container = containerRef.current;
    if (!container || !window.kakao?.maps || coordEntries.length === 0) return;

    try {
      window.kakao.maps.load(() => {
        if (!containerRef.current) return;

        overlaysRef.current.forEach((o) => o.setMap(null));
        overlaysRef.current = [];
        markersRef.current.clear();
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
          polylineRef.current = null;
        }

        const first = coordEntries[0].loc.coordinates!;
        if (!mapRef.current) {
          mapRef.current = new window.kakao.maps.Map(containerRef.current, {
            center: new window.kakao.maps.LatLng(first.latitude, first.longitude),
            level: 5,
          });
        }
        const map = mapRef.current;
        const bounds = new window.kakao.maps.LatLngBounds();
        const path: any[] = [];

        coordEntries.forEach(({ loc, order }) => {
          const coords = loc.coordinates!;
          const position = new window.kakao.maps.LatLng(coords.latitude, coords.longitude);
          bounds.extend(position);
          path.push(position);

          const el = document.createElement('button');
          el.type = 'button';
          el.setAttribute('aria-label', `${order}. ${loc.name}`);
          el.style.cssText =
            'display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;' +
            `background:${lightPalette.juhong[500]};color:#fff;font-size:12px;font-weight:700;border:2px solid #fff;` +
            'box-shadow:0 2px 6px rgba(0,0,0,0.28);cursor:pointer;transition:transform 0.16s ease;';
          el.textContent = String(order);
          el.addEventListener('click', () => onFocusRef.current(loc.placeId));

          const overlay = new window.kakao.maps.CustomOverlay({
            position,
            content: el,
            yAnchor: 0.5,
            xAnchor: 0.5,
          });
          overlay.setMap(map);
          overlaysRef.current.push(overlay);
          markersRef.current.set(loc.placeId, el);
        });

        const KakaoPolyline = (window.kakao.maps as any).Polyline;
        if (path.length >= 2 && KakaoPolyline) {
          polylineRef.current = new KakaoPolyline({
            path,
            strokeWeight: 3,
            strokeColor: lightPalette.juhong[500],
            strokeOpacity: 0.45,
            strokeStyle: 'shortdash',
          });
          polylineRef.current.setMap(map);
        }

        if (coordEntries.length > 1) {
          map.setBounds(bounds, 44, 44, 44, 44);
        } else {
          map.setCenter(new window.kakao.maps.LatLng(first.latitude, first.longitude));
        }

        setMapState('ready');
      });
    } catch {
      setMapState('error');
    }
  }, [coordEntries]);

  useEffect(() => {
    if (coordEntries.length === 0) return;
    if (window.kakao?.maps) {
      buildMap();
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setMapState((prev) => (prev === 'ready' ? prev : 'error'));
    }, MAP_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [buildMap, coordEntries.length]);

  useEffect(() => {
    return () => {
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current = [];
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    markersRef.current.forEach((el, id) => {
      const isFocused = focusedId === id;
      el.style.transform = isFocused ? 'scale(1.28)' : 'scale(1)';
      el.style.zIndex = isFocused ? '20' : '1';
      el.style.background = isFocused ? meok[900] : lightPalette.juhong[500];
    });

    if (focusedId && mapRef.current && window.kakao?.maps) {
      const target = coordEntries.find((entry) => entry.loc.placeId === focusedId);
      if (target?.loc.coordinates) {
        mapRef.current.panTo(
          new window.kakao.maps.LatLng(
            target.loc.coordinates.latitude,
            target.loc.coordinates.longitude,
          ),
        );
      }
    }
  }, [coordEntries, focusedId]);

  if (coordEntries.length === 0) {
    return (
      <MapPanel>
        <MapOverlayNotice>
          <HugeiconsIcon icon={MapPinIcon} size={20} strokeWidth={1.6} aria-hidden="true" />
          <span>{t('workMap.noCoordinates')}</span>
        </MapOverlayNotice>
      </MapPanel>
    );
  }

  return (
    <MapPanel>
      <Script
        strategy="afterInteractive"
        src={KAKAO_SDK_SRC}
        onReady={buildMap}
        onError={() => setMapState('error')}
      />
      <MapCanvas
        ref={containerRef}
        role="application"
        aria-label={t('workMap.mapAriaLabel', { title: workTitle })}
      />
      {mapState === 'loading' && (
        <MapOverlayNotice role="status">
          <HugeiconsIcon icon={MapPinIcon} size={20} strokeWidth={1.6} aria-hidden="true" />
          <span>{t('workMap.loadingMap')}</span>
        </MapOverlayNotice>
      )}
      {mapState === 'error' && (
        <MapOverlayNotice role="status">
          <HugeiconsIcon icon={MapPinIcon} size={20} strokeWidth={1.6} aria-hidden="true" />
          <span>{t('workMap.mapUnavailable')}</span>
        </MapOverlayNotice>
      )}
    </MapPanel>
  );
}

export interface WorkLocationsMapSectionProps {
  workId: string;
  workTitle: string;
  publicPlaceCount: number;
}

export default function WorkLocationsMapSection({
  workId,
  workTitle,
  publicPlaceCount,
}: WorkLocationsMapSectionProps) {
  const t = useTranslations('kCulture');
  const { locations, totalCount, isLoading, isError } = useWorkLocations(
    workId,
    publicPlaceCount > 0,
  );
  const [focusedId, setFocusedId] = useState<string | null>(null);

  useEffect(() => {
    if (locations.length > 0 && !focusedId) {
      setFocusedId(locations[0].placeId);
    }
  }, [locations, focusedId]);

  if (publicPlaceCount <= 0) {
    return (
      <Section>
        <SectionHeader>
          <HeaderText>
            <SectionTitle>{t('works.filmingLocations')}</SectionTitle>
          </HeaderText>
        </SectionHeader>
        <EmptyNote>{t('works.noLocations')}</EmptyNote>
      </Section>
    );
  }

  const displayCount = totalCount || publicPlaceCount;

  return (
    <Section>
      <SectionHeader>
        <HeaderText>
          <TitleLine>
            <SectionTitle>{t('workMap.mapTitle')}</SectionTitle>
            <CountPill>{t('workMap.courseCount', { count: displayCount })}</CountPill>
          </TitleLine>
          <SectionSub>{t('workMap.mapSubtitle')}</SectionSub>
        </HeaderText>

        <DiscoverAllLink href={`/discover?workId=${encodeURIComponent(workId)}`}>
          {t('workMap.openAllLocations')}
        </DiscoverAllLink>
      </SectionHeader>

      {isLoading ? (
        <LayoutGrid aria-busy="true">
          <SkeletonBox $h="380px" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonBox key={i} $h="68px" />
            ))}
          </div>
        </LayoutGrid>
      ) : isError || locations.length === 0 ? (
        <EmptyNote>{t('works.loadFailed')}</EmptyNote>
      ) : (
        <LayoutGrid>
          <WorkLocationsKakaoMap
            workTitle={workTitle}
            locations={locations}
            focusedId={focusedId}
            onFocus={setFocusedId}
          />
          <StopList>
            {locations.map((loc, idx) => (
              <WorkLocationStopCard
                key={loc.placeId}
                location={loc}
                index={idx}
                focused={focusedId === loc.placeId}
                onFocus={setFocusedId}
              />
            ))}
          </StopList>
        </LayoutGrid>
      )}
    </Section>
  );
}
