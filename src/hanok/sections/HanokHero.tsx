'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { transientProps } from '@/design-system/styled';
import { meok, lightPalette } from '@/design-system/tokens';
import { IoSparklesOutline, IoArrowForwardOutline } from 'react-icons/io5';
import type { Village } from '@/hanok/types';

const HeroContainer = styled.section`
  position: relative;
  width: 100%;
  border-radius: 28px;
  overflow: hidden;

  background: #191f28;
  color: #ffffff;
  margin-bottom: 56px;
`;

const SlideImage = styled(motion.div, transientProps)<{ $bg: string }>`
  position: absolute;
  inset: 0;
  background-image: url(${({ $bg }) => $bg});
  background-size: cover;
  background-position: center;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(25, 31, 40, 0.2) 0%,
      rgba(25, 31, 40, 0.5) 50%,
      rgba(25, 31, 40, 0.92) 100%
    );
  }
`;

const ContentOverlay = styled.div`
  position: relative;
  z-index: 2;
  padding: clamp(36px, 6vw, 64px) clamp(24px, 5vw, 48px);
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`;

const EyebrowBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;

  margin-bottom: 16px;
  width: fit-content;

  span.stamp {
    color: ${lightPalette.kobalt[200]};
  }
`;

const Title = styled.h2`
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
`;

const Description = styled.p`
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.65;
  max-width: 680px;
  margin: 0 0 24px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const Indicators = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Dot = styled.button<{ $active: boolean }>`
  width: ${({ $active }) => ($active ? '28px' : '8px')};
  height: 8px;
  border-radius: 9999px;
  background: ${({ $active }) =>
    $active ? lightPalette.kobalt[400] : 'rgba(255, 255, 255, 0.35)'};

  cursor: pointer;
  transition: all 0.3s ease;
`;

const DetailBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  color: ${meok[900]};
  font-size: 14px;
  font-weight: 600;
  padding: 10px 22px;
  border-radius: 9999px;

  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease;

  &:hover {
    background: ${lightPalette.kobalt[50]};
    color: ${lightPalette.kobalt[700]};
    transform: translateY(-2px);
  }
`;

interface HanokHeroProps {
  villages: Village[];
  onSelectVillage: (v: Village) => void;
}

export default function HanokHero({ villages, onSelectVillage }: HanokHeroProps) {
  const featured = React.useMemo(() => {
    return [...villages]
      .filter((v) => v.hasImage && v.image)
      .sort((a, b) => {
        const scoreA = (a.badges.includes('세계유산') ? 100 : 0) + (a.badges.includes('국가지정') ? 50 : 0) + a.badges.length;
        const scoreB = (b.badges.includes('세계유산') ? 100 : 0) + (b.badges.includes('국가지정') ? 50 : 0) + b.badges.length;
        return scoreB - scoreA;
      })
      .slice(0, 4);
  }, [villages]);

  const [index, setIndex] = useState(0);

  if (featured.length === 0) return null;

  const current = featured[index % featured.length];

  return (
    <HeroContainer>
      <AnimatePresence mode="wait">
        <SlideImage
          key={current.id}
          $bg={current.image!}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      </AnimatePresence>

      <ContentOverlay>
        <EyebrowBadge>
          <span className="stamp" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <IoSparklesOutline size={13} /> 온마루 스페셜 큐레이션
          </span>
          <span>{current.region} · {current.type}</span>
        </EyebrowBadge>

        <Title>{current.name}</Title>
        <Description>{current.summary || current.overview}</Description>

        <ControlsRow>
          <Indicators>
            {featured.map((item, i) => (
              <Dot
                key={item.id}
                $active={i === index}
                onClick={() => setIndex(i)}
                aria-label={`추천 한옥 ${i + 1}번째로 이동`}
              />
            ))}
          </Indicators>

          <DetailBtn onClick={() => onSelectVillage(current)}>
            자세히 보기 <IoArrowForwardOutline size={14} />
          </DetailBtn>
        </ControlsRow>
      </ContentOverlay>
    </HeroContainer>
  );
}
