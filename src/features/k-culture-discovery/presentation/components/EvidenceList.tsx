'use client';

import React from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import { ExternalLinkIcon, ShieldCheckIcon } from '@hugeicons/core-free-icons';
import { meok, lightPalette, fontSize } from '@/design-system/tokens';
import type { Evidence } from '../../domain/types';

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Item = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 8px;
`;

const IconWrap = styled.span`
  flex-shrink: 0;
  margin-top: 2px;
  color: ${lightPalette.cheongrok[600]};
`;

const SourceLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: ${fontSize.xs};
  color: ${meok[600]};
  text-decoration: none;
  transition: color 0.15s ease;
  min-width: 0;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    color: ${lightPalette.kobalt[600]};
    text-decoration: underline;
  }

  [data-theme='dark'] & {
    color: ${meok[400]};
    &:hover {
      color: ${lightPalette.kobalt[400]};
    }
  }
`;

const SourceMeta = styled.span`
  flex-shrink: 0;
  font-size: 11px;
  color: ${meok[400]};
`;

export interface EvidenceListProps {
  evidence: Evidence[];
}

export default function EvidenceList({ evidence }: EvidenceListProps) {
  if (evidence.length === 0) return null;

  return (
    <List aria-label="근거 출처 목록">
      {evidence.map((ev, i) => (
        <Item key={i}>
          <IconWrap>
            <HugeiconsIcon icon={ShieldCheckIcon} size={13} strokeWidth={2} aria-hidden="true" />
          </IconWrap>
          <SourceLink
            href={ev.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{ev.sourceTitle}</span>
            <HugeiconsIcon icon={ExternalLinkIcon} size={11} strokeWidth={2} aria-hidden="true" />
          </SourceLink>
          {ev.publisherName && <SourceMeta>— {ev.publisherName}</SourceMeta>}
        </Item>
      ))}
    </List>
  );
}
