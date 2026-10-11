'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import { ChevronDownIcon, ChevronUpIcon } from '@hugeicons/core-free-icons';
import { meok, lightPalette, fontSize } from '@/design-system/tokens';
import WorkTypeBadge from './WorkTypeBadge';
import EvidenceList from './EvidenceList';
import type { KContentRelation } from '../../domain/types';

const Card = styled.div`
  padding: 16px;
  border-radius: 14px;
  border: 1px solid rgba(78, 89, 104, 0.1);
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 12px;

  [data-theme='dark'] & {
    background: ${meok[800]};
    border-color: rgba(255, 255, 255, 0.08);
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
  color: ${lightPalette.kobalt[600]};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  transition: color 0.15s ease;

  &:hover {
    color: ${lightPalette.kobalt[800]};
  }

  [data-theme='dark'] & {
    color: ${lightPalette.kobalt[400]};
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <WorkTypeBadge type={work.type} variant="dark" />
            {work.releaseYear && <YearText>{work.releaseYear}</YearText>}
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
