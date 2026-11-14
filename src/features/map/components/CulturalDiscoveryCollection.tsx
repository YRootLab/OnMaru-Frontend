'use client';

import styled from '@emotion/styled';
import type { CulturalCollection } from '@/features/map/domain/culturalCollection';
import type { Item } from '@/features/map/types';

const Section = styled.section`
  margin: 12px 14px 20px;
  padding: 18px;
  border-radius: 16px;
  background: #f5f5f4;
`;
const Title = styled.h2`margin: 0; font-size: 1.1rem;`;
const Subtitle = styled.p`margin: 8px 0 14px; color: #525252; line-height: 1.5;`;
const EnglishContext = styled.p`margin: -8px 0 14px; color: #737373; font-size: 0.78rem; line-height: 1.5;`;
const Places = styled.div`display: flex; gap: 8px; overflow-x: auto;`;
const PlaceButton = styled.button`min-width: 132px; min-height: 44px; border: 0; border-radius: 10px; background: #fff; text-align: left; padding: 10px; cursor: pointer;`;
const HanokLink = styled.a`display: inline-flex; align-items: center; min-height: 44px; margin-top: 12px; border-radius: 999px; background: #1f2937; color: #fff; padding: 0 14px; font-size: 0.86rem; font-weight: 700; text-decoration: none;`;

interface Props {
  collection: CulturalCollection;
  places: Item[];
  loading: boolean;
  onPlaceSelect: (place: Item) => void;
}

export default function CulturalDiscoveryCollection({ collection, places, loading, onPlaceSelect }: Props) {
  const referenced = collection.placeRefs.length === 0 ? places.slice(0, 3) : places.filter((place) => collection.placeRefs.some((ref) => ref.placeId === place.id));
  return <Section aria-busy={loading}>
    <Title>{collection.title.ko}</Title>
    <Subtitle>{collection.subtitle.ko}</Subtitle>
    {collection.subtitle.en && <EnglishContext lang="en">{collection.subtitle.en}</EnglishContext>}
    <Places>{referenced.map((place) => <PlaceButton key={place.id} type="button" aria-label={place.name} onClick={() => onPlaceSelect(place)}>{place.name}</PlaceButton>)}</Places>
    <HanokLink href="/hanok">한옥 문화 더 알아보기</HanokLink>
  </Section>;
}
