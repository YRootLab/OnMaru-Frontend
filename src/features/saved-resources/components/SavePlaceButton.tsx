'use client';

import { useState } from 'react';
import type React from 'react';
import styled from '@emotion/styled';
import { Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { lightPalette, meok } from '@/design-system/tokens';
import { hasAuthenticatedUser } from '@/features/auth/privateState';
import { defaultSavedResourcesRepository, type SavedResourcesRepository } from '../api/savedResourcesApi';

type SavePlaceButtonProps = {
  placeId: string;
  placeName: string;
  initialSaved?: boolean;
  repository?: SavedResourcesRepository;
  className?: string;
  compact?: boolean;
};

const Button = styled.button<{ $active: boolean; $compact: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ $compact }) => ($compact ? '0' : '6px')};
  width: ${({ $compact }) => ($compact ? '30px' : 'auto')};
  height: ${({ $compact }) => ($compact ? '30px' : '34px')};
  padding: ${({ $compact }) => ($compact ? '0' : '0 12px')};
  border-radius: 9999px;
  border: 0;
  background: ${({ $active }) => ($active ? 'rgba(47, 111, 78, 0.12)' : 'rgba(25, 31, 40, 0.04)')};
  color: ${({ $active }) => ($active ? '#2f6f4e' : meok[500])};
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ $active }) => ($active ? 'rgba(47, 111, 78, 0.18)' : 'rgba(25, 31, 40, 0.08)')};
    color: ${({ $active }) => ($active ? '#245b3f' : meok[900])};
    transform: scale(1.04);
  }

  &:active:not(:disabled) {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid ${lightPalette.cheongrok[500]};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.65;
  }
`;

export default function SavePlaceButton({
  placeId,
  placeName,
  initialSaved = false,
  repository = defaultSavedResourcesRepository,
  className,
  compact = false,
}: SavePlaceButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  const handleClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!hasAuthenticatedUser()) {
      toast.info('로그인해주세요.');
      return;
    }

    const previous = saved;
    const next = !saved;
    setSaved(next);
    setPending(true);
    try {
      if (next) {
        await repository.savePlace(placeId);
        toast.success(`${placeName}을(를) 담았어요.`);
      } else {
        await repository.unsavePlace(placeId);
        toast.success(`${placeName} 담기를 해제했어요.`);
      }
    } catch {
      setSaved(previous);
      toast.error('서버 상태를 확인하지 못해 담기 상태를 되돌렸어요.');
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      className={className}
      $active={saved}
      $compact={compact}
      disabled={pending}
      onClick={handleClick}
      title={saved ? '담기 해제' : '담기'}
      aria-pressed={saved}
      aria-label={saved ? `${placeName} 담기 해제` : `${placeName} 담기`}
    >
      <Bookmark size={14} strokeWidth={2} fill={saved ? 'currentColor' : 'none'} />
      {!compact && <span>{saved ? '담은 장소' : '담기'}</span>}
    </Button>
  );
}
