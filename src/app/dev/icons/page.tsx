'use client';

/**
 * 아이콘 카탈로그 (개발용, /dev/icons)
 *
 * 프로젝트가 실제로 쓰는 아이콘만 모아 선(Outline)/채움(Solid) 두 버전을 나란히 본다.
 * 기존 사용처 코드는 건드리지 않는다 — 여기는 눈으로 고르기 위한 화면이다.
 *
 * 색 규칙: 아이콘에는 color prop을 주지 않는다.
 * react-icons는 stroke/fill이 currentColor라 부모의 color를 그대로 물려받는다.
 * 이 페이지도 그리드 컨테이너의 color 한 줄만 바꾼다.
 *
 * 새 아이콘을 쓰기 시작하면 아래 names 배열에 이름만 추가한다.
 */

import { useState } from 'react';
import styled from '@emotion/styled';
import type { IconType } from 'react-icons';
import * as Io5 from 'react-icons/io5';
import * as Ri from 'react-icons/ri';
import * as Tb from 'react-icons/tb';
import { semanticTokens, palette, meok, surface } from '@/design-system/tokens';

type IconModule = Record<string, IconType>;

/* ── 1. 이 프로젝트가 쓰는 아이콘 ── */
const REGISTRY: { pkg: string; mod: IconModule; names: string[] }[] = [
  {
    pkg: 'react-icons/io5',
    mod: Io5 as unknown as IconModule,
    names: [
      'IoAddOutline', 'IoAirplaneOutline', 'IoAlertCircleOutline', 'IoArrowForwardOutline',
      'IoArrowUpOutline', 'IoBagHandleOutline', 'IoBookOutline', 'IoBookmark',
      'IoBookmarkOutline', 'IoCafeOutline', 'IoCalendar', 'IoCalendarOutline',
      'IoCallOutline', 'IoCameraOutline', 'IoCarOutline', 'IoChatbubbleEllipsesOutline',
      'IoCheckmarkOutline', 'IoChevronBackOutline', 'IoChevronDownOutline',
      'IoChevronForwardOutline', 'IoChevronUpOutline', 'IoCloseOutline', 'IoCloudOutline',
      'IoCompassOutline', 'IoCreateOutline', 'IoFlame', 'IoGitNetworkOutline',
      'IoGlobeOutline', 'IoHeadsetOutline', 'IoHeart', 'IoHeartOutline', 'IoHomeOutline',
      'IoImagesOutline', 'IoInformationCircleOutline', 'IoLeaf', 'IoLeafOutline',
      'IoListOutline', 'IoLocateOutline', 'IoLocationOutline', 'IoMapOutline',
      'IoMegaphoneOutline', 'IoMenuOutline', 'IoMoonOutline', 'IoMusicalNotesOutline',
      'IoNavigateOutline', 'IoOpenOutline', 'IoPause', 'IoPeople', 'IoPeopleOutline',
      'IoPersonOutline', 'IoPlay', 'IoPlayBackOutline', 'IoPlayForwardOutline',
      'IoRainyOutline', 'IoReloadOutline', 'IoRemoveOutline', 'IoRestaurantOutline',
      'IoReturnDownBackOutline', 'IoRibbonOutline', 'IoSearchOutline',
      'IoShareSocialOutline', 'IoSparklesOutline', 'IoStorefrontOutline', 'IoSunnyOutline',
      'IoTicketOutline', 'IoTimeOutline', 'IoTrailSignOutline', 'IoVolumeMediumOutline',
    ],
  },
  {
    pkg: 'react-icons/ri',
    mod: Ri as unknown as IconModule,
    names: [
      'RiEmotionHappyLine', 'RiEmotionLaughLine', 'RiEmotionNormalLine',
      'RiEmotionSadLine', 'RiEmotionUnhappyLine',
    ],
  },
  {
    /**
     * Tabler — 부위별로 <path>를 따로 그린다. io5는 그림 전체가 path 하나라 부위 분리가 안 된다.
     * 그래서 투톤(종이 따로, 손잡이 따로)이 되는 건 이 섹션뿐이다.
     * 아래 목록은 지금 io5로 쓰고 있는 아이콘들의 Tabler 대응. 교체가 아니라 비교용이다.
     */
    pkg: 'react-icons/tb',
    mod: Tb as unknown as IconModule,
    names: [
      'TbAlertCircle', 'TbArrowRight', 'TbArrowUp', 'TbAward', 'TbBinaryTree', 'TbBook',
      'TbBookmark', 'TbBuildingPavilion', 'TbBuildingStore', 'TbCalendar', 'TbCamera', 'TbCar',
      'TbCheck', 'TbChevronDown', 'TbChevronLeft', 'TbChevronRight', 'TbChevronUp', 'TbClock',
      'TbCloud', 'TbCloudRain', 'TbCoffee', 'TbCompass', 'TbCornerDownLeft', 'TbCurrentLocation',
      'TbExternalLink', 'TbFlame', 'TbHeadphones', 'TbHeart', 'TbHierarchy', 'TbHome',
      'TbInfoCircle', 'TbLeaf', 'TbList', 'TbMap', 'TbMapPin', 'TbMenu2', 'TbMessage',
      'TbMessageDots', 'TbMinus', 'TbMoodConfuzed', 'TbMoodHappy', 'TbMoodNeutral', 'TbMoodSad',
      'TbMoodSmile', 'TbMoon', 'TbMusic', 'TbNavigation', 'TbPencil', 'TbPhone', 'TbPhoto',
      'TbPlane', 'TbPlayerPause', 'TbPlayerPlay', 'TbPlayerTrackNext', 'TbPlayerTrackPrev',
      'TbPlus', 'TbRefresh', 'TbRoute', 'TbSearch', 'TbShare', 'TbShoppingBag', 'TbSparkles',
      'TbSpeakerphone', 'TbSun', 'TbTag', 'TbTicket', 'TbToolsKitchen2', 'TbTorii', 'TbUser',
      'TbUsers', 'TbVolume', 'TbWorld', 'TbX',
    ],
  },
];

