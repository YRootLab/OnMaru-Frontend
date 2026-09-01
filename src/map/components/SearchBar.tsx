'use client';

import { useState } from 'react';
import styled from '@emotion/styled';
import { Search, X } from 'lucide-react';
import { meok } from '@/design-system/tokens';

const RECENT = ['전주 한옥마을', '안동 하회마을'];
const POPULAR = ['전주', '경주', '담양', '제주'];

const Wrap = styled.div`
  position: relative;
`;

const Field = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 14px;
  border: 1px solid rgba(78, 89, 104, 0.14);
  border-radius: 12px;
  background: #ffffff;

  &:focus-within {
    border-color: rgba(78, 89, 104, 0.28);
  }
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 15px;
  color: ${meok[900]};

  &::placeholder {
    color: ${meok[400]};
  }
`;

const Clear = styled.button`
  display: flex;
  flex: none;
  padding: 2px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: ${meok[500]};
  cursor: pointer;

  &:hover {
    background: rgba(25, 31, 40, 0.06);
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 40;
  padding: 12px 14px 14px;
  border: 1px solid rgba(78, 89, 104, 0.1);
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 8px 28px rgba(25, 31, 40, 0.14);
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
  padding: 5px 10px;
  border: 1px solid rgba(78, 89, 104, 0.14);
  border-radius: 9999px;
  background: transparent;
  font-family: inherit;
  font-size: 13px;
  color: ${meok[700]};
  cursor: pointer;

  &:hover {
    background: rgba(25, 31, 40, 0.04);
  }
`;

export default function SearchBar() {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  return (
    <Wrap>
      <Field>
        <Search size={18} color={meok[400]} aria-hidden />
        <Input
          type="search"
          value={value}
          placeholder="지역, 마을, 장소 검색"
          aria-label="장소 검색"
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          // 드롭다운 항목 클릭이 blur보다 먼저 살아남도록 한 틱 늦춘다.
          onBlur={() => setTimeout(() => setOpen(false), 120)}
        />
        {value && (
          <Clear type="button" aria-label="검색어 지우기" onClick={() => setValue('')}>
            <X size={16} />
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
