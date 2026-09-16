'use client';

/**
 * PDF 저장 — fe-experience-api-implementation-report.md §11.
 * 서버 PDF 생성기 없이 인쇄 전용 레이아웃 + window.print()만 쓴다.
 *
 * 포함: 여정 제목, 생성일, 장소 순서, 상대 거리, 연결 이유, 출처, "직선거리 기준" 표시.
 * 제외: 사용자 질문 원문, 회원 정보, pending proposal(에초에 explorationBoard만 읽는다).
 *
 * 화면에서는 항상 display:none이고 @media print에서만 나타난다. 나머지 페이지는
 * JourneyPrintStyles(Global)가 인쇄 시 가려준다.
 */

import styled from '@emotion/styled';
import { DISTANCE_BAND_CONNECTOR_PX } from '../types/exploration.types';
import type { JourneyBoard, PlaceResource } from '../types/exploration.types';

const PrintWrap = styled.div`
  display: none;

  @media print {
    display: block;
    padding: 0;
    color: #000;
    font-family: 'Spoqa Han Sans Neo', sans-serif;
  }
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 4px;
`;

const Meta = styled.p`
  font-size: 11px;
  color: #555;
  margin: 0 0 20px;
`;

const Stop = styled.div`
  padding: 10px 0;
  border-top: 1px solid #ccc;
  break-inside: avoid;
`;

const StopHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const StopOrder = styled.span`
  font-size: 13px;
  font-weight: 700;
`;

const StopTitle = styled.span`
  font-size: 14px;
  font-weight: 700;
`;

const StopMeta = styled.span`
  font-size: 10.5px;
  color: #666;
`;

const Reason = styled.p`
  font-size: 11.5px;
  line-height: 1.6;
  margin: 4px 0;
`;

const Source = styled.p`
  font-size: 10px;
  color: #777;
  margin: 0;
`;

const LegLabel = styled.p`
  font-size: 10.5px;
  color: #444;
  margin: 6px 0 0 12px;
  border-left: 2px dotted #999;
  padding-left: 8px;
`;

const Footer = styled.p`
  margin-top: 20px;
  font-size: 10px;
  color: #888;
  border-top: 1px solid #ccc;
  padding-top: 10px;
`;

function findPlace(board: JourneyBoard, id: string): PlaceResource | undefined {
  return board.resources.find((r): r is PlaceResource => r.ref.type === 'PLACE' && r.ref.id === id);
}

function distanceLabel(meters: number | null): string {
  if (meters == null) return '거리 미확인';
  return meters >= 1000 ? `직선 약 ${(meters / 1000).toFixed(1)}km` : `직선 약 ${meters}m`;
}

interface JourneyPrintViewProps {
  board: JourneyBoard;
  createdAt: string | null;
}

export default function JourneyPrintView({ board, createdAt }: JourneyPrintViewProps) {
  const printedAt = createdAt
    ? new Date(createdAt).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })
    : '';

  return (
    <PrintWrap className="journey-print-view">
      <Title>{board.title}</Title>
      <Meta>생성일 {printedAt || '미확인'}</Meta>

      {board.candidates.map((candidate, idx) => {
        const place = findPlace(board, candidate.placeRef.id);
        if (!place) return null;
        const leg = board.legs.find((l) => l.order === idx + 1 && l.fromRef.id === place.ref.id);
        const evidence = board.evidence.filter((e) => candidate.evidenceRefs.includes(e.id));

        return (
          <div key={place.ref.id}>
            <Stop>
              <StopHeader>
                <StopOrder>{idx + 1}.</StopOrder>
                <StopTitle>{place.title}</StopTitle>
                <StopMeta>{place.category}</StopMeta>
              </StopHeader>
              <Reason>{candidate.reason}</Reason>
              {evidence.map((e) => (
                <Source key={e.id}>
                  출처: {e.sourceName}
                  {e.asOf ? ` (${e.asOf} 기준)` : ''}
                </Source>
              ))}
            </Stop>
            {leg && (
              <LegLabel>
                ↓ {distanceLabel(leg.distanceMeters)} ({DISTANCE_BAND_CONNECTOR_PX[leg.distanceBand] ? leg.distanceBand : 'UNKNOWN'})
              </LegLabel>
            )}
          </div>
        );
      })}

      <Footer>
        장소 간 거리는 좌표 기준 직선거리 기준이며, 실제 도보 경로나 소요시간이 아닙니다. 온마루 이야기길.
      </Footer>
    </PrintWrap>
  );
}
