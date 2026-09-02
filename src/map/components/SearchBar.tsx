'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { Search, X, Home, MapPin, Sparkles, RotateCcw, Globe } from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';
import { DEFAULT_CENTER, DEFAULT_LEVEL, useMapStore } from '../hooks/useMapStore';

const RECENT = ['전주 한옥마을', '북촌 한옥마을', '안동 하회마을', '경주 양동마을', '경복궁'];
const POPULAR = ['전주', '북촌', '경주', '안동', '강릉', '담양', '공주'];

interface SearchBarProps {
  showHomeButton?: boolean;
}

const Wrap = styled.div`
  position: relative;
  width: 100%;
`;

const Field = styled.form`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 12px 0 6px;
  border-radius: 9999px;
  background: rgba(25, 31, 40, 0.05);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:focus-within {
    background: #ffffff;
    box-shadow: 0 4px 16px rgba(30, 122, 104, 0.12);
  }
`;

const HomeBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: none;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${lightPalette.cheongrok[50]};
    color: ${lightPalette.cheongrok[700]};
    transform: scale(1.06);
  }

  &:active {
    transform: scale(0.92);
  }
`;

const SearchSubmitBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  padding: 0 2px;
  color: ${meok[500]};
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: ${lightPalette.cheongrok[500]};
  }
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: ${meok[900]};

  &::placeholder {
    color: ${meok[400]};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ActionIconBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex: none;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(25, 31, 40, 0.08);
  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(25, 31, 40, 0.16);
    color: ${meok[900]};
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 40;
  padding: 16px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 12px 36px rgba(25, 31, 40, 0.12);
  backdrop-filter: blur(20px);
`;

const ResetAllBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 9px 14px;
  margin-bottom: 12px;
  border: none;
  border-radius: 12px;
  background: ${lightPalette.cheongrok[50]};
  color: ${lightPalette.cheongrok[700]};
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${lightPalette.cheongrok[100]};
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const GroupTitle = styled.p`
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  color: ${meok[500]};
  display: flex;
  align-items: center;
  gap: 4px;

  & + & {
    margin-top: 14px;
  }
`;

const Suggestions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Suggestion = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border: none;
  border-radius: 9999px;
  background: rgba(25, 31, 40, 0.05);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${lightPalette.cheongrok[50]};
    color: ${lightPalette.cheongrok[700]};
  }
