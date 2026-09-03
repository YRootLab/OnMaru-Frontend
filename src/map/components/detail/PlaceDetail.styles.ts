import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { lightPalette, darkPalette, meok } from '@/design-system/tokens';

export const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const DetailWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  overflow: hidden;
  outline: none;
`;

export const HeaderBar = styled.header`
  flex: none;
  height: 52px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  z-index: 5;
`;

export const HeaderBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 9999px;
  background: rgba(78, 89, 104, 0.08);
  color: ${meok[700]};
  font-size: 11.5px;
  font-weight: 700;
  border: none;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
    color: ${meok[400]};
  }
`;

export const BackToPopularBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px 5px 6px;
  border-radius: 9999px;
  background: rgba(78, 89, 104, 0.08);
  color: ${meok[900]};
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(78, 89, 104, 0.14);
    transform: translateX(-1.5px);
  }

  &:active {
    transform: scale(0.96);
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
    color: ${meok[100]};
  }
`;

export const CloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(25, 31, 40, 0.04);
  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(25, 31, 40, 0.08);
    color: ${meok[900]};
  }

  &:active {
    transform: scale(0.92);
  }
`;

export const ScrollBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  animation: ${fadeIn} 0.2s ease-out;
`;

export const TitleSection = styled.div`
  padding: 16px 16px 12px;
`;

export const PlaceTitle = styled.h2`
  margin: 0 0 4px;
  font-size: 19px;
  font-weight: 700;
  color: ${meok[900]};
  line-height: 1.35;
  letter-spacing: -0.02em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  outline: none;
`;

export const PlaceAddress = styled.p`
  margin: 0 0 10px;
  font-size: 13px;
  color: ${meok[500]};
`;

export const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const Badge = styled.span`
  padding: 3px 9px;
  border-radius: 9999px;
  font-size: 11.5px;
  font-weight: 500;
  color: ${meok[700]};
  background: rgba(78, 89, 104, 0.07);
  border: none;
`;

export const SmartFeatureRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

export const SmartFeatureChip = styled.span<{ $type?: 'free' | 'parking' | 'audio' | 'general' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  color: ${({ $type }) =>
    $type === 'audio' ? lightPalette.jangmi[700] : meok[700]};
  background: ${({ $type }) =>
    $type === 'audio' ? 'rgba(212, 32, 88, 0.08)' : 'rgba(78, 89, 104, 0.06)'};
  border: none;

  [data-theme='dark'] & {
    background: ${({ $type }) =>
      $type === 'audio' ? 'rgba(248, 78, 118, 0.15)' : 'rgba(255, 255, 255, 0.06)'};
    color: ${({ $type }) =>
      $type === 'audio' ? darkPalette.jangmi[400] : meok[400]};
  }
`;

export const HeroActionGrid = styled.div`
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding: 0 16px 14px;

  & > * {
    flex: 1;
    min-width: 0;
  }
`;

export const LiveWarmthMeter = styled.div`
  margin: 0 16px 12px;
  padding: 10px 14px;
  border-radius: 14px;
  background: #fbf8f2;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  box-sizing: border-box;

  [data-theme='dark'] & {
    background: #25221d;
  }
`;

export const LiveWarmthStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 700;
  color: ${meok[900]};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

export const LiveWarmthPulse = styled.span<{ $busy: boolean }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $busy }) => ($busy ? lightPalette.juhong[500] : lightPalette.hwanggeum[500])};
  box-shadow: 0 0 0 3px ${({ $busy }) => ($busy ? 'rgba(232, 90, 24, 0.2)' : 'rgba(245, 166, 35, 0.2)')};
`;

export const LiveWarmthCount = styled.span`
  font-size: 11px;
  color: ${lightPalette.juhong[500]};
  font-weight: 700;
  flex-shrink: 0;
  white-space: nowrap;
`;

export const HeroActionTile = styled.button<{ $highlight?: boolean; $isWarmth?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 10px 2px;
  border-radius: 14px;
  border: none;
  background: ${({ $highlight, $isWarmth }) =>
    $highlight
      ? 'rgba(212, 32, 88, 0.08)'
      : $isWarmth
        ? 'rgba(232, 90, 24, 0.08)'
        : 'rgba(78, 89, 104, 0.06)'};
  color: ${({ $highlight, $isWarmth }) =>
    $highlight
      ? lightPalette.jangmi[700]
      : $isWarmth
        ? lightPalette.juhong[500]
        : meok[700]};
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  text-decoration: none;

  &:hover {
    background: ${({ $highlight, $isWarmth }) =>
      $highlight
        ? 'rgba(212, 32, 88, 0.15)'
        : $isWarmth
          ? 'rgba(232, 90, 24, 0.15)'
          : 'rgba(78, 89, 104, 0.12)'};
    color: ${({ $highlight, $isWarmth }) =>
      $highlight
        ? lightPalette.jangmi[900]
        : $isWarmth
          ? lightPalette.juhong[700]
          : meok[900]};
    transform: translateY(-1.5px);
  }

  &:active {
    transform: scale(0.96);
  }

  [data-theme='dark'] & {
    background: ${({ $highlight, $isWarmth }) =>
      $highlight
        ? 'rgba(248, 78, 118, 0.15)'
        : $isWarmth
          ? 'rgba(248, 87, 0, 0.15)'
          : 'rgba(255, 255, 255, 0.06)'};
    color: ${({ $highlight, $isWarmth }) =>
      $highlight
        ? darkPalette.jangmi[400]
        : $isWarmth
          ? darkPalette.juhong[400]
          : meok[400]};
  }

  span {
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }
`;

