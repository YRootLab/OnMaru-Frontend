'use client';

import { FormEvent, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Bookmark01Icon,
  Copy01Icon,
  Search01Icon,
  StarIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from '@hugeicons/core-free-icons';
import { surface } from '@/design-system/tokens';
import type { ExplorationSummary, ExplorationTurn } from '../domain/conversation';
import type { JourneyBoard, PlaceResource } from '../types/exploration.types';

type Props = {
  explorations: ExplorationSummary[];
  activeExplorationId: string | null;
  turns: ExplorationTurn[];
  pendingQuery: string | null;
  progressMessage: string | null;
  loading: boolean;
  loadingOlder: boolean;
  hasOlderTurns: boolean;
  error: string | null;
  onSelectConversation: (explorationId: string | null) => void;
  onLoadOlder: () => void;
  onSend: (query: string) => Promise<void>;
  onCancel: () => Promise<void>;
};

const Page = styled.main`
  min-height: 100dvh;
  padding: 68px 20px 24px;
  background: #f8f8f7;
  color: #202124;

  [data-theme='dark'] & {
    background: ${surface.dark.app};
    color: #f5f5f5;
  }

  @media (max-width: 720px) {
    padding: 68px 0 0;
  }
`;

const Layout = styled.div`
  width: min(calc(100% - 40px), 1140px);
  min-height: calc(100dvh - 92px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid #e5e5e3;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 18px 56px rgba(25, 25, 25, 0.08);

  [data-theme='dark'] & {
    background: ${surface.dark.card};
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 18px 56px rgba(0, 0, 0, 0.4);
  }

  @media (max-width: 720px) {
    width: 100%;
    grid-template-columns: 1fr;
    min-height: calc(100dvh - 68px);
    border-radius: 0;
    border-inline: 0;
  }
`;

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-right: 1px solid #e5e5e3;
  background: #f5f5f4;

  [data-theme='dark'] & {
    background: ${surface.dark.surface};
    border-color: rgba(255, 255, 255, 0.08);
  }

  @media (max-width: 720px) {
    flex-direction: row;
    overflow-x: auto;
    border-right: 0;
    border-bottom: 1px solid #e5e5e3;
    padding: 10px 12px;
    gap: 8px;
    scrollbar-width: none;

    [data-theme='dark'] & {
      border-color: rgba(255, 255, 255, 0.08);
    }
  }
`;

const NewChatButton = styled.button`
  margin: 16px;
  padding: 11px 14px;
  border: 0;
  border-radius: 12px;
  background: #FF5500;
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover { background: #E64C00; }

  [data-theme='dark'] & {
    background: #FF6A10;
    &:hover { background: #FF8840; }
  }

  @media (max-width: 720px) {
    margin: 0;
    white-space: nowrap;
  }
`;

const ConversationList = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  padding: 0 10px 14px;
  overflow-y: auto;

  @media (max-width: 720px) {
    flex-direction: row;
    overflow: visible;
    padding: 0;
  }
`;

const ConversationButton = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 11px 12px;
  border: 0;
  border-radius: 12px;
  background: ${({ $active }) => ($active ? '#FFF1E8' : 'transparent')};
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s ease;
  ${({ $active }) => $active ? 'border-left: 3px solid #FF5500; padding-left: 9px;' : ''}

  &:hover { background: ${({ $active }) => ($active ? '#FFF1E8' : '#e5e5e3')}; }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? 'rgba(255, 106, 16, 0.16)' : 'transparent')};
    ${({ $active }) => $active ? 'border-left-color: #FF6A10;' : ''}
    &:hover { background: ${({ $active }) => ($active ? 'rgba(255, 106, 16, 0.16)' : 'rgba(255, 255, 255, 0.06)')}; }
  }

  @media (max-width: 720px) {
    width: 190px;
    flex: 0 0 190px;
    border-left: 0;
    padding-left: 12px;
    ${({ $active }) => $active ? 'border-bottom: 2px solid #FF5500;' : ''}
  }
`;

const ConversationTitle = styled.span`
  display: block;
  overflow: hidden;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ConversationMeta = styled.span`
  display: block;
  margin-top: 4px;
  overflow: hidden;
  color: #777;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: rgba(216, 229, 255, 0.6);
  }
`;

const Chat = styled.section`
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-width: 0;
  min-height: 0;
  background: #fff;

  [data-theme='dark'] & {
    background: ${surface.dark.app};
  }
`;

