'use client';

/**
 * 아이콘 카탈로그 (개발용, /dev/icons)
 *
 * 프로젝트가 실제로 쓰는 lucide-react 아이콘만 모아 색 / 크기 / 선 두께를 눈으로 고른다.
 *
 * 색 규칙: 아이콘에는 color prop을 주지 않는다.
 * lucide는 stroke가 currentColor라 부모의 color를 그대로 물려받는다.
 * 이 페이지도 그리드 컨테이너의 color 한 줄만 바꾼다.
 *
 * 새 아이콘을 쓰기 시작하면 아래 NAMES 배열에 이름만 추가한다.
 */

import { useState } from 'react';
import styled from '@emotion/styled';
import * as Lucide from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { semanticTokens, palette, meok, surface } from '@/design-system/tokens';

/* ── 1. 이 프로젝트가 쓰는 아이콘 ── */
const NAMES = [
  'AlertCircle', 'ArrowLeftRight', 'ArrowRight', 'ArrowUp', 'Award', 'BookOpen', 'Bookmark',
  'BookmarkCheck', 'Calendar', 'Camera', 'Car', 'Check', 'CheckCircle2', 'ChevronDown',
  'ChevronLeft', 'ChevronRight', 'ChevronUp', 'Clock', 'Cloud', 'CloudRain', 'CloudUpload',
  'Coffee', 'Compass', 'CornerDownLeft', 'Database', 'Download', 'ExternalLink', 'EyeOff',
  'Flame', 'Frown', 'FrownOpen', 'Gauge', 'Globe', 'Headphones', 'Heart', 'Home', 'ImageIcon',
  'Images', 'Inbox', 'Info', 'Landmark', 'Layers', 'LayoutDashboard', 'Leaf', 'List',
  'LocateFixed', 'Lock', 'LogOut', 'Mail', 'Map', 'MapPin', 'Megaphone', 'Meh', 'Menu',
  'MessageCircle', 'Minus', 'Moon', 'MoreHorizontal', 'Music2', 'Navigation', 'Network',
  'Pause', 'PenLine', 'Phone', 'Plane', 'Play', 'Plus', 'RefreshCw', 'RotateCcw', 'Search',
  'Share2', 'ShieldAlert', 'ShoppingBag', 'SkipBack', 'SkipForward', 'Smile', 'SmilePlus',
  'Sparkles', 'Square', 'Star', 'Store', 'Sun', 'Tag', 'Ticket', 'Trash2', 'User', 'UserX',
  'Users', 'Utensils', 'Volume2', 'Wand2', 'X', 'XCircle',
];

const ICONS = Lucide as unknown as Record<string, LucideIcon>;

/* ── 2. 아이콘이 쓸 수 있는 색 = 시맨틱 토큰의 역할 ── */
const t = semanticTokens.light;
const ROLES = [
  { key: 'text.primary', label: '기본', value: t.text.primary },
  { key: 'text.secondary', label: '보조', value: t.text.secondary },
  { key: 'action.primary', label: '주 액션', value: t.action.primary },
  { key: 'nav.primary', label: '내비', value: t.nav.primary },
  { key: 'info.primary', label: '정보', value: t.info.primary },
  { key: 'success.primary', label: '성공', value: t.success.primary },
  { key: 'warning.primary', label: '경고', value: t.warning.primary },
  { key: 'error.primary', label: '에러', value: t.error.primary },
] as const;

const SIZES = [16, 20, 24, 32] as const;
const WEIGHTS = [1.25, 1.5, 1.75, 2] as const;

const Page = styled.main`
  padding: 32px 0 80px;
  font-family: 'Pretendard', 'SpoqaHanSansNeo', -apple-system, sans-serif;
  color: ${meok[900]};
`;

const Title = styled.h1`
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const Lead = styled.p`
  margin: 0 0 20px;
  font-size: 13.5px;
  line-height: 1.65;
  color: ${meok[700]};

  b {
    color: ${palette.juhong[700]};
  }

  code {
    padding: 1px 5px;
    border-radius: 5px;
    background: rgba(25, 31, 40, 0.06);
    font-size: 12.5px;
  }
