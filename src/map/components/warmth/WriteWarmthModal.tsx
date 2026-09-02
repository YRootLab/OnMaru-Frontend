'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { X, Flame, Users, Leaf, Check } from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';
import { addWarmth, loadWarmth } from '../../warmth/warmthRepo';
import { useMapStore } from '../../hooks/useMapStore';
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
  box-shadow: 0 16px 40px rgba(25, 31, 40, 0.18);
  transform: ${({ $open }) => ($open ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(12px)')};
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const ModalTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: ${meok[900]};
`;

const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: ${meok[100]};
  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${meok[200]};
    color: ${meok[900]};
  }
`;

const PlaceNameBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 12px;
  background: ${lightPalette.juhong[50]};
  color: ${lightPalette.juhong[700]};
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 18px;
`;

const FormSection = styled.div`
  margin-bottom: 16px;
`;

const SectionLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: ${meok[700]};
  margin-bottom: 8px;
`;

const MoodButtonGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const MoodButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 42px;
  border-radius: 14px;
  border: 1.5px solid
    ${({ $active }) =>
      $active ? lightPalette.juhong[500] : meok[200]};
  background: ${({ $active }) =>
    $active ? lightPalette.juhong[50] : '#ffffff'};
  color: ${({ $active }) =>
    $active ? lightPalette.juhong[700] : meok[700]};
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    border-color: ${lightPalette.juhong[400]};
  }
`;

const TagWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const TagChip = styled.button<{ $selected: boolean }>`
  padding: 5px 10px;
  border-radius: 9999px;
  border: 1px solid ${({ $selected }) => ($selected ? lightPalette.juhong[500] : meok[200])};
  background: ${({ $selected }) => ($selected ? lightPalette.juhong[50] : '#ffffff')};
  color: ${({ $selected }) => ($selected ? lightPalette.juhong[700] : meok[700])};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${lightPalette.juhong[400]};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 80px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1.5px solid ${meok[200]};
  background: #ffffff;
  color: ${meok[900]};
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color 0.18s ease;

  &::placeholder {
    color: ${meok[400]};
  }

  &:focus {
    border-color: ${lightPalette.juhong[500]};
  }
`;

const CharCount = styled.div`
  text-align: right;
  font-size: 12px;
  color: ${meok[400]};
  margin-top: 4px;
`;

const SubmitBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  margin-top: 8px;
  border: none;
  border-radius: 14px;
  background: ${lightPalette.juhong[500]};
  color: #ffffff;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(232, 90, 24, 0.28);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover:not(:disabled) {
    background: ${lightPalette.juhong[700]};
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(232, 90, 24, 0.35);
  }

  &:disabled {
    background: ${meok[400]};
    cursor: not-allowed;
    box-shadow: none;
  }
`;

export default function WriteWarmthModal({
  isOpen,
  onClose,
  defaultPlace,
}: WriteWarmthModalProps) {
  const [score, setScore] = useState<MoodValue>(1);
  const [mood, setMood] = useState<'한적' | '북적'>('한적');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const setWarmths = useMapStore((s) => s.setWarmths);
  const searchCenter = useMapStore((s) => s.searchCenter);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const placeId = defaultPlace?.id || `custom-${Date.now()}`;
    const placeName = defaultPlace?.name || '우리 동네 한옥';
    const lat = defaultPlace?.lat || searchCenter.lat;
    const lng = defaultPlace?.lng || searchCenter.lng;

    // 로컬 저장소에 온기 추가
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

    // Zustand 스토어 업데이트
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
            <Flame size={20} color={lightPalette.juhong[500]} />
            <span>온기 한 줄 남기기</span>
          </ModalTitle>
          <CloseBtn type="button" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </CloseBtn>
        </ModalHeader>

        {defaultPlace && (
          <PlaceNameBadge>
            <span>📍</span>
            <span>{defaultPlace.name}</span>
          </PlaceNameBadge>
        )}

        <form onSubmit={handleSubmit}>
          {/* 1. 표정 감정 선택기 */}
          <FormSection>
            <SectionLabel>이곳에서의 전반적인 느낌 (표정 선택)</SectionLabel>
            <MoodSelector value={score} onChange={(val) => setScore(val)} />
          </FormSection>

          {/* 2. 장소 혼잡도 분위기 */}
          <FormSection>
            <SectionLabel>현재 이 장소의 분위기</SectionLabel>
            <MoodButtonGroup>
              <MoodButton
                type="button"
                $active={mood === '한적'}
                onClick={() => setMood('한적')}
              >
                <Leaf size={16} />
                <span>한적해요</span>
              </MoodButton>
              <MoodButton
                type="button"
                $active={mood === '북적'}
                onClick={() => setMood('북적')}
              >
                <Users size={16} />
                <span>북적여요</span>
              </MoodButton>
            </MoodButtonGroup>
          </FormSection>

          {/* 3. 추천 키워드 태그 */}
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

          {/* 4. 한줄평 본문 */}
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
                <Check size={18} />
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
