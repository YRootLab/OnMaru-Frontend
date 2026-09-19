'use client';

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, RotateCcw, Sparkles, Trophy, Gamepad2, Timer, Flame } from 'lucide-react';
import { fontSize, palette, ringShadow } from '@/design-system/tokens';

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
  max-width: 330px;
  margin-bottom: 8px;
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
  padding: 3px 9px;
  border-radius: 9999px;
  background: rgba(212, 175, 55, 0.12);
  border: none;
  box-shadow: ${ringShadow.light.button};
  color: #b8941f;
  font-size: 11px;
  font-weight: 600;

  [data-theme='dark'] & {
    box-shadow: ${ringShadow.dark.button};
    color: #e5c058;
  }
`;

const DifficultyBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.045);
  border: none;
  box-shadow: ${ringShadow.light.button};
  color: #6b7280;
  font-size: 11px;
  font-weight: 600;

  [data-theme='dark'] & {
    color: #9ca3af;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: ${ringShadow.dark.button};
  }
`;

const StatusRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: #9ca3af;
`;

const TimerDisplay = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
  font-size: 11px;

  [data-theme='dark'] & {
    color: #a1a1aa;
  }
`;

const WordTagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  width: 100%;
  max-width: 330px;
  margin-bottom: 8px;
`;

const WordTag = styled.div<{ $isFound: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 500;
  border: none;
  box-shadow: ${ringShadow.light.button};
  transition: all 0.25s;

  ${({ $isFound }) =>
    $isFound
      ? `
    background: rgba(0, 184, 130, 0.15);
    color: #008a60;
    text-decoration: line-through;
    opacity: 0.85;
  `
      : `
    background: rgba(0, 0, 0, 0.045);
    color: #4b5563;

    [data-theme='dark'] & {
      background: rgba(255, 255, 255, 0.07);
      color: #d1d5db;
    }
  `}

  [data-theme='dark'] & {
    box-shadow: ${ringShadow.dark.button};
  }
`;

const GridBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  gap: 3.5px;
  width: min(330px, calc(100vw - 64px));
  height: min(330px, calc(100vw - 64px));
  max-width: 330px;
  max-height: 330px;
  aspect-ratio: 1;
  background: #ebe5d8;
  border: none;
  border-radius: 12px;
  padding: 6px;
  box-shadow: ${ringShadow.light.card};

  [data-theme='dark'] & {
    background: #28231d;
    box-shadow: ${ringShadow.dark.card};
  }

  @media (max-width: 380px) {
    gap: 2.5px;
    padding: 5px;
    border-radius: 10px;
  }
`;

const CellButton = styled.button<{ $isSelected: boolean; $isFound: boolean }>`
  position: relative;
  background: ${({ $isFound, $isSelected }) =>
    $isFound
      ? 'rgba(0, 184, 130, 0.22)'
      : $isSelected
      ? 'rgba(0, 184, 130, 0.15)'
      : '#ffffff'};
  border: none;
  box-shadow: ${ringShadow.light.button};
  border-radius: 6px;
  color: ${({ $isFound, $isSelected }) =>
    $isFound ? '#008a60' : $isSelected ? '#008a60' : '#191f28'};
  font-family: var(--font-hanok);
  font-size: 14.5px;
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
        ? 'rgba(0, 184, 130, 0.22)'
        : 'rgba(255, 255, 255, 0.07)'};
    color: ${({ $isFound, $isSelected }) =>
      $isFound ? '#4ade80' : $isSelected ? '#4ade80' : '#f3f4f6'};
    box-shadow: ${ringShadow.dark.button};
  }

  &:hover {
    background: ${({ $isFound }) =>
      $isFound ? 'rgba(0, 184, 130, 0.3)' : 'rgba(0, 0, 0, 0.08)'};
    box-shadow: ${ringShadow.light.buttonHoverGlow};
    transform: translateY(-1px);

    [data-theme='dark'] & {
      background: ${({ $isFound }) =>
        $isFound ? 'rgba(0, 184, 130, 0.35)' : 'rgba(255, 255, 255, 0.12)'};
      box-shadow: ${ringShadow.dark.buttonHoverGlow};
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
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
    box-shadow: ${ringShadow.dark.button};
    color: #e5e7eb;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.08);
    box-shadow: ${ringShadow.light.buttonHoverGlow};

    [data-theme='dark'] & {
      background: rgba(255, 255, 255, 0.14);
      box-shadow: ${ringShadow.dark.buttonHoverGlow};
    }
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

const FoundAllMessage = styled(motion.div)`
  margin-top: 8px;
  color: #008a60;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;

  [data-theme='dark'] & {
    color: #4ade80;
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
            <span>처음부터</span>
          </ActionButton>
          <ActionButton onClick={handleNextPuzzle}>
            <span>다음 문제</span>
          </ActionButton>
        </div>

        {onBackToOmok && (
          <ActionButton onClick={onBackToOmok}>
            <Gamepad2 size={11} />
            <span>오목 게임 이동</span>
          </ActionButton>
        )}
      </ControlsRow>

      {/* When all words are found */}
      {isAllFound && (
        <FoundAllMessage
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Trophy size={14} />
          <span>모든 낱말을 다 찾았어요! ({formatTime(seconds)})</span>
        </FoundAllMessage>
      )}

      {/* Assembly Finished Notification Banner */}
      <AnimatePresence>
        {isGenerationComplete && (
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
