'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import styled from '@emotion/styled';
import { motion, useReducedMotion } from 'framer-motion';
import { Section2StudyStory, getNextStudySelection, getStudyPlaybackLabel } from './studyData';
import { palette, meok } from '@/design-system/tokens';

const IMAGE_FALLBACK = '/images/hanok/hanok-main.png';

export interface StudyVariantProps {
  stories: Section2StudyStory[];
  selectedStoryId: string | null;
  onSelectStory: (storyId: string | null) => void;
}

interface StudySectionFrameProps {
  number: string;
  title: string;
  description: string;
  detail: string;
  children: React.ReactNode;
}

const SectionFrameRoot = styled.section`
  padding-top: 3.5rem;
  padding-bottom: 3.5rem;
  @media (min-width: 640px) {
    padding-top: 5rem;
    padding-bottom: 5rem;
  }
`;

const SectionHeader = styled.div`
  margin-bottom: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  @media (min-width: 640px) {
    margin-bottom: 2.25rem;
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
`;

const VariantTag = styled.p`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: ${palette.jangmi[500]};
`;

const SectionHeading = styled.h2`
  margin-top: 0.5rem;
  font-family: var(--font-hanok);
  font-size: clamp(25px, 3vw, 36px);
  font-weight: 700;
  letter-spacing: -0.045em;
  color: #211e19;
`;

const HeaderDescCol = styled.div`
  max-width: 24rem;
  @media (min-width: 640px) {
    text-align: right;
  }
`;

const SubTitle = styled.p`
  font-family: var(--font-hanok);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: #403930;
`;

const SubDesc = styled.p`
  margin-top: 0.25rem;
  font-size: 0.75rem;
  line-height: 1.25rem;
  color: #786d5e;
`;

const DetailText = styled.p`
  margin-top: 1rem;
  max-width: 42rem;
  font-size: 10px;
  line-height: 1.25rem;
  color: #8c7e6c;
`;

export function StudySectionFrame({
  number,
  title,
  description,
  detail,
  children,
}: StudySectionFrameProps) {
  const headingId = `section2-study-${number}`;

  return (
    <SectionFrameRoot aria-labelledby={headingId}>
      <SectionHeader>
        <div>
          <VariantTag>VARIANT {number}</VariantTag>
          <SectionHeading id={headingId}>
            장면을 골라 듣다
          </SectionHeading>
        </div>
        <HeaderDescCol>
          <SubTitle>{title}</SubTitle>
          <SubDesc>{description}</SubDesc>
        </HeaderDescCol>
      </SectionHeader>
      {children}
      <DetailText>{detail}</DetailText>
    </SectionFrameRoot>
  );
}

const RailOuter = styled.div`
  margin-left: -1rem;
  margin-right: -1rem;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 1.25rem;
  overflow-x: auto;
  scrollbar-color: rgba(33, 30, 25, 0.22) transparent;
  scrollbar-width: thin;
  @media (min-width: 640px) {
    margin-left: 0;
    margin-right: 0;
    padding-left: 0;
    padding-right: 0;
  }
`;

const RailInner = styled.div<{ $gap?: string }>`
  display: flex;
  width: max-content;
  max-width: none;
  align-items: stretch;
  gap: ${({ $gap }) => $gap || '1rem'};
`;

export function StudyRail({
  children,
  className = '',
  gap = '1rem',
}: {
  children: React.ReactNode;
  className?: string;
  gap?: string;
}) {
  return (
    <RailOuter>
      <RailInner className={className} $gap={gap}>
        {children}
      </RailInner>
    </RailOuter>
  );
}

const StyledImage = styled(Image)`
  object-fit: cover;
`;

export function StudyImage({
  story,
  sizes,
  className = '',
}: {
  story: Section2StudyStory;
  sizes: string;
  className?: string;
}) {
  const [src, setSrc] = useState(story.imageSrc);

  return (
    <StyledImage
      src={src}
      alt={`${story.title} 풍경`}
      fill
      sizes={sizes}
      className={className}
      onError={() => setSrc(IMAGE_FALLBACK)}
    />
  );
}

const PlayButton = styled.button<{ $compact?: boolean; $selected?: boolean }>`
  display: inline-flex;
  height: 2.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  border-radius: 9999px;
  background-color: ${palette.jangmi[500]};
  font-weight: 700;
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: width 0.2s ease, background-color 0.2s ease;
  font-size: 10px;
  ${({ $compact, $selected }) =>
    $compact && !$selected
      ? `width: 2.75rem;`
      : `min-width: 2.75rem; padding-left: 0.75rem; padding-right: 0.75rem;`}

  &:hover {
    background-color: ${palette.jangmi[700]};
  }
  &:focus-visible {
    outline: 2px solid #211e19;
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export function StudyPlayControl({
  story,
  selectedStoryId,
  onSelectStory,
  compact = false,
}: {
  story: Section2StudyStory;
  selectedStoryId: string | null;
  onSelectStory: (storyId: string | null) => void;
  compact?: boolean;
}) {
  const isSelected = selectedStoryId === story.id;
  const label = getStudyPlaybackLabel(selectedStoryId, story.id);

  return (
    <PlayButton
      type="button"
      onClick={() => onSelectStory(getNextStudySelection(selectedStoryId, story.id))}
      aria-label={`${story.title} ${isSelected ? '재생 멈추기' : '재생하기'}`}
      aria-pressed={isSelected}
      $compact={compact}
      $selected={isSelected}
    >
      <span aria-hidden="true" style={{ fontSize: 10 }}>{isSelected ? 'Ⅱ' : '▶'}</span>
      {(!compact || isSelected) && <span>{label}</span>}
    </PlayButton>
  );
}

export function MotionStudyCard({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : { y: -5 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.article>
  );
}
