'use client';

import styled from '@emotion/styled';
import type { CulturalCollection, CulturalCollectionPath } from '@/features/map/domain/culturalCollection';
import type { Item } from '@/features/map/types';

const Section = styled.section`
  margin: 16px 14px 20px;
  padding: 0 0 18px;
  border-bottom: 1px solid #e5e5e3;
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

const Paths = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 14px;
`;

const PathButton = styled.button`
  min-height: 38px;
  padding: 8px 10px;
  border: 1px solid #e5e5e3;
  border-radius: 9px;
  background: #f8f8f7;
  color: #475569;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: #b8b8b4;
    background: #fff;
    color: #1f2937;
  }

  &:focus-visible {
    outline: 2px solid #475569;
    outline-offset: 2px;
  }
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
  margin: 0 0 5px;
  color: #64748b;
  font-size: 0.6875rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1.4;
  text-decoration: underline;
  text-decoration-color: #94a3b8;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;

  &::after {
    content: '\\2197';
    font-size: 0.95rem;
    transition: transform 150ms ease;
  }

  &:hover {
    color: #1f2937;
    text-decoration-color: currentColor;
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
  onPathSelect: (path: CulturalCollectionPath) => void;
}

export default function CulturalDiscoveryCollection({ collection, places, loading, onPlaceSelect, onPathSelect }: Props) {
  const referenced = collection.placeRefs.length === 0
    ? places.filter((place) => place.isTraditional)
    : places.filter((place) => collection.placeRefs.some((ref) => ref.placeId === place.id));

  return (
    <Section aria-busy={loading}>
      <HanokLink href="/hanok">HANOK CULTURE WALK</HanokLink>
      <Title>{collection.title.ko}</Title>
      <Subtitle>{collection.subtitle.ko}</Subtitle>
      {collection.paths && collection.paths.length > 0 && (
        <Paths aria-label="한국 생활문화 탐색">
          {collection.paths.map((path) => (
            <PathButton key={path.id} type="button" onClick={() => onPathSelect(path)}>
              {path.label}
            </PathButton>
          ))}
        </Paths>
      )}
      <Places>
        {referenced.map((place) => (
          <PlaceButton key={place.id} type="button" aria-label={place.name} onClick={() => onPlaceSelect(place)}>
            {place.name}
          </PlaceButton>
        ))}
      </Places>
    </Section>
  );
}
