'use client';

import React, { useState, useCallback, useMemo } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  Award,
  Sparkles,
  CheckCircle2,
  Bot,
  User,
  Flame,
  Trophy,
  Crown,
  Swords,
  Search,
  PartyPopper,
} from 'lucide-react';
import { fontSize, palette, ringShadow } from '@/design-system/tokens';

const BOARD_SIZE = 11; // 11x11 traditional compact grid

type Stone = 'B' | 'W' | null; // B: Black (User), W: White (AI)

interface MiniOmokGameProps {
  isGenerationComplete?: boolean;
  onViewJourney?: () => void;
  onGoToWordSearch?: () => void;
}

const CONFETTI_COLORS = [
  '#FF5500', // 단청 주홍
  '#FFB800', // 황금 골드
  '#00C471', // 대청 청록
  '#FF2A85', // 연지 핑크
  '#4A6FA0', // 청화 코발트
  '#8B1BFF', // 자하 바이올렛
  '#FFFFFF', // 순백
];

const ConfettiParticle = styled(motion.div)<{ $color: string; $size: number; $isCircle?: boolean }>`
  position: absolute;
  width: ${({ $size }) => $size}px;
  height: ${({ $size, $isCircle }) => ($isCircle ? $size : $size * 1.8)}px;
  background: ${({ $color }) => $color};
  border-radius: ${({ $isCircle }) => ($isCircle ? '50%' : '2px')};
  pointer-events: none;
  z-index: 20;
`;

