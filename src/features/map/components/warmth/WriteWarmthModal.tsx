'use client';

import React, { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { X, Flame, Users, Leaf, Check, MapPin } from 'lucide-react';
import { lightPalette, meok , fontSize } from '@/design-system/tokens';
import { addWarmth, loadWarmth } from '@/features/map/warmth/warmthRepo';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import MoodSelector, { type MoodValue } from './MoodSelector';

interface WriteWarmthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlace?: {
    id: string;
    name: string;
    lat: number;
    lng: number;
  };
}

const REGIONS = [
  '전국',
  '전주',
  '안동',
  '경주',
  '서울',
  '강릉',
  '담양',
  '공주/부여',
  '제주',
];

const PRESET_TAGS = [
  '#대청마루',
  '#야경',
  '#사진맛집',
  '#전통체험',
  '#힐링',
  '#고즈넉함',
  '#산책코스',
  '#차한잔',
];

/* ── STRICT RULE: border & shadow 절대 사용 금지 ── */
const Overlay = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(25, 31, 40, 0.45);
  backdrop-filter: blur(8px);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transition: opacity 0.22s ease;

  [data-theme='dark'] & {
    background: rgba(0, 0, 0, 0.72);
  }
`;

const ModalCard = styled.div<{ $open: boolean }>`
  position: relative;
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  border-radius: 24px;
  background: #ffffff;

  transform: ${({ $open }) => ($open ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(12px)')};
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);

  [data-theme='dark'] & {
    background: #24211D;
    color: #F3F4F6;
    border: none;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
`;

const ModalTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: ${fontSize.lg};
  font-weight: 500;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: #F3F4F6;
  }
`;

const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  border-radius: 50%;
  background: #f2f4f6;
  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #e5e8eb;
    color: ${meok[900]};
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
    color: #9CA3AF;

    &:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
    }
  }
`;

const FormSection = styled.div`
  margin-bottom: 18px;
`;

const SectionLabel = styled.label`
  display: block;
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${meok[900]};
  margin-bottom: 8px;

  [data-theme='dark'] & {
    color: #D1D5DB;
  }
`;

/* ── 1. 지역 선택기 (Region Scroller) ── */
const RegionScroller = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const RegionChip = styled.button<{ $active: boolean }>`
  flex: none;
  height: 32px;
  padding: 0 12px;
  border-radius: 9999px;

  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: 500;
  cursor: pointer;
  background: ${({ $active }) => ($active ? lightPalette.juhong[500] : '#f2f4f6')};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $active }) => ($active ? lightPalette.juhong[500] : '#e5e8eb')};
  }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? '#e85a18' : 'rgba(255, 255, 255, 0.08)')};
    color: ${({ $active }) => ($active ? '#ffffff' : '#9CA3AF')};

    &:hover {
      background: ${({ $active }) => ($active ? '#e85a18' : 'rgba(255, 255, 255, 0.14)')};
    }
  }
`;

/* ── 2. 장소 검색/선택 인풋 (Place Search & Select) ── */
const PlaceInputWrap = styled.div`
  position: relative;
  margin-top: 8px;
`;

const PlaceInputIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  color: ${lightPalette.juhong[500]};
  pointer-events: none;
`;

const PlaceInput = styled.input`
  width: 100%;
  height: 42px;
  padding: 0 14px 0 38px;
  border-radius: 12px;

  background: #f2f4f6;
  color: ${meok[900]};
  font-family: inherit;
  font-size: ${fontSize.sm};
  font-weight: 500;
  outline: none;

  &::placeholder {
    color: ${meok[400]};
    font-weight: 400;
  }

  &:focus {
    background: ${lightPalette.juhong[50]};
    color: ${lightPalette.juhong[900]};
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.06);
    color: #F3F4F6;

    &::placeholder {
      color: #6B7280;
    }

    &:focus {
      background: rgba(232, 90, 24, 0.12);
      color: #ffffff;
    }
  }
`;

const PlaceDropdown = styled.div`
  margin-top: 6px;
  max-height: 140px;
  overflow-y: auto;
  border-radius: 12px;
  background: #fafbfc;

  padding: 4px;

  [data-theme='dark'] & {
    background: #1C1A17;
    border: none;
  }
`;

const PlaceOption = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;

  background: transparent;
  color: ${meok[900]};
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s ease;

  &:hover {
    background: ${lightPalette.juhong[50]};
    color: ${lightPalette.juhong[700]};
  }

  [data-theme='dark'] & {
    color: #E5E7EB;

    &:hover {
      background: rgba(232, 90, 24, 0.18);
      color: #FBBF24;
    }
  }
