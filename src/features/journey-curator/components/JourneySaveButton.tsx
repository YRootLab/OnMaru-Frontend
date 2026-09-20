'use client';

/**
 * 여정 저장 — seven-day-mvp-fe-handoff.md §11.
 * 실제 Spring `/saved-journeys`가 아직 없어 로컬에 저장한다(useSavedExplorationStore) —
 * 로그인하지 않은 사용자는 저장할 수 없다.
 */

import { useEffect } from 'react';
import styled from '@emotion/styled';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth';
import { meok, palette, fontSize } from '@/design-system/tokens';
import { useJourneyStore } from '../store/useJourneyStore';
import { useSavedExplorationStore } from '../store/useSavedExplorationStore';

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
  const { isLoggedIn } = useAuth();
  const board = useJourneyStore((s) => s.explorationBoard);
  const pinnedRefs = useJourneyStore((s) => s.pinnedRefs);

  const saveJourney = useSavedExplorationStore((s) => s.saveJourney);
  const isSavedFn = useSavedExplorationStore((s) => s.isSaved);
  const loadSaved = useSavedExplorationStore((s) => s.loadSaved);
  const isLoaded = useSavedExplorationStore((s) => s.isLoaded);

  useEffect(() => {
    if (!isLoaded) loadSaved();
  }, [isLoaded, loadSaved]);

  if (!board) return null;
  const currentBoard = board;
  const saved = isSavedFn(currentBoard.title);

  function handleClick() {
    if (!isLoggedIn) {
      toast.info('로그인해주세요.');
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
