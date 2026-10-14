'use client';

import React from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  MapPinIcon,
  Building04Icon,
  HeadphonesIcon,
  BookmarkAdd01Icon,
  BookmarkRemove01Icon,
} from '@hugeicons/core-free-icons';
import { meok, lightPalette, fontSize } from '@/design-system/tokens';
import KContentRelationCard from './KContentRelationCard';
import { useDiscoveryPlaceDetail } from '../hooks/useDiscoveryPlaceDetail';
import { useKContentRelations } from '../hooks/useKContentRelations';
import { usePlaceSave } from '../hooks/usePlaceSave';
import { useTourApiImage } from '../hooks/useTourApiImage';
import type { TopicCode } from '../../domain/types';

const shimmerAnim = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
`;

const Page = styled.article`
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  margin: 0 auto;
  padding-bottom: 80px;

  @media (min-width: 768px) {
    padding-top: 8px;
  }

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
  }

  @media (max-width: 640px) {
    width: calc(100% - 24px);
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: ${fontSize.xs};
  font-weight: 600;
  color: ${meok[400]};
  text-decoration: none;
  padding: 20px 0 16px;

  &:hover { color: ${meok[700]}; }

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.25);
    &:hover { color: rgba(255,255,255,0.55); }
  }
`;

/* ─── cinematic hero ─── */
const HeroWrap = styled.div`
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  background: ${meok[200]};
  margin-bottom: 20px;

  @media (max-width: 640px) {
    border-radius: 14px;
    aspect-ratio: 4 / 3;
  }

  [data-theme='dark'] & {
    background: #141822;
  }
`;

const HeroImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const HeroFallback = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(155deg, #ede8de 0%, #ddd7c9 100%);
  color: ${meok[400]};

  [data-theme='dark'] & {
    background: linear-gradient(155deg, #181e2a 0%, #101420 100%);
    color: rgba(255,255,255,0.2);
  }
`;

const HeroScrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0,0,0,0.08) 0%,
    transparent 35%,
    rgba(0,0,0,0.62) 100%
  );
  pointer-events: none;
`;

const HeroOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 22px 22px;
  z-index: 2;
`;

const HeroName = styled.h1`
  font-family: var(--font-hanok), serif;
  font-size: clamp(20px, 3.5vw, 30px);
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 6px;
  letter-spacing: -0.035em;
  line-height: 1.2;
  text-shadow: 0 2px 12px rgba(0,0,0,0.45);
`;

const HeroMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const HeroPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 6px;
  background: rgba(255,255,255,0.18);
  backdrop-filter: blur(8px);
  color: rgba(255,255,255,0.9);
  font-size: 11px;
  font-weight: 600;
  border: 1px solid rgba(255,255,255,0.2);
`;

/* ─── action bar ─── */
const ActionBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const SaveBtn = styled.button<{ $saved: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 9999px;
  border: 1.5px solid ${({ $saved }) => $saved ? lightPalette.juhong[400] : 'rgba(0,0,0,0.1)'};
  background: ${({ $saved }) => $saved ? lightPalette.juhong[50] : 'transparent'};
  color: ${({ $saved }) => $saved ? lightPalette.juhong[600] : meok[600]};
  font-size: ${fontSize.xs};
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $saved }) => $saved ? lightPalette.juhong[100] : 'rgba(0,0,0,0.04)'};
    border-color: ${({ $saved }) => $saved ? lightPalette.juhong[500] : 'rgba(0,0,0,0.18)'};
  }

  &:active { transform: scale(0.96); }
  &:disabled { opacity: 0.4; cursor: default; }

  [data-theme='dark'] & {
    border-color: ${({ $saved }) => $saved ? lightPalette.juhong[500] : 'rgba(255,255,255,0.12)'};
    background: ${({ $saved }) => $saved ? 'rgba(255,85,0,0.14)' : 'transparent'};
    color: ${({ $saved }) => $saved ? lightPalette.juhong[400] : 'rgba(255,255,255,0.55)'};

    &:hover {
      background: ${({ $saved }) => $saved ? 'rgba(255,85,0,0.22)' : 'rgba(255,255,255,0.06)'};
      border-color: ${({ $saved }) => $saved ? lightPalette.juhong[400] : 'rgba(255,255,255,0.2)'};
    }
  }
`;

const OdiiBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 9999px;
  border: 1.5px solid rgba(0,0,0,0.1);
  background: transparent;
  color: ${lightPalette.cheongrok[700]};
  font-size: ${fontSize.xs};
  font-weight: 700;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(0,160,100,0.06);
    border-color: ${lightPalette.cheongrok[400]};
  }

  [data-theme='dark'] & {
    border-color: rgba(255,255,255,0.12);
    color: ${lightPalette.cheongrok[400]};

    &:hover {
      background: rgba(0,196,113,0.1);
      border-color: ${lightPalette.cheongrok[500]};
    }
  }
`;

/* ─── body content ─── */
const AddressRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 5px;
  font-size: ${fontSize.xs};
  color: ${meok[400]};
  margin-bottom: 16px;
  line-height: 1.5;

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.3);
  }
`;

const TopicChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 16px;
`;

const TopicChip = styled.span`
  padding: 3px 10px;
  border-radius: 6px;
  background: rgba(0,0,0,0.04);
  color: ${meok[600]};
  font-size: 11px;
  font-weight: 500;
  border: 1px solid rgba(0,0,0,0.06);

  [data-theme='dark'] & {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.5);
    border-color: rgba(255,255,255,0.08);
  }
`;

const SummaryPoints = styled.ul`
  margin: 0 0 20px;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const SummaryPoint = styled.li`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 9999px;
  background: rgba(0,0,0,0.04);
  color: ${meok[700]};
  font-size: ${fontSize.xs};
  font-weight: 500;
  border: 1px solid rgba(0,0,0,0.06);

  [data-theme='dark'] & {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.6);
    border-color: rgba(255,255,255,0.08);
  }
`;

const Description = styled.p`
  font-size: ${fontSize.sm};
  line-height: 1.8;
  color: ${meok[700]};
  margin: 0 0 28px;
  max-width: 680px;

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.55);
  }
`;

/* ─── K-Contents section ─── */
const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0,0,0,0.06);

  [data-theme='dark'] & {
    border-color: rgba(255,255,255,0.07);
  }
`;

const SectionTitle = styled.h2`
  font-family: var(--font-hanok);
  font-size: ${fontSize.base};
  font-weight: 700;
  color: ${meok[900]};
  margin: 0;
  letter-spacing: -0.02em;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const SectionCount = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${meok[400]};

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.3);
  }
`;

const RelationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const EmptyRelations = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[400]};
  padding: 24px 0;
  text-align: center;

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.25);
  }
`;

const TOPIC_LABELS: Record<TopicCode, string> = {
  TRADITIONAL_SPACE_HERITAGE: '전통 공간·문화유산',
  TRADITIONAL_EXPERIENCE: '전통 체험·공방',
  TRADITIONAL_FOOD_TEA: '전통 음식·다례',
  K_DRAMA: 'K-드라마',
  K_MOVIE: 'K-영화',
  K_POP_MV: 'K-POP MV',
  K_ARTIST: 'K-아티스트',
};

const SkeletonBlock = styled.div<{ $h?: string; $w?: string; $mb?: string }>`
  height: ${({ $h }) => $h ?? '18px'};
  width: ${({ $w }) => $w ?? '100%'};
  border-radius: 8px;
  margin-bottom: ${({ $mb }) => $mb ?? '0'};
  background: linear-gradient(90deg, #e8e6e2 25%, #dedad5 50%, #e8e6e2 75%);
  background-size: 200% 100%;
  animation: ${shimmerAnim} 1.6s infinite ease-in-out;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, #1e2330 25%, #252c3a 50%, #1e2330 75%);
    background-size: 200% 100%;
  }
`;

const NotFoundBox = styled.div`
  padding: 60px 0;
  text-align: center;
  color: ${meok[500]};
  font-size: ${fontSize.sm};
`;

export interface PlaceDetailViewProps {
  placeId: string;
  backHref?: string;
}