export const HeroActionLink = styled.a`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 10px 2px;
  border-radius: 14px;
  border: none;
  background: rgba(78, 89, 104, 0.06);
  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  text-decoration: none;

  &:hover {
    background: rgba(78, 89, 104, 0.12);
    color: ${meok[900]};
    transform: translateY(-1.5px);
  }

  &:active {
    transform: scale(0.96);
  }

  span {
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }
`;

export const CoreInfoBox = styled.div`
  margin: 0 16px;
  padding: 16px;
  background: #f5f3ef;
  border-radius: 18px;
  border: none;
  display: flex;
  flex-direction: column;
  gap: 11px;

  [data-theme='dark'] & {
    background: #25221d;
  }
`;

export const CoreRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const CoreLabel = styled.span`
  font-size: 13px;
  color: ${meok[500]};
  flex-shrink: 0;
`;

export const CoreValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${meok[900]};
  text-align: right;
  word-break: keep-all;
`;

export const OverviewSection = styled.div`
  padding: 16px;
  margin-top: 6px;
`;

export const SectionTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: ${meok[900]};
`;

export const OverviewText = styled.p<{ $expanded: boolean }>`
  margin: 0;
  font-size: 13.5px;
  line-height: 1.7;
  color: ${meok[700]};
  word-break: keep-all;
  white-space: pre-line;

  ${({ $expanded }) =>
    !$expanded &&
    `
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
`;

export const ToggleMoreBtn = styled.button`
  margin-top: 6px;
  padding: 0;

  background: transparent;
  color: ${lightPalette.cheongrok[700]};
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

export const BottomActionArea = styled.div`
  flex: none;
  padding: 12px 16px;
  background: #ffffff;
  display: flex;
  gap: 8px;
`;

export const HeaderActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const BookmarkButton = styled.button<{ $active: boolean }>`
  flex: 1.1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 48px;
  border-radius: 16px;
  border: none;
  background: ${({ $active }) =>
    $active ? 'rgba(232, 90, 24, 0.1)' : 'rgba(78, 89, 104, 0.08)'};
  color: ${({ $active }) =>
    $active ? lightPalette.juhong[700] : meok[900]};
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $active }) =>
      $active ? 'rgba(232, 90, 24, 0.16)' : 'rgba(78, 89, 104, 0.14)'};
  }

  &:active {
    transform: scale(0.97);
  }

  [data-theme='dark'] & {
    background: ${({ $active }) =>
      $active ? 'rgba(248, 87, 0, 0.2)' : 'rgba(255, 255, 255, 0.08)'};
    color: ${({ $active }) =>
      $active ? darkPalette.juhong[200] : meok[200]};
  }
`;

export const ShareButton = styled.button`
  flex: 0.9;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 48px;
  border: none;
  border-radius: 16px;
  background: rgba(78, 89, 104, 0.08);
  color: ${meok[900]};
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(78, 89, 104, 0.14);
  }

  &:active {
    transform: scale(0.97);
  }
`;

export const NavButton = styled.a`
  flex: 1.6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 48px;
  border-radius: 16px;
  background: ${meok[900]};
  color: #ffffff;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${meok[700]};
  }

  &:active {
    transform: scale(0.97);
  }
`;

export const SkeletonBox = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

export const SkeletonImg = styled.div`
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 16px;
  background: rgba(78, 89, 104, 0.08);
`;

export const SkeletonLine = styled.div<{ $w: string; $h: string }>`
  width: ${({ $w }) => $w};
  height: ${({ $h }) => $h};
  border-radius: 4px;
  background: rgba(78, 89, 104, 0.08);
`;

export const ErrorBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

export const CinematicBanner = styled.div`
  margin: 12px 16px 6px;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(212, 32, 88, 0.08) 0%, rgba(248, 78, 118, 0.12) 100%);
  border: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  overflow: hidden;

  [data-theme='dark'] & {
    background: linear-gradient(135deg, rgba(248, 78, 118, 0.15) 0%, rgba(212, 32, 88, 0.18) 100%);
  }
`;

export const CinematicHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const CinematicBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 800;
  color: ${lightPalette.jangmi[500]};

  [data-theme='dark'] & {
    color: ${darkPalette.jangmi[400]};
  }
`;

export const CinematicDuration = styled.span`
  font-size: 11px;
  color: ${meok[500]};
  font-weight: 600;
`;

export const CinematicTitle = styled.h4`
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  color: ${meok[900]};
  line-height: 1.35;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

export const CinematicDesc = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${meok[700]};
  line-height: 1.4;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

export const CinematicStartButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 38px;
  margin-top: 4px;
  border: none;
  border-radius: 12px;
  background: ${lightPalette.jangmi[500]};
  color: #ffffff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${lightPalette.jangmi[700]};
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.98);
  }

  [data-theme='dark'] & {
    background: ${darkPalette.jangmi[500]};
  }
`;

