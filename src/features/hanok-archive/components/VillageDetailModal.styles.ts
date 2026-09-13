import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { meok, palette, surface, fluidHeading, fontSize } from '@/design-system/tokens';

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
  border: none;
  box-shadow: none;

  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  [data-theme='dark'] & {
    background: ${surface.dark.card};
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
      : 'background: linear-gradient(135deg, #1C1A17 0%, #2D2924 100%);'}

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
  border: none;
  box-shadow: none;
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
  left: 28px;
  right: 28px;
  z-index: 4;
`;

export const HeroRegion = styled.span`
  display: inline-block;
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${palette.hwanggeum[200]};
  margin-bottom: 6px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

export const HeroTitle = styled.h2`
  font-family: var(--font-hanok);
  font-size: ${fluidHeading.feature};
  font-weight: 400;
  margin: 0;
  line-height: 1.25;
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
  background: ${palette.cheongrok[50]};
  color: ${palette.cheongrok[700]};
  font-size: ${fontSize.xs};
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 9999px;
  border: none;
  box-shadow: none;

  [data-theme='dark'] & {
    background: rgba(0, 196, 113, 0.15);
    color: ${palette.cheongrok[400]};
  }
`;

export const AddrText = styled.span`
  font-size: ${fontSize.xs};
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

export const CuratorsNoteSection = styled.div`
  background: #f5f5f4;
  border-radius: 20px;
  padding: 20px 22px;
  margin-bottom: 24px;
  border: none;
  box-shadow: none;

  [data-theme='dark'] & {
    background: #24211D;
  }
`;

export const NoteHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: ${fontSize.xs};
  font-weight: 600;
  color: ${palette.cheongrok[700]};
  margin-bottom: 12px;

  [data-theme='dark'] & {
    color: ${palette.cheongrok[400]};
  }
`;

export const HeaderBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const SourceTag = styled.span`
  font-size: ${fontSize.micro};
  font-weight: 500;
  color: ${meok[700]};
  background: ${meok[200]};
  padding: 3px 9px;
  border-radius: 6px;
  border: none;
  box-shadow: none;

  [data-theme='dark'] & {
    color: ${meok[400]};
    background: rgba(255, 255, 255, 0.08);
  }
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
  font-size: ${fontSize.sm};
  font-weight: 400;
  color: ${meok[700]};
  line-height: 1.78;
  margin: 0 0 14px;
  letter-spacing: -0.01em;
  word-break: keep-all;

  &:last-of-type {
    margin-bottom: 0;
  }

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

export const ExpandBtn = styled.button`
  background: transparent;
  color: ${palette.cheongrok[700]};
  font-size: ${fontSize.xs};
  font-weight: 600;
  cursor: pointer;
  padding: 6px 0 0;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;

  &:hover {
    text-decoration: underline;
  }

  [data-theme='dark'] & {
    color: ${palette.cheongrok[400]};
  }
`;

export const SectionTitle = styled.h3`
  font-size: ${fontSize.base};
  font-weight: 400;
  color: ${meok[900]};
  margin: 24px 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
`;

export const InfoCard = styled.div`
  background: #f5f5f4;
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  border: none;
  box-shadow: none;

  [data-theme='dark'] & {
    background: #24211D;
  }
`;

export const InfoIconBox = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: ${palette.cheongrok[50]};
  color: ${palette.cheongrok[700]};
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border: none;

  [data-theme='dark'] & {
    background: rgba(0, 196, 113, 0.15);
    color: ${palette.cheongrok[400]};
  }
`;

export const InfoContentBox = styled.div`
  flex: 1;
  min-width: 0;
`;

