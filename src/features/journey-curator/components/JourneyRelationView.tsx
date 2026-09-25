'use client';

import { motion } from 'framer-motion';





import styled from '@emotion/styled';
import { MapPin, Route } from 'lucide-react';
import { meok, palette, fontSize } from '@/design-system/tokens';
import type { JourneyBoard, PlaceResource, RegionResource, ResourceRef } from '../types/exploration.types';

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
`;

const Row = styled.li<{ $focused: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 4px;
  border-top: 1px solid ${meok[200]};
  background: ${({ $focused }) => ($focused ? palette.juhong[50] : 'transparent')};
`;

const IconBox = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  color: ${meok[500]};
  background: ${meok[100]};
`;

const RelText = styled.button`
  flex: 1;
  min-width: 0;
  text-align: left;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  font-size: ${fontSize.sm};
  color: ${meok[800]};
  margin: 0;

  b {
    font-weight: 500;
    color: ${meok[900]};
  }

  [data-theme='dark'] & {
    color: ${meok[300]};

    b {
      color: #f8f9fa;
    }
  }
`;

const EvidenceButton = styled.button`
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: ${fontSize.xs};
  color: ${meok[500]};
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover {
    color: ${meok[900]};
  }
`;

const BusLineWrap = styled.div`
  position: relative;
  padding-left: 18px;
`;

const BusLine = styled.div`
  position: absolute;
  left: 6px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: ${meok[200]};
  border-radius: 1px;
  overflow: hidden;

  [data-theme='dark'] & {
    background: rgba(255,255,255,0.08);
  }
`;

const BusGlow = styled(motion.div)`
  position: absolute;
  left: 0;
  width: 100%;
  height: 48px;
  background: linear-gradient(180deg, transparent, ${palette.juhong[400]}, transparent);
  border-radius: 1px;
`;

const MotionRow = motion(Row);

const Empty = styled.p`
  padding: 24px 0;
  text-align: center;
  font-size: ${fontSize.sm};
  color: ${meok[500]};
`;

function resolveTitle(board: JourneyBoard, ref: ResourceRef): string {
  const resource = board.resources.find((r) => r.ref.type === ref.type && r.ref.id === ref.id);
  if (!resource) return ref.id;
  return (resource as PlaceResource | RegionResource).title;
}

interface JourneyRelationViewProps {
  board: JourneyBoard;
  focusedRef: ResourceRef | null;
  onFocus: (ref: ResourceRef) => void;
  onOpenEvidence?: (ref: ResourceRef) => void;
}

export default function JourneyRelationView({ board, focusedRef, onFocus, onOpenEvidence }: JourneyRelationViewProps) {
  const relations = focusedRef
    ? board.relations.filter((r) => r.sourceRef.id === focusedRef.id || r.targetRef.id === focusedRef.id)
    : board.relations;

  if (relations.length === 0) {
    return <Empty>표시할 연결이 없어요.</Empty>;
  }

  return (
    <BusLineWrap>
      <BusLine aria-hidden="true">
        <BusGlow
          initial={{ top: '-48px' }}
          animate={{ top: '100%' }}
          transition={{ duration: relations.length * 0.18 + 0.6, ease: 'easeInOut' }}
        />
      </BusLine>
      <List>
        {relations.map((rel, i) => {
          const sourceTitle = resolveTitle(board, rel.sourceRef);
          const targetTitle = resolveTitle(board, rel.targetRef);
          const isFocused =
            focusedRef !== null && (rel.sourceRef.id === focusedRef.id || rel.targetRef.id === focusedRef.id);
          const clickTarget = rel.sourceRef.id === focusedRef?.id ? rel.targetRef : rel.sourceRef;

          return (
            <MotionRow
              key={rel.id}
              $focused={isFocused}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06, ease: 'easeOut' }}
            >
              <IconBox>{rel.type === 'NEARBY' ? <Route size={14} strokeWidth={2} /> : <MapPin size={14} strokeWidth={2} />}</IconBox>
              <RelText type="button" onClick={() => onFocus(clickTarget)}>
                <b>{sourceTitle}</b> · {rel.label} · <b>{targetTitle}</b>
              </RelText>
              {onOpenEvidence && (
                <EvidenceButton type="button" onClick={() => onOpenEvidence(rel.sourceRef)}>
                  근거
                </EvidenceButton>
              )}
            </MotionRow>
          );
        })}
      </List>
    </BusLineWrap>
  );
}
