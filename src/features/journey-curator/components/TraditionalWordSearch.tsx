'use client';

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, RotateCcw, Sparkles, Trophy, Gamepad2, Timer, Flame } from 'lucide-react';
import { fontSize } from '@/design-system/tokens';

interface WordPuzzle {
  id: number;
  theme: string;
  grid: string[][];
  words: {
    word: string;
    coords: [number, number][]; // [[r, c], ...]
    direction: string;
  }[];
}

const PUZZLES: WordPuzzle[] = [
  {
    id: 1,
    theme: '전통 한옥과 미학',
    grid: [
      ['온', '솔', '담', '기', '둥', '뜰', '한', '울'],
      ['달', '마', '돌', '꽃', '살', '문', '창', '호'],
      ['마', '음', '루', '마', '당', '비', '와', '배'],
      ['바', '람', '쉼', '처', '마', '청', '빛', '흘'],
      ['누', '서', '결', '골', '길', '단', '풍', '림'],
      ['각', '까', '숲', '정', '단', '경', '해', '살'],
      ['고', '래', '즈', '넉', '한', '지', '돌', '담'],
      ['선', '율', '툇', '마', '루', '여', '백', '쉼'],
    ],
    words: [
      {
        word: '온마루',
        coords: [
          [0, 0],
          [1, 1],
          [2, 2],
        ],
        direction: '대각선 ↘',
      },
      {
        word: '꽃살문',
        coords: [
          [1, 3],
          [1, 4],
          [1, 5],
        ],
        direction: '가로 →',
      },
      {
        word: '배흘림',
        coords: [
          [2, 7],
          [3, 7],
          [4, 7],
        ],
        direction: '세로 ↓',
      },
      {
        word: '서까래',
        coords: [
          [4, 1],
          [5, 1],
          [6, 1],
        ],
        direction: '세로 ↓',
      },
      {
        word: '툇마루',
        coords: [
          [7, 2],
          [7, 3],
          [7, 4],
        ],
        direction: '가로 →',
      },
      {
        word: '단청',
        coords: [
          [5, 4],
          [4, 5],
        ],
        direction: '대각선 ↗',
      },
      {
        word: '처마',
        coords: [
          [3, 3],
          [3, 4],
        ],
        direction: '가로 →',
      },
    ],
  },
  {
    id: 2,
    theme: '한국의 원림과 소리',
    grid: [
      ['솔', '바', '람', '결', '소', '쇄', '원', '림'],
      ['소', '대', '숲', '맑', '은', '물', '소', '리'],
      ['리', '빛', '광', '음', '뜰', '처', '마', '길'],
      ['마', '울', '림', '풍', '여', '백', '낙', '돌'],
      ['루', '쉼', '터', '자', '각', '새', '숫', '담'],
      ['계', '곡', '정', '소', '리', '물', '물', '잎'],
      ['달', '제', '월', '당', '툇', '마', '루', '그'],
      ['늘', '비', '갠', '뒤', '대', '숲', '길', '쉼'],
    ],
    words: [
      {
        word: '소리마루',
        coords: [
          [1, 0],
          [2, 0],
          [3, 0],
          [4, 0],
        ],
        direction: '세로 ↓',
      },
      {
        word: '광풍각',
        coords: [
          [2, 2],
          [3, 3],
          [4, 4],
        ],
        direction: '대각선 ↘',
      },
      {
        word: '소쇄원',
        coords: [
          [0, 4],
          [0, 5],
          [0, 6],
        ],
        direction: '가로 →',
      },
      {
        word: '낙숫물',
        coords: [
          [3, 6],
          [4, 6],
          [5, 6],
        ],
        direction: '세로 ↓',
      },
      {
        word: '제월당',
        coords: [
          [6, 1],
          [6, 2],
          [6, 3],
        ],
        direction: '가로 →',
      },
      {
        word: '대숲길',
        coords: [
          [7, 4],
          [7, 5],
          [7, 6],
        ],
        direction: '가로 →',
      },
      {
        word: '정자',
        coords: [
          [5, 2],
          [4, 3],
        ],
        direction: '대각선 ↗',
      },
    ],
  },
];

interface TraditionalWordSearchProps {
  isGenerationComplete?: boolean;
  onViewJourney?: () => void;
  onBackToOmok?: () => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const HeaderStatus = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 360px;
  margin-bottom: 10px;
`;

const StatusLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ThemeTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 9999px;
  background: rgba(212, 175, 55, 0.12);
  border: none;
  box-shadow: none;
  color: #d4af37;
  font-size: 11.5px;
  font-weight: 600;
`;

const DifficultyBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(255, 84, 20, 0.1);
  border: none;
  box-shadow: none;
  color: #ff5414;
  font-size: 11px;
  font-weight: 600;
`;

const StatusRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${fontSize.xs};
  color: #9ca3af;
`;

const TimerDisplay = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
  font-size: 11.5px;

