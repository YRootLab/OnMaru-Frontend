'use client';

/**
 * 확정 보드 하나를 가로 여정 흐름으로 그린다.
 * seven-day-mvp-fe-handoff.md §7: connector는 실제 도보 경로가 아니라
 * 인접 장소 좌표의 직선거리를 제한된 시각 단계(distanceBand)로 표현한 것.
 *
 * BentoJourneyGrid.tsx의 고정 지도 카드를 대체할 후보 — 기존 컴포넌트는 지우지 않는다.
 */

import { useRef } from 'react';
import styled from '@emotion/styled';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { meok, fontSize } from '@/design-system/tokens';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import JourneyPlaceCard from './JourneyPlaceCard';
import { DISTANCE_BAND_CONNECTOR_PX } from '../types/exploration.types';
import type {
  JourneyBoard,
  PlaceResource,
  ResourceRef,
  DistanceBand,
} from '../types/exploration.types';

const Rail = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  padding: 4px 4px 12px;

  @media (max-width: 767px) {
    scroll-snap-type: x mandatory;

    > * {
      scroll-snap-align: start;
    }
  }
`;

const ConnectorWrap = styled.div<{ $width: number }>`
  flex-shrink: 0;
  width: ${({ $width }) => $width}px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding-top: 40px;
  align-self: stretch;
`;

const ConnectorLine = styled.div<{ $dashed: boolean }>`
  width: 100%;
  height: 0;
  border-top: 1.5px ${({ $dashed }) => ($dashed ? 'dashed' : 'solid')} ${meok[300]};
  transform-origin: left center;
`;

const ConnectorLabel = styled.span`
  font-size: ${fontSize.micro};
  color: ${meok[500]};
  white-space: nowrap;
`;

function findPlace(board: JourneyBoard, ref: ResourceRef): PlaceResource | undefined {
  return board.resources.find(
    (r): r is PlaceResource => r.ref.type === 'PLACE' && r.ref.id === ref.id,
  );
}

function distanceLabel(distanceMeters: number | null, band: DistanceBand): string {
  if (distanceMeters == null) return '거리 미확인';
  if (distanceMeters >= 1000) return `직선 약 ${(distanceMeters / 1000).toFixed(1)}km`;
  return `직선 약 ${distanceMeters}m`;
}

interface JourneyFlowRailProps {
  board: JourneyBoard;
  pinnedRefs: ResourceRef[];
  onTogglePin?: (ref: ResourceRef) => void;
  onOpenEvidence?: (ref: ResourceRef) => void;
}

export default function JourneyFlowRail({ board, pinnedRefs, onTogglePin, onOpenEvidence }: JourneyFlowRailProps) {
  const regionTitle = board.regionRef ? findRegionTitle(board) : '';
  const railRef = useRef<HTMLDivElement>(null);
  const reduceMotion = usePrefersReducedMotion();

  // 여정 순서가 실제로 "이어지는 길"이라는 걸 보여주는 유일한 연출 — connector가 왼쪽에서
  // 자라나며 그려진다. 카드 등장에는 따로 효과를 주지 않는다: 움직임을 한 곳에만 쓴다.
  useGSAP(
    () => {
      if (reduceMotion || !railRef.current) return;
      const lines = railRef.current.querySelectorAll<HTMLElement>('[data-connector-line]');
      gsap.fromTo(
        lines,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.6, ease: 'power2.out', stagger: 0.12, delay: 0.15 },
      );
    },
    { dependencies: [board.title, board.candidates.map((c) => c.placeRef.id).join(',')], scope: railRef },
  );

  return (
    <Rail role="list" aria-label="여정 순서" ref={railRef}>
      {board.candidates.map((candidate, idx) => {
        const place = findPlace(board, candidate.placeRef);
        if (!place) return null;
        const isPinned = pinnedRefs.some((r) => r.id === place.ref.id);
        const leg = board.legs.find((l) => l.order === idx + 1 && l.fromRef.id === place.ref.id);

        return (
          <div key={place.ref.id} role="listitem" style={{ display: 'contents' }}>
            <JourneyPlaceCard
              order={idx + 1}
              candidate={candidate}
              place={place}
              regionTitle={regionTitle}
              state={isPinned ? 'pinned' : 'default'}
              isPinned={isPinned}
              onTogglePin={onTogglePin ? () => onTogglePin(place.ref) : undefined}
              onOpenEvidence={onOpenEvidence ? () => onOpenEvidence(place.ref) : undefined}
            />
            {leg && (
              <ConnectorWrap
                $width={DISTANCE_BAND_CONNECTOR_PX[leg.distanceBand]}
                aria-hidden="true"
              >
                <ConnectorLine $dashed={leg.distanceBand === 'UNKNOWN'} data-connector-line />
                <ConnectorLabel>{distanceLabel(leg.distanceMeters, leg.distanceBand)}</ConnectorLabel>
              </ConnectorWrap>
            )}
          </div>
        );
      })}
    </Rail>
  );
}

function findRegionTitle(board: JourneyBoard): string {
  const region = board.resources.find(
    (r) => r.ref.type === 'REGION' && r.ref.id === board.regionRef.id,
  );
  return region ? (region as { title: string }).title : '';
}
