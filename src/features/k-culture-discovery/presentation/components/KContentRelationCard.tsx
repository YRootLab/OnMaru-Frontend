'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { useTranslations } from 'next-intl';
import { HugeiconsIcon } from '@hugeicons/react';
import { ChevronDownIcon, ChevronUpIcon } from '@hugeicons/core-free-icons';
import { meok, lightPalette, ringShadow, fontSize } from '@/design-system/tokens';
import WorkTypeBadge from './WorkTypeBadge';
import EvidenceList from './EvidenceList';
import type { KContentRelation, RelationType, WorkType } from '../../domain/types';

const ACCENT_COLOR: Record<WorkType, string> = {
  DRAMA: lightPalette.juhong[500],
  MOVIE: lightPalette.kobalt[500],
  MUSIC_VIDEO: '#9333ea',
  ARTIST: '#9333ea',
  VARIETY: lightPalette.cheongrok[500],
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

const Card = styled.div<{ $accent: string }>`
  position: relative;
  padding: 16px 16px 16px 20px;
  border-radius: 14px;
  border: none;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: ${ringShadow.light.cardElevated};
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${({ $accent }) => $accent};
    border-radius: 14px 0 0 14px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${ringShadow.light.cardLift};
  }

  [data-theme='dark'] & {
    background: ${meok[800]};
    box-shadow: ${ringShadow.dark.cardElevated};

    &:hover {
      box-shadow: ${ringShadow.dark.cardLift};
    }
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

const WorkTitle = styled(Link)`
  font-family: var(--font-hanok);
  font-size: ${fontSize.base};
  font-weight: 700;
  color: ${meok[900]};
  margin: 0;
  letter-spacing: -0.02em;
  text-decoration: none;
  transition: color 0.15s ease;

  &:hover {
    color: ${lightPalette.juhong[600]};
  }

  [data-theme='dark'] & {
    color: ${meok[100]};
    &:hover { color: ${lightPalette.juhong[400]}; }
  }
`;

const YearText = styled.span`
  font-size: ${fontSize.xs};
  color: ${meok[500]};
`;

const ContextText = styled.blockquote`
  font-size: ${fontSize.sm};
  color: ${meok[600]};
  margin: 0;
  padding: 8px 0 8px 12px;
  border-left: 2px solid ${meok[200]};
  line-height: 1.65;
  font-style: italic;

  [data-theme='dark'] & {
    color: ${meok[400]};
    border-left-color: rgba(255,255,255,0.1);
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
  const t = useTranslations('kCulture');
  const tp = useTranslations('kCulture.places');
  const [showEvidence, setShowEvidence] = useState(false);
  const { work } = relation;

  const accent = ACCENT_COLOR[work.type] ?? meok[500];

  return (
    <Card $accent={accent}>
      <Header>
        <WorkInfo>
          <WorkTitle href={`/discover/works/${encodeURIComponent(work.workId)}`}>
            {work.canonicalTitle}
          </WorkTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <WorkTypeBadge type={work.type} variant="dark" />
            {work.releaseYear && <YearText>{work.releaseYear}</YearText>}
            <RelationBadge $type={relation.relationType}>
              {t(`relationType.${relation.relationType}`)}
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
            {tp('evidenceCount', { count: relation.evidenceCount })}
          </EvidenceToggle>

          {showEvidence && <EvidenceList evidence={relation.evidence} />}
        </>
      )}
    </Card>
  );
}