  [data-theme='dark'] & {
    color: #a1a1aa;
  }
`;

const WordTagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
  width: 100%;
  max-width: 370px;
  margin-bottom: 12px;
`;

const WordTag = styled.div<{ $isFound: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 500;
  border: none;
  box-shadow: none;
  transition: all 0.25s;

  ${({ $isFound }) =>
    $isFound
      ? `
    background: rgba(0, 184, 130, 0.15);
    color: #00b882;
    text-decoration: line-through;
    opacity: 0.85;
  `
      : `
    background: rgba(0, 0, 0, 0.05);
    color: #4b5563;

    [data-theme='dark'] & {
      background: rgba(255, 255, 255, 0.07);
      color: #d1d5db;
    }
  `}
`;

const GridBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  gap: 4px;
  width: 350px;
  height: 350px;
  background: #ebe5d8;
  border: none;
  border-radius: 14px;
  padding: 8px;
  box-shadow: none;

  [data-theme='dark'] & {
    background: #28231d;
    border: none;
    box-shadow: none;
  }

  @media (max-width: 400px) {
    width: 300px;
    height: 300px;
    gap: 3px;
    padding: 6px;
  }
`;

const CellButton = styled.button<{ $isSelected: boolean; $isFound: boolean }>`
  position: relative;
  background: ${({ $isFound, $isSelected }) =>
    $isFound
      ? 'rgba(0, 184, 130, 0.22)'
      : $isSelected
      ? 'rgba(255, 120, 20, 0.22)'
      : '#ffffff'};
  border: none;
  box-shadow: none;
  border-radius: 7px;
  color: ${({ $isFound, $isSelected }) =>
    $isFound ? '#008a60' : $isSelected ? '#d94b00' : '#191f28'};
  font-family: var(--font-hanok);
  font-size: ${fontSize.base};
  font-weight: ${({ $isFound, $isSelected }) => ($isFound || $isSelected ? 700 : 500)};
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.16s ease;
  user-select: none;
  touch-action: manipulation;

  [data-theme='dark'] & {
    background: ${({ $isFound, $isSelected }) =>
      $isFound
        ? 'rgba(0, 184, 130, 0.28)'
        : $isSelected
        ? 'rgba(255, 120, 20, 0.35)'
        : 'rgba(255, 255, 255, 0.07)'};
    color: ${({ $isFound, $isSelected }) =>
      $isFound ? '#4ade80' : $isSelected ? '#ff9d5c' : '#f3f4f6'};
    border: none;
    box-shadow: none;
  }

  &:hover {
    background: ${({ $isFound }) =>
      $isFound ? 'rgba(0, 184, 130, 0.3)' : 'rgba(0, 0, 0, 0.08)'};
    transform: translateY(-1px);

    [data-theme='dark'] & {
      background: ${({ $isFound }) =>
        $isFound ? 'rgba(0, 184, 130, 0.35)' : 'rgba(255, 255, 255, 0.12)'};
    }
  }

  &:active {
    transform: scale(0.92);
  }
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 350px;
  margin-top: 12px;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  box-shadow: none;
  color: #374151;
  font-size: 11.5px;
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
`;

const FinishedBanner = styled(motion.div)`
  width: 100%;
  max-width: 350px;
  background: rgba(0, 184, 130, 0.12);
  border: none;
  box-shadow: none;
  border-radius: 12px;
  padding: 10px 14px;
  margin-top: 12px;
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
  font-size: 12.5px;
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
  transition: background 0.2s, transform 0.15s;

  &:hover {
    background: #00996c;
    transform: scale(1.02);
  }
`;

export default function TraditionalWordSearch({
  isGenerationComplete = false,
  onViewJourney,
  onBackToOmok,
}: TraditionalWordSearchProps) {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const currentPuzzle = PUZZLES[puzzleIdx];

  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<[number, number][]>([]);
  const [seconds, setSeconds] = useState(0);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if a coordinate is currently selected
  const isSelected = (r: number, c: number) => {
    return selectedCoords.some(([sr, sc]) => sr === r && sc === c);
  };

  // Check if a coordinate belongs to any already-found words
  const isFoundCoord = (r: number, c: number) => {
    return currentPuzzle.words.some(
      (w) =>
        foundWords.includes(w.word) &&
        w.coords.some(([wr, wc]) => wr === r && wc === c)
    );
  };

  const handleCellClick = (r: number, c: number) => {
    if (isSelected(r, c)) {
      setSelectedCoords((prev) => prev.filter(([sr, sc]) => !(sr === r && sc === c)));
      return;
    }

    const nextCoords: [number, number][] = [...selectedCoords, [r, c]];
    setSelectedCoords(nextCoords);

    // Form spelling
    const currentSpelling = nextCoords
      .map(([cr, cc]) => currentPuzzle.grid[cr][cc])
      .join('');

    // Check match
    const match = currentPuzzle.words.find(
      (w) => !foundWords.includes(w.word) && w.word === currentSpelling
    );

    if (match) {
      setFoundWords((prev) => [...prev, match.word]);
      setSelectedCoords([]);
    } else {
      const isPrefix = currentPuzzle.words.some(
        (w) => !foundWords.includes(w.word) && w.word.startsWith(currentSpelling)
      );
      if (!isPrefix) {
        setTimeout(() => {
          setSelectedCoords([]);
        }, 300);
      }
    }
  };

  const handleReset = () => {
    setFoundWords([]);
    setSelectedCoords([]);
    setSeconds(0);
  };

  const handleNextPuzzle = () => {
    setPuzzleIdx((prev) => (prev + 1) % PUZZLES.length);
    setFoundWords([]);
    setSelectedCoords([]);
    setSeconds(0);
  };

  const isAllFound = foundWords.length === currentPuzzle.words.length;

  return (
    <Container>
      <HeaderStatus>
        <StatusLeft>
          <ThemeTag>
            <Sparkles size={11} />
            <span>{currentPuzzle.theme}</span>
          </ThemeTag>
          <DifficultyBadge>
            <Flame size={11} />
            <span>심화 8x8</span>
          </DifficultyBadge>
        </StatusLeft>

        <StatusRight>
          <TimerDisplay>
            <Timer size={12} />
            <span>{formatTime(seconds)}</span>
          </TimerDisplay>
          <span>
            <strong style={{ color: '#00b882' }}>{foundWords.length}</strong> /{' '}
            {currentPuzzle.words.length}
          </span>
        </StatusRight>
      </HeaderStatus>

      <WordTagsRow>
        {currentPuzzle.words.map((w) => {
          const found = foundWords.includes(w.word);
          return (
            <WordTag key={w.word} $isFound={found} title={w.direction}>
              {found && <CheckCircle2 size={11} />}
              <span>{w.word}</span>
            </WordTag>
          );
        })}
      </WordTagsRow>

      <GridBoard>
        {currentPuzzle.grid.map((row, r) =>
          row.map((char, c) => (
            <CellButton
              key={`${r}-${c}`}
              $isSelected={isSelected(r, c)}
              $isFound={isFoundCoord(r, c)}
              onClick={() => handleCellClick(r, c)}
              aria-label={`행 ${r + 1}, 열 ${c + 1} 글자 ${char}`}
            >
              {char}
            </CellButton>
          ))
        )}
      </GridBoard>

      <ControlsRow>
        <div style={{ display: 'flex', gap: '6px' }}>
          <ActionButton onClick={handleReset}>
            <RotateCcw size={11} />
            <span>초기화</span>
          </ActionButton>
          <ActionButton onClick={handleNextPuzzle}>
            <span>다음 판</span>
          </ActionButton>
        </div>

        {onBackToOmok && (
          <ActionButton onClick={onBackToOmok}>
            <Gamepad2 size={11} />
            <span>오목으로 복귀</span>
          </ActionButton>
        )}
      </ControlsRow>

      {/* When all words are found */}
      {isAllFound && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: '10px',
            color: '#00b882',
            fontSize: '12.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Trophy size={15} />
          <span>모든 낱말을 찾아내셨습니다! ({formatTime(seconds)})</span>
        </motion.div>
      )}

      {/* Assembly Finished Notification Banner */}
      <AnimatePresence>
        {isGenerationComplete && (
          <FinishedBanner
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <CompleteText>
              <CheckCircle2 size={16} color="#00b882" />
              <span>온마루 AI 추천 경로가 완성되었습니다!</span>
            </CompleteText>
            {onViewJourney && (
              <ViewJourneyBtn onClick={onViewJourney}>
                <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
                완성된 여정 바로보기 →
              </ViewJourneyBtn>
            )}
          </FinishedBanner>
        )}
      </AnimatePresence>
    </Container>
  );
}