const ChatHeader = styled.header`
  padding: 24px 24px 20px;
  border-bottom: 1px solid #ededeb;
  background: linear-gradient(180deg, rgba(255, 85, 0, 0.03) 0%, transparent 100%);

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.08);
    background: linear-gradient(180deg, rgba(255, 106, 16, 0.06) 0%, transparent 100%);
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(20px, 2.6vw, 28px);
  font-weight: 700;
  letter-spacing: -0.035em;
`;

const Subtitle = styled.p`
  margin: 5px 0 0;
  color: #737373;
  font-size: 13px;
  line-height: 1.5;

  [data-theme='dark'] & {
    color: rgba(216, 229, 255, 0.65);
  }
`;

const Transcript = styled.div`
  min-height: 0;
  overflow-y: auto;
  padding: 28px clamp(16px, 4vw, 56px);
`;

const LoadOlderButton = styled.button`
  display: block;
  margin: 0 auto 22px;
  padding: 8px 12px;
  border: 1px solid #dededc;
  border-radius: 999px;
  background: #fff;
  color: #4a4a4a;
  font: inherit;
  font-size: 13px;
  cursor: pointer;

  [data-theme='dark'] & {
    background: ${surface.dark.card};
    border-color: rgba(255, 255, 255, 0.12);
    color: #f5f5f5;

    &:hover {
      background: ${surface.dark.elevated};
    }
  }
`;

const MessageGroup = styled.article<{ $user?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ $user }) => ($user ? 'flex-end' : 'flex-start')};
  gap: 8px;
  margin: 0 0 24px;
`;

const Bubble = styled.div<{ $user?: boolean }>`
  max-width: min(700px, 88%);
  padding: 13px 16px;
  border-radius: ${({ $user }) => ($user ? '18px 18px 4px 18px' : '18px 18px 18px 4px')};
  background: ${({ $user }) => ($user ? '#FF5500' : '#f1f1ef')};
  color: ${({ $user }) => ($user ? '#fff' : '#242424')};
  font-size: 15px;
  line-height: 1.65;
  white-space: pre-wrap;

  [data-theme='dark'] & {
    background: ${({ $user }) => ($user ? '#CC4300' : surface.dark.card)};
    color: ${({ $user }) => ($user ? '#fff' : '#f5f5f5')};
  }
`;

const SEARCH_PREVIEWS = [
  { url: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=400&q=80', alt: '한옥 서촌' },
  { url: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=400&q=80', alt: '전주 한옥마을' },
  { url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80', alt: '경복궁 근정전' },
  { url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=400&q=80', alt: '인왕산 소나무길' },
  { url: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=400&q=80', alt: '창덕궁 후원' },
  { url: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=400&q=80', alt: '북촌 한옥 골목' },
];

function SparkleClusterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="2.5" r="2.2" fill="#1562FF" />
      <circle cx="9" cy="15.5" r="2.2" fill="#1562FF" />
      <circle cx="2.5" cy="9" r="2.2" fill="#1562FF" />
      <circle cx="15.5" cy="9" r="2.2" fill="#1562FF" />
    </svg>
  );
}

const SearchingCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: min(420px, 100%);
  padding: 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ededeb;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);

  [data-theme='dark'] & {
    background: ${surface.dark.surface};
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
`;

const SearchingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const SearchingTile = styled.div<{ $delay: number }>`
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  background: #dededc;
  animation: pulseShimmer 1.8s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  [data-theme='dark'] & {
    background: ${surface.dark.card};
  }

  @keyframes pulseShimmer {
    0%, 100% { opacity: 0.85; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.02); }
  }
`;

const SearchingStatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  color: #555;
  font-size: 14px;
  font-weight: 500;
  padding: 2px 4px;

  [data-theme='dark'] & {
    color: rgba(216, 229, 255, 0.8);
  }

  .sparkle-icon {
    display: inline-flex;
    animation: sparkleSpin 3s linear infinite;
  }

  @keyframes sparkleSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ResponseContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PlacesScroll = styled.div`
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 4px 2px 14px;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;

  & > article {
    scroll-snap-align: start;
  }
`;

const ResultPlaceCard = styled.article`
  width: min(320px, 85vw);
  flex: 0 0 min(320px, 85vw);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid #e5e5e3;
  background: #fff;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.09);
  }

  [data-theme='dark'] & {
    background: ${surface.dark.surface};
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);

    &:hover {
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.5);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover { transform: none; }
  }
`;

