'use client';









import { useRef } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
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
  padding: 6px 4px 14px;
  margin: -4px -4px -14px;

  @media (max-width: 767px) {
    scroll-snap-type: x mandatory;

    > * {
      scroll-snap-align: start;
    }
  }
`;

const CardItemWrap = styled(motion.div)`
  display: flex;
  align-items: flex-start;
  flex-shrink: 0;
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
}

export default function JourneyFlowRail({ board }: JourneyFlowRailProps) {
  const regionTitle = board.regionRef ? findRegionTitle(board) : '';
  const railRef = useRef<HTMLDivElement>(null);
  const reduceMotion = usePrefersReducedMotion();



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
        const isPinned = false;
        const leg = board.legs.find((l) => l.order === idx + 1 && l.fromRef.id === place.ref.id);

        return (
          <CardItemWrap
            key={place.ref.id}
            role="listitem"
            initial={reduceMotion ? false : { opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.55, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <JourneyPlaceCard
              order={idx + 1}
              candidate={candidate}
              place={place}
              regionTitle={regionTitle}
              state={'default'}
              isPinned={false}
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
          </CardItemWrap>
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