`;

const PlaceOptionAddr = styled.span`
  font-size: ${fontSize.micro};
  color: ${meok[400]};
  font-weight: 400;

  [data-theme='dark'] & {
    color: #9CA3AF;
  }
`;

/* ── 3. 장소 혼잡도 분위기 ── */
const MoodButtonGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const MoodButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 42px;
  border-radius: 14px;

  background: ${({ $active }) => ($active ? lightPalette.juhong[500] : '#f2f4f6')};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  font-size: ${fontSize.sm};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $active }) => ($active ? lightPalette.juhong[500] : '#e5e8eb')};
  }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? '#e85a18' : 'rgba(255, 255, 255, 0.08)')};
    color: ${({ $active }) => ($active ? '#ffffff' : '#D1D5DB')};

    &:hover {
      background: ${({ $active }) => ($active ? '#e85a18' : 'rgba(255, 255, 255, 0.14)')};
    }
  }
`;

/* ── 4. 추천 키워드 태그 ── */
const TagWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const TagChip = styled.button<{ $selected: boolean }>`
  padding: 6px 12px;
  border-radius: 9999px;

  background: ${({ $selected }) => ($selected ? lightPalette.juhong[500] : '#f2f4f6')};
  color: ${({ $selected }) => ($selected ? '#ffffff' : meok[700])};
  font-size: ${fontSize.xs};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $selected }) => ($selected ? lightPalette.juhong[500] : '#e5e8eb')};
  }

  [data-theme='dark'] & {
    background: ${({ $selected }) => ($selected ? '#e85a18' : 'rgba(255, 255, 255, 0.08)')};
    color: ${({ $selected }) => ($selected ? '#ffffff' : '#D1D5DB')};

    &:hover {
      background: ${({ $selected }) => ($selected ? '#e85a18' : 'rgba(255, 255, 255, 0.14)')};
    }
  }
`;

/* ── 5. 한줄평 본문 ── */
const TextArea = styled.textarea`
  width: 100%;
  height: 84px;
  padding: 12px 14px;
  border-radius: 14px;

  background: #f2f4f6;
  color: ${meok[900]};
  font-family: inherit;
  font-size: ${fontSize.sm};
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: background 0.15s ease;

  &::placeholder {
    color: ${meok[400]};
  }

  &:focus {
    background: #eef1f4;
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.06);
    color: #F3F4F6;

    &::placeholder {
      color: #6B7280;
    }

    &:focus {
      background: rgba(255, 255, 255, 0.09);
    }
  }
`;

const CharCount = styled.div`
  text-align: right;
  font-size: ${fontSize.xs};
  color: ${meok[400]};
  margin-top: 4px;

  [data-theme='dark'] & {
    color: #6B7280;
  }
`;

const SubmitBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  margin-top: 8px;

  border-radius: 14px;
  background: ${lightPalette.juhong[500]};
  color: #ffffff;
  font-family: inherit;
  font-size: ${fontSize.sm};
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover:not(:disabled) {
    background: ${lightPalette.juhong[700]};
  }

  &:disabled {
    background: #d1d5db;
    color: #9ca3af;
    cursor: not-allowed;
  }

  [data-theme='dark'] & {
    background: linear-gradient(135deg, #e85a18 0%, #d4af37 100%);

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #f06a2b 0%, #e5bd47 100%);
    }

    &:disabled {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.3);
    }
  }