const ResultImageArea = styled.div`
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #dededc;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.04);
  }

  [data-theme='dark'] & {
    background: ${surface.dark.card};
  }
`;

const QuickActionOverlay = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  gap: 8px;
  z-index: 2;
`;

const QuickCircleButton = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(6px);
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);

  &:hover {
    transform: scale(1.08);
    background: #fff;
    color: #FF5500;
  }

  &.saved {
    background: #FF5500;
    color: #fff;
  }

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.15);
    background: rgba(23, 30, 43, 0.85);
    color: #f5f5f5;

    &:hover {
      background: ${surface.dark.elevated};
      color: #FF6A10;
    }

    &.saved {
      background: #FF6A10;
      color: #fff;
    }
  }
`;

const ResultCardBody = styled.div`
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ResultPlaceTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
  color: #1a1a1a;

  [data-theme='dark'] & {
    color: #f5f5f5;
  }
`;

const ResultMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;

  [data-theme='dark'] & {
    color: rgba(216, 229, 255, 0.65);
  }
`;

const RatingTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 600;
  color: #1a1a1a;

  [data-theme='dark'] & {
    color: #f5f5f5;
  }
`;

const ResultPlaceSummary = styled.p`
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: #555;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  [data-theme='dark'] & {
    color: rgba(216, 229, 255, 0.7);
  }
`;

const NarrativeBubble = styled.div`
  padding: 18px 20px;
  border-radius: 18px 18px 18px 4px;
  background: #fff;
  border: 1px solid #ededeb;
  color: #242424;
  font-size: 15px;
  line-height: 1.7;

  [data-theme='dark'] & {
    background: ${surface.dark.surface};
    border-color: rgba(255, 255, 255, 0.08);
    color: #f5f5f5;
  }
`;

const NarrativeText = styled.div`
  white-space: pre-wrap;
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #f0f0ee;

  [data-theme='dark'] & {
    border-top-color: rgba(255, 255, 255, 0.08);
  }
`;

const ActionIconButton = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid ${({ $active }) => ($active ? '#FF5500' : 'transparent')};
  background: ${({ $active }) => ($active ? '#FFF1E8' : 'transparent')};
  color: ${({ $active }) => ($active ? '#FF5500' : '#737373')};
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;

  &:hover {
    background: ${({ $active }) => ($active ? '#FFF1E8' : '#f0f0ee')};
    color: #1a1a1a;
  }

  [data-theme='dark'] & {
    border-color: ${({ $active }) => ($active ? '#FF6A10' : 'transparent')};
    background: ${({ $active }) => ($active ? 'rgba(255, 106, 16, 0.16)' : 'transparent')};
    color: ${({ $active }) => ($active ? '#FF6A10' : 'rgba(216, 229, 255, 0.6)')};

    &:hover {
      background: ${({ $active }) => ($active ? 'rgba(255, 106, 16, 0.16)' : 'rgba(255, 255, 255, 0.08)')};
      color: #f5f5f5;
    }
  }
`;

const CopiedBadge = styled.span`
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 2px 6px;
  border-radius: 4px;
  background: #1a1a1a;
  color: #fff;
  font-size: 11px;
  white-space: nowrap;

  [data-theme='dark'] & {
    background: #fff;
    color: #1a1a1a;
  }
`;

const Source = styled.p`
  margin: 8px 0 0;
  padding: 0;
  color: #777;
  font-size: 11px;

  [data-theme='dark'] & {
    color: rgba(216, 229, 255, 0.5);
  }
