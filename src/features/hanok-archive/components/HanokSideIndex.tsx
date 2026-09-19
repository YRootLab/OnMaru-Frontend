'use client';

import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { meok, lightPalette } from '@/design-system/tokens';
import { HANOK_REVEAL_SECTIONS } from '@/features/hanok-archive/hanokSectionReveal';

/*
  본문(SectionContainer/IntroStage)은 항상 1140px로 가운데 정렬된다. 1366~1512px대
  노트북에서도 보이게 하려면 왼쪽 여백이 80~190px밖에 없다고 보고 짜야 한다 — 본문
  가운데 기준으로 위치를 계산하지 않고 뷰포트 왼쪽 끝에서 고정 거리(20px)만 떼어
  두고, 라벨도 108px 폭 안에서 줄바꿈되게 해 절대 본문을 침범하지 않는다.
*/
const SIDE_INDEX_SECTIONS = [
  { id: 'hanok-kculture-themes', label: '스크린 속 한옥' },
  { id: HANOK_REVEAL_SECTIONS.structure, label: '3D 구조 & 일조' },
  { id: HANOK_REVEAL_SECTIONS.grid, label: '전국 한옥 도감' },
  { id: HANOK_REVEAL_SECTIONS.stay, label: '지역별 한옥 스테이' },
  { id: HANOK_REVEAL_SECTIONS.map, label: '전국 공간 지도' },
] as const;

const Rail = styled.nav<{ $visible: boolean }>`
  display: none;

  @media (min-width: 1320px) {
    display: flex;
    position: fixed;
    top: 50%;
    left: 20px;
    width: 108px;
    transform: translateY(-50%);
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    z-index: 5;
    opacity: ${({ $visible }) => ($visible ? 1 : 0)};
    pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
    transition: opacity 0.3s ease;
  }
`;

const IndexItem = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  background: none;
  border: none;
  padding: 2px 0;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-hanok);
  font-size: 12.5px;
  line-height: 1.35;
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  letter-spacing: -0.01em;
  white-space: normal;
  word-break: keep-all;
  color: ${({ $active }) => ($active ? lightPalette.juhong[500] : meok[400])};
  transition: color 0.3s ease, font-weight 0.2s ease;

  &:hover {
    color: ${({ $active }) => ($active ? lightPalette.juhong[500] : meok[700])};
  }

  [data-theme='dark'] & {
    color: ${({ $active }) => ($active ? lightPalette.juhong[400] : meok[500])};

    &:hover {
      color: ${({ $active }) => ($active ? lightPalette.juhong[400] : meok[300])};
    }
  }
`;

const IndexDash = styled.span<{ $active: boolean }>`
  margin-top: 6px;
  width: ${({ $active }) => ($active ? '14px' : '8px')};
  height: 2px;
  flex-shrink: 0;
  background: ${lightPalette.juhong[500]};
  opacity: ${({ $active }) => ($active ? 1 : 0.35)};
  transition: width 0.3s ease, opacity 0.3s ease;
`;

/**
 * 뷰포트 중앙의 얇은 띠(위아래 45%씩 접어 10%만 남긴다)를 지나는 섹션을 "지금 보는 중"으로
 * 삼는다. 여러 섹션이 동시에 걸치는 일은 드물지만, 그런 경우 선언 순서상 앞선 쪽을 우선한다.
 */
export default function HanokSideIndex() {
  const [activeId, setActiveId] = useState<string>(SIDE_INDEX_SECTIONS[0].id);
  const [visible, setVisible] = useState(false);
  const intersectingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const elements = SIDE_INDEX_SECTIONS
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) intersectingRef.current.add(entry.target.id);
          else intersectingRef.current.delete(entry.target.id);
        }

        const current = SIDE_INDEX_SECTIONS.find((section) => intersectingRef.current.has(section.id));
        if (current) setActiveId(current.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // 목차는 히어로(인트로)를 다 지나 "스크린 속 한옥"에 들어설 때부터 보여준다 — 히어로
  // 위에 얹히면 제목/리드 문구와 겹쳐 산만해진다.
  useEffect(() => {
    const introEl = document.getElementById(HANOK_REVEAL_SECTIONS.intro);
    if (!introEl) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: '-50% 0px 0px 0px', threshold: 0 },
    );
    observer.observe(introEl);
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Rail aria-label="한옥 이야기 챕터 목차" $visible={visible}>
      {SIDE_INDEX_SECTIONS.map((section) => {
        const active = section.id === activeId;
        return (
          <IndexItem
            key={section.id}
            type="button"
            $active={active}
            aria-current={active || undefined}
            onClick={() => scrollTo(section.id)}
          >
            <IndexDash $active={active} />
            {section.label}
          </IndexItem>
        );
      })}
    </Rail>
  );
}
