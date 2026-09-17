'use client';

import React, { useState, useCallback } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Award, Sparkles, CheckCircle2, Bot, User, Flame } from 'lucide-react';
import { fontSize } from '@/design-system/tokens';

const BOARD_SIZE = 11; // 11x11 traditional compact grid

type Stone = 'B' | 'W' | null; // B: Black (User), W: White (AI)

interface MiniOmokGameProps {
  isGenerationComplete?: boolean;
  onViewJourney?: () => void;
  onGoToWordSearch?: () => void;
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
  max-width: 350px;
  margin-bottom: 12px;
  font-size: ${fontSize.xs};
`;

const TurnBadge = styled.div<{ $isUserTurn: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 9999px;
  background: ${({ $isUserTurn }) =>
    $isUserTurn ? 'rgba(0, 184, 130, 0.12)' : 'rgba(212, 175, 55, 0.12)'};
  border: none;
  box-shadow: none;
  color: ${({ $isUserTurn }) => ($isUserTurn ? '#00b882' : '#d4af37')};
  font-weight: 600;
  font-size: ${fontSize.xs};
`;

const DifficultyBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: ${fontSize.xs};
  color: #ff5414;
  background: rgba(255, 84, 20, 0.1);
  border: none;
  box-shadow: none;
  padding: 4px 9px;
  border-radius: 6px;
  font-weight: 600;
`;

/* 모던한 플랫 원목 바둑판 (노 보더, 노 섀도우) */
const BoardContainer = styled.div`
  position: relative;
  width: 340px;
  height: 340px;
  background: #deb887;
  border: none;
  border-radius: 12px;
  box-shadow: none;
  display: grid;
  grid-template-columns: repeat(${BOARD_SIZE}, 1fr);
  grid-template-rows: repeat(${BOARD_SIZE}, 1fr);
  padding: 12px;
  user-select: none;
  touch-action: manipulation;

  [data-theme='dark'] & {
    background: #2b241d;
    border: none;
    box-shadow: none;
  }

  @media (max-width: 400px) {
    width: 295px;
    height: 295px;
    padding: 8px;
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
  width: 5.5px;
  height: 5.5px;
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
  width: 84%;
  height: 84%;
  border-radius: 50%;
  z-index: 2;
  border: none;
  box-shadow: none;

  ${({ $color }) =>
    $color === 'B'
      ? `
    background: #191f28;

    [data-theme='dark'] & {
      background: #111317;
    }
  `
      : `
    background: #ffffff;

    [data-theme='dark'] & {
      background: #f0f0f0;
    }
  `}

  ${({ $isLast }) =>
    $isLast &&
    `
    &::after {
      content: '';
      position: absolute;
      width: 7px;
      height: 7px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: #ff5414;
      border: none;
      box-shadow: none;
    }
  `}
`;

const ControlsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 340px;
  margin-top: 14px;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  box-shadow: none;
  color: #374151;
  font-size: ${fontSize.xs};
  cursor: pointer;
  transition: all 0.2s;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
    color: #e5e7eb;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.09);

    [data-theme='dark'] & {
      background: rgba(255, 255, 255, 0.14);
    }
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const FinishedBanner = styled(motion.div)`
  width: 100%;
  max-width: 340px;
  background: rgba(0, 184, 130, 0.12);
  border: none;
  box-shadow: none;
  border-radius: 12px;
  padding: 10px 14px;
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  [data-theme='dark'] & {
    background: rgba(0, 184, 130, 0.16);
  }
`;

const CompleteText = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${fontSize.xs};
  font-weight: 600;
  color: #191f28;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const ViewJourneyBtn = styled.button`
  background: #00b882;
  color: #ffffff;
  border: none;
  box-shadow: none;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: ${fontSize.xs};
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;

  &:hover {
    background: #00996c;
  }
`;

const WinnerOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: rgba(248, 248, 247, 0.96);
  border-radius: 12px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  text-align: center;
  border: none;
  box-shadow: none;

  [data-theme='dark'] & {
    background: rgba(28, 26, 23, 0.96);
  }
`;

const WinnerTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #191f28;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const WinnerDesc = styled.div`
  font-size: 12.5px;
  color: #6b7280;
  max-width: 260px;

  [data-theme='dark'] & {
    color: #a1a1aa;
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
          <span>{isPlayerTurn ? '당신의 차례 (흑돌)' : '온마루 AI 수읽기 중...'}</span>
        </TurnBadge>

        <DifficultyBadge>
          <Flame size={12} />
          <span>난이도: 고수</span>
        </DifficultyBadge>
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
              <Award size={36} color={winner === 'B' ? '#00b882' : '#d4af37'} />
              <WinnerTitle>
                {winner === 'B'
                   ? '🎉 흑돌(사용자) 승리!'
                   : winner === 'W'
                   ? '백돌(온마루 AI) 승리!'
                   : '무승부입니다!'}
              </WinnerTitle>
              <WinnerDesc>
                {winner === 'B'
                   ? '축하합니다! 고수 AI를 제압하셨습니다.'
                   : '날카로운 공방이었습니다! 다음 판에 설욕해보세요.'}
              </WinnerDesc>

              {!isGenerationComplete ? (
                <>
                  <div
                    style={{
                      color: '#d4af37',
                      fontSize: '13px',
                      fontWeight: 600,
                      margin: '6px 0 2px',
                    }}
                  >
                    ⏳ 아직 온마루 AI가 맞춤 경로를 추천 중이에요!
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      width: '100%',
                      maxWidth: '250px',
                      marginTop: '4px',
                    }}
                  >
                    {onGoToWordSearch && (
                      <ViewJourneyBtn
                        style={{
                          width: '100%',
                          background: '#00b882',
                          padding: '8px 12px',
                        }}
                        onClick={onGoToWordSearch}
                      >
                        🔍 전통 단어 찾기 퍼즐 하기 →
                      </ViewJourneyBtn>
                    )}
                    <ActionButton
                      style={{ justifyContent: 'center', width: '100%' }}
                      onClick={handleReset}
                    >
                      <RotateCcw size={13} />
                      <span>오목 다시 대국</span>
                    </ActionButton>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      color: '#00b882',
                      fontSize: '13px',
                      fontWeight: 600,
                      margin: '6px 0 2px',
                    }}
                  >
                    ✨ 온마루 AI 추천 경로가 완성되었습니다!
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <ActionButton onClick={handleReset}>
                      <RotateCcw size={13} />
                      <span>다시 대국</span>
                    </ActionButton>
                    {onViewJourney && (
                      <ViewJourneyBtn onClick={onViewJourney}>
                        <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        완성된 여정 보러가기 →
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
            <span>판 초기화</span>
          </ActionButton>
          <ActionButton onClick={handleUndo} disabled={moveHistory.length < 2 || !isPlayerTurn}>
            <span>한 수 무르기</span>
          </ActionButton>
        </div>

        {onGoToWordSearch && (
          <ActionButton onClick={onGoToWordSearch}>
            <span>🔍 단어 찾기</span>
          </ActionButton>
        )}
      </ControlsBar>

      {/* Assembly Finished Banner */}
      <AnimatePresence>
        {isGenerationComplete && (
          <FinishedBanner
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CompleteText>
              <CheckCircle2 size={16} color="#00b882" />
              <span>여정이 모두 지어졌습니다!</span>
            </CompleteText>
            {onViewJourney && (
              <ViewJourneyBtn onClick={onViewJourney}>
                <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
                완성된 여정 보기
              </ViewJourneyBtn>
            )}
          </FinishedBanner>
        )}
      </AnimatePresence>
    </Container>
  );
}
