'use client';

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight01Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClapperboardIcon,
  ShieldCheckIcon,
} from '@hugeicons/core-free-icons';
import { meok, lightPalette, ringShadow, fontSize } from '@/design-system/tokens';
import WorkTypeBadge from './WorkTypeBadge';
import EvidenceList from './EvidenceList';
import type { KContentRelation, RelationType, WorkType } from '../../domain/types';

const WORK_ACCENT: Record<WorkType, string> = {
  DRAMA: lightPalette.juhong[500],
  MOVIE: lightPalette.kobalt[500],
  MUSIC_VIDEO: lightPalette.jaha[500],
  ARTIST: lightPalette.jaha[500],
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
  overflow: hidden;
  box-shadow: ${ringShadow.light.cardElevated};

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${({ $accent }) => $accent};
  }

  [data-theme='dark'] & {
    background: #1e2330;
    box-shadow: ${ringShadow.dark.cardElevated};
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
`;

const WorkInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const WorkTitleLink = styled(Link)`
  font-family: var(--font-hanok);
  font-size: ${fontSize.base};
  font-weight: 700;
  color: ${meok[900]};
  text-decoration: none;
  letter-spacing: -0.02em;
  line-height: 1.25;
  transition: color 0.14s ease;

  &:hover {
    color: ${lightPalette.juhong[600]};
  }

  [data-theme='dark'] & {
    color: ${meok[100]};

    &:hover {
      color: ${lightPalette.juhong[400]};
    }
  }
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const YearText = styled.span`
  font-size: ${fontSize.xs};
  color: ${meok[500]};
`;

const VerifiedPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  color: ${lightPalette.cheongrok[700]};

  [data-theme='dark'] & {
    color: ${lightPalette.cheongrok[400]};
  }
`;

const WorkCtaLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  background: #f5f5f4;
  color: ${meok[700]};
  font-size: 11px;
  font-weight: 600;
  text-decoration: none;
  flex-shrink: 0;
  transition: background 0.14s ease, color 0.14s ease;

  &:hover {
    background: #e5e5e3;
    color: ${meok[900]};
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.07);
    color: rgba(255, 255, 255, 0.78);

    &:hover {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
    }
  }
`;

const SceneCallout = styled.div<{ $accent: string }>`
  padding: 12px 14px;
  border-radius: 10px;
  background: #f5f5f4;
  border-left: 3px solid ${({ $accent }) => $accent};
  display: flex;
  flex-direction: column;
  gap: 6px;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.04);
  }
`;

const SceneLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.45);
  }
`;

const ContextText = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[700]};
  margin: 0;
  line-height: 1.65;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.78);
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
  background: #f5f5f4;
  color: ${meok[600]};
  font-size: 11px;
  font-weight: 500;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.07);
    color: rgba(255, 255, 255, 0.65);
  }
`;

const EvidenceToggle = styled.button`
  display: inline-flex;
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

function formatVerifiedDate(isoDate: string, locale: string): string | null {
  if (!isoDate) return null;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
    }).format(parsed);
  } catch {
    return null;
  }
}

export interface KContentRelationCardProps {
  relation: KContentRelation;
}

export default function KContentRelationCard({ relation }: KContentRelationCardProps) {
  const t = useTranslations('kCulture');
  const locale = useLocale();
  const [showEvidence, setShowEvidence] = useState(false);
  const { work } = relation;
  const accent = WORK_ACCENT[work.type] ?? lightPalette.juhong[500];
  const verifiedDate = formatVerifiedDate(relation.verifiedAt, locale);

  return (
    <Card $accent={accent}>
      <Header>
        <WorkInfo>
          <WorkTitleLink href={`/discover/works/${encodeURIComponent(work.workId)}`}>
            {work.canonicalTitle}
          </WorkTitleLink>
          <MetaRow>
            <WorkTypeBadge type={work.type} variant="dark" />
            {work.releaseYear && <YearText>{work.releaseYear}</YearText>}
            <RelationBadge $type={relation.relationType}>
              {t(`relationType.${relation.relationType}`)}
            </RelationBadge>
            {verifiedDate && (
              <VerifiedPill>
                <HugeiconsIcon icon={ShieldCheckIcon} size={12} strokeWidth={2} aria-hidden="true" />
                {t('sceneCard.verifiedLabel')} · {verifiedDate}
              </VerifiedPill>
            )}
          </MetaRow>
        </WorkInfo>

        <WorkCtaLink href={`/discover/works/${encodeURIComponent(work.workId)}`}>
          {t('sceneCard.viewWorkDetail')}
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} strokeWidth={2.2} aria-hidden="true" />
        </WorkCtaLink>
      </Header>

      {relation.contextSummary && (
        <SceneCallout $accent={accent}>
          <SceneLabel>
            <HugeiconsIcon icon={ClapperboardIcon} size={12} strokeWidth={2} aria-hidden="true" />
            {t('sceneCard.sceneContextLabel')}
          </SceneLabel>
          <ContextText>{relation.contextSummary}</ContextText>
        </SceneCallout>
      )}

      {relation.relationTags.length > 0 && (
        <TagRow>
          {relation.relationTags.map((tag) => (
            <Tag key={tag}>#{tag}</Tag>
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
            {t('places.evidenceCount', { count: relation.evidenceCount })}
          </EvidenceToggle>

          {showEvidence && <EvidenceList evidence={relation.evidence} />}
        </>
      )}
    </Card>
  );
}
