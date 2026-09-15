'use client';

import React from 'react';
import styled from '@emotion/styled';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SorimaruCategory } from '@/features/sorimaru-audio/types/sorimaru.types';
import { palette, meok, fontSize } from '@/design-system/tokens';

interface RealThemeCard {
  id: string;
  category: SorimaruCategory;
  title: string;
  subTitle: string;
  placeCount: number;
  audioCount: number;
  examples: string;
  gradient: string;
  accentColor: string;
  tag: string;
}

const REAL_THEMES: RealThemeCard[] = [
  {
    id: 'hanok',
    category: '한옥',
    title: '한옥과 고운 숨결',
    subTitle: '기와 지붕 아래 머무는 한국의 멋',
    placeCount: 9,
    audioCount: 19,
    examples: '남산골 한옥마을, 전주 한옥마을, 송도 한옥마을',
    gradient: 'linear-gradient(135deg, #2e261f 0%, #1c1814 100%)',
    accentColor: '#d4af37', // Gold
    tag: '한옥 19',
  },
  {
    id: 'palace',
    category: '궁',
    title: '궁궐과 전각의 역사',
    subTitle: '조선 왕조 500년 궁궐 건축의 서사',
    placeCount: 29,
    audioCount: 205,
    examples: '경복궁 근정전/영제교, 창덕궁, 덕수궁, 창경궁',
    gradient: 'linear-gradient(135deg, #381c19 0%, #1f0e0c 100%)',
    accentColor: '#e06d53', // Coral Red
    tag: '궁궐 205',
  },
  {
    id: 'gotaek',
    category: '고택',
    title: '고택과 선비의 집',
    subTitle: '세월을 품은 종택과 선비의 지혜',
    placeCount: 8,
    audioCount: 21,
    examples: '안동 하회마을 하동고택, 작천고택, 북촌댁',
    gradient: 'linear-gradient(135deg, #272b22 0%, #141712 100%)',
    accentColor: '#a1b88e', // Sage Green
    tag: '고택 21',
  },
  {
    id: 'bukchon',
    category: '북촌',
    title: '북촌 한옥길',
    subTitle: '궁궐 사이 고즈넉한 한옥 골목',
    placeCount: 3,
    audioCount: 12,
    examples: '북촌 솟을대문, 화경당, 가회동 한옥길',
    gradient: 'linear-gradient(135deg, #27252f 0%, #16151c 100%)',
    accentColor: '#9b90c2', // Lavender
    tag: '북촌 12',
  },
  {
    id: 'jeonju',
    category: '전주',
    title: '전주 한옥마을',
    subTitle: '소리문화와 전통 풍류가 살아있는 곳',
    placeCount: 18,
    audioCount: 37,
    examples: '전주 한옥마을, 전주소리문화관, 전통술박물관',
    gradient: 'linear-gradient(135deg, #33261a 0%, #1e160e 100%)',
    accentColor: '#e69d45', // Warm Ochre
    tag: '전주 37',
  },
  {
    id: 'market',
    category: '전통시장',
    title: '시장과 정겨운 장터',
    subTitle: '사람 냄새 가득한 우리 삶의 이야기',
    placeCount: 62,
    audioCount: 136,
    examples: '남대문시장, 부산 국제시장, 중앙전통시장',
    gradient: 'linear-gradient(135deg, #2b241e 0%, #191512 100%)',
    accentColor: '#d98b6c', // Terrakotta
    tag: '전통시장 136',
  },
];

const Section = styled.section`
  width: 100%;
  padding: 2rem 0;
`;

const SectionHeader = styled.div`
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: flex-end;
  }
`;

const CurationBadge = styled.span`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: ${palette.danpung[700]};
  text-transform: uppercase;
`;

const SectionTitle = styled.h2`
  margin-top: 0.25rem;
  font-family: inherit;
  font-size: ${fontSize['2xl']};
  font-weight: 600;
  color: ${meok[900]};

  @media (min-width: 640px) {
    font-size: ${fontSize['3xl']};
  }
`;