export const InfoLabel = styled.div`
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${meok[500]};
  margin-bottom: 3px;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

export const InfoVal = styled.div`
  font-size: ${fontSize.xs};
  font-weight: 400;
  color: ${meok[700]};
  line-height: 1.5;
  word-break: keep-all;

  a {
    color: ${palette.cheongrok[700]};
    text-decoration: underline;
    font-weight: 500;
    &:hover {
      color: ${palette.cheongrok[900]};
    }
  }

  [data-theme='dark'] & {
    color: ${meok[400]};
    a {
      color: ${palette.cheongrok[400]};
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
  background: #f5f5f4;
  border-radius: 12px;
  padding: 12px 16px;
  border: none;
  box-shadow: none;

  [data-theme='dark'] & {
    background: #24211D;
  }
`;

export const RepeatTitleText = styled.div`
  font-size: ${fontSize.xs};
  font-weight: 600;
  color: ${palette.cheongrok[700]};
  margin-bottom: 4px;

  [data-theme='dark'] & {
    color: ${palette.cheongrok[400]};
  }
`;

export const RepeatContentText = styled.div`
  font-size: ${fontSize.xs};
  color: ${meok[700]};
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
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
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 10px;
  overflow: hidden;
  border: ${({ $active }) => ($active ? `2px solid ${palette.cheongrok[700]}` : 'none')};
  box-shadow: none;
  padding: 0;
  background: #eee;
  cursor: zoom-in;
  transition: transform 0.18s ease;

  &:hover {
    transform: scale(1.04);
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
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

  [data-theme='dark'] & {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.06) 25%,
      rgba(255, 255, 255, 0.14) 50%,
      rgba(255, 255, 255, 0.06) 75%
    );
    background-size: 800px 100%;
  }
`;

export const BadgeTitle = styled.div`
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${meok[500]};
  margin-bottom: 8px;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

export const BadgeList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
`;

export const TagBadge = styled.span`
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${palette.cheongrok[700]};
  background: ${palette.cheongrok[50]};
  padding: 4px 11px;
  border-radius: 9999px;
  border: none;
  box-shadow: none;

  [data-theme='dark'] & {
    color: ${palette.cheongrok[400]};
    background: rgba(0, 196, 113, 0.15);
  }
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
  background: ${meok[900]};
  color: #ffffff;
  border-radius: 14px;
  font-size: ${fontSize.sm};
  font-weight: 500;
  text-decoration: none;
  border: none;
  box-shadow: none;
  transition: background 0.15s ease, transform 0.15s ease;

  &:hover {
    background: #000000;
  }

  &:active {
    transform: scale(0.98);
  }

  [data-theme='dark'] & {
    background: ${meok[200]};
    color: ${meok[900]};
    &:hover {
      background: #ffffff;
    }
  }
`;

export const BookingModalBtn = styled.a`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 48px;
  background: ${palette.cheongrok[700]};
  color: #ffffff;
  border-radius: 14px;
  font-size: ${fontSize.sm};
  font-weight: 500;
  text-decoration: none;
  border: none;
  box-shadow: none;
  transition: background 0.15s ease, transform 0.15s ease;

  &:hover {
    background: ${palette.cheongrok[900]};
  }

  &:active {
    transform: scale(0.98);
  }

  [data-theme='dark'] & {
    background: ${palette.cheongrok[500]};
    &:hover {
      background: ${palette.cheongrok[400]};
    }
  }
`;

export const BookmarkBtn = styled.button<{ $bookmarked: boolean }>`
  position: absolute;
  top: 16px;
  right: 64px;
  z-index: 10;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: ${({ $bookmarked }) => ($bookmarked ? palette.cheongrok[50] : 'rgba(255, 255, 255, 0.9)')};
  backdrop-filter: blur(8px);
  color: ${({ $bookmarked }) => ($bookmarked ? palette.cheongrok[700] : meok[900])};
  cursor: pointer;
  display: grid;
  place-items: center;
  border: none;
  box-shadow: none;
  transition: transform 0.18s ease, background 0.18s ease;

  &:hover {
    transform: scale(1.08);
    background: #ffffff;
  }
`;

export const BookmarkActionBtn = styled.button<{ $bookmarked: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 48px;
  padding: 0 18px;
  border-radius: 14px;
  font-size: ${fontSize.sm};
  font-weight: 500;
  cursor: pointer;
  border: none;
  box-shadow: none;
  background: ${({ $bookmarked }) => ($bookmarked ? palette.cheongrok[50] : '#f5f5f4')};
  color: ${({ $bookmarked }) => ($bookmarked ? palette.cheongrok[700] : meok[700])};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $bookmarked }) => ($bookmarked ? palette.cheongrok[100] : '#eaeaea')};
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.98);
  }

  [data-theme='dark'] & {
    background: ${({ $bookmarked }) => ($bookmarked ? 'rgba(0, 196, 113, 0.2)' : 'rgba(255, 255, 255, 0.08)')};
    color: ${({ $bookmarked }) => ($bookmarked ? palette.cheongrok[400] : meok[400])};
  }
`;

export const HeroZoomBadge = styled.button`
  position: absolute;
  bottom: 20px;
  right: 24px;
  z-index: 5;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: none;
  box-shadow: none;
  color: #ffffff;
  font-size: ${fontSize.xs};
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 9999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.18s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: scale(1.04);
  }
`;

export const LightboxOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 1000000;
  background: rgba(10, 12, 16, 0.94);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  user-select: none;
`;

export const LightboxCloseBtn = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  color: #ffffff;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.18s ease;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.08);
  }
`;

export const LightboxImageWrapper = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const LightboxImg = styled(motion.img)`
  max-width: 90vw;
  max-height: 78vh;
  object-fit: contain;
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.75);
`;

export const LightboxNavBtn = styled.button<{ $dir: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${({ $dir }) => ($dir === 'left' ? 'left: 24px;' : 'right: 24px;')}
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(10px);
  color: #ffffff;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.18s ease;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.35);
    transform: translateY(-50%) scale(1.1);
  }

  @media (max-width: 640px) {
    width: 40px;
    height: 40px;
    ${({ $dir }) => ($dir === 'left' ? 'left: 12px;' : 'right: 12px;')}
  }
`;

export const LightboxFooter = styled.div`
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #ffffff;
  font-size: ${fontSize.sm};
`;

export const LightboxCounter = styled.span`
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(8px);
  padding: 4px 14px;
  border-radius: 9999px;
  font-size: ${fontSize.xs};
  font-weight: 500;
  letter-spacing: 0.05em;
`;