`;

const Empty = styled.div`
  max-width: 520px;
  margin: 0 auto;
  padding: 56px 24px;
  color: #5f5f5f;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;

  h2 {
    margin: 0 0 8px;
    color: #202124;
    font-size: clamp(22px, 2.6vw, 28px);
    font-weight: 700;
    letter-spacing: -0.02em;

    [data-theme='dark'] & { color: #f5f5f5; }
  }

  p {
    margin: 0;
    color: #737373;
    font-size: 15px;
    line-height: 1.6;
  }

  [data-theme='dark'] & { color: rgba(255, 255, 255, 0.5); }
`;

const EmptyIcon = styled.div`
  width: 72px;
  height: 72px;
  margin-bottom: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFF1E8 0%, #FFD9C0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;

  [data-theme='dark'] & {
    background: linear-gradient(135deg, rgba(255, 106, 16, 0.2) 0%, rgba(255, 136, 64, 0.1) 100%);
  }
`;

const SuggestionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 24px;
`;

const Suggestion = styled.button`
  padding: 10px 16px;
  border: 1px solid #FFD9C0;
  border-radius: 999px;
  background: #FFF9F6;
  color: #CC4300;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #FFF1E8;
    border-color: #FFB380;
    transform: translateY(-1px);
  }

  [data-theme='dark'] & {
    background: rgba(255, 106, 16, 0.1);
    border-color: rgba(255, 106, 16, 0.25);
    color: #FFB380;

    &:hover {
      background: rgba(255, 106, 16, 0.18);
      border-color: rgba(255, 106, 16, 0.4);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover { transform: none; }
  }
`;

const DEFAULT_SUGGESTED_KEYWORDS = [
  '주변 맛집도 함께 알려줘',
  '대중교통으로 가기 편해?',
  '주차 가능한 곳이야?',
  '비 오는 날 가도 괜찮아?',
  '아이와 함께 가기 좋은 코스는?',
  '사진 찍기 좋은 스팟은?',
];

const ComposerArea = styled.div`
  display: flex;
  flex-direction: column;
  border-top: 1px solid #ededeb;
  background: #fff;

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.08);
    background: ${surface.dark.app};
  }
`;

const QuickChipsRow = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 12px clamp(16px, 4vw, 56px) 6px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const QuickChipButton = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border: 1px solid #e5e5e3;
  border-radius: 999px;
  background: #fff;
  color: #242424;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  &:hover {
    background: #f8f8f7;
    border-color: #dcdcd9;
    transform: translateY(-1px);
  }

  [data-theme='dark'] & {
    background: ${surface.dark.card};
    border-color: rgba(255, 255, 255, 0.12);
    color: #f5f5f5;

    &:hover {
      background: ${surface.dark.elevated};
      border-color: rgba(255, 255, 255, 0.2);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover { transform: none; }
  }
`;

const Composer = styled.form`
  display: flex;
  gap: 10px;
  padding: 6px clamp(16px, 4vw, 56px) 12px;
`;

const ComposerNotice = styled.p`
  margin: 0;
  text-align: center;
  font-size: 11px;
  color: #999;
  padding: 0 16px 10px;

  [data-theme='dark'] & {
    color: rgba(216, 229, 255, 0.45);
  }
`;

const Input = styled.input`
  min-width: 0;
  flex: 1;
  padding: 13px 14px;
  border: 1px solid #d5d5d2;
  border-radius: 14px;
  background: #fff;
  color: inherit;
  font: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: #FF5500;
    box-shadow: 0 0 0 3px rgba(255, 85, 0, 0.08);
  }

  [data-theme='dark'] & {
    background: ${surface.dark.surface};
    border-color: rgba(255, 255, 255, 0.12);
    color: #f5f5f5;

    &:focus {
      border-color: #FF6A10;
      box-shadow: 0 0 0 3px rgba(255, 106, 16, 0.15);
    }
  }