`;

export default function SearchBar({ showHomeButton = true }: SearchBarProps) {
  const router = useRouter();
  const map = useMapStore((s) => s.map);
  const currentAddress = useMapStore((s) => s.currentAddress);
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  const handleGoHome = () => {
    router.push('/');
  };

  // 전국 전체보기로 지도 및 검색 초기화
  const handleResetToNationwide = () => {
    setValue('');
    setOpen(false);
    const store = useMapStore.getState();
    store.setCurrentAddress('대한민국 전국');
    store.setCenter(DEFAULT_CENTER, DEFAULT_LEVEL);
    store.setCategory(null);
    store.setSelectedId(null);
    store.setDetailId(null);
    store.clearSearchDirty();

    if (map && window.kakao?.maps) {
      map.setCenter(new window.kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng));
      map.setLevel(DEFAULT_LEVEL, { animate: true });
    }
  };

  const performSearch = useCallback(
    (query: string) => {
      const keyword = query.trim();
      if (!keyword) return;

      setValue(keyword);
      setOpen(false);

      const store = useMapStore.getState();

      // 1. 카카오 키워드 장소 검색 서비스 실행
      if (typeof window !== 'undefined' && window.kakao?.maps?.services) {
        const ps = new window.kakao.maps.services.Places();
        ps.keywordSearch(keyword, (data: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK && data && data.length > 0) {
            const first = data[0];
            const targetLat = Number(first.y);
            const targetLng = Number(first.x);

            // 지도 뷰포트 이동
            if (map) {
              const latLng = new window.kakao.maps.LatLng(targetLat, targetLng);
              map.setCenter(latLng);
              map.setLevel(4, { animate: true });
            }

            // 스토어 상태 갱신 및 재조회 트리거
            store.setCurrentAddress(first.address_name || keyword);
            store.setCenter({ lat: targetLat, lng: targetLng }, 4);
            store.clearSearchDirty();
            return;
          }

          // 검색 결과가 카카오 맵에 없을 경우 기존 리스트 내 필터링 시도
          fallbackLocalSearch(keyword);
        });
      } else {
        fallbackLocalSearch(keyword);
      }
    },
    [map],
  );

  const fallbackLocalSearch = (keyword: string) => {
    const store = useMapStore.getState();
    const cleanKw = keyword.toLowerCase().replace(/\s+/g, '');
    const matched = store.items.find((item) =>
      item.name.toLowerCase().replace(/\s+/g, '').includes(cleanKw),
    );

    if (matched && map && window.kakao?.maps) {
      map.panTo(new window.kakao.maps.LatLng(matched.lat, matched.lng));
      map.setLevel(3, { animate: true });
      store.setSelectedId(matched.id);
      store.setDetailId(matched.id);
      store.setSheetSnap('full');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(value);
  };

  const isSearched = Boolean(value) || (currentAddress && !currentAddress.includes('전국'));

  return (
    <Wrap>
      <Field onSubmit={handleSubmit}>
        {showHomeButton ? (
          <HomeBtn
            type="button"
            onClick={handleGoHome}
            aria-label="온마루 메인 홈으로 이동"
            title="온마루 홈으로 이동"
          >
            <Home size={18} />
          </HomeBtn>
        ) : null}

        <SearchSubmitBtn type="submit" aria-label="검색 실행">
          <Search size={16} aria-hidden />
        </SearchSubmitBtn>

        <Input
          type="search"
          value={value}
          placeholder="지역이나 장소를 검색하세요 (예: 전주, 북촌, 하회마을)"
          aria-label="장소 검색"
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 220)}
        />

        <ButtonGroup>
          {isSearched && (
            <ActionIconBtn
              type="button"
              aria-label="전국 지도로 초기화"
              title="전국 지도로 초기화"
              onClick={handleResetToNationwide}
            >
              <RotateCcw size={13} />
            </ActionIconBtn>
          )}

          {value && (
            <ActionIconBtn
              type="button"
              aria-label="검색어 지우기"
              onClick={() => {
                setValue('');
              }}
            >
              <X size={14} />
            </ActionIconBtn>
          )}
        </ButtonGroup>
      </Field>

      {open && (
        <Dropdown>
          {isSearched && (
            <ResetAllBtn
              type="button"
              onMouseDown={handleResetToNationwide}
            >
              <Globe size={15} />
              <span>전국 지도로 초기화</span>
            </ResetAllBtn>
          )}

          <GroupTitle>
            <Sparkles size={13} color={lightPalette.cheongrok[500]} />
            <span>추천 검색어</span>
          </GroupTitle>
          <Suggestions>
            {RECENT.map((keyword) => (
              <Suggestion
                key={keyword}
                type="button"
                onMouseDown={() => performSearch(keyword)}
              >
                <MapPin size={11} color={lightPalette.cheongrok[500]} />
                <span>{keyword}</span>
              </Suggestion>
            ))}
          </Suggestions>

          <GroupTitle style={{ marginTop: 14 }}>
            <MapPin size={13} color={lightPalette.cheongrok[500]} />
            <span>인기 지역</span>
          </GroupTitle>
          <Suggestions>
            {POPULAR.map((keyword) => (
              <Suggestion
                key={keyword}
                type="button"
                onMouseDown={() => performSearch(keyword)}
              >
                <span>{keyword}</span>
              </Suggestion>
            ))}
          </Suggestions>
        </Dropdown>
      )}
    </Wrap>
  );
}
