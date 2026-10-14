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
import type { TopicCode } from '../../domain/types';

const shimmerAnim = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
`;

const Page = styled.article`
  max-width: 680px;
  margin: 0 auto;
  padding: 0 16px 64px;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: ${fontSize.xs};
  font-weight: 600;
  color: ${meok[400]};
  text-decoration: none;
  margin: 20px 0 0;
  transition: color 0.14s ease;

  &:hover {
    color: ${meok[700]};
  }

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.28);
    &:hover { color: rgba(255,255,255,0.60); }
  }
`;

const Hero = styled.div`
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 18px;
  overflow: hidden;
  margin: 12px 0 20px;
  background: ${meok[200]};

  [data-theme='dark'] & {
    background: ${meok[700]};
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
  color: ${meok[400]};
  background: ${meok[200]};

  [data-theme='dark'] & {
    color: ${meok[600]};
    background: ${meok[700]};
  }
`;

const Name = styled.h1`
  font-family: var(--font-hanok);
  font-size: clamp(22px, 4vw, 32px);
  font-weight: 700;
  color: ${meok[900]};
  margin: 0 0 8px;
  letter-spacing: -0.03em;
  line-height: 1.2;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 9999px;
  background: ${meok[100]};
  color: ${meok[600]};
  font-size: ${fontSize.xs};
  font-weight: 500;

  [data-theme='dark'] & {
    background: ${meok[700]};
    color: ${meok[300]};
  }
`;

const SourceLabel = styled.span`
  font-size: ${fontSize.xs};
  color: ${meok[400]};
`;

const OdiiLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 9999px;
  border: none;
  background: ${lightPalette.cheongrok[50]};
  color: ${lightPalette.cheongrok[700]};
  font-size: ${fontSize.xs};
  font-weight: 600;
  text-decoration: none;
  transition: background 0.18s ease;

  &:hover {
    background: ${lightPalette.cheongrok[100]};
  }

  [data-theme='dark'] & {
    background: rgba(0, 196, 113, 0.12);
    color: ${lightPalette.cheongrok[300]};

    &:hover {
      background: rgba(0, 196, 113, 0.20);
    }
  }
`;

const Description = styled.p`
  font-size: ${fontSize.sm};
  line-height: 1.75;
  color: ${meok[700]};
  margin: 0 0 24px;

  [data-theme='dark'] & {
    color: ${meok[300]};
  }
`;

const SaveBtn = styled.button<{ $saved: boolean; $disabled: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 9999px;
  border: none;
  background: ${({ $saved }) => ($saved ? lightPalette.juhong[500] : meok[100])};
  color: ${({ $saved }) => ($saved ? '#ffffff' : meok[600])};
  font-size: ${fontSize.xs};
  font-weight: 600;
  cursor: ${({ $disabled }) => ($disabled ? 'default' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.45 : 1)};
  font-family: inherit;
  transition: background 0.15s ease, color 0.15s ease, transform 0.10s ease;
  margin-bottom: 20px;

  &:not(:disabled):hover {
    background: ${({ $saved }) =>
      $saved ? lightPalette.juhong[400] : meok[200]};
  }

  &:not(:disabled):active {
    transform: scale(0.96);
  }

  [data-theme='dark'] & {
    background: ${({ $saved }) =>
      $saved ? lightPalette.juhong[500] : 'rgba(255,255,255,0.08)'};
    color: ${({ $saved }) => ($saved ? '#ffffff' : 'rgba(255,255,255,0.55)')};

    &:not(:disabled):hover {
      background: ${({ $saved }) =>
        $saved ? lightPalette.juhong[400] : 'rgba(255,255,255,0.14)'};
    }
  }
`;

const AddressRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 5px;
  font-size: ${fontSize.xs};
  color: ${meok[500]};
  margin-bottom: 12px;
  line-height: 1.5;

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.35);
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
  background: ${meok[100]};
  color: ${meok[700]};
  font-size: ${fontSize.xs};
  font-weight: 500;

  &::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 9999px;
    background: ${lightPalette.juhong[400]};
    flex-shrink: 0;
  }

  [data-theme='dark'] & {
    background: rgba(255,255,255,0.07);
    color: rgba(255,255,255,0.65);
  }
`;

const SectionTitle = styled.h2`
  font-family: var(--font-hanok);
  font-size: ${fontSize.lg};
  font-weight: 700;
  color: ${meok[900]};
  margin: 0 0 12px;
  letter-spacing: -0.02em;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const RelationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const EmptyRelations = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[500]};
  padding: 20px 0;
  text-align: center;
`;

const TopicChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
`;

const TopicChip = styled.span`
  padding: 4px 10px;
  border-radius: 6px;
  background: ${meok[100]};
  color: ${meok[600]};
  font-size: 11px;
  font-weight: 500;

  [data-theme='dark'] & {
    background: ${meok[700]};
    color: ${meok[300]};
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
  background: linear-gradient(90deg, #e4e4e2 25%, #dcdcd9 50%, #e4e4e2 75%);
  background-size: 200% 100%;
  animation: ${shimmerAnim} 1.6s infinite ease-in-out;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, #32302d 25%, #3d3a36 50%, #32302d 75%);
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

  if (isLoading) {
    return (
      <Page>
        <BackLink href={backHref}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2.5} />
          목록으로
        </BackLink>
        <Hero style={{ animation: 'none', background: '#e4e4e2' }} />
        <SkeletonBlock $h="32px" $w="55%" $mb="10px" />
        <SkeletonBlock $h="16px" $w="35%" $mb="16px" />
        <SkeletonBlock $h="14px" $mb="6px" />
        <SkeletonBlock $h="14px" $w="90%" $mb="6px" />
        <SkeletonBlock $h="14px" $w="75%" />
      </Page>
    );
  }

  if (isNotFound || isError || !place) {
    return (
      <Page>
        <BackLink href={backHref}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2.5} />
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

  const primaryImage = place.images[0] ?? null;

  return (
    <Page>
      <BackLink href={backHref}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2.5} />
        목록으로
      </BackLink>

      <Hero>
        {primaryImage ? (
          <HeroImage src={primaryImage} alt={place.name} />
        ) : (
          <HeroFallback>
            <HugeiconsIcon icon={Building04Icon} size={56} strokeWidth={1.2} aria-hidden="true" />
          </HeroFallback>
        )}
      </Hero>

      <Name>{place.name}</Name>

      <MetaRow>
        <Pill>
          <HugeiconsIcon icon={MapPinIcon} size={11} strokeWidth={2} aria-hidden="true" />
          {place.region.nameKo}
        </Pill>
        {place.placeRoles.map((role) => (
          <Pill key={role.code}>
            <HugeiconsIcon icon={Building04Icon} size={11} strokeWidth={2} aria-hidden="true" />
            {role.labelKo}
          </Pill>
        ))}
        <SourceLabel>{place.sourceTaxonomy.labelKo}</SourceLabel>
      </MetaRow>

      {place.address && (
        <AddressRow>
          <HugeiconsIcon icon={MapPinIcon} size={11} strokeWidth={2} aria-hidden="true" />
          {place.address}
        </AddressRow>
      )}

      {place.topics.length > 0 && (
        <TopicChips>
          {place.topics.map((code) => (
            <TopicChip key={code}>{TOPIC_LABELS[code] ?? code}</TopicChip>
          ))}
        </TopicChips>
      )}

      {place.placeSummaryPoints.length > 0 && (
        <SummaryPoints>
          {place.placeSummaryPoints.map((point) => (
            <SummaryPoint key={point}>{point}</SummaryPoint>
          ))}
        </SummaryPoints>
      )}

      {place.description && <Description>{place.description}</Description>}

      {place.odii.linked && (
        <OdiiLink href="/sorimaru" style={{ display: 'inline-flex', marginBottom: 24 }}>
          <HugeiconsIcon icon={HeadphonesIcon} size={13} strokeWidth={2} aria-hidden="true" />
          소리마루 오디오 가이드 {place.odii.storyCount > 0 ? `${place.odii.storyCount}편` : ''}
        </OdiiLink>
      )}

      {place.saveAvailable && (
        <SaveBtn
          type="button"
          $saved={!!savedByMe}
          $disabled={isSaving}
          disabled={isSaving}
          onClick={toggle}
          aria-label={savedByMe ? '저장 취소' : '장소 저장'}
        >
          <HugeiconsIcon
            icon={savedByMe ? BookmarkRemove01Icon : BookmarkAdd01Icon}
            size={14}
            strokeWidth={2}
            aria-hidden="true"
          />
          {savedByMe ? '저장됨' : '장소 저장'}
        </SaveBtn>
      )}

      <SectionTitle>K-Contents 관계</SectionTitle>

      {relLoading ? (
        <RelationList>
          {[1, 2].map((i) => (
            <SkeletonBlock key={i} $h="100px" style={{ borderRadius: 14 }} />
          ))}
        </RelationList>
      ) : relations.length === 0 ? (
        <EmptyRelations>확인된 촬영 관계가 없습니다.</EmptyRelations>
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
