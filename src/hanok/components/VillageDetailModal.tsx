'use client';

import React from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { meok, lightPalette } from '@/design-system/tokens';
import type { Village } from '@/hanok/types';

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(25, 31, 40, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 200;
  display: grid;
  place-items: center;
  padding: 24px;
`;

const ModalCard = styled(motion.div)`
  background: #ffffff;
  border-radius: 28px;
  max-width: 680px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
`;

const ImageHero = styled.div<{ $bg: string | null }>`
  position: relative;
  width: 100%;
  height: 280px;
  background-color: rgba(78, 89, 104, 0.08);
  ${({ $bg }) =>
    $bg
      ? `background-image: url("${$bg}"); background-size: cover; background-position: center;`
      : ''}

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0.6) 100%);
  }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  color: ${meok[900]};
  font-size: 18px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.18s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const HeroContent = styled.div`
  position: absolute;
  bottom: 20px;
  left: 24px;
  right: 24px;
  z-index: 2;
  color: #ffffff;
`;

const HeroRegion = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${lightPalette.kobalt[100]};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const HeroTitle = styled.h2`
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: clamp(24px, 3.5vw, 32px);
  font-weight: 700;
  margin: 4px 0 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
`;

const Body = styled.div`
  padding: 28px 32px 36px;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const TypeBadge = styled.span`
  background: ${lightPalette.kobalt[50]};
  color: ${lightPalette.kobalt[700]};
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 9999px;
`;

const AddrText = styled.span`
  font-size: 13px;
  color: ${meok[500]};
`;

const Overview = styled.p<{ $expanded?: boolean }>`
  font-size: 14.5px;
  color: ${meok[700]};
  line-height: 1.75;
  margin: 0 0 12px;
  white-space: pre-line;

  ${({ $expanded }) =>
    !$expanded
      ? `
    display: -webkit-box;
    -webkit-line-clamp: 10;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `
      : ''}
`;

const ExpandBtn = styled.button`
  border: none;
  background: transparent;
  color: ${lightPalette.kobalt[500]};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    text-decoration: underline;
  }
`;

const BadgeTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${meok[500]};
  margin-bottom: 10px;
`;

const BadgeList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 32px;
`;

const TagBadge = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${lightPalette.kobalt[700]};
  background: ${lightPalette.kobalt[50]};
  padding: 5px 12px;
  border-radius: 9999px;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 24px;
`;

const MapBtn = styled.a`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(135deg, ${lightPalette.kobalt[500]} 0%, ${lightPalette.kobalt[700]} 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  padding: 12px;
  border-radius: 9999px;
  text-decoration: none;
  transition: opacity 0.18s ease;

  &:hover {
    opacity: 0.88;
  }
`;

import { X, MapPin, ChevronDown, ArrowUpRight } from 'lucide-react';

interface VillageDetailModalProps {
  village: Village | null;
  onClose: () => void;
}

export default function VillageDetailModal({
  village,
  onClose,
}: VillageDetailModalProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    setIsExpanded(false);
  }, [village]);

  const rawOverview = village?.overview || village?.summary || '';
  const isLongText = rawOverview.length > 300;

  return (
    <AnimatePresence>
      {village && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <ModalCard
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <CloseBtn onClick={onClose} aria-label="닫기">
              <X size={18} />
            </CloseBtn>

            <ImageHero $bg={village.hasImage ? village.image : null}>
              <HeroContent>
                <HeroRegion>{village.region}</HeroRegion>
                <HeroTitle>{village.name}</HeroTitle>
              </HeroContent>
            </ImageHero>

            <Body>
              <MetaRow>
                <TypeBadge>{village.type}</TypeBadge>
                <AddrText>
                  <MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />
                  {village.addr}
                </AddrText>
              </MetaRow>

              <Overview $expanded={isExpanded}>{rawOverview}</Overview>

              {isLongText && !isExpanded && (
                <ExpandBtn onClick={() => setIsExpanded(true)}>
                  전체 내용 더보기 <ChevronDown size={14} />
                </ExpandBtn>
              )}

              {village.badges.length > 0 && (
                <>
                  <BadgeTitle>주요 특징 태그</BadgeTitle>
                  <BadgeList>
                    {village.badges.map((b) => (
                      <TagBadge key={b}>#{b}</TagBadge>
                    ))}
                  </BadgeList>
                </>
              )}

              <ActionRow>
                <MapBtn href={`/map?lat=${village.lat}&lng=${village.lng}`}>
                  <MapPin size={15} /> 지도에서 위치 탐색하기 <ArrowUpRight size={14} />
                </MapBtn>
              </ActionRow>
            </Body>
          </ModalCard>
        </Overlay>
      )}
    </AnimatePresence>
  );
}
