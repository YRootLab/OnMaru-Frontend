'use client';

import React, { FormEvent, useId, useState } from 'react';
import styled from '@emotion/styled';
import { Search, X } from 'lucide-react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SORIMARU_THEME_CATEGORIES } from '@/features/sorimaru-audio/data/sorimaruCategoryData';
import { palette, meok, surface } from '@/design-system/tokens';

interface Props {
  resultCount: number;
  totalCount?: number;
}

const labelFor = (keyword: string) => {
  if (!keyword || keyword === '전체') return '전체 이야기';
  const category = SORIMARU_THEME_CATEGORIES.find((item) => item.keyword === keyword);
  if (keyword === '마을') return '전통마을';
  if (keyword === '시장') return '전통시장';
  if (keyword === '궁') return '궁궐/역사';
  if (keyword === '길') return '자연/둘레길';
  return category?.label || keyword;
};

const BarWrapper = styled.div`
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.15rem 0;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const MetaInfoGroup = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
`;

const FilterChip = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  background-color: #f3f3f2;
  padding: 0.22rem 0.65rem;
  font-size: 12px;
  font-weight: 600;
  color: ${meok[900]};

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.1);
    color: ${meok[100]};
  }
`;

const SearchForm = styled.form`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.4rem;

  @media (min-width: 640px) {
    width: 17rem;
  }
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  height: 2.125rem;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  background-color: #f5f5f4;
  border: none;
  box-shadow: none;
  padding: 0 0.75rem;
  transition: background-color 0.2s ease;

  &:focus-within {
    background-color: ${palette.juhong[50]};
    border: none;
    box-shadow: none;
  }

  [data-theme='dark'] & {
    background-color: ${surface.dark.card};
    border: none;
    box-shadow: none;

    &:focus-within {
      background-color: ${surface.dark.elevated};
      border: none;
      box-shadow: none;
    }
  }
`;

const StyledSearchInput = styled.input`
  height: 100%;
  width: 100%;
  min-width: 0;
  background: transparent;
  font-family: inherit;
  font-size: 0.75rem;
  color: ${meok[900]};
  outline: none;
  border: none;

  &::placeholder {
    color: ${meok[500]};
  }

  [data-theme='dark'] & {
    color: ${meok[100]};

    &::placeholder {
      color: ${meok[400]};
    }
  }
`;

const ClearBtn = styled.button`
  display: grid;
  flex-shrink: 0;
  place-items: center;
  border-radius: 9999px;
  padding: 0.2rem;
  color: ${meok[500]};
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: rgba(33, 30, 25, 0.05);
    color: ${meok[900]};
  }

  [data-theme='dark'] & {
    color: ${meok[400]};

    &:hover {
      background-color: rgba(255, 255, 255, 0.08);
      color: ${meok[100]};
    }
  }
`;

const SubmitBtn = styled.button`
  height: 2.125rem;
  flex-shrink: 0;
  border-radius: 9999px;
  background-color: #211e19;
  padding: 0 0.875rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${palette.juhong[500]};
  }

  [data-theme='dark'] & {
    background-color: ${palette.juhong[500]};

    &:hover {
      background-color: ${palette.juhong[600]};
    }
  }
`;

const ResetBtn = styled.button`
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${meok[500]};
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: ${meok[900]};
  }

  [data-theme='dark'] & {
    color: ${meok[400]};

    &:hover {
      color: ${meok[100]};
    }
  }
`;

export const SorimaruArchiveMetaBar: React.FC<Props> = ({ resultCount, totalCount }) => {
  const selectedCategory = useSorimaruAudioStore((state) => state.selectedCategory);
  const searchQuery = useSorimaruAudioStore((state) => state.searchQuery);
  const setSearchQuery = useSorimaruAudioStore((state) => state.setSearchQuery);
  const setSelectedCategory = useSorimaruAudioStore((state) => state.setSelectedCategory);
  const [draft, setDraft] = useState(searchQuery);
  const searchId = useId();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSelectedCategory('전체');
    setSearchQuery(draft.trim());
  };

  const reset = () => {
    setDraft('');
    setSearchQuery('');
    setSelectedCategory('전체');
  };

  const hasFilter = selectedCategory !== '전체' || Boolean(searchQuery);

  return (
    <BarWrapper>
      <MetaInfoGroup>
        <FilterChip>{labelFor(selectedCategory)}</FilterChip>
        {searchQuery && (
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: meok[700] }}>
            “<strong style={{ fontWeight: 600, color: meok[900] }}>{searchQuery}</strong>” 검색 결과
          </span>
        )}
        <span style={{ flexShrink: 0, color: meok[500] }}>
          {(totalCount ?? resultCount).toLocaleString()}개
        </span>
      </MetaInfoGroup>

      <SearchForm onSubmit={submit}>
        <label htmlFor={searchId} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
          오디오 이야기 검색
        </label>

        <InputWrapper>
          <Search size={15} style={{ flexShrink: 0, color: meok[500] }} />

          <StyledSearchInput
            id={searchId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="장소 또는 키워드 검색"
          />
          {draft && (
            <ClearBtn type="button" onClick={() => setDraft('')} aria-label="검색어 지우기">
              <X size={14} strokeWidth={2} />
            </ClearBtn>
          )}
        </InputWrapper>
        <SubmitBtn type="submit">
          검색
        </SubmitBtn>
        {hasFilter && (
          <ResetBtn type="button" onClick={reset}>
            초기화
          </ResetBtn>
        )}
      </SearchForm>
    </BarWrapper>
  );
};