const SectionSubtitle = styled.p`
  margin-top: 0.5rem;
  font-size: ${fontSize.xs};
  color: ${meok[700]};

  @media (min-width: 640px) {
    margin-top: 0;
  }
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const ThemeCard = styled.div<{ isSelected: boolean; gradient: string; accentColor: string }>`
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border-radius: 1rem;
  padding: 1.5rem;
  background: ${(props) => props.gradient};
  border: 1px solid ${(props) => (props.isSelected ? props.accentColor : 'transparent')};
  transform: ${(props) => (props.isSelected ? 'scale(1.02)' : 'none')};
  box-shadow: ${(props) => (props.isSelected ? `0 0 0 2px ${props.accentColor}` : 'none')};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    opacity: 1;
  }

  &:hover .card-title {
    color: #fef3c7;
  }
`;

const CardTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const TagBadge = styled.span<{ accentColor: string }>`
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 600;
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  color: ${(props) => props.accentColor};
`;

const PlacesCount = styled.span`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
`;

const CardTitle = styled.h3`
  font-family: inherit;
  font-size: ${fontSize.xl};
  font-weight: 700;
  color: #ffffff;
  transition: color 0.2s ease;
`;

const CardSub = styled.p`
  margin-top: 0.375rem;
  font-size: ${fontSize.xs};
  color: rgba(255, 255, 255, 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardBottomRow = styled.div`
  margin-top: 1.25rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ExamplesText = styled.p`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 85%;
`;

const ArrowIcon = styled.span<{ isSelected: boolean; accentColor: string }>`
  font-size: ${fontSize.xs};
  color: ${(props) => props.accentColor};
  transition: transform 0.3s ease;
  transform: ${(props) => (props.isSelected ? 'translateX(4px)' : 'none')};
  font-weight: ${(props) => (props.isSelected ? '700' : '400')};

  ${ThemeCard}:hover & {
    transform: translateX(4px);
  }
`;

export const SorimaruThemeHeaderRail: React.FC = () => {
  const selectedCategory = useSorimaruAudioStore((s) => s.selectedCategory);
  const setSelectedCategory = useSorimaruAudioStore((s) => s.setSelectedCategory);

  return (
    <Section>
      <SectionHeader>
        <div>
          <CurationBadge>
            Sorimaru Audio Curation
          </CurationBadge>
          <SectionTitle>
            한국의 온기를 담은 6대 문화 테마
          </SectionTitle>
        </div>
        <SectionSubtitle>
          공공 문화유산 오디오 해설 실시간 연동 (총 6,524개 음원 중 엄선)
        </SectionSubtitle>
      </SectionHeader>

      <CardsGrid>
        {REAL_THEMES.map((theme) => {
          const isSelected = selectedCategory === theme.category;

          return (
            <ThemeCard
              key={theme.id}
              isSelected={isSelected}
              gradient={theme.gradient}
              accentColor={theme.accentColor}
              onClick={() => setSelectedCategory(theme.category)}
            >
              <CardTopRow>
                <TagBadge accentColor={theme.accentColor}>
                  {theme.tag} 오디오
                </TagBadge>
                <PlacesCount>
                  {theme.placeCount}개 장소
                </PlacesCount>
              </CardTopRow>

              <CardTitle className="card-title">
                {theme.title}
              </CardTitle>
              <CardSub>
                {theme.subTitle}
              </CardSub>

              <CardBottomRow>
                <ExamplesText>
                  {theme.examples}
                </ExamplesText>
                <ArrowIcon isSelected={isSelected} accentColor={theme.accentColor}>
                  →
                </ArrowIcon>
              </CardBottomRow>
            </ThemeCard>
          );
        })}
      </CardsGrid>
    </Section>
  );
};
