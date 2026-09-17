'use client';

/**
 * 새 계약(exploration.types.ts)의 JourneyCandidate 한 장을 그리는 반복 카드.
 *
 * BentoJourneyGrid.tsx의 고정 4종 카드를 대체할 후보 — 지우지 않고 나란히 추가한다.
 * (seven-day-mvp-fe-handoff.md §6 "고정 4종 Bento 대신 반복 가능한 place card")
 *
 * 의도적으로 border와 box-shadow를 쓰지 않는다. 카드 사이 구분은 여백과 순번 숫자,
 * 상태별 accent rule(유지/제외/추가)로만 만든다 — 전형적인 "AI가 만든 카드"의 신호인
 * 옅은 회색 테두리 + 은은한 그림자 조합을 쓰지 않기로 한 결정이다.
 */

import styled from '@emotion/styled';
import { Check, HelpCircle } from 'lucide-react';
import { meok, palette, fontSize } from '@/design-system/tokens';
import type { JourneyCandidate, PlaceResource } from '../types/exploration.types';

export type PlaceCardState = 'default' | 'pinned' | 'kept' | 'added' | 'removed';

const STATE_LABEL: Record<Exclude<PlaceCardState, 'default'>, string> = {
  pinned: '고정',
  kept: '유지',
  added: '추가',
  removed: '제외',
};

const STATE_ACCENT: Record<Exclude<PlaceCardState, 'default'>, string> = {
  pinned: palette.juhong[500],
  kept: meok[500],
  added: palette.cheongrok[500],
  removed: meok[400],
};

const Card = styled.div<{ $order: number; $muted: boolean }>`
  width: 264px;
  flex-shrink: 0;
  padding: 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  opacity: ${({ $muted }) => ($muted ? 0.5 : 1)};
  transition: opacity 0.2s ease;

  [data-theme='dark'] & {
    color: inherit;
  }
`;

const TopRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
`;

const OrderNumeral = styled.span`
  font-family: var(--font-hanok);
  font-size: ${fontSize['2xl']};
  font-weight: 300;
  color: ${meok[300]};
  line-height: 1;

  [data-theme='dark'] & {
    color: ${meok[700]};
  }
`;

const StateTag = styled.span<{ $color: string }>`
  font-size: ${fontSize.micro};
  font-weight: 600;
  letter-spacing: 0.04em;
  color: ${({ $color }) => $color};
`;

const Title = styled.h3`
  font-family: var(--font-hanok);
  font-size: ${fontSize.lg};
  font-weight: 500;
  letter-spacing: -0.01em;
  color: ${meok[900]};
  margin: 0;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const MetaRow = styled.p`
  font-size: ${fontSize.xs};
  color: ${meok[500]};
  margin: 0;
`;

const Reason = styled.p`
  font-size: ${fontSize.sm};
  line-height: 1.6;
  color: ${meok[700]};
  margin: 0;

  [data-theme='dark'] & {
    color: ${meok[300]};
  }
`;

const CheckList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CheckRow = styled.li<{ $status: 'SATISFIED' | 'VIOLATED' | 'UNKNOWN' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${fontSize.xs};
  color: ${({ $status }) =>
    $status === 'VIOLATED' ? palette.danpung[700] : $status === 'UNKNOWN' ? meok[500] : meok[600]};
`;

const UnavailableNote = styled.p`
  font-size: ${fontSize.micro};
  color: ${meok[400]};
  margin: 0;
`;



const UNAVAILABLE_LABEL: Record<string, string> = {
  OPERATING_HOURS: '운영시간',
  ACCESSIBILITY: '접근성',
};

interface JourneyPlaceCardProps {
  order: number;
  candidate: JourneyCandidate;
  place: PlaceResource;
  regionTitle: string;
  state?: PlaceCardState;
  isPinned?: boolean;
}

export default function JourneyPlaceCard({
  order,
  candidate,
  place,
  regionTitle,
  state = 'default',
  isPinned = false,
}: JourneyPlaceCardProps) {
  const accent = state !== 'default' ? STATE_ACCENT[state] : null;

  return (
    <Card $order={order} $muted={state === 'removed'} style={accent ? { borderLeft: `2px solid ${accent}` } : undefined}>
      <TopRow>
        <OrderNumeral>{String(order).padStart(2, '0')}</OrderNumeral>
        {state !== 'default' && <StateTag $color={STATE_ACCENT[state]}>{STATE_LABEL[state]}</StateTag>}
      </TopRow>

      <div>
        <Title>{place.title}</Title>
        <MetaRow>
          {place.category} · {regionTitle}
        </MetaRow>
      </div>

      <Reason>{candidate.reason}</Reason>

      {candidate.constraintChecks.length > 0 && (
        <CheckList>
          {candidate.constraintChecks.map((c) => (
            <CheckRow key={c.key} $status={c.status}>
              {c.status === 'UNKNOWN' ? <HelpCircle size={12} strokeWidth={2} /> : <Check size={12} strokeWidth={2} />}
              <span>{c.label}</span>
            </CheckRow>
          ))}
        </CheckList>
      )}

      {place.unavailableFields.length > 0 && (
        <UnavailableNote>
          미확인: {place.unavailableFields.map((f) => UNAVAILABLE_LABEL[f] ?? f).join(', ')}
        </UnavailableNote>
      )}


    </Card>
  );
}
