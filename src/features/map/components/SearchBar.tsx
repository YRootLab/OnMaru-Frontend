import React, { useState, useCallback, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import {
  Search,
  X,
  RotateCcw,
  Globe,
} from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';
import { DEFAULT_CENTER, DEFAULT_LEVEL, useMapStore } from '@/features/map/hooks/useMapStore';

const RECENT = ['전주 한옥마을', '북촌 한옥마을', '안동 하회마을', '경주 양동마을', '경복궁'];
const POPULAR = ['전주', '북촌', '경주', '안동', '강릉', '담양', '공주'];

interface SearchBarProps {
  className?: string;
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
  padding: 0 12px 0 12px;
  border-radius: 14px;
  background: rgba(25, 31, 40, 0.05);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:focus-within {
    background: #ffffff;
    box-shadow: 0 4px 14px rgba(25, 31, 40, 0.08);
  }
`;

const SearchSubmitBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;

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
  width: 100%;

  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: ${meok[900]};
  /* placeholder가 좁은 패널 폭에서 중간에 뚝 끊기지 않고 "..."으로
     자연스럽게 줄어들도록 한다. */
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;

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
  border: 1px solid rgba(25, 31, 40, 0.08);
  box-shadow: 0 12px 32px -4px rgba(25, 31, 40, 0.16);
  user-select: none;
  backdrop-filter: blur(20px);
`;

const ResetAllBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px 10px;
  margin-bottom: 12px;
  border-radius: 10px;
  background: rgba(25, 31, 40, 0.03);
  border: 1px dashed rgba(25, 31, 40, 0.15);
  color: ${meok[500]};
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${lightPalette.cheongrok[50]};
    color: ${lightPalette.cheongrok[700]};
  }
`;

const GroupTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 500;
  color: ${meok[500]};
  letter-spacing: 0.3px;
  text-transform: uppercase;
  margin-bottom: 8px;
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
  padding: 6px 12px;
  border-radius: 9999px;
  background: rgba(25, 31, 40, 0.04);
  color: ${meok[700]};
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 400;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(40, 110, 95, 0.1);
    color: ${lightPalette.cheongrok[700]};
  }
`;

export default function SearchBar({ className }: SearchBarProps) {
  const map = useMapStore((s) => s.map);
  const currentAddress = useMapStore((s) => s.currentAddress);
  const searchQuery = useMapStore((s) => s.searchQuery);
  const searchTrigger = useMapStore((s) => s.searchTrigger);
  const setSearchQuery = useMapStore((s) => s.setSearchQuery);
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const lastTriggerRef = useRef(searchTrigger);

  useEffect(() => {
    if (searchTrigger !== lastTriggerRef.current) {
      performSearch(searchQuery);
      lastTriggerRef.current = searchTrigger;
    }
  }, [searchTrigger, searchQuery]);

  // 전국 전체보기로 지도 및 검색 초기화
  const handleResetToNationwide = () => {
    setValue('');
    setSearchQuery('');
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
      setSearchQuery(keyword);
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
    <Wrap className={className}>
      <Field onSubmit={handleSubmit}>
        <SearchSubmitBtn type="submit" aria-label="검색 실행">
          <Search size={18} strokeWidth={2} aria-hidden />
        </SearchSubmitBtn>

        <Input
          type="search"
          value={value}
          placeholder="지역이나 장소 검색 (예: 전주, 북촌)"
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
              <RotateCcw size={14} strokeWidth={2} />
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
              <X size={16} strokeWidth={2} />
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
              <Globe size={16} strokeWidth={2} />
              <span>전국 지도로 초기화</span>
            </ResetAllBtn>
          )}

          <GroupTitle>
            <span>추천 검색어</span>
          </GroupTitle>
          <Suggestions>
            {RECENT.map((keyword) => (
              <Suggestion
                key={keyword}
                type="button"
                onMouseDown={() => performSearch(keyword)}
              >
                <span>{keyword}</span>
              </Suggestion>
            ))}
          </Suggestions>

          <GroupTitle style={{ marginTop: 14 }}>
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
