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
import { semanticTokens, meok, surface } from '@/design-system/tokens';

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
];

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

/**
 * 선 버전 이름으로 채움 짝을 찾는다.
 * io5: IoHeartOutline → IoHeart · ri: RiEmotionHappyLine → RiEmotionHappyFill
 */
function solidNameOf(name: string) {
  if (name.endsWith('Outline')) return name.slice(0, -'Outline'.length);
  if (name.endsWith('Line')) return `${name.slice(0, -'Line'.length)}Fill`;
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
  margin: 0 0 14px;
  font-size: 12px;
  color: ${meok[500]};
`;

/** 아이콘은 color prop을 받지 않는다. 이 한 줄이 그리드 전체의 아이콘 색이다. */
const Grid = styled.div<{ $color: string }>`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  color: ${({ $color }) => $color};
`;

const Card = styled.div<{ $dark: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 10px 12px;

  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(25, 31, 40, 0.08)')};
  border-radius: 14px;
  background: ${({ $dark }) => ($dark ? surface.dark.card : '#ffffff')};
`;

const Pair = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 18px;
  min-height: 42px;
`;

const Slot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
`;

const SlotLabel = styled.span`
  font-size: 9.5px;
  font-weight: 600;
  color: ${meok[400]};
`;

const Name = styled.span<{ $dark: boolean }>`
  font-size: 10.5px;
  line-height: 1.35;
  text-align: center;
  word-break: break-all;
  color: ${({ $dark }) => ($dark ? meok[400] : meok[500])};
`;

const Empty = styled.span`
  font-size: 12px;
  color: ${meok[200]};
`;

export default function IconCatalogPage() {
  const [role, setRole] = useState<string>(ROLES[0].key);
  const [size, setSize] = useState<number>(24);
  const [dark, setDark] = useState(false);

  const color = ROLES.find((r) => r.key === role)?.value ?? t.text.primary;
  const total = REGISTRY.reduce((n, lib) => n + lib.names.length, 0);

  return (
    <Page>
      <Title>아이콘 카탈로그</Title>
      <Lead>
        프로젝트에서 쓰는 아이콘 {total}개. 선(Outline) 버전과 채움(Solid) 짝을 같이 보여준다.
        관행은 <b>선 = 기본/꺼짐, 채움 = 선택됨/켜짐</b>.
        <br />
        아래 아이콘에는 <code>color</code> prop이 하나도 없다 — 라이브러리 기본값이{' '}
        <code>currentColor</code>라 그리드 컨테이너의 <code>color</code> 한 줄만 바뀐다.
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
      </Controls>

      {REGISTRY.map((lib) => (
        <section key={lib.pkg}>
          <LibHeading>{lib.pkg}</LibHeading>
          <LibMeta>{lib.names.length}개</LibMeta>

          <Grid $color={color}>
            {lib.names.map((name) => {
              const Icon = lib.mod[name];
              const solidName = solidNameOf(name);
              const Solid = solidName ? lib.mod[solidName] : undefined;

              return (
                <Card key={name} $dark={dark}>
                  <Pair>
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
                  </Pair>

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