export default function PlaceDetailView({ placeId, backHref = '/discover' }: PlaceDetailViewProps) {
  const { place, isLoading, isNotFound, isError } = useDiscoveryPlaceDetail(placeId);
  const { relations, isLoading: relLoading } = useKContentRelations(placeId);
  const { savedByMe, isSaving, toggle } = usePlaceSave({
    placeId,
    saveAvailable: place?.saveAvailable ?? false,
    initialSavedByMe: place?.savedByMe ?? null,
  });
  const primaryImage = useTourApiImage(placeId, place?.images[0] ?? null);

  if (isLoading) {
    return (
      <Page>
        <BackLink href={backHref}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={2.5} />
          목록으로
        </BackLink>
        <SkeletonBlock $h="clamp(200px, 40vw, 420px)" $mb="20px" style={{ borderRadius: 18 }} />
        <SkeletonBlock $h="28px" $w="50%" $mb="10px" />
        <SkeletonBlock $h="14px" $w="32%" $mb="20px" />
        <SkeletonBlock $h="14px" $mb="6px" />
        <SkeletonBlock $h="14px" $w="88%" />
      </Page>
    );
  }

  if (isNotFound || isError || !place) {
    return (
      <Page>
        <BackLink href={backHref}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={2.5} />
          목록으로
        </BackLink>
        <NotFoundBox role="alert">
          {isNotFound
            ? '장소 정보를 찾을 수 없습니다. 목록으로 돌아가 다시 선택해 주세요.'
            : '정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'}
        </NotFoundBox>
      </Page>
    );
  }

  return (
    <Page>
      <BackLink href={backHref}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={2.5} />
        목록으로
      </BackLink>

      {/* ─── cinematic hero ─── */}
      <HeroWrap>
        {primaryImage ? (
          <HeroImage src={primaryImage} alt={place.name} />
        ) : (
          <HeroFallback>
            <HugeiconsIcon icon={Building04Icon} size={52} strokeWidth={1} aria-hidden="true" />
          </HeroFallback>
        )}
        <HeroScrim />
        <HeroOverlay>
          <HeroName>{place.name}</HeroName>
          <HeroMeta>
            <HeroPill>
              <HugeiconsIcon icon={MapPinIcon} size={10} strokeWidth={2} aria-hidden="true" />
              {place.region.nameKo}
            </HeroPill>
            {place.placeRoles.slice(0, 2).map((role) => (
              <HeroPill key={role.code}>{role.labelKo}</HeroPill>
            ))}
          </HeroMeta>
        </HeroOverlay>
      </HeroWrap>

      {/* ─── action bar ─── */}
      <ActionBar>
        {place.saveAvailable && (
          <SaveBtn
            type="button"
            $saved={!!savedByMe}
            disabled={isSaving}
            onClick={toggle}
            aria-label={savedByMe ? '저장 취소' : '장소 저장'}
          >
            <HugeiconsIcon
              icon={savedByMe ? BookmarkRemove01Icon : BookmarkAdd01Icon}
              size={13}
              strokeWidth={2}
              aria-hidden="true"
            />
            {savedByMe ? '저장됨' : '저장'}
          </SaveBtn>
        )}
        {place.odii.linked && (
          <OdiiBtn href="/sorimaru">
            <HugeiconsIcon icon={HeadphonesIcon} size={13} strokeWidth={2} aria-hidden="true" />
            소리마루 오디오{place.odii.storyCount > 0 ? ` ${place.odii.storyCount}편` : ''}
          </OdiiBtn>
        )}
      </ActionBar>

      {/* ─── address ─── */}
      {place.address && (
        <AddressRow>
          <HugeiconsIcon icon={MapPinIcon} size={11} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          {place.address}
        </AddressRow>
      )}

      {/* ─── topics ─── */}
      {place.topics.length > 0 && (
        <TopicChips>
          {place.topics.map((code) => (
            <TopicChip key={code}>{TOPIC_LABELS[code] ?? code}</TopicChip>
          ))}
        </TopicChips>
      )}

      {/* ─── summary points ─── */}
      {place.placeSummaryPoints.length > 0 && (
        <SummaryPoints>
          {place.placeSummaryPoints.map((point) => (
            <SummaryPoint key={point}>{point}</SummaryPoint>
          ))}
        </SummaryPoints>
      )}

      {/* ─── description ─── */}
      {place.description && <Description>{place.description}</Description>}

      {/* ─── K-Contents 이력 ─── */}
      <SectionHeader>
        <SectionTitle>촬영·방문 이력</SectionTitle>
        {!relLoading && relations.length > 0 && (
          <SectionCount>{relations.length}건</SectionCount>
        )}
      </SectionHeader>

      {relLoading ? (
        <RelationList>
          {[1, 2].map((i) => (
            <SkeletonBlock key={i} $h="96px" style={{ borderRadius: 12 }} />
          ))}
        </RelationList>
      ) : relations.length === 0 ? (
        <EmptyRelations>확인된 촬영·방문 기록이 없습니다.</EmptyRelations>
      ) : (
        <RelationList>
          {relations.map((rel) => (
            <KContentRelationCard key={rel.relationId} relation={rel} />
          ))}
        </RelationList>
      )}
    </Page>
  );
}