/* ── 1-2. 투톤 악센트로 쓸 7대 계열 ── */
const FAMILIES = [
  { key: 'danpung', label: '단풍' },
  { key: 'juhong', label: '주홍' },
  { key: 'hwanggeum', label: '황금' },
  { key: 'cheongrok', label: '청록' },
  { key: 'kobalt', label: '코발트' },
  { key: 'jaha', label: '자하' },
  { key: 'jangmi', label: '연지' },
] as const satisfies readonly { key: keyof typeof palette; label: string }[];

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

function getIconPalette(name: string): { color: string; accent: string } {
  if (/Bag|Shop|Cart|Box|Package/i.test(name)) return { color: '#FF6F0F', accent: '#FF9F2F' };
  if (/Home|Pavilion/i.test(name)) return { color: '#DF5BC1', accent: '#CC25A8' };
  if (/Building|Bank|Torii/i.test(name)) return { color: '#2563EB', accent: '#1D4ED8' };
  if (/Car|Plane|Airplane|Truck/i.test(name)) return { color: '#308EFF', accent: '#126BE1' };
  if (/Cafe|Coffee|Mug|Cup/i.test(name)) return { color: '#D97706', accent: '#B45309' };
  if (/Restaurant|Kitchen|Food|Fork|Dish|Pizza/i.test(name)) return { color: '#EA580C', accent: '#C2410C' };
  if (/Tree|Leaf|Clover|Apple/i.test(name)) return { color: '#16A34A', accent: '#15803D' };
  if (/Sun|Sunny/i.test(name)) return { color: '#F59E0B', accent: '#D97706' };
  if (/Moon/i.test(name)) return { color: '#8B5CF6', accent: '#6D28D9' };
  if (/Cloud|Rain/i.test(name)) return { color: '#38BDF8', accent: '#0284C7' };
  if (/Heart/i.test(name)) return { color: '#E11D48', accent: '#BE123C' };
  if (/Sparkle|Star|Award/i.test(name)) return { color: '#F59E0B', accent: '#D97706' };
  if (/Music|Headphone|Headset/i.test(name)) return { color: '#8B5CF6', accent: '#6D28D9' };
  if (/Camera|Photo|Image/i.test(name)) return { color: '#06B6D4', accent: '#0891B2' };
  if (/Phone|Call/i.test(name)) return { color: '#2563EB', accent: '#1D4ED8' };
  if (/Message|Chat/i.test(name)) return { color: '#14B8A6', accent: '#0F766E' };
  if (/Search/i.test(name)) return { color: '#0284C7', accent: '#0369A1' };
  if (/User|People|Person/i.test(name)) return { color: '#6366F1', accent: '#4338CA' };
  if (/Tag|Price|Ticket/i.test(name)) return { color: '#EC4899', accent: '#BE185D' };
  if (/Nav|Compass|Route|Map|Location|Locate/i.test(name)) return { color: '#2563EB', accent: '#1E40AF' };
  if (/World|Globe/i.test(name)) return { color: '#0284C7', accent: '#075985' };
  if (/Pencil/i.test(name)) return { color: '#F59E0B', accent: '#D97706' };
  if (/Scissors/i.test(name)) return { color: '#A855F7', accent: '#7E22CE' };
  if (/Player/i.test(name)) return { color: '#3B82F6', accent: '#1D4ED8' };
  if (/Speaker|Megaphone/i.test(name)) return { color: '#F97316', accent: '#C2410C' };
  if (/Refresh|Reload/i.test(name)) return { color: '#0D9488', accent: '#0F766E' };
  if (/Plus|Check/i.test(name)) return { color: '#10B981', accent: '#047857' };
  if (/Close|X|Minus|Alert|Error/i.test(name)) return { color: '#EF4444', accent: '#B91C1C' };
  if (/Smile|Happy/i.test(name)) return { color: '#F59E0B', accent: '#D97706' };
  if (/Sad|Unhappy/i.test(name)) return { color: '#64748B', accent: '#475569' };
  if (/Book/i.test(name)) return { color: '#D97706', accent: '#92400E' };
  return { color: '#2563EB', accent: '#1D4ED8' };
}

