'use client';

import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { BookOpenText, ExternalLink, RotateCw, Search, Sparkles } from 'lucide-react';
import { meok, palette, fontSize } from '@/design-system/tokens';
import { filterLabel } from '@/features/hanok-archive/filterLabels';
import type { Village } from '@/features/hanok-archive/types';
import type { HanokStoryResponse } from '@/features/hanok-archive/types/hanokStory';

interface HanokAiStoryPanelProps {
  village: Village;
  overview?: string;
  isContextLoading?: boolean;
}

const Panel = styled.section`
  min-height: 382px;
  margin-bottom: 24px;
  padding: 22px;
  border-radius: 20px;
  background: #f8f8f7;
  color: ${meok[900]};

  [data-theme='dark'] & {
    background: #24211d;
    color: ${meok[100]};
  }
`;

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
`;

const Eyebrow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
  color: ${palette.cheongrok[700]};
  font-size: ${fontSize.micro};
  font-weight: 600;
  letter-spacing: 0.04em;

  [data-theme='dark'] & { color: ${palette.cheongrok[400]}; }
`;

const Title = styled.h3`
  margin: 0;
  font-family: var(--font-hanok);
  font-size: 20px;
  font-weight: 500;
  line-height: 1.35;
`;

const AiLabel = styled.span`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 9px;
  border-radius: 999px;
  background: #e5e5e3;
  color: ${meok[600]};
  font-size: ${fontSize.micro};
  font-weight: 600;

  [data-theme='dark'] & { background: rgba(255, 255, 255, 0.08); color: ${meok[300]}; }
`;

const Summary = styled.p`
  margin: 0 0 20px;
  color: ${meok[700]};
  font-size: ${fontSize.sm};
  line-height: 1.82;
  letter-spacing: -0.01em;
  word-break: keep-all;

  [data-theme='dark'] & { color: ${meok[300]}; }
`;

const Subheading = styled.h4`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 18px 0 10px;
  font-size: ${fontSize.xs};
  font-weight: 600;
  color: ${meok[800]};

  [data-theme='dark'] & { color: ${meok[200]}; }
`;

const Timeline = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const TimelineItem = styled.li`
  display: grid;
  grid-template-columns: 82px 1fr;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid #e5e5e3;

  [data-theme='dark'] & { border-color: rgba(255, 255, 255, 0.08); }
`;

const Period = styled.span`
  color: ${palette.cheongrok[700]};
  font-size: ${fontSize.xs};
  font-weight: 600;

  [data-theme='dark'] & { color: ${palette.cheongrok[400]}; }
`;

const EventText = styled.div`
  strong { display: block; margin-bottom: 3px; font-size: ${fontSize.sm}; font-weight: 600; }
  p { margin: 0; color: ${meok[600]}; font-size: ${fontSize.xs}; line-height: 1.62; }
  [data-theme='dark'] & p { color: ${meok[400]}; }
`;

const Highlights = styled.ul`
  display: grid;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    position: relative;
    padding-left: 14px;
    color: ${meok[700]};
    font-size: ${fontSize.xs};
    line-height: 1.62;
  }
  li::before { content: ''; position: absolute; left: 0; top: 0.7em; width: 4px; height: 4px; border-radius: 50%; background: ${palette.cheongrok[500]}; }
  [data-theme='dark'] & li { color: ${meok[300]}; }
`;

const SourceRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid #e5e5e3;

  [data-theme='dark'] & { border-color: rgba(255, 255, 255, 0.08); }
`;

const SourceLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 5px 8px;
  border-radius: 7px;
  background: #eeeeec;
  color: ${meok[700]};
  font-size: ${fontSize.micro};
  text-decoration: none;

  span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &:hover { background: #e5e5e3; color: ${meok[900]}; }
  [data-theme='dark'] & { background: rgba(255,255,255,0.06); color: ${meok[300]}; }
`;

const Disclaimer = styled.p`
  margin: 10px 0 0;
  color: ${meok[500]};
  font-size: ${fontSize.micro};
  line-height: 1.5;
`;

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding: 7px 10px;
  border: 0;
  border-radius: 8px;
  background: #e5e5e3;
  color: ${meok[700]};
  cursor: pointer;
