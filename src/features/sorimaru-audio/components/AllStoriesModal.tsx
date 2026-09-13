'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { X, Search, Clock, Pause, Play } from 'lucide-react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SorimaruStoryItem, SorimaruCategory } from '@/features/sorimaru-audio/types/sorimaru.types';
import { palette, meok, surface, fontSize } from '@/design-system/tokens';

interface AllStoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  allStories: SorimaruStoryItem[];
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const pulseAnim = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(12px);
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContainer = styled.div`
  background-color: ${surface.dark.app};
  color: #ffffff;
  width: 100%;
  max-width: 56rem;
  max-height: 85vh;
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const HeaderBadge = styled.span`
  font-size: ${fontSize.micro};
  font-weight: 700;
  color: ${palette.jangmi[200]};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 0.125rem;
`;

const HeaderTitle = styled.h2`
  font-family: inherit;
  font-size: ${fontSize.xl};
  font-weight: 600;
  color: #ffffff;

  @media (min-width: 640px) {
    font-size: ${fontSize['2xl']};
  }
`;

const CloseButton = styled.button`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const ControlBar = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: #141210;
`;

const CategoryChipsRail = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ChipButton = styled.button<{ isSelected: boolean }>`
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: ${fontSize.xs};
  font-weight: 700;
  white-space: nowrap;
  border: 1px solid ${(props) => (props.isSelected ? palette.jangmi[700] : 'rgba(255, 255, 255, 0.1)')};
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${(props) => (props.isSelected ? palette.jangmi[700] : 'rgba(255, 255, 255, 0.05)')};
  color: ${(props) => (props.isSelected ? '#ffffff' : meok[500])};

  &:hover {
    background-color: ${(props) => (props.isSelected ? palette.jangmi[700] : 'rgba(255, 255, 255, 0.1)')};
    color: #ffffff;
  }
`;

const SearchInputWrapper = styled.div`
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.625rem 1rem 0.625rem 2.5rem;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  font-size: ${fontSize.sm};
  color: #ffffff;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    border-color: ${palette.jangmi[500]};
  }
`;

const SearchIconWrapper = styled.div`
  position: absolute;
  left: 0.875rem;
  top: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
`;

const StoryListArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const EmptyState = styled.div`
  padding: 3rem 0;
  text-align: center;
  color: ${meok[500]};
  font-size: ${fontSize.sm};
`;

const StoryCard = styled.div<{ isCurrent: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${(props) => (props.isCurrent ? palette.jangmi[700] : 'rgba(255, 255, 255, 0.08)')};
  background-color: ${(props) => (props.isCurrent ? 'rgba(212, 32, 88, 0.2)' : 'rgba(255, 255, 255, 0.05)')};
  color: ${(props) => (props.isCurrent ? '#ffffff' : meok[500])};

  &:hover {
    background-color: ${(props) => (props.isCurrent ? 'rgba(212, 32, 88, 0.25)' : 'rgba(255, 255, 255, 0.1)')};
  }
`;

const CardLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
`;

const CardThumb = styled.img`
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.75rem;
  object-fit: cover;
  flex-shrink: 0;
`;

const CardInfo = styled.div`
  min-width: 0;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

const CategoryTag = styled.span`
  padding: 0.125rem 0.5rem;
  font-size: ${fontSize.micro};
  font-weight: 700;
  background-color: ${palette.jangmi[700]};
  color: #ffffff;
  border-radius: 0.25rem;
`;

const DurationText = styled.span`
  font-size: ${fontSize.xs};
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const StoryTitle = styled.h4`
  font-size: ${fontSize.sm};
  font-weight: 700;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (min-width: 640px) {
    font-size: ${fontSize.base};
  }
