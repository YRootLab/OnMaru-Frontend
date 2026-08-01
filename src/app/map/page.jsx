'use client';

/*
  =============================================================
  ⚠️ [주의 / NOTICE] 여 기 는  임 시  파 일 입 니 다 !
  =============================================================
  - 이 라우트 페이지(/map/page.jsx)는 지도 탐색 임시 프로토타입 페이지입니다.
  - 추후 정식 지도 서비스 연동 개발 시 수정을 하거나 대체될 수 있습니다.
  =============================================================
*/

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import styled from '@emotion/styled';

import { lightPalette, meok } from '@/design-system/tokens';
import STAYS from '@/data/hanokStays.json';

const FONT = "'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * Leaflet은 window를 직접 만진다. 서버에서 한 번이라도 그리면 그 자리에서 터지므로
 * 브라우저에서만 불러온다. (이 파일이 클라이언트 컴포넌트여야 ssr:false를 쓸 수 있다.)
 */
const HanokMap = dynamic(() => import('@/components/map/HanokMap'), {
  ssr: false,
  loading: () => <MapPlaceholder>지도를 불러오는 중…</MapPlaceholder>,
});

const ALL = '전체';

const Page = styled.main`
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-columns: minmax(280px, 340px) 1fr;
  font-family: ${FONT};
  background: #faf6ef;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }
`;

const Panel = styled.aside`
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid rgba(78, 89, 104, 0.14);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);

  @media (max-width: 900px) {
    grid-row: 2;
    max-height: 46vh;
    border-right: none;
    border-top: 1px solid rgba(78, 89, 104, 0.14);
  }
`;

const PanelHead = styled.header`
  padding: 20px 22px 14px;
  border-bottom: 1px solid rgba(78, 89, 104, 0.1);
`;

const BackLink = styled(Link)`
  display: inline-block;
  margin-bottom: 14px;
  font-size: 13px;
  font-weight: 500;
  color: ${meok[500]};
  text-decoration: none;

  &:hover {
    color: ${meok[700]};
  }

  &:focus-visible {
    outline: 2px solid ${lightPalette.juhong[500]};
    outline-offset: 3px;
    border-radius: 4px;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${meok[900]};
`;

const Count = styled.p`
  margin: 6px 0 0;
  font-size: 13px;
  color: ${meok[500]};

  b {
    color: ${lightPalette.juhong[500]};
    font-variant-numeric: tabular-nums;
  }
`;

/**
 * 데이터 출처를 화면에 그대로 적는다.
 * TourAPI 키가 붙기 전까지는 실측 숙소 목록이 아니라 공개된 한옥마을·고택 좌표다.
 */
const SourceBadge = styled.p`
  margin: 10px 0 0;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(245, 166, 35, 0.12);
  font-size: 11px;
  line-height: 1.5;
  color: #7a4c04;
  word-break: keep-all;
`;

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 14px 22px;
`;

const Chip = styled.button`
  padding: 5px 12px;
  border-radius: 9999px;
  border: 1px solid rgba(78, 89, 104, 0.2);
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  color: ${meok[700]};
  cursor: pointer;
  transition: background 0.2s ease-out;

  &:hover {
    background: rgba(25, 31, 40, 0.04);
  }

  &[aria-pressed='true'] {
    border-color: ${lightPalette.juhong[500]};
    background: rgba(232, 90, 24, 0.08);
    color: ${lightPalette.juhong[500]};
  }

  &:focus-visible {
    outline: 2px solid ${lightPalette.juhong[500]};
    outline-offset: 2px;
  }
`;

const List = styled.ul`
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0 12px 20px;
  overflow-y: auto;
  list-style: none;
`;

const Item = styled.li`
  & + & {
    margin-top: 2px;
  }
`;

const ItemButton = styled.button`
  width: 100%;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease-out;

  &:hover {
    background: rgba(25, 31, 40, 0.04);
  }

  &[aria-current='true'] {
    background: rgba(232, 90, 24, 0.08);
  }

  &:focus-visible {
    outline: 2px solid ${lightPalette.juhong[500]};
    outline-offset: -2px;
  }
`;

const ItemName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${meok[900]};
`;

const ItemRegion = styled.span`
  flex: none;
  font-size: 12px;
  color: ${meok[500]};
`;

const Empty = styled.p`
  margin: 24px 12px;
  font-size: 13px;
  color: ${meok[500]};
  text-align: center;
`;

const MapArea = styled.div`
  position: relative;
  min-height: 0;

  @media (max-width: 900px) {
    grid-row: 1;
  }
`;

const MapPlaceholder = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f2ece1;
  font-family: ${FONT};
  font-size: 13px;
  color: ${meok[500]};
`;

export default function MapPage() {
  const [region, setRegion] = useState(ALL);
  const [activeId, setActiveId] = useState(null);

  const regions = useMemo(
    () => [ALL, ...new Set(STAYS.items.map((place) => place.region))],
    [],
  );

  const places = useMemo(
    () => (region === ALL ? STAYS.items : STAYS.items.filter((p) => p.region === region)),
    [region],
  );

  const pick = (id) => setActiveId((current) => (current === id ? null : id));

  return (
    <Page>
      <Panel>
        <PanelHead>
          <BackLink href="/">← 온마루</BackLink>

          <Title>한옥 지도</Title>
          <Count>
            <b>{places.length}</b>곳 {region === ALL ? '전국' : region}
          </Count>

          <SourceBadge>
            샘플 데이터 — 공개된 한옥마을·고택의 근사 좌표입니다. 한국관광공사 TourAPI 키를 연결하면
            실제 숙소 목록으로 바뀝니다.
          </SourceBadge>
        </PanelHead>

        <Filters role="group" aria-label="지역 필터">
          {regions.map((name) => (
            <Chip
              key={name}
              type="button"
              aria-pressed={region === name}
              onClick={() => {
                setRegion(name);
                setActiveId(null);
              }}
            >
              {name}
            </Chip>
          ))}
        </Filters>

        {places.length === 0 ? (
          <Empty>이 지역에는 아직 등록된 곳이 없습니다.</Empty>
        ) : (
          <List>
            {places.map((place) => (
              <Item key={place.id}>
                <ItemButton
                  type="button"
                  aria-current={place.id === activeId}
                  onClick={() => pick(place.id)}
                >
                  <ItemName>{place.name}</ItemName>
                  <ItemRegion>{place.region}</ItemRegion>
                </ItemButton>
              </Item>
            ))}
          </List>
        )}
      </Panel>

      <MapArea>
        <HanokMap places={places} activeId={activeId} onSelect={pick} />
      </MapArea>
    </Page>
  );
}
