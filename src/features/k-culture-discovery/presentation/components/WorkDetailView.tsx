'use client';

import React from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ExternalLinkIcon,
  MapPinIcon,
  CheckmarkCircle02Icon,
  ClapperboardIcon,
} from '@hugeicons/core-free-icons';
import { meok, lightPalette, ringShadow, fontSize } from '@/design-system/tokens';
import WorkTypeBadge from './WorkTypeBadge';
import { useDiscoveryWorkDetail } from '../hooks/useDiscoveryWorkDetail';

const shimmerAnim = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
`;

const Page = styled.article`
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 16px 64px;

  @media (min-width: 768px) {
    padding-top: 66px;
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

const Header = styled.div`
  margin: 20px 0;
  display: flex;
  gap: 16px;
  align-items: flex-start;
`;

const ArtworkBox = styled.div`
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 14px;
  background: ${meok[200]};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  overflow: hidden;

  [data-theme='dark'] & {
    background: ${meok[700]};
  }
`;

const ArtworkImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const TitleBlock = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h1`
  font-family: var(--font-hanok);
  font-size: clamp(20px, 3.5vw, 28px);
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
  gap: 8px;
  flex-wrap: wrap;
`;

const YearText = styled.span`
  font-size: ${fontSize.xs};
  color: ${meok[500]};
`;

const ArtistText = styled.span`
  font-size: ${fontSize.xs};
  color: ${meok[500]};
`;

const SectionTitle = styled.h2`
  font-family: var(--font-hanok);
  font-size: ${fontSize.base};
  font-weight: 700;
  color: ${meok[900]};
  margin: 24px 0 10px;
  letter-spacing: -0.02em;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const SummaryList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SummaryItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: ${fontSize.sm};
  color: ${meok[700]};
  line-height: 1.65;

  [data-theme='dark'] & {
    color: ${meok[300]};
  }
`;

const CheckIcon = styled.span`
  flex-shrink: 0;
  margin-top: 2px;
  color: ${lightPalette.cheongrok[600]};
`;

const OfficialLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 10px 18px;
  border-radius: 10px;
  border: none;
  background: ${meok[100]};
  color: ${meok[700]};
  font-size: ${fontSize.sm};
  font-weight: 600;
  text-decoration: none;
  box-shadow: ${ringShadow.light.cardElevated};
  transition: background 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    background: ${meok[200]};
    box-shadow: ${ringShadow.light.cardLift};
  }

  [data-theme='dark'] & {
    background: ${meok[700]};
    color: ${meok[200]};
    box-shadow: ${ringShadow.dark.cardElevated};

    &:hover {
      background: ${meok[600]};
      box-shadow: ${ringShadow.dark.cardLift};
    }
  }
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
`;

const Tag = styled.span`
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

const PlaceCountBadge = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  border-radius: 10px;
  background: ${meok[100]};
  color: ${meok[600]};
  font-size: ${fontSize.sm};
  font-weight: 600;
  text-decoration: none;
  transition: background 0.18s ease;

  &:hover {
    background: ${meok[200]};
  }

  [data-theme='dark'] & {
    background: ${meok[700]};
    color: ${meok[300]};
  }
`;

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

export interface WorkDetailViewProps {
  workId: string;
  backHref?: string;
}

export default function WorkDetailView({ workId, backHref = '/discover/works' }: WorkDetailViewProps) {
  const { work, isLoading, isNotFound, isError } = useDiscoveryWorkDetail(workId);

  if (isLoading) {
    return (
      <Page>
        <BackLink href={backHref}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2.5} />
          작품 목록
        </BackLink>
        <div style={{ display: 'flex', gap: 16, margin: '20px 0' }}>
          <SkeletonBlock style={{ width: 80, height: 80, borderRadius: 14, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <SkeletonBlock $h="26px" $w="65%" $mb="8px" />
            <SkeletonBlock $h="16px" $w="40%" />
          </div>
        </div>
        <SkeletonBlock $h="14px" $mb="6px" />
        <SkeletonBlock $h="14px" $w="90%" $mb="6px" />
        <SkeletonBlock $h="14px" $w="75%" />
      </Page>
    );
  }

  if (isNotFound || isError || !work) {
    return (
      <Page>
        <BackLink href={backHref}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2.5} />
          작품 목록
        </BackLink>
        <NotFoundBox role="alert">
          {isNotFound
            ? '작품 정보를 찾을 수 없습니다. 목록으로 돌아가 다시 선택해 주세요.'
            : '정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'}
        </NotFoundBox>
      </Page>
    );
  }

  return (
    <Page>
      <BackLink href={backHref}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2.5} />
        작품 목록
      </BackLink>

      <Header>
        <ArtworkBox>
          {work.workArtwork ? (
            <ArtworkImg src={work.workArtwork} alt={work.canonicalTitle} />
          ) : (
            <HugeiconsIcon icon={ClapperboardIcon} size={28} strokeWidth={1.5} aria-hidden="true" />
          )}
        </ArtworkBox>

        <TitleBlock>
          <Title>{work.canonicalTitle}</Title>
          <MetaRow>
            <WorkTypeBadge type={work.type} variant="dark" />
            {work.releaseYear && <YearText>{work.releaseYear}</YearText>}
            {work.artists.map((a) => (
              <ArtistText key={a.artistId}>{a.name}</ArtistText>
            ))}
          </MetaRow>
        </TitleBlock>
      </Header>

      {work.summaryPoints.length > 0 && (
        <>
          <SectionTitle>작품 소개</SectionTitle>
          <SummaryList>
            {work.summaryPoints.map((point, i) => (
              <SummaryItem key={i}>
                <CheckIcon>
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={14}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </CheckIcon>
                {point}
              </SummaryItem>
            ))}
          </SummaryList>
        </>
      )}

      {work.workTags.length > 0 && (
        <TagRow>
          {work.workTags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </TagRow>
      )}

      <SectionTitle>촬영 장소</SectionTitle>
      {work.publicPlaceCount > 0 ? (
        <PlaceCountBadge
          href={`/discover?workId=${encodeURIComponent(work.workId)}`}
        >
          <HugeiconsIcon icon={MapPinIcon} size={13} strokeWidth={2} aria-hidden="true" />
          공개된 촬영지 {work.publicPlaceCount}곳 보기
        </PlaceCountBadge>
      ) : (
        <p style={{ fontSize: fontSize.sm, color: meok[500] }}>
          공개된 촬영지 정보가 없습니다.
        </p>
      )}

      {work.officialPageUrl && (
        <div style={{ marginTop: 24 }}>
          <OfficialLink
            href={work.officialPageUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <HugeiconsIcon icon={ExternalLinkIcon} size={13} strokeWidth={2} aria-hidden="true" />
            공식 페이지 바로 가기
          </OfficialLink>
        </div>
      )}
    </Page>
  );
}