const SIZES = [16, 20, 24, 32] as const;

/**
 * 선 버전 이름으로 채움 짝을 찾는다.
 */
function solidNameOf(name: string) {
  if (name.endsWith('Outline')) return name.slice(0, -'Outline'.length);
  if (name.endsWith('Line')) return `${name.slice(0, -'Line'.length)}Fill`;
  if (name.startsWith('Tb')) return `${name}Filled`;
  return null;
}

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

const LibHeading = styled.h2`
  margin: 28px 0 2px;
  font-size: 14px;
  font-weight: 700;
`;

const LibMeta = styled.p`
  margin: 0 0 12px;
  font-size: 12px;
  color: ${meok[500]};
`;

/**
 * 아이콘 그리드: 카드 너비를 넉넉하게 확보해 멀티컬러 / 선 / 채움 3종을 나란히 배치
 */
const Grid = styled.div<{ $color: string; $accent?: string; $paper?: string }>`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  color: ${({ $color }) => $color};

  ${({ $paper }) => $paper && `svg > path:first-of-type { fill: ${$paper}; }`}
  ${({ $accent }) => $accent && `svg > path:not(:first-of-type) { stroke: ${$accent}; }`}
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

const Trio = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 14px;
  min-height: 42px;
`;

const Slot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
`;

const SlotLabel = styled.span<{ $isMulti?: boolean }>`
  font-size: 10px;
  font-weight: ${({ $isMulti }) => ($isMulti ? '700' : '600')};
  color: ${({ $isMulti }) => ($isMulti ? palette.juhong[700] : meok[400])};
  letter-spacing: -0.01em;
