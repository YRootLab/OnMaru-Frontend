'use client';

import { useState } from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import * as HugeIcons from '@hugeicons/core-free-icons';
import { semanticTokens, palette, meok, surface, fontSize } from '@/design-system/tokens';

const NAMES = [
  'Activity01Icon', 'AlertCircleIcon', 'AngryIcon', 'Airplane01Icon', 'ArrowExpand01Icon',
  'ArrowLeft01Icon', 'ArrowLeftRightIcon', 'ArrowRight01Icon', 'ArrowShrink01Icon',
  'ArrowUp01Icon', 'ArrowUpRight01Icon', 'Award01Icon', 'BookmarkCheck01Icon',
  'Bookmark01Icon', 'BookOpen01Icon', 'BotIcon', 'Building01Icon', 'Calendar01Icon',
  'CalendarDaysIcon', 'Camera01Icon', 'Car01Icon', 'Cancel01Icon', 'CancelCircleIcon',
  'CheckIcon', 'CheckmarkCircle01Icon', 'ChevronDownIcon', 'ChevronLeftIcon',
  'ChevronRightIcon', 'ChevronUpIcon', 'ClapperboardIcon', 'Clock01Icon', 'CloudIcon',
  'CloudRainIcon', 'CloudUploadIcon', 'CodeIcon', 'Coffee01Icon', 'Compass01Icon',
  'Copy01Icon', 'CornerDownLeftIcon', 'CrownIcon', 'DashboardCircleIcon',
  'Database01Icon', 'Download01Icon', 'ExternalLinkIcon', 'EyeOffIcon',
  'FileTextIcon', 'Film01Icon', 'FlameIcon', 'Flower01Icon', 'FrownIcon',
  'Gamepad01Icon', 'GaugeIcon', 'GlobeIcon', 'GridViewIcon', 'HashtagIcon',
  'HeadphonesIcon', 'HeartIcon', 'HelpCircleIcon', 'Home01Icon', 'Image01Icon',
  'Image02Icon', 'InboxIcon', 'InformationCircleIcon', 'LandmarkIcon', 'Layers01Icon',
  'Leaf01Icon', 'ListIcon', 'LoaderCircleIcon', 'LocateFixedIcon', 'LockIcon',
  'Logout01Icon', 'MagicWand01Icon', 'Mail01Icon', 'MapIcon', 'MapPinIcon',
  'Medal01Icon', 'Megaphone01Icon', 'MehIcon', 'Menu01Icon', 'MessageCircleIcon',
  'MinusSignIcon', 'Moon01Icon', 'MoreHorizontalIcon', 'Music01Icon', 'Music02Icon',
  'Navigation01Icon', 'NetworkIcon', 'PauseIcon', 'PenLineIcon', 'PhoneIcon',
  'PlayIcon', 'PlusSignIcon', 'RefreshCwIcon', 'RotateCcwIcon', 'RotateCwIcon',
  'Route01Icon', 'Search01Icon', 'Share01Icon', 'ShieldAlertIcon', 'ShieldCheckIcon',
  'ShoppingBag01Icon', 'SkipBackIcon', 'SkipForwardIcon', 'SmileIcon', 'SmilePlusIcon',
  'SnowflakeIcon', 'SparklesIcon', 'SproutIcon', 'SquareIcon', 'Store01Icon',
  'Sun01Icon', 'SunMediumIcon', 'Sword01Icon', 'Tag01Icon', 'Ticket01Icon',
  'Timer01Icon', 'TrashIcon', 'TrophyIcon', 'UserCheck01Icon', 'UserIcon',
  'UsersIcon', 'UserXIcon', 'UtensilsIcon', 'VolumeHighIcon', 'WindIcon',
  'ZoomInIcon',
];

const ICONS = HugeIcons as unknown as Record<string, unknown>;

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
  font-family: 'Spoqa Han Sans Neo', -apple-system, sans-serif;
  color: ${meok[900]};
`;

const Title = styled.h1`
  margin: 0 0 6px;
  font-size: ${fontSize['2xl']};
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const Lead = styled.p`
  margin: 0 0 20px;
  font-size: ${fontSize.sm};
  line-height: 1.65;
  color: ${meok[700]};

  b {
    color: ${palette.juhong[700]};
  }

  code {
    padding: 1px 5px;
    border-radius: 5px;
    background: rgba(25, 31, 40, 0.06);
    font-size: ${fontSize.xs};
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
  font-size: ${fontSize.xs};
  font-weight: 500;
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
  font-size: ${fontSize.xs};
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

const IconName = styled.span<{ $dark: boolean }>`
  font-size: ${fontSize.micro};
  font-weight: 500;
  line-height: 1.35;
  text-align: center;
  word-break: break-all;
  color: ${({ $dark }) => ($dark ? meok[200] : meok[700])};
`;

const Empty = styled.span`
  font-size: ${fontSize.micro};
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
        아이콘은 전부 <b>@hugeicons/core-free-icons</b> 한 곳에서만 온다. 이모지는 쓰지 않는다.
        <br />
        <code>HugeiconsIcon</code> 컴포넌트로 렌더링하며, 색은 <code>color</code> 혹은 부모의{' '}
        <code>color</code>로, 두께는 <code>strokeWidth</code>로 조절한다.
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

      <LibMeta>@hugeicons/core-free-icons · {NAMES.length}개</LibMeta>

      <Grid $color={color}>
        {NAMES.map((name) => {
          const iconData = ICONS[name];
          return (
            <Card key={name} $dark={dark}>
              <Slot>
                {iconData
                  ? <HugeiconsIcon icon={iconData as Parameters<typeof HugeiconsIcon>[0]['icon']} size={size} strokeWidth={weight} color={color} />
                  : <Empty>없음</Empty>
                }
              </Slot>
              <IconName $dark={dark}>{name}</IconName>
            </Card>
          );
        })}
      </Grid>
    </Page>
  );
}