function FanfareConfetti() {
  const particles = useMemo(() => {
    return Array.from({ length: 48 }).map((_, i) => {
      const angle = (i / 48) * 360 + (Math.random() * 20 - 10);
      const rad = (angle * Math.PI) / 180;
      const distance = 85 + Math.random() * 115;
      const x = Math.cos(rad) * distance;
      const y = Math.sin(rad) * distance - 25;
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const size = 6 + Math.random() * 6;
      const isCircle = i % 3 === 0;
      const rotation = Math.random() * 720 - 360;
      const duration = 0.9 + Math.random() * 0.6;
      const delay = Math.random() * 0.15;

      return { id: i, x, y, color, size, isCircle, rotation, duration, delay };
    });
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30, overflow: 'hidden' }}>
      {particles.map((p) => (
        <ConfettiParticle
          key={p.id}
          $color={p.color}
          $size={p.size}
          $isCircle={p.isCircle}
          style={{ top: '50%', left: '50%' }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: p.x,
            y: [0, p.y - 20, p.y + 60],
            scale: [0, 1.2, 0.8],
            opacity: [1, 1, 0],
            rotate: p.rotation,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const StatusHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 330px;
  margin-bottom: 8px;
  font-size: ${fontSize.xs};
`;

const TurnBadge = styled.div<{ $isUserTurn: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 9999px;
  background: ${({ $isUserTurn }) =>
    $isUserTurn ? 'rgba(0, 184, 130, 0.10)' : 'rgba(212, 175, 55, 0.12)'};
  border: none;
  box-shadow: ${ringShadow.light.button};
  color: ${({ $isUserTurn }) => ($isUserTurn ? '#008a60' : '#b8941f')};
  font-weight: 600;
  font-size: 11.5px;

  [data-theme='dark'] & {
    box-shadow: ${ringShadow.dark.button};
    background: ${({ $isUserTurn }) =>
      $isUserTurn ? 'rgba(0, 184, 130, 0.16)' : 'rgba(212, 175, 55, 0.16)'};
    color: ${({ $isUserTurn }) => ($isUserTurn ? '#4ade80' : '#e5c058')};
  }
`;

const DifficultyBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #6b7280;
  background: rgba(0, 0, 0, 0.045);
  border: none;
  box-shadow: ${ringShadow.light.button};
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;

  [data-theme='dark'] & {
    color: #9ca3af;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: ${ringShadow.dark.button};
  }
`;

/* 모던한 플랫 원목 바둑판 - 반응형 최적화 */
const BoardContainer = styled.div`
  position: relative;
  width: min(330px, calc(100vw - 64px));
  height: min(330px, calc(100vw - 64px));
  max-width: 330px;
  max-height: 330px;
  aspect-ratio: 1;
  background: #deb887;
  border: none;
  border-radius: 12px;
  box-shadow: ${ringShadow.light.card};
  display: grid;
  grid-template-columns: repeat(${BOARD_SIZE}, 1fr);
  grid-template-rows: repeat(${BOARD_SIZE}, 1fr);
  padding: 8px;
  user-select: none;
  touch-action: manipulation;

  [data-theme='dark'] & {
    background: #2b241d;
    box-shadow: ${ringShadow.dark.card};
  }

  @media (max-width: 380px) {
    padding: 6px;
    border-radius: 10px;
  }
`;

const Cell = styled.button<{ $stone: Stone }>`
  position: relative;
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
  margin: 0;
  cursor: ${({ $stone }) => ($stone ? 'default' : 'pointer')};
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;

  /* Traditional Board Grid Lines */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1.5px;
    background: rgba(74, 48, 24, 0.45);
    transform: translateY(-50%);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 1.5px;
    background: rgba(74, 48, 24, 0.45);
    transform: translateX(-50%);
    pointer-events: none;
  }

  [data-theme='dark'] &::before,
  [data-theme='dark'] &::after {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const StarPointDot = styled.div`
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #3e2712;
  z-index: 1;
  pointer-events: none;
  border: none;
  box-shadow: none;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.4);
  }
`;

const StonePiece = styled(motion.div)<{ $color: 'B' | 'W'; $isLast?: boolean }>`
  position: absolute;
  width: 86%;
  height: 86%;
  border-radius: 50%;
  z-index: 2;
  border: none;

  ${({ $color }) =>
    $color === 'B'
      ? `
    background: radial-gradient(circle at 35% 35%, #2b323c 0%, #111317 100%);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.45), inset 0 -1.5px 3px rgba(255, 255, 255, 0.12);

    [data-theme='dark'] & {
      background: radial-gradient(circle at 35% 35%, #333842 0%, #0c0e11 100%);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.65), inset 0 -1.5px 3px rgba(255, 255, 255, 0.16);
    }
  `
      : `
    background: radial-gradient(circle at 35% 35%, #ffffff 0%, #e2e8f0 100%);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.22), inset 0 -1.5px 3px rgba(0, 0, 0, 0.08);

    [data-theme='dark'] & {
      background: radial-gradient(circle at 35% 35%, #ffffff 0%, #d1d5db 100%);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.40), inset 0 -1.5px 3px rgba(0, 0, 0, 0.12);
    }
  `}

  ${({ $isLast }) =>
    $isLast &&
    `
    &::after {
      content: '';
      position: absolute;
      width: 6px;
      height: 6px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: #e11d48;
      border: none;
      box-shadow: 0 0 4px rgba(225, 29, 72, 0.6);
    }
  `}
`;

const ControlsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 330px;
  margin-top: 8px;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 7px;
  background: rgba(0, 0, 0, 0.045);
  border: none;
  box-shadow: ${ringShadow.light.button};
  color: #374151;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
    box-shadow: ${ringShadow.dark.button};
    color: #e5e7eb;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.075);
    color: #111827;
    box-shadow: ${ringShadow.light.buttonHoverGlow};
    transform: translateY(-1px);

    [data-theme='dark'] & {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
      box-shadow: ${ringShadow.dark.buttonHoverGlow};
    }
  }

  &:active {
    transform: scale(0.96);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const FinishedBanner = styled(motion.div)`
  width: 100%;
  max-width: 330px;
  background: rgba(0, 184, 130, 0.08);
  border: none;
  box-shadow: ${ringShadow.light.card};
  border-radius: 10px;
  padding: 8px 12px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  [data-theme='dark'] & {
    background: rgba(0, 184, 130, 0.12);
    box-shadow: ${ringShadow.dark.card};
  }
`;

const CompleteText = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #191f28;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const ViewJourneyBtn = styled.button`
  background: ${palette.juhong[500]};
  color: #ffffff;
  border: none;
  box-shadow: 0 3px 10px rgba(255, 85, 0, 0.32);
  padding: 6px 12px;
  border-radius: 7px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: ${palette.juhong[600]};
    transform: scale(1.03);
    box-shadow: 0 4px 14px rgba(255, 85, 0, 0.42);
  }

  &:active {
    transform: scale(0.96);
  }
`;

const WinnerOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 12px;
  text-align: center;
  border: none;
  box-shadow: ${ringShadow.light.cardHoverGlow};

  [data-theme='dark'] & {
    background: rgba(28, 26, 23, 0.96);
    box-shadow: ${ringShadow.dark.cardHoverGlow};
  }
`;

const WinnerTitle = styled.div`
  font-size: 16.5px;
  font-weight: 700;
  color: #191f28;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const WinnerDesc = styled.div`
  font-size: 12px;
  color: #6b7280;
  max-width: 240px;

  [data-theme='dark'] & {
    color: #a1a1aa;
  }
`;

const WinnerIconWrap = styled.div<{ $winner: Stone | 'DRAW' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  box-shadow: ${ringShadow.light.button};
  background: ${({ $winner }) =>
    $winner === 'B'
      ? 'rgba(0, 184, 130, 0.12)'
      : $winner === 'W'
      ? 'rgba(212, 175, 55, 0.14)'
      : 'rgba(107, 114, 128, 0.12)'};
  color: ${({ $winner }) =>
    $winner === 'B' ? '#008a60' : $winner === 'W' ? '#b8941f' : '#6b7280'};

  [data-theme='dark'] & {
    box-shadow: ${ringShadow.dark.button};
    background: ${({ $winner }) =>
      $winner === 'B'
        ? 'rgba(0, 184, 130, 0.20)'
        : $winner === 'W'
        ? 'rgba(212, 175, 55, 0.20)'
        : 'rgba(255, 255, 255, 0.10)'};
    color: ${({ $winner }) =>
      $winner === 'B' ? '#4ade80' : $winner === 'W' ? '#e5c058' : '#9ca3af'};
  }
`;

const NoticeText = styled.div<{ $variant?: 'gold' | 'green' }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  margin: 2px 0;
  color: ${({ $variant }) => ($variant === 'green' ? '#008a60' : '#b8941f')};

  [data-theme='dark'] & {
    color: ${({ $variant }) => ($variant === 'green' ? '#4ade80' : '#e5c058')};
  }
`;

// ==========================================
// 🧠 고도화된 고급 오목 AI 평가 엔진
// ==========================================

const DIRECTIONS = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal \
  [1, -1], // diagonal /
];

function checkWinner(board: Stone[][], r: number, c: number, stone: Stone): boolean {
  if (!stone) return false;

  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;

    for (const stepDir of [1, -1]) {
      let step = 1;
      while (true) {
        const nr = r + dr * step * stepDir;
        const nc = c + dc * step * stepDir;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === stone) {
          count++;
          step++;
        } else {
          break;
        }
      }
    }

    if (count >= 5) return true;
  }
  return false;
}

/**
 * 한 방향에 대한 패턴 점수 계산기
 * - 5목: 1,000,000점 (승리)
 * - 열린 4 (양쪽 열림): 120,000점 (필승 수)
 * - 닫힌 4 (한쪽 막힘): 25,000점 (즉각 위협)
 * - 열린 3 (양쪽 열림): 15,000점
 * - 닫힌 3 / 깬 3: 3,000점
 * - 열린 2: 1,000점
 */
function evaluateDirection(
  board: Stone[][],
  r: number,
  c: number,
  dr: number,
  dc: number,
  stone: Stone
): number {
  const opponent: Stone = stone === 'B' ? 'W' : 'B';
  let consecutive = 1;
  let openEnds = 0;

  // 정방향 탐색
  let rF = r + dr;
  let cF = c + dc;
  while (rF >= 0 && rF < BOARD_SIZE && cF >= 0 && cF < BOARD_SIZE && board[rF][cF] === stone) {
    consecutive++;
    rF += dr;
    cF += dc;
  }
  if (rF >= 0 && rF < BOARD_SIZE && cF >= 0 && cF < BOARD_SIZE && board[rF][cF] === null) {
    openEnds++;
  }

  // 역방향 탐색
  let rB = r - dr;
  let cB = c - dc;
  while (rB >= 0 && rB < BOARD_SIZE && cB >= 0 && cB < BOARD_SIZE && board[rB][cB] === stone) {
    consecutive++;
    rB -= dr;
    cB -= dc;
  }
  if (rB >= 0 && rB < BOARD_SIZE && cB >= 0 && cB < BOARD_SIZE && board[rB][cB] === null) {
    openEnds++;
  }

  // 5목 완성
  if (consecutive >= 5) return 1000000;

  // 4목
  if (consecutive === 4) {
    if (openEnds === 2) return 120000;
    if (openEnds === 1) return 25000;
  }

  // 3목
  if (consecutive === 3) {
    if (openEnds === 2) return 15000;
    if (openEnds === 1) return 3000;
  }

  // 2목
  if (consecutive === 2) {
    if (openEnds === 2) return 1000;
    if (openEnds === 1) return 200;
  }

  return 0;
}

/**
 * 특정 위치에 착수했을 때의 전체 가치 평가
 */
function evaluatePosition(board: Stone[][], r: number, c: number, stone: Stone): number {
  let totalScore = 0;
  let openThrees = 0;
  let fours = 0;

  for (const [dr, dc] of DIRECTIONS) {
    const dirScore = evaluateDirection(board, r, c, dr, dc, stone);
    totalScore += dirScore;

    if (dirScore >= 120000 || dirScore >= 25000) fours++;
    if (dirScore === 15000) openThrees++;
  }

  // 4-3, 3-3(쌍삼) 복합 공격 가중치 부여
  if (openThrees >= 2) totalScore += 60000;
  if (fours >= 1 && openThrees >= 1) totalScore += 80000;
  if (fours >= 2) totalScore += 150000;

  return totalScore;
}

/**
 * AI의 최고 수 찾기 (공격 + 수비 정밀 계산)
 */
function findBestMoveHighDifficulty(board: Stone[][]): [number, number] {
  const candidates: [number, number][] = [];
  const center = Math.floor(BOARD_SIZE / 2);

  // 빈 칸 중 주위에 돌이 2칸 이내에 있는 후보지 우선 선정
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) {
        let hasNeighbor = false;
        for (let dr = -2; dr <= 2 && !hasNeighbor; dr++) {
          for (let dc = -2; dc <= 2 && !hasNeighbor; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] !== null) {
              hasNeighbor = true;
            }
          }
        }
        if (hasNeighbor || (r === center && c === center)) {
          candidates.push([r, c]);
        }
      }
    }
  }

  // 돌이 하나도 없으면 정중앙 착수
  if (candidates.length === 0) {
    return [center, center];
  }

  let bestMove = candidates[0];
  let highestWeight = -1;

  for (const [r, c] of candidates) {
    // 1. 공격 가치 (AI: White)
    const attackScore = evaluatePosition(board, r, c, 'W');

    // 2. 수비 가치 (User: Black이 이 자리에 둘 경우의 위협도)
    const defenseScore = evaluatePosition(board, r, c, 'B');

    // 5목 승리수가 있다면 무조건 즉시 승리 착수
    if (attackScore >= 1000000) {
      return [r, c];
    }

    // 상대방의 5목 완성을 막아야 한다면 최우선 수비
    if (defenseScore >= 1000000) {
      return [r, c];
    }

    // 상대의 열린 4(120,000)나 닫힌 4(25,000)를 막는 방어 가중치 강화 (수비 배수 1.25x)
    const combinedWeight = attackScore + defenseScore * 1.28 + (BOARD_SIZE - Math.abs(r - center) - Math.abs(c - center));

    if (combinedWeight > highestWeight) {
      highestWeight = combinedWeight;
      bestMove = [r, c];
    }
  }

  return bestMove;
}

export default function MiniOmokGame({
  isGenerationComplete = false,
  onViewJourney,
  onGoToWordSearch,
}: MiniOmokGameProps) {
  const [board, setBoard] = useState<Stone[][]>(() =>
    Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null))
  );
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true);
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);
  const [winner, setWinner] = useState<Stone | 'DRAW' | null>(null);
  const [moveHistory, setMoveHistory] = useState<{ r: number; c: number; stone: Stone }[]>([]);

  // AI Response turn (300ms delay)
  const makeAIMove = useCallback((currentBoard: Stone[][]) => {
    const [r, c] = findBestMoveHighDifficulty(currentBoard);
    const nextBoard = currentBoard.map((row) => [...row]);
    nextBoard[r][c] = 'W';
    setBoard(nextBoard);
    setLastMove([r, c]);
    setMoveHistory((prev) => [...prev, { r, c, stone: 'W' }]);

    if (checkWinner(nextBoard, r, c, 'W')) {
      setWinner('W');
    } else {
      setIsPlayerTurn(true);
    }
  }, []);

  const handleCellClick = (r: number, c: number) => {
    if (board[r][c] || !isPlayerTurn || winner) return;

    // Player (Black) Move
    const nextBoard = board.map((row) => [...row]);
    nextBoard[r][c] = 'B';
    setBoard(nextBoard);
    setLastMove([r, c]);
    setMoveHistory((prev) => [...prev, { r, c, stone: 'B' }]);

    if (checkWinner(nextBoard, r, c, 'B')) {
      setWinner('B');
      return;
    }

    // Check draw
    const isFull = nextBoard.every((row) => row.every((cell) => cell !== null));
    if (isFull) {
      setWinner('DRAW');
      return;
    }

    // Switch to AI turn
    setIsPlayerTurn(false);
    setTimeout(() => {
      makeAIMove(nextBoard);
    }, 280);
  };

  const handleReset = () => {
    setBoard(
      Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill(null))
    );
    setIsPlayerTurn(true);
    setLastMove(null);
    setWinner(null);
    setMoveHistory([]);
  };

  const handleUndo = () => {
    if (moveHistory.length < 2 || !isPlayerTurn || winner) return;
    const historyCopy = [...moveHistory];
    historyCopy.pop(); // Pop AI move
    historyCopy.pop(); // Pop Player move

    const nextBoard = Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null));

    for (const item of historyCopy) {
      nextBoard[item.r][item.c] = item.stone;
    }

    setBoard(nextBoard);
    setMoveHistory(historyCopy);
    setLastMove(
      historyCopy.length > 0
        ? [historyCopy[historyCopy.length - 1].r, historyCopy[historyCopy.length - 1].c]
        : null
    );
    setWinner(null);
    setIsPlayerTurn(true);
  };

  // Star points on 11x11 board
  const isStarPoint = (r: number, c: number) => {
    return (
      (r === 2 && c === 2) ||
      (r === 2 && c === 8) ||
      (r === 8 && c === 2) ||
      (r === 8 && c === 8) ||
      (r === 5 && c === 5)
    );
  };

  return (
    <Container>
      <StatusHeader>
        <TurnBadge $isUserTurn={isPlayerTurn}>
          {isPlayerTurn ? <User size={13} /> : <Bot size={13} />}
          <span>{isPlayerTurn ? '내 차례 (흑돌)' : 'AI가 생각하고 있어요'}</span>
        </TurnBadge>

        
      </StatusHeader>

      <BoardContainer>
        {board.map((row, r) =>
          row.map((stone, c) => (
            <Cell
              key={`${r}-${c}`}
              $stone={stone}
              onClick={() => handleCellClick(r, c)}
              aria-label={`행 ${r + 1}, 열 ${c + 1}`}
            >
              {isStarPoint(r, c) && !stone && <StarPointDot />}
              {stone && (
                <StonePiece
                  $color={stone}
                  $isLast={lastMove?.[0] === r && lastMove?.[1] === c}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 520, damping: 26 }}
                />
              )}
            </Cell>
          ))
        )}

        <AnimatePresence>
          {winner && (
            <WinnerOverlay
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* 팡파레 축하 파티클 효과 */}
              <FanfareConfetti />

              <WinnerIconWrap $winner={winner}>
                {winner === 'B' ? (
                  <Crown size={24} />
                ) : winner === 'W' ? (
                  <Bot size={24} />
                ) : (
                  <Swords size={24} />
                )}
              </WinnerIconWrap>

              <WinnerTitle>
                {winner === 'B'
                  ? '승리하셨어요!'
                  : winner === 'W'
                  ? 'AI가 이겼어요'
                  : '무승부예요'}
              </WinnerTitle>
              <WinnerDesc>
                {winner === 'B'
                  ? '축하해요! AI를 상대로 멋진 승리를 거두셨어요.'
                  : winner === 'W'
                  ? '아쉽게 졌어요. 한 번 더 도전해 볼까요?'
                  : '치열한 접전 끝에 비겼어요.'}
              </WinnerDesc>

              {!isGenerationComplete ? (
                <>
                  <NoticeText $variant="gold">
                    <Sparkles size={13} />
                    <span>맞춤 여정을 추천하는 중이에요</span>
                  </NoticeText>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      width: '100%',
                      maxWidth: '260px',
                      marginTop: '4px',
                      justifyContent: 'center',
                    }}
                  >
                    <ActionButton
                      style={{ justifyContent: 'center' }}
                      onClick={handleReset}
                    >
                      <RotateCcw size={12} />
                      <span>한 판 더 하기</span>
                    </ActionButton>
                    {onGoToWordSearch && (
                      <ActionButton
                        style={{ justifyContent: 'center' }}
                        onClick={onGoToWordSearch}
                      >
                        <Search size={12} />
                        <span>낱말 찾기 이동</span>
                      </ActionButton>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <NoticeText $variant="green">
                    <CheckCircle2 size={14} />
                    <span>맞춤 여정이 준비되었어요</span>
                  </NoticeText>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px', width: '100%', maxWidth: '270px', justifyContent: 'center' }}>
                    <ActionButton onClick={handleReset}>
                      <RotateCcw size={12} />
                      <span>한 판 더 하기</span>
                    </ActionButton>
                    {onViewJourney && (
                      <ViewJourneyBtn onClick={onViewJourney}>
                        <Sparkles size={12} />
                        <span>완성된 여정 보기</span>
                      </ViewJourneyBtn>
                    )}
                  </div>
                </>
              )}
            </WinnerOverlay>
          )}
        </AnimatePresence>
      </BoardContainer>

      <ControlsBar>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ActionButton onClick={handleReset}>
            <RotateCcw size={12} />
            <span>다시 하기</span>
          </ActionButton>
          <ActionButton onClick={handleUndo} disabled={moveHistory.length < 2 || !isPlayerTurn}>
            <span>한 수 취소</span>
          </ActionButton>
        </div>

        {onGoToWordSearch && (
          <ActionButton onClick={onGoToWordSearch}>
            <Search size={12} />
            <span>낱말 찾기</span>
          </ActionButton>
        )}
      </ControlsBar>

      {/* Assembly Finished Banner (대국 진행 중에만 하단에 표시하여 승리 모달과 중복 방지) */}
      <AnimatePresence>
        {isGenerationComplete && !winner && (
          <FinishedBanner
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ type: 'spring', damping: 20, stiffness: 350 }}
          >
            <CompleteText>
              <CheckCircle2 size={14} color="#008a60" />
              <span>맞춤 여정이 준비되었어요</span>
            </CompleteText>
            {onViewJourney && (
              <ViewJourneyBtn onClick={onViewJourney}>
                <Sparkles size={12} />
                <span>완성된 여정 보기</span>
              </ViewJourneyBtn>
            )}
          </FinishedBanner>
        )}
      </AnimatePresence>
    </Container>
  );
}