`;

const StoryDesc = styled.p`
  margin-top: 0.125rem;
  font-size: ${fontSize.xs};
  color: ${meok[500]};

  & .loc {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & .spk {
    display: block;
    margin-top: 0.125rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: ${fontSize.micro};
  }
`;

const PlayActionBtn = styled.button<{ isPlaying: boolean }>`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${fontSize.sm};
  font-weight: 700;
  flex-shrink: 0;
  margin-left: 0.75rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${(props) => (props.isPlaying ? palette.jangmi[700] : 'rgba(255, 255, 255, 0.1)')};
  color: #ffffff;
  animation: ${(props) => (props.isPlaying ? `${pulseAnim} 2s infinite` : 'none')};

  &:hover {
    background-color: ${palette.jangmi[700]};
  }
`;

const MODAL_CATEGORIES: SorimaruCategory[] = [
  '전체',
  '한옥/고택',
  '전통시장/장터',
  '마을/골목길',
  '궁궐/역사',
  '소리/문화',
  '자연/둘레길',
];

const MODAL_CATEGORY_KEYWORDS: Record<string, string[]> = {
  '한옥/고택': ['한옥', '고택', '한옥마을'],
  '전통시장/장터': ['시장', '장터', '시전'],
  '마을/골목길': ['마을', '골목', '길'],
  '궁궐/역사': ['궁', '역사', '유적'],
  '소리/문화': ['소리', '전통', '문화'],
  '자연/둘레길': ['자연', '둘레길', '산', '공원'],
};

export const AllStoriesModal: React.FC<AllStoriesModalProps> = ({
  isOpen,
  onClose,
  allStories,
}) => {
  const currentStory = useSorimaruAudioStore((s) => s.currentStory);
  const isPlaying = useSorimaruAudioStore((s) => s.isPlaying);
  const setCurrentStory = useSorimaruAudioStore((s) => s.setCurrentStory);
  const setIsPlaying = useSorimaruAudioStore((s) => s.setIsPlaying);

  const [activeCat, setActiveCat] = useState<SorimaruCategory>('전체');
  const [modalSearch, setModalSearch] = useState<string>('');

  if (!isOpen) return null;

  let filtered = allStories;
  if (activeCat !== '전체') {
    const keywords = MODAL_CATEGORY_KEYWORDS[activeCat] || [];
    filtered = filtered.filter((story) => {
      const searchableText = [story.category, story.title, story.audioTitle, story.locationName]
        .filter(Boolean)
        .join(' ');
      return keywords.some((keyword) => searchableText.includes(keyword));
    });
  }
  if (modalSearch.trim().length > 0) {
    const q = modalSearch.toLowerCase().trim();
    filtered = filtered.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.audioTitle.toLowerCase().includes(q) ||
        s.script.toLowerCase().includes(q)
    );
  }

  const handlePlayStory = (story: SorimaruStoryItem) => {
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        {/* 모달 헤더 */}
        <ModalHeader>
          <div>
            <HeaderBadge>
              COMPLETE AUDIO COLLECTION
            </HeaderBadge>
            <HeaderTitle>
              오디(Sorimaru) 전체 이야기 아카이브
            </HeaderTitle>
          </div>
          <CloseButton onClick={onClose} aria-label="닫기">
            <X size={22} strokeWidth={2} />
          </CloseButton>
        </ModalHeader>

        {/* 카테고리 필터 & 검색 */}
        <ControlBar>
          {/* 카테고리 태그 칩 */}
          <CategoryChipsRail>
            {MODAL_CATEGORIES.map((cat) => {
              const isSel = activeCat === cat;
              return (
                <ChipButton
                  key={cat}
                  isSelected={isSel}
                  onClick={() => setActiveCat(cat)}
                >
                  {cat}
                </ChipButton>
              );
            })}
          </CategoryChipsRail>

          {/* 검색창 */}
          <SearchInputWrapper>
            <SearchInput
              type="text"
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              placeholder="이야기, 장소, 해설사 키워드로 검색"
            />
            <SearchIconWrapper>
              <Search size={16} strokeWidth={2} />
            </SearchIconWrapper>
          </SearchInputWrapper>
        </ControlBar>

        {/* 오디오 이야기 리스트 스크롤 영역 */}
        <StoryListArea>
          {filtered.length === 0 ? (
            <EmptyState>
              일치하는 이야기가 없습니다.
            </EmptyState>
          ) : (
            filtered.map((story, index) => {
              const isCurrent = currentStory.stid === story.stid;
              const isThisPlaying = isCurrent && isPlaying;

              return (
                <StoryCard
                  key={`${story.stid}-${index}`}
                  isCurrent={isCurrent}
                  onClick={() => handlePlayStory(story)}
                >
                  <CardLeft>
                    <CardThumb
                      src={story.imageUrl || 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80'}
                      alt={story.title}
                    />
                    <CardInfo>
                      <MetaRow>
                        <CategoryTag>
                          {story.category}
                        </CategoryTag>
                        <DurationText>
                          <Clock size={13} strokeWidth={2} />
                          {story.formattedDuration}
                        </DurationText>
                      </MetaRow>
                      <StoryTitle>
                        {story.title}
                      </StoryTitle>
                      <StoryDesc>
                        <span className="loc">{story.locationName || story.title}</span>
                        <span className="spk">{story.speaker}</span>
                      </StoryDesc>
                    </CardInfo>
                  </CardLeft>

                  <PlayActionBtn
                    isPlaying={isThisPlaying}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayStory(story);
                    }}
                    aria-label={isThisPlaying ? '일시정지' : '재생'}
                  >
                    {isThisPlaying ? (
                      <Pause size={16} strokeWidth={2} />
                    ) : (
                      <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />
                    )}
                  </PlayActionBtn>
                </StoryCard>
              );
            })
          )}
        </StoryListArea>
      </ModalContainer>
    </ModalOverlay>
  );
};