`;

export default function WriteWarmthModal({
  isOpen,
  onClose,
  defaultPlace,
}: WriteWarmthModalProps) {
  const items = useMapStore((s) => s.items);
  const searchCenter = useMapStore((s) => s.searchCenter);
  const setWarmths = useMapStore((s) => s.setWarmths);

  const [selectedRegion, setSelectedRegion] = useState('전국');
  const [placeQuery, setPlaceQuery] = useState(defaultPlace?.name || '');
  const [selectedPlace, setSelectedPlace] = useState<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  } | null>(defaultPlace || null);

  const [score, setScore] = useState<MoodValue>(1);
  const [mood, setMood] = useState<'한적' | '북적'>('한적');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 지역 및 검색어 필터링된 장소 목록
  const filteredPlaces = useMemo(() => {
    let list = items;
    if (selectedRegion !== '전국') {
      list = list.filter(
        (i) => i.addr?.includes(selectedRegion) || i.name.includes(selectedRegion),
      );
    }
    if (placeQuery.trim()) {
      const q = placeQuery.trim().toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }
    return list.slice(0, 5);
  }, [items, selectedRegion, placeQuery]);

  const handleSelectPlace = (place: { id: string; name: string; lat: number; lng: number }) => {
    setSelectedPlace(place);
    setPlaceQuery(place.name);
    setIsDropdownOpen(false);
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const placeId = selectedPlace?.id || `custom-${Date.now()}`;
    const placeName = selectedPlace?.name || placeQuery.trim() || '우리 동네 한옥';
    const lat = selectedPlace?.lat || searchCenter.lat;
    const lng = selectedPlace?.lng || searchCenter.lng;

    addWarmth({
      placeId,
      placeName,
      lat,
      lng,
      text: text.trim(),
      mood,
      score,
      tags: selectedTags,
    });

    setWarmths(loadWarmth());

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setText('');
      setSelectedTags([]);
      onClose();
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <Overlay $open={isOpen} onClick={onClose} role="dialog" aria-modal="true">
      <ModalCard $open={isOpen} onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Flame size={20} strokeWidth={2} color={lightPalette.juhong[500]} />
            <span>온기 한 줄 남기기</span>
          </ModalTitle>
          <CloseBtn type="button" onClick={onClose} aria-label="닫기">
            <X size={20} strokeWidth={2} />
          </CloseBtn>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          {/* 1. 지역 및 장소 선택기 */}
          <FormSection>
            <SectionLabel>남길 지역 및 장소 선택</SectionLabel>
            <RegionScroller>
              {REGIONS.map((region) => (
                <RegionChip
                  key={region}
                  type="button"
                  $active={selectedRegion === region}
                  onClick={() => setSelectedRegion(region)}
                >
                  {region}
                </RegionChip>
              ))}
            </RegionScroller>

            <PlaceInputWrap>
              <PlaceInputIcon>
                <MapPin size={16} strokeWidth={2} />
              </PlaceInputIcon>
              <PlaceInput
                type="text"
                value={placeQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setPlaceQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                placeholder="장소명을 검색하거나 직접 입력하세요 (예: 경기전)"
                required
              />
            </PlaceInputWrap>

            {isDropdownOpen && filteredPlaces.length > 0 && (
              <PlaceDropdown>
                {filteredPlaces.map((place) => (
                  <PlaceOption
                    key={place.id}
                    type="button"
                    onClick={() => handleSelectPlace(place)}
                  >
                    <span>{place.name}</span>
                    <PlaceOptionAddr>{place.addr?.split(' ').slice(0, 2).join(' ')}</PlaceOptionAddr>
                  </PlaceOption>
                ))}
              </PlaceDropdown>
            )}
          </FormSection>

          {/* 2. 표정 감정 선택기 */}
          <FormSection>
            <SectionLabel>이곳에서의 전반적인 느낌 (표정 선택)</SectionLabel>
            <MoodSelector value={score} onChange={(val) => setScore(val)} />
          </FormSection>

          {/* 3. 장소 혼잡도 분위기 */}
          <FormSection>
            <SectionLabel>현재 이 장소의 분위기</SectionLabel>
            <MoodButtonGroup>
              <MoodButton
                type="button"
                $active={mood === '한적'}
                onClick={() => setMood('한적')}
              >
                <Leaf size={16} strokeWidth={2} />
                <span>한적해요</span>
              </MoodButton>
              <MoodButton
                type="button"
                $active={mood === '북적'}
                onClick={() => setMood('북적')}
              >
                <Users size={16} strokeWidth={2} />
                <span>북적여요</span>
              </MoodButton>
            </MoodButtonGroup>
          </FormSection>

          {/* 4. 추천 키워드 태그 */}
          <FormSection>
            <SectionLabel>방문 키워드 (선택)</SectionLabel>
            <TagWrap>
              {PRESET_TAGS.map((tag) => (
                <TagChip
                  key={tag}
                  type="button"
                  $selected={selectedTags.includes(tag)}
                  onClick={() => handleToggleTag(tag)}
                >
                  {tag}
                </TagChip>
              ))}
            </TagWrap>
          </FormSection>

          {/* 5. 한줄평 본문 */}
          <FormSection>
            <SectionLabel>이곳에 머문 느낌이나 꿀팁</SectionLabel>
            <TextArea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 80))}
              placeholder="예: 마당에 피어난 배롱나무 꽃이 너무 예뻐요. 아침 일찍 방문을 추천합니다!"
              required
            />
            <CharCount>{text.length} / 80자</CharCount>
          </FormSection>

          <SubmitBtn type="submit" disabled={!text.trim() || isSuccess}>
            {isSuccess ? (
              <>
                <Check size={18} strokeWidth={2} />
                <span>온기가 따뜻하게 남겨졌습니다!</span>
              </>
            ) : (
              <span>온기 등록하기</span>
            )}
          </SubmitBtn>
        </form>
      </ModalCard>
    </Overlay>
  );
}
