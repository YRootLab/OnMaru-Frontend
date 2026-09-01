'use client';

import { useCallback, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { MapPin, Navigation } from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';
import { DEFAULT_CENTER, useMapStore } from '../hooks/useMapStore';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
  background: #ffffff;
`;

const AddressWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const PinIcon = styled(MapPin)`
  flex-shrink: 0;
  color: ${lightPalette.cheongrok[500]};
`;

const AddressText = styled.span`
  font-size: 15.5px;
  font-weight: 700;
  color: ${meok[900]};
  letter-spacing: -0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MyLocationButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: none;
  border-radius: 9999px;
  background: rgba(78, 89, 104, 0.07);
  color: ${meok[700]};
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(40, 110, 95, 0.12);
    color: ${lightPalette.cheongrok[700]};
  }

  &:active {
    transform: scale(0.96);
  }
`;

/** 광역 시/도 명칭 축약 (예: 전라북도/전북특별자치도 -> 전북, 서울특별시 -> 서울) */
function formatRegionAddress(r1?: string, r2?: string): string {
  if (!r1 && !r2) return '대한민국';
  let shortR1 = r1 ?? '';
  shortR1 = shortR1
    .replace(/^전북특별자치도|^전라북도/, '전북')
    .replace(/^전남특별자치도|^전라남도/, '전남')
    .replace(/^경북특별자치도|^경상북도/, '경북')
    .replace(/^경남특별자치도|^경상남도/, '경남')
    .replace(/^충북특별자치도|^충청북도/, '충북')
    .replace(/^충남특별자치도|^충청남도/, '충남')
    .replace(/^강원특별자치도|^강원도/, '강원')
    .replace(/^제주특별자치도|^제주도/, '제주')
    .replace(/^서울특별시/, '서울')
    .replace(/^부산광역시/, '부산')
    .replace(/^대구광역시/, '대구')
    .replace(/^인천광역시/, '인천')
    .replace(/^광주광역시/, '광주')
    .replace(/^대전광역시/, '대전')
    .replace(/^울산광역시/, '울산')
    .replace(/^세종특별자치시/, '세종');

  return [shortR1, r2].filter(Boolean).join(' ');
}

export default function CurrentLocationBar() {
  const map = useMapStore((s) => s.map);
  const center = useMapStore((s) => s.center);
  const currentAddress = useMapStore((s) => s.currentAddress);
  const setCurrentAddress = useMapStore((s) => s.setCurrentAddress);
  const geocoderRef = useRef<any>(null);

  // 카카오 Geocoder로 중심 좌표 주소 변환 (300ms 디바운스)
  useEffect(() => {
    if (!window.kakao?.maps?.services?.Geocoder) return;

    if (!geocoderRef.current) {
      geocoderRef.current = new window.kakao.maps.services.Geocoder();
    }

    const timer = setTimeout(() => {
      geocoderRef.current.coord2RegionCode(
        center.lng,
        center.lat,
        (result: any[], status: string) => {
          if (status === window.kakao.maps.services.Status.OK && result && result.length > 0) {
            // 법정동(H) 또는 행정동(B) 중 첫 번째 지역 정보 사용
            const region = result.find((r) => r.region_type === 'H') || result[0];
            const formatted = formatRegionAddress(region.region_1depth_name, region.region_2depth_name);
            if (formatted) {
              setCurrentAddress(formatted);
            }
          }
        },
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [center.lat, center.lng, setCurrentAddress]);

  // 내 위치로 지도 중심 이동
  const handleMoveToMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      map?.panTo(new window.kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng));
      useMapStore.getState().setCenter(DEFAULT_CENTER);
      useMapStore.getState().clearSearchDirty();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const myCenter = { lat: coords.latitude, lng: coords.longitude };
        map?.panTo(new window.kakao.maps.LatLng(myCenter.lat, myCenter.lng));
        useMapStore.getState().setCenter(myCenter);
        useMapStore.getState().clearSearchDirty();
      },
      () => {
        map?.panTo(new window.kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng));
        useMapStore.getState().setCenter(DEFAULT_CENTER);
        useMapStore.getState().clearSearchDirty();
      },
    );
  }, [map]);

  return (
    <Container>
      <AddressWrapper>
        <PinIcon size={18} />
        <AddressText title={currentAddress}>{currentAddress}</AddressText>
      </AddressWrapper>
      <MyLocationButton
        type="button"
        onClick={handleMoveToMyLocation}
        aria-label="현재 내 위치로 지도 이동"
      >
        <Navigation size={12} />
        <span>내 위치</span>
      </MyLocationButton>
    </Container>
  );
}
