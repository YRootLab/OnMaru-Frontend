'use client';

import { memo, useEffect, useRef } from 'react';
import Image from 'next/image';
import styled from '@emotion/styled';
import { Landmark, Home, Utensils, Coffee, ShoppingBag } from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';
import type { Item, PlaceCategory } from '../types';

interface PlaceListItemProps {
  item: Item;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (item: Item) => void;
  onHover: (id: string | null) => void;
}

const ItemContainer = styled.li`
  padding: 3px 8px;
`;

const ItemButton = styled.button<{ $isSelected: boolean }>`
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: none;
  border-radius: 16px;
  background: ${({ $isSelected }) =>
    $isSelected ? 'rgba(40, 110, 95, 0.08)' : 'transparent'};
  text-align: left;
  cursor: pointer;
  outline: none;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ $isSelected }) =>
      $isSelected ? 'rgba(40, 110, 95, 0.1)' : 'rgba(25, 31, 40, 0.04)'};
  }

  &:active {
    transform: scale(0.985);
  }

  &:focus-visible {
    background: rgba(40, 110, 95, 0.08);
  }
`;

const ThumbnailBox = styled.div`
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  border-radius: 14px;
  overflow: hidden;
  background: #f0eae0;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 1023px) {
    width: 64px;
    height: 64px;
  }
`;

const FallbackIconWrapper = styled.div`
  color: ${meok[400]};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
`;

const Row1 = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const Title = styled.h4`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: ${meok[900]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
`;

const IndexNumber = styled.span`
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: ${meok[400]};
  font-variant-numeric: tabular-nums;
`;

const Row2 = styled.div`
  font-size: 12px;
  color: ${meok[500]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
`;

const Row3 = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${lightPalette.cheongrok[700]};
  font-variant-numeric: tabular-nums;
  margin-top: 2px;
`;

const BadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  overflow: hidden;
`;

const Badge = styled.span`
  padding: 2px 7px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
  color: ${meok[700]};
  background: rgba(78, 89, 104, 0.07);
  white-space: nowrap;
`;

/** 카테고리별 한글 명칭 */
const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  spot: '한옥명소',
  stay: '한옥숙박',
  food: '전통음식점',
  cafe: '카페·찻집',
  market: '전통시장·쇼핑',
};

/** 카테고리별 SVG 폴백 아이콘 렌더링 */
function renderCategoryIcon(category: PlaceCategory) {
  switch (category) {
    case 'spot':
      return <Landmark size={24} />;
    case 'stay':
      return <Home size={24} />;
    case 'food':
      return <Utensils size={24} />;
    case 'cafe':
      return <Coffee size={24} />;
    case 'market':
      return <ShoppingBag size={24} />;
    default:
      return <Landmark size={24} />;
  }
}

/** 주소에서 시/구 추출 */
function getDistrictFromAddr(addr?: string): string {
  if (!addr) return '';
  const parts = addr.split(' ');
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`.replace(/특별자치도|특별자치시|광역시|도/g, '');
  }
  return addr;
}

/** 거리 포맷팅 (1000m 미만 "320m", 이상 "2.4km") */
function formatDistance(dist?: number | null): string {
  if (dist === null || dist === undefined || !Number.isFinite(dist)) return '';
  if (dist < 1000) return `${Math.round(dist)}m`;
  return `${(dist / 1000).toFixed(1)}km`;
}

/** 뱃지 태그 추출 (최대 2개) */
function getBadges(item: Item): string[] {
  const badges: string[] = [];
  if (item.category === 'stay') badges.push('한옥스테이');
  else if (item.category === 'cafe') badges.push('전통차');
  else if (item.category === 'food') badges.push('향토음식');
  else badges.push('문화유산');

  if (item.tel) badges.push('안내가능');
  return badges.slice(0, 2);
}

function PlaceListItemComponent({
  item,
  index,
  isSelected,
  onSelect,
  onHover,
}: PlaceListItemProps) {
  const itemRef = useRef<HTMLLIElement>(null);

  // 지도 마커 클릭 등으로 선택되었을 때 리스트 항목 자동 스크롤
  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected]);

  const catLabel = CATEGORY_LABELS[item.category] || '한옥명소';
  const district = getDistrictFromAddr(item.addr);
  const distText = formatDistance(item.dist);
  const badges = getBadges(item);

  return (
    <ItemContainer ref={itemRef}>
      <ItemButton
        type="button"
        $isSelected={isSelected}
        onClick={() => onSelect(item)}
        onMouseEnter={() => onHover(item.id)}
        onMouseLeave={() => onHover(null)}
        aria-current={isSelected ? 'true' : undefined}
        aria-expanded={isSelected}
      >
        <ThumbnailBox>
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="72px"
              style={{ objectFit: 'cover' }}
              unoptimized
            />
          ) : (
            <FallbackIconWrapper>
              {renderCategoryIcon(item.category)}
            </FallbackIconWrapper>
          )}
        </ThumbnailBox>

        <Content>
          <Row1>
            <Title title={item.name}>{item.name}</Title>
            <IndexNumber>{index + 1}</IndexNumber>
          </Row1>

          <Row2 title={`${catLabel} · ${district}`}>
            {catLabel} {district ? `· ${district}` : ''}
          </Row2>

          {distText && <Row3>{distText}</Row3>}

          <BadgeRow>
            {badges.map((badge, idx) => (
              <Badge key={idx}>{badge}</Badge>
            ))}
          </BadgeRow>
        </Content>
      </ItemButton>
    </ItemContainer>
  );
}

export const PlaceListItem = memo(PlaceListItemComponent);
