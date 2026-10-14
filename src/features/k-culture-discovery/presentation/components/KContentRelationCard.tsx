'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import { ChevronDownIcon, ChevronUpIcon } from '@hugeicons/core-free-icons';
import { meok, lightPalette, ringShadow, fontSize } from '@/design-system/tokens';
import WorkTypeBadge from './WorkTypeBadge';
import EvidenceList from './EvidenceList';
import type { KContentRelation, RelationType } from '../../domain/types';

const RELATION_LABELS: Record<RelationType, string> = {
  FILMING_LOCATION: '촬영지',
  VISIT_SPOT: '방문 장소',
};

const RelationBadge = styled.span<{ $type: RelationType }>`
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 600;
  background: ${({ $type }) =>
    $type === 'VISIT_SPOT' ? lightPalette.cheongrok[50] : lightPalette.juhong[50]};
  color: ${({ $type }) =>
    $type === 'VISIT_SPOT' ? lightPalette.cheongrok[700] : lightPalette.juhong[600]};

  [data-theme='dark'] & {
    background: ${({ $type }) =>
      $type === 'VISIT_SPOT' ? 'rgba(0,196,113,0.12)' : 'rgba(255,85,0,0.14)'};
    color: ${({ $type }) =>
      $type === 'VISIT_SPOT' ? lightPalette.cheongrok[300] : lightPalette.juhong[300]};
  }
`;

const Card = styled.div`
  padding: 16px;
  border-radius: 14px;
  border: none;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: ${ringShadow.light.cardElevated};

  [data-theme='dark'] & {
    background: ${meok[800]};
    box-shadow: ${ringShadow.dark.cardElevated};
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const WorkInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const WorkTitle = styled.h4`
  font-family: var(--font-hanok);
  font-size: ${fontSize.base};
  font-weight: 700;
  color: ${meok[900]};
  margin: 0;
  letter-spacing: -0.02em;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const YearText = styled.span`
  font-size: ${fontSize.xs};
  color: ${meok[500]};
`;

const ContextText = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[600]};
  margin: 0;
  line-height: 1.6;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`;

const Tag = styled.span`
  padding: 3px 9px;
  border-radius: 6px;
  background: ${meok[100]};
  color: ${meok[600]};
  font-size: 11px;
  font-weight: 500;

  [data-theme='dark'] & {
    background: ${meok[700]};
    color: ${meok[300]};
  }
`;

const EvidenceToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: ${fontSize.xs};
  font-weight: 600;
  color: ${lightPalette.cheongrok[600]};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  transition: color 0.15s ease;

  &:hover {
    color: ${lightPalette.cheongrok[800]};
  }

  [data-theme='dark'] & {
    color: ${lightPalette.cheongrok[400]};
  }
`;

export interface KContentRelationCardProps {
  relation: KContentRelation;
}

export default function KContentRelationCard({ relation }: KContentRelationCardProps) {
  const [showEvidence, setShowEvidence] = useState(false);
  const { work } = relation;

  return (
    <Card>
      <Header>
        <WorkInfo>
          <WorkTitle>{work.canonicalTitle}</WorkTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <WorkTypeBadge type={work.type} variant="dark" />
            {work.releaseYear && <YearText>{work.releaseYear}</YearText>}
            <RelationBadge $type={relation.relationType}>
              {RELATION_LABELS[relation.relationType]}
            </RelationBadge>
          </div>
        </WorkInfo>
      </Header>

      {relation.contextSummary && (
        <ContextText>{relation.contextSummary}</ContextText>
      )}

      {relation.relationTags.length > 0 && (
        <TagRow>
          {relation.relationTags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </TagRow>
      )}

      {relation.evidenceCount > 0 && (
        <>
          <EvidenceToggle
            type="button"
            onClick={() => setShowEvidence((v) => !v)}
            aria-expanded={showEvidence}
          >
            <HugeiconsIcon
              icon={showEvidence ? ChevronUpIcon : ChevronDownIcon}
              size={13}
              strokeWidth={2.5}
              aria-hidden="true"
            />
            근거 출처 {relation.evidenceCount}개
          </EvidenceToggle>

          {showEvidence && <EvidenceList evidence={relation.evidence} />}
        </>
      )}
    </Card>
  );
}