`;

const SendButton = styled.button`
  padding: 0 18px;
  border: 0;
  border-radius: 14px;
  background: #FF5500;
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover { background: #E64C00; }
  &:disabled { cursor: not-allowed; opacity: 0.45; }

  [data-theme='dark'] & {
    background: #FF6A10;
    &:hover { background: #FF8840; }
  }
`;

function findPlaces(board: JourneyBoard | null): PlaceResource[] {
  return board?.resources.filter((resource): resource is PlaceResource => resource.ref.type === 'PLACE') ?? [];
}

function AssistantResponse({ turn }: { turn: ExplorationTurn }) {
  const { response } = turn;
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);

  if (response.status === 'PENDING') return null;
  if (response.status === 'CANCELLED') return <Bubble>요청이 취소되었어요.</Bubble>;
  if (response.status === 'FAILED') return <Bubble>요청을 완료하지 못했어요. {response.error?.requestId ? `요청 번호: ${response.error.requestId}` : ''}</Bubble>;
  if (response.outcome === 'NO_RESULTS') return <Bubble>{response.summary ?? '조건에 맞는 여행 결과를 찾지 못했어요.'}</Bubble>;

  const places = findPlaces(response.board);
  const textSummary = response.summary ?? (response.board ? response.board.querySummary : '여행 결과를 준비했어요.');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
    }
  };

  return (
    <ResponseContainer>
      {/* 3번째 결과 카드: 사진, 퀵 액션, 장소명, 카테고리/지역/평점, 요약 */}
      {places.length > 0 && (
        <PlacesScroll aria-label="추천 장소">
          {places.map((place, idx) => {
            const imageUrl = place.image?.url || SEARCH_PREVIEWS[idx % SEARCH_PREVIEWS.length].url;
            return (
              <ResultPlaceCard key={place.ref.id || idx} tabIndex={0}>
                <ResultImageArea>
                  <img src={imageUrl} alt={place.image?.alt || place.title} />
                  <QuickActionOverlay>
                    <QuickCircleButton
                      type="button"
                      aria-label={`${place.title} 지도에서 보기`}
                      title="지도에서 보기"
                      onClick={() => {
                        window.open(`/map?query=${encodeURIComponent(place.title)}`, '_blank');
                      }}
                    >
                      <HugeiconsIcon icon={Search01Icon} size={16} />
                    </QuickCircleButton>
                    <QuickCircleButton
                      type="button"
                      aria-label={`${place.title} 저장하기`}
                      title="저장하기"
                      onClick={(e) => {
                        e.currentTarget.classList.toggle('saved');
                      }}
                    >
                      <HugeiconsIcon icon={Bookmark01Icon} size={16} />
                    </QuickCircleButton>
                  </QuickActionOverlay>
                </ResultImageArea>
                <ResultCardBody>
                  <ResultPlaceTitle>{place.title}</ResultPlaceTitle>
                  <ResultMetaRow>
                    <span>{place.category}</span>
                    <span>·</span>
                    <span>{place.regionRef.id}</span>
                    <span>·</span>
                    <RatingTag>
                      <HugeiconsIcon icon={StarIcon} size={13} fill="#FEDC00" color="#FEDC00" />
                      <span>4.9</span>
                    </RatingTag>
                  </ResultMetaRow>
                  {place.summary && <ResultPlaceSummary>{place.summary}</ResultPlaceSummary>}
                </ResultCardBody>
              </ResultPlaceCard>
            );
          })}
        </PlacesScroll>
      )}

      {/* 4번째 결과 텍스트: 자연어 설명 + 좋아요/아쉬워요/복사 액션 */}
      <NarrativeBubble>
        <NarrativeText>{textSummary}</NarrativeText>
        {places.some((place) => place.image?.sourceName) && (
          <Source>사진 출처: {places.map((place) => place.image?.sourceName).filter(Boolean).join(', ')}</Source>
        )}
        <ActionRow>
          <ActionIconButton
            type="button"
            aria-label="도움이 되었어요"
            title="좋아요"
            $active={feedback === 'up'}
            onClick={() => setFeedback((prev) => (prev === 'up' ? null : 'up'))}
          >
            <HugeiconsIcon icon={ThumbsUpIcon} size={16} />
          </ActionIconButton>
          <ActionIconButton
            type="button"
            aria-label="아쉬워요"
            title="아쉬워요"
            $active={feedback === 'down'}
            onClick={() => setFeedback((prev) => (prev === 'down' ? null : 'down'))}
          >
            <HugeiconsIcon icon={ThumbsDownIcon} size={16} />
          </ActionIconButton>
          <ActionIconButton
            type="button"
            aria-label="답변 복사하기"
            title="복사"
            onClick={handleCopy}
          >
            <HugeiconsIcon icon={Copy01Icon} size={16} />
            {copied && <CopiedBadge>복사됨</CopiedBadge>}
          </ActionIconButton>
        </ActionRow>
      </NarrativeBubble>
    </ResponseContainer>
  );
}

export default function JourneyChatInterface({
  explorations,
  activeExplorationId,
  turns,
  pendingQuery,
  progressMessage,
  loading,
  loadingOlder,
  hasOlderTurns,
  error,
  onSelectConversation,
  onLoadOlder,
  onSend,
  onCancel,
}: Props) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isRunning = Boolean(progressMessage);

  const handleChipClick = (keyword: string) => {
    setDraft(keyword);
    inputRef.current?.focus();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const query = draft.trim();
    if (!query || isRunning) return;
    setDraft('');
    await onSend(query);
  };

  return (
    <Page data-chat-surface="conversation">
      <Layout>
        <Sidebar aria-label="여정 대화 목록">
          <NewChatButton type="button" onClick={() => onSelectConversation(null)}>새 대화</NewChatButton>
          <ConversationList>
            {explorations.map((conversation) => (
              <ConversationButton
                key={conversation.explorationId}
                type="button"
                $active={conversation.explorationId === activeExplorationId}
                onClick={() => onSelectConversation(conversation.explorationId)}
              >
                <ConversationTitle>{conversation.title}</ConversationTitle>
                <ConversationMeta>{conversation.lastUserQueryPreview ?? '여정 대화'}</ConversationMeta>
              </ConversationButton>
            ))}
          </ConversationList>
        </Sidebar>

        <Chat>
          <ChatHeader>
            <Title>여행을 같이 짜볼까요?</Title>
            <Subtitle>조건을 말해 주시면, 사진과 장소를 보며 함께 여행을 만들어 가요.</Subtitle>
          </ChatHeader>

          <Transcript aria-live="polite">
            {hasOlderTurns && <LoadOlderButton type="button" disabled={loadingOlder} onClick={onLoadOlder}>{loadingOlder ? '불러오는 중…' : '이전 대화 더 보기'}</LoadOlderButton>}
            {!activeExplorationId && !pendingQuery && (
              <Empty data-message-role="assistant">
                <EmptyIcon aria-hidden>🏛️</EmptyIcon>
                <h2>어떤 여행을 함께 만들어 볼까요?</h2>
                <p>장소, 분위기, 이동 시간처럼 원하는 조건을 편하게 말해 주세요.</p>
                <SuggestionRow>
                  {['비 오는 날 조용한 서울 산책', '아이와 함께 가기 좋은 한옥 여행', '전주에서 하루 동안 걷는 여행'].map((suggestion) => (
                    <Suggestion key={suggestion} type="button" onClick={() => void onSend(suggestion)}>{suggestion}</Suggestion>
                  ))}
                </SuggestionRow>
              </Empty>
            )}
            {loading && activeExplorationId && <Empty>대화를 불러오는 중이에요.</Empty>}
            {turns.map((turn) => (
              <div key={turn.turnId}>
                <MessageGroup $user><Bubble $user>{turn.query}</Bubble></MessageGroup>
                <MessageGroup data-message-role="assistant"><AssistantResponse turn={turn} /></MessageGroup>
              </div>
            ))}
            {pendingQuery && <MessageGroup $user><Bubble $user>{pendingQuery}</Bubble></MessageGroup>}
            {(isRunning || Boolean(progressMessage) || Boolean(pendingQuery)) && (
              <MessageGroup data-message-role="assistant">
                <SearchingCard>
                  <SearchingGrid>
                    {SEARCH_PREVIEWS.map((item, idx) => (
                      <SearchingTile key={idx} $delay={idx * 0.15}>
                        <img src={item.url} alt={item.alt} />
                      </SearchingTile>
                    ))}
                  </SearchingGrid>
                  <SearchingStatusRow>
                    <span className="sparkle-icon">
                      <SparkleClusterIcon />
                    </span>
                    <span>{progressMessage || '조건에 맞는 장소를 찾고 있어요…'}</span>
                  </SearchingStatusRow>
                </SearchingCard>
              </MessageGroup>
            )}
            {error && <MessageGroup><Bubble>{error}</Bubble></MessageGroup>}
          </Transcript>

          <ComposerArea>
            <QuickChipsRow aria-label="추천 질문 키워드">
              {DEFAULT_SUGGESTED_KEYWORDS.map((keyword) => (
                <QuickChipButton
                  key={keyword}
                  type="button"
                  onClick={() => handleChipClick(keyword)}
                >
                  {keyword}
                </QuickChipButton>
              ))}
            </QuickChipsRow>

            <Composer onSubmit={submit}>
              <Input
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="여행 조건을 이어서 물어보세요"
                aria-label="여행 질문"
                disabled={isRunning}
              />
              {isRunning ? (
                <SendButton type="button" onClick={() => void onCancel()}>취소</SendButton>
              ) : (
                <SendButton type="submit" disabled={!draft.trim()}>보내기</SendButton>
              )}
            </Composer>
            <ComposerNotice>AI 응답은 참고용 정보이며 실제 장소 상황과 다를 수 있습니다.</ComposerNotice>
          </ComposerArea>
        </Chat>
      </Layout>
    </Page>
  );
}
