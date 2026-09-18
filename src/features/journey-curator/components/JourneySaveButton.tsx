'use client';

/**
 * 여정 저장 — seven-day-mvp-fe-handoff.md §11.
 * 비회원이 누르면 지금 board를 sessionStorage에 맡겨두고 카카오 로그인으로 보낸 뒤,
 * 돌아오면 자동으로 저장을 마저 끝낸다(pendingSaveBridge). 로그인 취소·실패 시
 * sessionStorage에 남은 값은 다음 저장 시도 때 덮어써지므로 board를 잃지 않는다.
 *
 * 실제 Spring `/saved-journeys`가 아직 없어 로컬에 저장한다(useSavedExplorationStore) —
 * 카카오 인가 자체는 실제 화면을 왕복한다(2026-09-16부터).
 */

import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth';
import { meok, palette, fontSize } from '@/design-system/tokens';
import { useJourneyStore } from '../store/useJourneyStore';
import { useSavedExplorationStore } from '../store/useSavedExplorationStore';
import { clearPendingSave, getPendingSave, setPendingSave } from '../store/pendingSaveBridge';

const SaveBtn = styled.button<{ $saved: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 6px 2px;
  cursor: pointer;
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${({ $saved }) => ($saved ? palette.cheongrok[500] : meok[500])};

  &:hover {
    color: ${palette.cheongrok[500]};
  }
`;

export default function JourneySaveButton() {
  const { isLoggedIn, loginWithKakao } = useAuth();
  const board = useJourneyStore((s) => s.explorationBoard);
  const pinnedRefs = useJourneyStore((s) => s.pinnedRefs);
  const hanokDogan = useJourneyStore((s) => s.hanokDogan);
  const nearbyAudio = useJourneyStore((s) => s.nearbyAudio);
  const nearbyFood = useJourneyStore((s) => s.nearbyFood);
  const hydrateBoard = useJourneyStore((s) => s.hydrateBoard);

  const saveJourney = useSavedExplorationStore((s) => s.saveJourney);
  const isSavedFn = useSavedExplorationStore((s) => s.isSaved);
  const loadSaved = useSavedExplorationStore((s) => s.loadSaved);
  const isLoaded = useSavedExplorationStore((s) => s.isLoaded);

  const resumedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) loadSaved();
  }, [isLoaded, loadSaved]);

  // 카카오 로그인 왕복 뒤 자동으로 저장을 마저 끝낸다.
  useEffect(() => {
    if (resumedRef.current || !isLoggedIn) return;
    const pending = getPendingSave();
    if (!pending) return;
    resumedRef.current = true;

    hydrateBoard(pending.board, pending.pinnedRefs, {
      hanokDogan: pending.hanokDogan,
      nearbyAudio: pending.nearbyAudio,
      nearbyFood: pending.nearbyFood,
    });
    saveJourney(pending.board, pending.pinnedRefs, pending.title);
    clearPendingSave();
    toast.success(`'${pending.title}' 여정을 저장했어요!`);
  }, [isLoggedIn, hydrateBoard, saveJourney]);

  if (!board) return null;
  const currentBoard = board;
  const saved = isSavedFn(currentBoard.title);

  function handleClick() {
    if (!isLoggedIn) {
      setPendingSave({ board: currentBoard, pinnedRefs, title: currentBoard.title, hanokDogan, nearbyAudio, nearbyFood });
      toast.info('로그인하면 이 여정을 저장할 수 있어요.');
      loginWithKakao();
      return;
    }
    if (saved) return;
    saveJourney(currentBoard, pinnedRefs, currentBoard.title);
    toast.success(`'${currentBoard.title}' 여정을 저장했어요!`);
  }

  return (
    <SaveBtn type="button" onClick={handleClick} $saved={saved} disabled={saved}>
      {saved ? <BookmarkCheck size={15} strokeWidth={2} /> : <Bookmark size={15} strokeWidth={2} />}
      <span>{saved ? '저장됨' : '여정 저장하기'}</span>
    </SaveBtn>
  );
}
