'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { Search, X, Home } from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';

const RECENT = ['전주 한옥마을', '안동 하회마을'];
const POPULAR = ['전주', '경주', '담양', '제주'];

interface SearchBarProps {
  showHomeButton?: boolean;
}

const Wrap = styled.div`
  position: relative;
  width: 100%;
`;

const Field = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 14px 0 6px;
  border-radius: 9999px;
  background: rgba(25, 31, 40, 0.04);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:focus-within {
    background: rgba(25, 31, 40, 0.07);
  }
`;

const HomeBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: none;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(40, 110, 95, 0.12);
    color: ${lightPalette.cheongrok[700]};
    transform: scale(1.06);
  }

  &:active {
    transform: scale(0.92);
  }
`;

const SearchIconBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 2px;
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  color: ${meok[900]};

  &::placeholder {
    color: ${meok[400]};
  }
`;

const Clear = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex: none;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(25, 31, 40, 0.08);
  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(25, 31, 40, 0.16);
    color: ${meok[900]};
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 40;
  padding: 16px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(25, 31, 40, 0.1);
  backdrop-filter: blur(20px);
`;

const GroupTitle = styled.p`
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: ${meok[500]};

  & + & {
    margin-top: 14px;
  }
`;

const Suggestions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Suggestion = styled.button`
  padding: 5px 12px;
  border: none;
  border-radius: 9999px;
  background: rgba(78, 89, 104, 0.07);
  font-family: inherit;
  font-size: 12.5px;
  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(78, 89, 104, 0.14);
    color: ${meok[900]};
  }
`;

export default function SearchBar({ showHomeButton = true }: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <Wrap>
      <Field>
        {showHomeButton ? (
          <HomeBtn
            type="button"
            onClick={handleGoHome}
            aria-label="온마루 메인 홈으로 이동"
            title="온마루 홈으로 이동"
          >
            <Home size={18} />
          </HomeBtn>
        ) : null}

        <SearchIconBox>
          <Search size={16} color={meok[400]} aria-hidden />
        </SearchIconBox>

        <Input
          type="search"
          value={value}
          placeholder="지역, 마을, 장소 검색"
          aria-label="장소 검색"
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
        />

        {value && (
          <Clear type="button" aria-label="검색어 지우기" onClick={() => setValue('')}>
            <X size={15} />
          </Clear>
        )}
      </Field>

      {open && (
        <Dropdown>
          <GroupTitle>최근 검색</GroupTitle>
          <Suggestions>
            {RECENT.map((keyword) => (
              <Suggestion key={keyword} type="button" onClick={() => setValue(keyword)}>
                {keyword}
              </Suggestion>
            ))}
          </Suggestions>

          <GroupTitle>인기 지역</GroupTitle>
          <Suggestions>
            {POPULAR.map((keyword) => (
              <Suggestion key={keyword} type="button" onClick={() => setValue(keyword)}>
                {keyword}
              </Suggestion>
            ))}
          </Suggestions>
        </Dropdown>
      )}
    </Wrap>
  );
}
