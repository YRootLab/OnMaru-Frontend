import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { meok, lightPalette } from '@/design-system/tokens';

export const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(25, 31, 40, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 99999;
  display: grid;
  place-items: center;
  padding: 24px;
`;

export const ModalCard = styled(motion.div)`
  background: #ffffff;
  border-radius: 28px;
  max-width: 720px;
  width: 100%;
  max-height: 88vh;
  overflow-y: auto;
  position: relative;

  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export const ImageHero = styled.div<{ $bg: string | null }>`
  position: relative;
  width: 100%;
  height: 300px;
  background-color: rgba(78, 89, 104, 0.08);
  transition: background-image 0.3s ease;
  ${({ $bg }) =>
    $bg
      ? `background-image: url("${$bg}"); background-size: cover; background-position: center;`
      : 'background: linear-gradient(135deg, #2B5CE6 0%, #1A3898 100%);'}

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0) 40%, rgba(14, 20, 36, 0.8) 100%);
  }
`;

export const CloseBtn = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 38px;
  height: 38px;
  border-radius: 50%;

  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  color: ${meok[900]};
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.18s ease, background 0.18s ease;

  &:hover {
    transform: scale(1.08);
    background: #ffffff;
  }
`;

export const HeroContent = styled.div`
  position: absolute;
  bottom: 20px;
  left: 24px;
  right: 24px;
  z-index: 2;
  color: #ffffff;
`;

export const HeroRegion = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${lightPalette.kobalt[100]};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const HeroTitle = styled.h2`
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: clamp(24px, 3.5vw, 32px);
  font-weight: 700;
  margin: 4px 0 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  color: #ffffff;
`;

export const Body = styled.div`
  padding: 24px 28px 32px;
`;

export const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

export const TypeBadge = styled.span`
  background: ${lightPalette.kobalt[50]};
  color: ${lightPalette.kobalt[700]};
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 9999px;

`;

export const AddrText = styled.span`
  font-size: 13px;
  color: ${meok[500]};
`;

export const CuratorsNoteSection = styled.div`
  background: #f8fbff;

  border-radius: 20px;
  padding: 20px 22px;
  margin-bottom: 24px;
`;

export const NoteHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: ${lightPalette.kobalt[500]};
  margin-bottom: 12px;
`;

export const HeaderBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const SourceTag = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #1a49c6;
  background: #eef3ff;
  padding: 3px 9px;
  border-radius: 6px;
`;

export const StoryContainer = styled.div<{ $isExpanded: boolean }>`
  position: relative;
  ${({ $isExpanded }) =>
    !$isExpanded &&
    `
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
`;

export const StoryParagraph = styled.p`
  font-size: 14px;
  color: ${meok[700]};
  line-height: 1.78;
  margin: 0 0 14px;
  letter-spacing: -0.01em;
  word-break: keep-all;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

export const ExpandBtn = styled.button`

  background: transparent;
  color: ${lightPalette.kobalt[500]};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 0 0;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    text-decoration: underline;
  }
`;

export const SectionTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: ${meok[900]};
  margin: 24px 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
`;

export const InfoCard = styled.div`
  background: #fcfcfd;

  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

export const InfoIconBox = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: ${lightPalette.kobalt[50]};
  color: ${lightPalette.kobalt[500]};
  display: grid;
  place-items: center;
  flex-shrink: 0;
`;

export const InfoContentBox = styled.div`
  flex: 1;
  min-width: 0;
`;

export const InfoLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${meok[500]};
  margin-bottom: 3px;
`;

export const InfoVal = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${meok[700]};
  line-height: 1.5;
  word-break: keep-all;

  a {
    color: ${lightPalette.kobalt[500]};
    text-decoration: underline;
    font-weight: 600;
    &:hover {
      color: ${lightPalette.kobalt[700]};
    }
  }
`;

export const RepeatList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
`;

export const RepeatItemCard = styled.div`
  background: rgba(248, 250, 255, 0.7);

  border-radius: 12px;
  padding: 12px 16px;
`;

export const RepeatTitleText = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${lightPalette.kobalt[700]};
  margin-bottom: 4px;
`;

export const RepeatContentText = styled.div`
  font-size: 13px;
  color: ${meok[700]};
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: keep-all;
`;

export const GallerySection = styled.div`
  margin-bottom: 24px;
`;

export const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-top: 10px;
`;

export const GalleryThumb = styled.button<{ $active: boolean }>`
  aspect-ratio: 4 / 3;
  border-radius: 10px;
  overflow: hidden;

  padding: 0;
  background: #eee;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;

  &:hover {
    transform: scale(1.04);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const OverviewSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
`;

const shimmer = `
  @keyframes shimmer {
    0% { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
`;

export const SkeletonLine = styled.div`
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, ${meok[200]} 25%, #e8e8e8 50%, ${meok[200]} 75%);
  background-size: 800px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  ${shimmer}
`;

export const BadgeTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${meok[500]};
  margin-bottom: 8px;
`;

export const BadgeList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
`;

export const TagBadge = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${lightPalette.kobalt[700]};
  background: ${lightPalette.kobalt[50]};
  padding: 4px 11px;
  border-radius: 9999px;

`;

export const ActionRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

export const MapBtn = styled.a`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 48px;
  background: ${lightPalette.kobalt[500]};
  color: #ffffff;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s ease, transform 0.15s ease;

  &:hover {
    background: ${lightPalette.kobalt[700]};
  }

  &:active {
    transform: scale(0.98);
  }
`;
