'use client';

import styled from '@emotion/styled';
import type { CulturalCollection } from '@/features/map/domain/culturalCollection';
import type { Item } from '@/features/map/types';

const Section = styled.section`
  margin: 16px 14px 20px;
  padding: 0 0 18px;
  border-bottom: 1px solid #e5e5e3;
`;

const KoreanCopy = styled.span`
  display: block;

  [lang^='en'] & {
    display: none;
  }
`;

const EnglishCopy = styled.span`
  display: none;

  [lang^='en'] & {
    display: block;
  }
`;

const Title = styled.h2`
  margin: 0;
  color: #1f2937;
  font-size: 1.0625rem;
  font-weight: 750;
  letter-spacing: -0.025em;
  line-height: 1.4;
`;

const Subtitle = styled.p`
  margin: 7px 0 14px;
  color: #656565;
  font-size: 0.875rem;
  line-height: 1.55;
`;

const Places = styled.div`
  display: grid;
  gap: 6px;
`;

const PlaceButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 48px;
  padding: 11px 12px 11px 14px;
  border: 1px solid #e5e5e3;
  border-radius: 12px;
  background: #fff;
  color: #303030;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  text-align: left;
  transition: border-color 150ms ease, background-color 150ms ease, transform 150ms ease;
  cursor: pointer;

  &::after {
    color: #8a8a88;
    content: '↗';
    font-size: 1rem;
    font-weight: 400;
  }

  &:hover {
    border-color: #b8b8b4;
    background: #f8f8f7;
  }

  &:focus-visible {
    outline: 2px solid #475569;
    outline-offset: 2px;
  }

  &:active {
    transform: translateY(1px);
  }
`;

const HanokLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  margin-top: 10px;
  color: #475569;
  font-size: 0.8125rem;
  font-weight: 700;
  text-decoration: none;

  &::after {
    content: '→';
    font-size: 0.95rem;
    transition: transform 150ms ease;
  }

  &:hover {
    color: #1f2937;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  &:hover::after {
    transform: translateX(2px);
  }

  &:focus-visible {
    outline: 2px solid #475569;
    outline-offset: 3px;
  }
`;

interface Props {
  collection: CulturalCollection;
  places: Item[];
  loading: boolean;
  onPlaceSelect: (place: Item) => void;
}

export default function CulturalDiscoveryCollection({ collection, places, loading, onPlaceSelect }: Props) {
  const referenced = collection.placeRefs.length === 0
    ? places.slice(0, 3)
    : places.filter((place) => collection.placeRefs.some((ref) => ref.placeId === place.id));

  return (
    <Section aria-busy={loading}>
      <Title>
        <KoreanCopy>{collection.title.ko}</KoreanCopy>
        <EnglishCopy lang="en">{collection.title.en}</EnglishCopy>
      </Title>
      <Subtitle>
        <KoreanCopy>{collection.subtitle.ko}</KoreanCopy>
        <EnglishCopy lang="en">{collection.subtitle.en}</EnglishCopy>
      </Subtitle>
      <Places>
        {referenced.map((place) => (
          <PlaceButton key={place.id} type="button" aria-label={place.name} onClick={() => onPlaceSelect(place)}>
            {place.name}
          </PlaceButton>
        ))}
      </Places>
      <HanokLink href="/hanok">
        <KoreanCopy>한옥 문화 더 알아보기</KoreanCopy>
        <EnglishCopy lang="en">Explore Hanok culture</EnglishCopy>
      </HanokLink>
    </Section>
  );
}