`;

const Skeleton = styled.div`
  min-height: 302px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  i {
    display: block;
    height: 12px;
    border-radius: 5px;
    background: linear-gradient(90deg, #e5e5e3 25%, #f1f1ef 50%, #e5e5e3 75%);
    background-size: 600px 100%;
    animation: ai-story-shimmer 1.5s ease-in-out infinite;
  }
  i:nth-of-type(1) { width: 94%; }
  i:nth-of-type(2) { width: 100%; }
  i:nth-of-type(3) { width: 72%; margin-bottom: 15px; }
  i:nth-of-type(4) { width: 38%; height: 10px; }
  i:nth-of-type(5), i:nth-of-type(6) { width: 100%; height: 42px; }
  i:nth-of-type(7) { width: 55%; height: 10px; margin-top: 8px; }
  i:nth-of-type(8), i:nth-of-type(9) { width: 86%; }

  @keyframes ai-story-shimmer {
    from { background-position: -600px 0; }
    to { background-position: 600px 0; }
  }

  @media (prefers-reduced-motion: reduce) { i { animation: none; } }
  [data-theme='dark'] & i { background: rgba(255,255,255,0.08); }
`;

export default function HanokAiStoryPanel({
  village,
  overview = '',
  isContextLoading = false,
}: HanokAiStoryPanelProps) {
  const [story, setStory] = useState<HanokStoryResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    if (isContextLoading) return;
    const controller = new AbortController();

    fetch('/api/hanok/story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentId: village.id,
        name: village.name,
        address: village.addr,
        type: filterLabel(village.type),
        overview,
      }),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<HanokStoryResponse>;
      })
      .then(setStory)
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setFailed(true);
      });

    return () => controller.abort();
  }, [
    isContextLoading,
    overview,
    requestKey,
    village.addr,
    village.id,
    village.name,
    village.type,
  ]);

  const retry = () => {
    setStory(null);
    setFailed(false);
    setRequestKey((value) => value + 1);
  };

  return (
    <Panel aria-busy={!story && !failed} aria-live="polite">
      <Header>
        <div>
          <Eyebrow><Sparkles size={13} /> 장소의 맥락을 발견하다</Eyebrow>
          <Title>이 장소에 얽힌 이야기</Title>
        </div>
        <AiLabel>
          {story?.sourceMode === 'public' ? <BookOpenText size={12} /> : <Search size={12} />}
          {story?.sourceMode === 'public'
            ? '공공 기록 해설'
            : story?.sourceMode === 'unavailable'
              ? '자료 확인 중'
              : 'AI 검색 해설'}
        </AiLabel>
      </Header>

      {!story && !failed && (
        <Skeleton aria-label="장소의 역사와 이야기를 찾는 중">
          {Array.from({ length: 9 }, (_, index) => <i key={index} />)}
        </Skeleton>
      )}

      {failed && (
        <>
          <Summary>지금은 공개 자료를 불러오지 못했어요. 잠시 후 다시 검색해 주세요.</Summary>
          <RetryButton type="button" onClick={retry}>
            <RotateCw size={14} /> 다시 검색
          </RetryButton>
        </>
      )}

      {story && (
        <>
          <Summary>{story.summary}</Summary>

          {story.timeline.length > 0 && (
            <>
              <Subheading><BookOpenText size={14} /> 시간의 층위</Subheading>
              <Timeline>
                {story.timeline.map((item, index) => (
                  <TimelineItem key={`${item.period}-${index}`}>
                    <Period>{item.period}</Period>
                    <EventText><strong>{item.title}</strong><p>{item.detail}</p></EventText>
                  </TimelineItem>
                ))}
              </Timeline>
            </>
          )}

          {story.highlights.length > 0 && (
            <>
              <Subheading>현장에서 눈여겨볼 것</Subheading>
              <Highlights>{story.highlights.map((item) => <li key={item}>{item}</li>)}</Highlights>
            </>
          )}

          {story.sources.length > 0 && (
            <SourceRow aria-label="해설 출처">
              {story.sources.map((source, index) => (
                <SourceLink key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">
                  <span>{index + 1}. {source.title}</span><ExternalLink size={11} />
                </SourceLink>
              ))}
            </SourceRow>
          )}

          <Disclaimer>
            {story.sourceMode === 'ai'
              ? 'AI가 공개 검색 자료를 바탕으로 요약했습니다. 세부 사실은 연결된 출처에서 확인할 수 있어요.'
              : story.sourceMode === 'public'
                ? '한국관광공사와 도감 공공데이터 기록을 바탕으로 정리했습니다.'
                : '공개 자료 연결이 원활하지 않습니다.'}
          </Disclaimer>
          {story.sourceMode === 'unavailable' && (
            <RetryButton type="button" onClick={retry}>
              <RotateCw size={14} /> AI 해설 다시 검색
            </RetryButton>
          )}
        </>
      )}
    </Panel>
  );
}