`;

/**
 * 당근 앱 스타일 멀티컬러 슬롯:
 * 선이 잘리거나 부위가 증발하지 않도록 stroke를 절대 임의로 제거하지 않으며,
 * 각 아이콘의 고유 의미에 맞는 다채로운 컬러를 부여합니다.
 */
const MultiColorSlot = styled.div<{ $color: string; $accent: string; $name: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => $color};

  svg {
    display: block;

    ${({ $color, $accent, $name }) => {
      // 집(Home): 지붕과 벽체 투톤
      if (/Home|Pavilion/i.test($name)) {
        return `
          path:first-of-type { fill: ${$color}; }
          path:nth-of-type(2) { fill: ${$accent}; }
        `;
      }
      // 위치 핀(Location): 핀 본체와 중앙 원
      if (/Location|Locate|Pin/i.test($name)) {
        return `
          path { fill: ${$color}; }
          circle { fill: #ffffff; }
        `;
      }
      // 카메라(Camera): 바디와 렌즈 원
      if (/Camera|Photo/i.test($name)) {
        return `
          circle { fill: ${$accent}; }
        `;
      }
      // 나침반(Compass): 원형 다이얼과 침
      if (/Compass/i.test($name)) {
        return `
          circle { fill: ${$accent}; }
        `;
      }
      return '';
    }}
  }
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
  const [dark, setDark] = useState(false);
  const [accentKey, setAccentKey] = useState<keyof typeof palette | null>(null);
  const [paper, setPaper] = useState(false);

  const color = ROLES.find((r) => r.key === role)?.value ?? t.text.primary;
  const accent = accentKey ? palette[accentKey][500] : undefined;
  const paperFill = paper ? (accentKey ? palette[accentKey][100] : meok[200]) : undefined;

  return (
    <Page style={{ background: dark ? surface.dark.app : 'transparent' }}>
      <Title style={{ color: dark ? '#ffffff' : meok[900] }}>
        아이콘 카탈로그 (멀티컬러 · 선 · 채움)
      </Title>
      <Lead style={{ color: dark ? meok[200] : meok[700] }}>
        각 아이콘마다 <b>멀티컬러</b> (당근 앱 스타일 부위별 솔리드 분할 채움),{' '}
        <b>선</b>(Outline), <b>채움</b>(Solid) 3가지 버전을 나란히 확인합니다.
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

        <Chip type="button" $active={dark} onClick={() => setDark((v) => !v)}>
          어두운 배경
        </Chip>

        <Divider />

        {/* 투톤: 두 번째 이후 path만 이 색으로. 다시 누르면 끈다. */}
        {FAMILIES.map((f) => (
          <Chip
            key={f.key}
            type="button"
            $active={accentKey === f.key}
            $swatch={palette[f.key][500]}
            onClick={() => setAccentKey((prev) => (prev === f.key ? null : f.key))}
            title={`palette.${f.key}[500] — 부위 2 이후`}
          >
            {f.label}
          </Chip>
        ))}

        <Chip type="button" $active={paper} onClick={() => setPaper((v) => !v)}>
          면 채우기
        </Chip>
      </Controls>

      {REGISTRY.map((lib) => (
        <section key={lib.pkg}>
          <LibHeading>{lib.pkg}</LibHeading>
          <LibMeta>{lib.names.length}개</LibMeta>

          <Grid $color={color} $accent={accent} $paper={paperFill}>
            {lib.names.map((name) => {
              const Icon = lib.mod[name];
              const solidName = solidNameOf(name);
              const Solid = solidName ? lib.mod[solidName] : undefined;
              const { color: iconColor, accent: iconAccent } = getIconPalette(name);

              return (
                <Card key={name} $dark={dark}>
                  <Trio>
                    {/* 1. 멀티컬러 (다채로운 고유 톤온톤) */}
                    <Slot>
                      <MultiColorSlot $color={iconColor} $accent={iconAccent} $name={name}>
                        {Solid ? <Solid size={size} /> : Icon ? <Icon size={size} /> : <Empty>—</Empty>}
                      </MultiColorSlot>
                      <SlotLabel $isMulti style={{ color: iconColor }}>
                        멀티컬러
                      </SlotLabel>
                    </Slot>

                    {/* 2. 선 (Line) */}
                    <Slot>
                      {Icon ? <Icon size={size} /> : <Empty>없음</Empty>}
                      <SlotLabel>{solidName ? '선' : '단일'}</SlotLabel>
                    </Slot>

                    {solidName && (
                      <Slot>
                        {Solid ? <Solid size={size} /> : <Empty>—</Empty>}
                        <SlotLabel>{Solid ? '채움' : '짝 없음'}</SlotLabel>
                      </Slot>
                    )}
                  </Trio>

                  <Name $dark={dark}>{name}</Name>
                </Card>
              );
            })}
          </Grid>
        </section>
      ))}
    </Page>
  );
}
