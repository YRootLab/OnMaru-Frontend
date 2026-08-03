'use client';

/*
  =============================================================
  📢 [안내 / NOTICE] 이 파일은 데모 / 프로토타입 임시 페이지입니다!
  =============================================================
  - 이 페이지는 공통 헤더/카테고리 네비게이션 확인용 데모 페이지입니다.
  - 정식 한옥 아카이브 개발 시 이 구조에 국한되지 않고 자유롭게 
    기능 확장 및 디자인을 마음껏 꾸미실 수 있습니다! 🇰🇷
  =============================================================
*/

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

const Container = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 40px 0 80px;
  font-family: 'SpoqaHanSansNeo', sans-serif;
  color: #1c1a17;
`;

const HeaderSection = styled.div`
  margin-bottom: 40px;
`;

const Subtitle = styled.span`
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: #a94d35;
  text-transform: uppercase;
  display: block;
  margin-bottom: 8px;
`;

const Title = styled.h1`
  font-family: 'MaruBuri', 'SpoqaHanSansNeo', serif;
  font-size: 32px;
  font-weight: 700;
  color: #191613;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
`;

const Description = styled.p`
  font-size: 15px;
  color: #655b4d;
  line-height: 1.6;
  margin: 0;
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
  border-bottom: 1px solid rgba(25, 22, 19, 0.1);
  padding-bottom: 16px;
  flex-wrap: wrap;
`;

const FilterTab = styled.button<{ active: boolean }>`
  background: ${({ active }) => (active ? '#1c1a17' : 'transparent')};
  color: ${({ active }) => (active ? '#ffffff' : '#655b4d')};
  border: 1px solid ${({ active }) => (active ? '#1c1a17' : 'rgba(25, 22, 19, 0.15)')};
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #1c1a17;
    color: ${({ active }) => (active ? '#ffffff' : '#1c1a17')};
  }
`;

const ArchiveGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
`;

const ArchiveCard = styled(motion.article)`
  background: #ffffff;
  border: 1px solid rgba(25, 22, 19, 0.08);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  }
`;

const CardImage = styled.div<{ bg: string }>`
  width: 100%;
  height: 200px;
  background-image: url(${({ bg }) => bg});
  background-size: cover;
  background-position: center;
  position: relative;
`;

const Badge = styled.span`
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(28, 26, 23, 0.75);
  backdrop-filter: blur(8px);
  color: #faf8f5;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
`;

const CardBody = styled.div`
  padding: 20px;
`;

const CardTitle = styled.h3`
  font-family: 'MaruBuri', 'SpoqaHanSansNeo', serif;
  font-size: 18px;
  font-weight: 700;
  color: #191613;
  margin: 0 0 8px;
`;

const CardDetail = styled.p`
  font-size: 13px;
  color: #655b4d;
  line-height: 1.6;
  margin: 0 0 16px;
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(25, 22, 19, 0.06);
  padding-top: 12px;
  font-size: 12px;
  color: #8c7e6c;
`;

const ARCHIVE_ITEMS = [
  {
    id: 1,
    title: '경복궁 집옥재 (集玉齋)',
    category: '궁궐 건축',
    description: '고종 황제의 서재로 사용된 건물로, 전통 한옥 구조에 중국풍 양식과 유리 창호가 결합된 19세기 대표 융합 한옥입니다.',
    period: '조선 후기 (1891년)',
    location: '서울 종로구 사직로',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    title: '강릉 선교장 (船橋莊)',
    category: '민가 주택',
    description: '300년 역사를 간직한 조선시대 사대부 가옥의 정수로, 활래정과 대청마루가 조화롭게 어우러진 자연과 인간의 인터페이스입니다.',
    period: '조선 중기 (1703년)',
    location: '강원도 강릉시 운정길',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    title: '안동 하회마을 충효당 (忠孝堂)',
    category: '종택 건축',
    description: '서애 류성룡 선생의 종택으로, 솟을대문과 툇마루의 정갈한 목조 건축미가 살아있는 한국 전통 문화유산입니다.',
    period: '조선 명종 연간',
    location: '경북 안동시 풍천면',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
  },
];

export default function ArchiveDemoPage() {
  const [activeCategory, setActiveCategory] = useState('전체');
  const categories = ['전체', '궁궐 건축', '민가 주택', '종택 건축'];

  const filteredItems = activeCategory === '전체'
    ? ARCHIVE_ITEMS
    : ARCHIVE_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <Container>
      <HeaderSection>
        <Subtitle>ON-MARU ARCHIVE</Subtitle>
        <Title>한옥 아카이브</Title>
        <Description>
          우리 한옥의 기단, 기둥, 마루부터 기와지붕까지 — 역사와 아름다움을 보존하는 3D 디지털 아카이브 체계입니다.
        </Description>
      </HeaderSection>

      <FilterBar>
        {categories.map((cat) => (
          <FilterTab
            key={cat}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </FilterTab>
        ))}
      </FilterBar>

      <ArchiveGrid>
        {filteredItems.map((item) => (
          <ArchiveCard
            key={item.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardImage bg={item.image}>
              <Badge>{item.category}</Badge>
            </CardImage>
            <CardBody>
              <CardTitle>{item.title}</CardTitle>
              <CardDetail>{item.description}</CardDetail>
              <CardMeta>
                <span>📍 {item.location}</span>
                <span>🏛️ {item.period}</span>
              </CardMeta>
            </CardBody>
          </ArchiveCard>
        ))}
      </ArchiveGrid>
    </Container>
  );
}