`;

const Controls = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px 0 14px;
  margin-bottom: 8px;
  background: ${surface.light.base};
  border-bottom: 1px solid rgba(25, 31, 40, 0.08);
`;

const Divider = styled.span`
  width: 1px;
  height: 20px;
  background: rgba(25, 31, 40, 0.12);
`;

const Chip = styled.button<{ $active: boolean; $swatch?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;

  border: 1px solid ${({ $active }) => ($active ? 'transparent' : 'rgba(25, 31, 40, 0.12)')};
  border-radius: 9999px;
  background: ${({ $active }) => ($active ? meok[900] : '#ffffff')};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;

  &::before {
    content: ${({ $swatch }) => ($swatch ? "''" : 'none')};
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${({ $swatch }) => $swatch};
  }
`;

const LibMeta = styled.p`
  margin: 12px 0;
  font-size: 12px;
  color: ${meok[500]};
`;

const Grid = styled.div<{ $color: string }>`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  color: ${({ $color }) => $color};
`;

const Card = styled.div<{ $dark: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 12px 12px;

  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(25, 31, 40, 0.08)')};
  border-radius: 14px;
  background: ${({ $dark }) => ($dark ? surface.dark.card : '#ffffff')};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
`;

const Slot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
`;

const Name = styled.span<{ $dark: boolean }>`
  font-size: 11px;
  font-weight: 600;
  line-height: 1.35;
  text-align: center;
  word-break: break-all;
  color: ${({ $dark }) => ($dark ? meok[200] : meok[700])};
`;

const Empty = styled.span`
  font-size: 11px;
  color: ${meok[400]};
`;

export default function IconCatalogPage() {
  const [role, setRole] = useState<string>(ROLES[0].key);
  const [size, setSize] = useState<number>(24);
  const [weight, setWeight] = useState<number>(2);
  const [dark, setDark] = useState(false);

  const color = ROLES.find((r) => r.key === role)?.value ?? t.text.primary;

  return (
    <Page style={{ background: dark ? surface.dark.app : 'transparent' }}>
      <Title style={{ color: dark ? '#ffffff' : meok[900] }}>아이콘 카탈로그</Title>
      <Lead style={{ color: dark ? meok[200] : meok[700] }}>
        아이콘은 전부 <b>lucide-react</b> 한 곳에서만 온다. 이모지는 쓰지 않는다.
        <br />
        선 전용(<code>fill: none</code>, <code>stroke: currentColor</code>)이라 채움 버전은 없고, 색은
        부모의 <code>color</code>로, 두께는 <code>strokeWidth</code>로 조절한다.
      </Lead>

      <Controls>
        {ROLES.map((r) => (
          <Chip
            key={r.key}
            type="button"
            $active={role === r.key}
            $swatch={r.value}
            onClick={() => setRole(r.key)}
            title={`theme.colors.${r.key}`}
          >
            {r.label}
          </Chip>
        ))}

        <Divider />

        {SIZES.map((s) => (
          <Chip key={s} type="button" $active={size === s} onClick={() => setSize(s)}>
            {s}
          </Chip>
        ))}

        <Divider />

        {WEIGHTS.map((w) => (
          <Chip
            key={w}
            type="button"
            $active={weight === w}
            onClick={() => setWeight(w)}
            title="strokeWidth"
          >
            {w}
          </Chip>
        ))}

        <Divider />

        <Chip type="button" $active={dark} onClick={() => setDark((v) => !v)}>
          어두운 배경
        </Chip>
      </Controls>

      <LibMeta>lucide-react · {NAMES.length}개</LibMeta>

      <Grid $color={color}>
        {NAMES.map((name) => {
          const Icon = ICONS[name];
          return (
            <Card key={name} $dark={dark}>
              <Slot>{Icon ? <Icon size={size} strokeWidth={weight} /> : <Empty>없음</Empty>}</Slot>
              <Name $dark={dark}>{name}</Name>
            </Card>
          );
        })}
      </Grid>
    </Page>
  );
}
