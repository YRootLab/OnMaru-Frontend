'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, FlameIcon, UsersIcon, Leaf01Icon, CheckIcon, MapPinIcon } from '@hugeicons/core-free-icons';
import { meok, palette, surface, fontSize, ringShadow } from '@/design-system/tokens';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { useCreateVisitReview } from '@/features/visit-review/presentation/useCreateVisitReview';
import { RAIL_INSET, RAIL_WIDTH } from '@/features/map/components/MapNavRail';
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

const PANEL_WIDTH = 400;
const PANEL_WIDTH_COMPACT = 358;

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

const PanelContainer = styled(motion.aside)<{ $panelOpen: boolean }>`
  position: fixed;
  top: ${RAIL_INSET}px;
  bottom: ${RAIL_INSET}px;
  left: ${({ $panelOpen }) =>
    $panelOpen
      ? `${RAIL_INSET + RAIL_WIDTH + RAIL_INSET + PANEL_WIDTH + 12}px`
      : `${RAIL_INSET + RAIL_WIDTH + RAIL_INSET}px`};
  width: ${PANEL_WIDTH}px;
  height: calc(100vh - ${RAIL_INSET * 2}px);
  z-index: 40;
  display: flex;
  flex-direction: column;
  padding: 24px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.16), 0 4px 12px -4px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  pointer-events: auto;

  [data-theme='dark'] & {
    background: ${surface.dark.surface};
    color: #F3F4F6;
    box-shadow: ${ringShadow.dark.mapPanel};
    border: none;
  }

  @media (min-width: 1024px) and (max-width: 1439px) {
    left: ${({ $panelOpen }) =>
      $panelOpen
        ? `${RAIL_INSET + RAIL_WIDTH + RAIL_INSET + PANEL_WIDTH_COMPACT + 12}px`
        : `${RAIL_INSET + RAIL_WIDTH + RAIL_INSET}px`};
    width: ${PANEL_WIDTH_COMPACT}px;
  }

  @media (max-width: 1023px) {
    top: 12px;
    bottom: 12px;
    left: 12px;
    right: 12px;
    width: auto;
    height: auto;
  }
`;

const ModalHeader = styled.div`
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
`;

const ModalForm = styled.form`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-right: 4px;
  margin-right: -4px;

  scrollbar-width: thin;
  scrollbar-color: rgba(25, 31, 40, 0.18) transparent;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(25, 31, 40, 0.18);
    border-radius: 9999px;
  }

  [data-theme='dark'] & {
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
    }
  }
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
  overflow-y: hidden;
  padding-bottom: 4px;
  touch-action: pan-x;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
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
  background: ${({ $active }) => ($active ? meok[900] : '#f2f4f6')};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $active }) => ($active ? meok[800] : '#e5e8eb')};
  }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.08)')};
    color: ${({ $active }) => ($active ? '#ffffff' : '#9CA3AF')};

    &:hover {
      background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.24)' : 'rgba(255, 255, 255, 0.14)')};
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
  color: ${meok[500]};
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
    background: #eef1f4;
    color: ${meok[900]};
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.06);
    color: #F3F4F6;

    &::placeholder {
      color: #6B7280;
    }

    &:focus {
      background: rgba(255, 255, 255, 0.1);
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
    background: ${surface.dark.app};
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
    background: #eef1f4;
    color: ${meok[700]};
  }

  [data-theme='dark'] & {
    color: #E5E7EB;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
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

  background: ${({ $active }) => ($active ? meok[900] : '#f2f4f6')};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  font-size: ${fontSize.sm};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $active }) => ($active ? meok[800] : '#e5e8eb')};
  }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.08)')};
    color: ${({ $active }) => ($active ? '#ffffff' : '#D1D5DB')};

    &:hover {
      background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.24)' : 'rgba(255, 255, 255, 0.14)')};
    }
  }
`;

const MoodButtonMascot = styled.img`
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
  display: block;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
`;


const TagWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const TagChip = styled.button<{ $selected: boolean }>`
  padding: 6px 12px;
  border-radius: 9999px;

  background: ${({ $selected }) => ($selected ? meok[900] : '#f2f4f6')};
  color: ${({ $selected }) => ($selected ? '#ffffff' : meok[700])};
  font-size: ${fontSize.xs};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $selected }) => ($selected ? meok[800] : '#e5e8eb')};
  }

  [data-theme='dark'] & {
    background: ${({ $selected }) => ($selected ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.08)')};
    color: ${({ $selected }) => ($selected ? '#ffffff' : '#D1D5DB')};

    &:hover {
      background: ${({ $selected }) => ($selected ? 'rgba(255, 255, 255, 0.24)' : 'rgba(255, 255, 255, 0.14)')};
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
  background: ${meok[900]};
  color: #ffffff;
  font-family: inherit;
  font-size: ${fontSize.sm};
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover:not(:disabled) {
    background: ${meok[800]};
  }

  &:disabled {
    background: #d1d5db;
    color: #9ca3af;
    cursor: not-allowed;
  }

  [data-theme='dark'] & {
    background: ${meok[900]};

    &:hover:not(:disabled) {
      background: ${meok[800]};
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
  const panelOpen = useMapStore((s) => s.panelOpen);
  const setIsWarmthWriteOpen = useMapStore((s) => s.setIsWarmthWriteOpen);
  const { create, loading: isSubmitting, error: createError } = useCreateVisitReview();

  const [mounted, setMounted] = useState(false);
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
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsWarmthWriteOpen(isOpen);
    return () => {
      setIsWarmthWriteOpen(false);
    };
  }, [isOpen, setIsWarmthWriteOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <PanelContainer
          key="warmth-write-panel"
          $panelOpen={panelOpen}
          initial={{ opacity: 0, x: -20, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.19, 1.15, 0.22, 1] }}
          role="dialog"
          aria-label="온기 한 줄 남기기"
        >
          <ModalHeader>
            <ModalTitle>
              <HugeiconsIcon icon={FlameIcon} size={20} strokeWidth={2} color={palette.juhong[500]} />
              <span>온기 한 줄 남기기</span>
            </ModalTitle>
            <CloseBtn type="button" onClick={onClose} aria-label="닫기">
              <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={2} />
            </CloseBtn>
          </ModalHeader>

          <ModalForm onSubmit={handleSubmit}>
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
                <HugeiconsIcon icon={MapPinIcon} size={16} strokeWidth={2} />
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
                <MoodButtonMascot src="/images/character/Oni_tea.png" alt="" width={22} height={22} aria-hidden="true" />
                <span>한적해요</span>
              </MoodButton>
              <MoodButton
                type="button"
                $active={mood === '북적'}
                onClick={() => setMood('북적')}
              >
                <MoodButtonMascot src="/images/character/Oni_sogo.png" alt="" width={22} height={22} aria-hidden="true" />
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
            <SectionLabel>방문 팁이나 남기고 싶은 이야기</SectionLabel>
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
                ? '온기를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.'
                : '목록에서 장소를 선택해 주세요.'}
            </ErrorText>
          )}

          <SubmitBtn type="submit" disabled={!text.trim() || !selectedPlace || isSuccess || isSubmitting}>
            {isSuccess ? (
              <>
                <HugeiconsIcon icon={CheckIcon} size={18} strokeWidth={2} />
                <span>이야기를 남겼어요!</span>
              </>
            ) : (
              <span>{isSubmitting ? '저장 중…' : '온기 등록하기'}</span>
            )}
          </SubmitBtn>
        </ModalForm>
      </PanelContainer>
    )}
  </AnimatePresence>,
  document.body
);
}

