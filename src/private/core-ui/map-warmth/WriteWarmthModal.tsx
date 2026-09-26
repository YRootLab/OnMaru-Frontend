'use client';

import React, { useEffect, useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { X, Flame, Users, Leaf, Check, MapPin } from 'lucide-react';
import { lightPalette, meok , fontSize } from '@/design-system/tokens';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { useCreateVisitReview } from '@/features/visit-review/presentation/useCreateVisitReview';
import type { Warmth } from '@/features/map/types';
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
  onCreated?: (review: Warmth) => void;
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
  background: ${({ $active }) => ($active ? lightPalette.hwanggeum[500] : '#f2f4f6')};
  color: ${({ $active }) => ($active ? '#191f28' : meok[700])};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $active }) => ($active ? lightPalette.hwanggeum[500] : '#e5e8eb')};
  }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? '#e85a18' : 'rgba(255, 255, 255, 0.08)')};
    color: ${({ $active }) => ($active ? '#ffffff' : '#9CA3AF')};

    &:hover {
      background: ${({ $active }) => ($active ? '#e85a18' : 'rgba(255, 255, 255, 0.14)')};
    }
  }
`;


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
  color: ${lightPalette.hwanggeum[500]};
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
    background: ${lightPalette.hwanggeum[50]};
    color: ${lightPalette.hwanggeum[900]};
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
    background: ${lightPalette.hwanggeum[50]};
    color: ${lightPalette.hwanggeum[700]};
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

  background: ${({ $active }) => ($active ? lightPalette.hwanggeum[500] : '#f2f4f6')};
  color: ${({ $active }) => ($active ? '#191f28' : meok[700])};
  font-size: ${fontSize.sm};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $active }) => ($active ? lightPalette.hwanggeum[500] : '#e5e8eb')};
  }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? '#e85a18' : 'rgba(255, 255, 255, 0.08)')};
    color: ${({ $active }) => ($active ? '#ffffff' : '#D1D5DB')};

    &:hover {
      background: ${({ $active }) => ($active ? '#e85a18' : 'rgba(255, 255, 255, 0.14)')};
    }
  }
`;


const TagWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const TagChip = styled.button<{ $selected: boolean }>`
  padding: 6px 12px;
  border-radius: 9999px;

  background: ${({ $selected }) => ($selected ? lightPalette.hwanggeum[500] : '#f2f4f6')};
  color: ${({ $selected }) => ($selected ? '#191f28' : meok[700])};
  font-size: ${fontSize.xs};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $selected }) => ($selected ? lightPalette.hwanggeum[500] : '#e5e8eb')};
  }

  [data-theme='dark'] & {
    background: ${({ $selected }) => ($selected ? '#e85a18' : 'rgba(255, 255, 255, 0.08)')};
    color: ${({ $selected }) => ($selected ? '#ffffff' : '#D1D5DB')};

    &:hover {
      background: ${({ $selected }) => ($selected ? '#e85a18' : 'rgba(255, 255, 255, 0.14)')};
    }
  }
`;


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

const ErrorText = styled.p`
  margin: 8px 0 0;
  color: #b42318;
  font-size: ${fontSize.xs};
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
  background: ${lightPalette.hwanggeum[500]};
  color: #191f28;
  font-family: inherit;
  font-size: ${fontSize.sm};
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover:not(:disabled) {
    background: ${lightPalette.hwanggeum[700]};
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
  onCreated,
}: WriteWarmthModalProps) {
  const items = useMapStore((s) => s.items);
  const setWarmths = useMapStore((s) => s.setWarmths);
  const { create, loading: isSubmitting, error: createError } = useCreateVisitReview();

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

  useEffect(() => {
    if (!isOpen) return;
    setSelectedPlace(defaultPlace ?? null);
    setPlaceQuery(defaultPlace?.name ?? '');
  }, [defaultPlace, isOpen]);


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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !selectedPlace) return;

    try {
      const created = await create({
        placeId: selectedPlace.id,
        text: text.trim(),
        mood,
        score,
        tags: selectedTags,
      });

      setWarmths([
        created,
        ...useMapStore.getState().warmths.filter((item) => item.id !== created.id),
      ]);
      onCreated?.(created);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setText('');
        setSelectedTags([]);
        onClose();
      }, 900);
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <Overlay $open={isOpen} onClick={onClose} role="dialog" aria-modal="true">
      <ModalCard $open={isOpen} onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Flame size={20} strokeWidth={2} color={lightPalette.hwanggeum[500]} />
            <span>온기 한 줄 남기기</span>
          </ModalTitle>
          <CloseBtn type="button" onClick={onClose} aria-label="닫기">
            <X size={20} strokeWidth={2} />
          </CloseBtn>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          {}
          <FormSection>
            <SectionLabel>어디를 다녀오셨나요?</SectionLabel>
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
                  if (e.target.value !== selectedPlace?.name) setSelectedPlace(null);
                  setIsDropdownOpen(true);
                }}
                placeholder="장소 이름을 검색해보세요 (예: 경기전)"
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

          {}
          <FormSection>
            <SectionLabel>이곳에서 어떤 기분이 드셨나요?</SectionLabel>
            <MoodSelector value={score} onChange={(val) => setScore(val)} />
          </FormSection>

          {}
          <FormSection>
            <SectionLabel>지금 분위기는 어때요?</SectionLabel>
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

          {}
          <FormSection>
            <SectionLabel>어울리는 분위기를 골라보세요 (선택)</SectionLabel>
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

          {}
          <FormSection>
            <SectionLabel>남기고 싶은 이야기나 꿀팁</SectionLabel>
            <TextArea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 80))}
              placeholder="예: 마당에 핀 배롱나무 꽃이 참 예뻐요. 아침 일찍 들르는 걸 추천해요."
              required
            />
            <CharCount>{text.length} / 80자</CharCount>
          </FormSection>

          {(!selectedPlace || Boolean(createError)) && (
            <ErrorText role="alert">
              {createError
                ? '후기를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'
                : '목록에서 장소를 선택해 주세요.'}
            </ErrorText>
          )}

          <SubmitBtn type="submit" disabled={!text.trim() || !selectedPlace || isSuccess || isSubmitting}>
            {isSuccess ? (
              <>
                <Check size={18} strokeWidth={2} />
                <span>이야기를 남겼어요!</span>
              </>
            ) : (
              <span>{isSubmitting ? '저장 중…' : '온기 등록하기'}</span>
            )}
          </SubmitBtn>
        </form>
      </ModalCard>
    </Overlay>
  );
}
