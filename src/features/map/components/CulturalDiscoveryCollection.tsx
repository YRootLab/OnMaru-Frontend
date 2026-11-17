'use client';

import styled from '@emotion/styled';
import type { Item } from '@/features/map/types';

const Section = styled.section`
  margin: 12px 14px 20px;
  padding: 18px;
  border-radius: 16px;
  background: #f5f5f4;
`;
const Eyebrow = styled.p`margin: 0; color: #596873; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em;`;
const Title = styled.h2`margin: 7px 0 0; font-size: 1.1rem;`;
const Subtitle = styled.p`margin: 8px 0 0; color: #525252; line-height: 1.5;`;
const EnglishContext = styled.p`margin: 6px 0 14px; color: #737373; font-size: 0.78rem; line-height: 1.5;`;
const Places = styled.div`display: flex; gap: 8px; overflow-x: auto;`;
const PlaceButton = styled.button`min-width: 132px; min-height: 44px; border: 0; border-radius: 10px; background: #fff; text-align: left; padding: 10px; cursor: pointer;`;
const HanokLink = styled.a`display: inline-flex; align-items: center; min-height: 44px; margin-top: 12px; border-radius: 999px; background: #1f2937; color: #fff; padding: 0 14px; font-size: 0.86rem; font-weight: 700; text-decoration: none;`;

interface Props {
  places: Item[];
  onPlaceSelect: (place: Item) => void;
}

export default function CulturalDiscoveryCollection({ places, onPlaceSelect }: Props) {
  return <Section aria-label="한옥 문화 발견">
    <Eyebrow>HANOK CULTURE WALK</Eyebrow>
    <Title>동네에서 만나는 한옥 문화</Title>
    <Subtitle>한옥 공간이 오늘의 동네와 어떻게 이어지는지 발견해 보세요.</Subtitle>
    <EnglishContext lang="en">Discover how living Hanok culture connects places, people, and everyday neighborhoods.</EnglishContext>
    <Places>{places.slice(0, 3).map((place) => <PlaceButton key={place.id} type="button" aria-label={place.name} onClick={() => onPlaceSelect(place)}>{place.name}</PlaceButton>)}</Places>
    <HanokLink href="/hanok">한옥 문화 더 알아보기</HanokLink>
  </Section>;
}
