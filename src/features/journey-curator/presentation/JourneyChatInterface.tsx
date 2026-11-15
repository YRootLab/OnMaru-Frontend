'use client';

import { FormEvent, useState } from 'react';
import styled from '@emotion/styled';
import type { ExplorationSummary, ExplorationTurn } from '../domain/conversation';
import type { JourneyBoard, PlaceResource } from '../types/exploration.types';

type Props = {
  explorations: ExplorationSummary[];
  activeExplorationId: string | null;
  turns: ExplorationTurn[];
  pendingQuery: string | null;
  progressMessage: string | null;
  loading: boolean;
  loadingOlder: boolean;
  hasOlderTurns: boolean;
  error: string | null;
  onSelectConversation: (explorationId: string | null) => void;
  onLoadOlder: () => void;
  onSend: (query: string) => Promise<void>;
  onCancel: () => Promise<void>;
};

const Page = styled.main`
  min-height: 100dvh;
  padding: 84px 20px 24px;
  background: #f8f8f7;
  color: #202124;

  [data-theme='dark'] & {
    background: #171717;
    color: #f5f5f5;
  }

  @media (max-width: 720px) {
    padding: 68px 0 0;
  }
`;

const Layout = styled.div`
  width: min(1240px, 100%);
  min-height: calc(100dvh - 108px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid #e5e5e3;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 18px 56px rgba(25, 25, 25, 0.08);

  [data-theme='dark'] & {
    background: #202020;
    border-color: #373737;
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    min-height: calc(100dvh - 68px);
    border-radius: 0;
    border-inline: 0;
  }
`;

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-right: 1px solid #e5e5e3;
  background: #f5f5f4;

  [data-theme='dark'] & {
    background: #1c1c1c;
    border-color: #373737;
  }

  @media (max-width: 720px) {
    flex-direction: row;
    overflow-x: auto;
    border-right: 0;
    border-bottom: 1px solid #e5e5e3;
    padding: 10px 12px;
    gap: 8px;
    scrollbar-width: none;
  }
`;

const NewChatButton = styled.button`
  margin: 16px;
  padding: 11px 14px;
  border: 0;
  border-radius: 12px;
  background: #202124;
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;

  &:hover { background: #383838; }

  @media (max-width: 720px) {
    margin: 0;
    white-space: nowrap;
  }
`;

const ConversationList = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  padding: 0 10px 14px;
  overflow-y: auto;

  @media (max-width: 720px) {
    flex-direction: row;
    overflow: visible;
    padding: 0;
  }
`;

const ConversationButton = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 11px 12px;
  border: 0;
  border-radius: 12px;
  background: ${({ $active }) => ($active ? '#e5e5e3' : 'transparent')};
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:hover { background: #e5e5e3; }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? '#393939' : 'transparent')};
    &:hover { background: #393939; }
  }

  @media (max-width: 720px) {
    width: 190px;
    flex: 0 0 190px;
  }
`;

const ConversationTitle = styled.span`
  display: block;
  overflow: hidden;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ConversationMeta = styled.span`
  display: block;
  margin-top: 4px;
  overflow: hidden;
  color: #777;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Chat = styled.section`
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-width: 0;
  min-height: 0;
`;

const ChatHeader = styled.header`
  padding: 20px 24px 16px;
  border-bottom: 1px solid #ededeb;

  [data-theme='dark'] & { border-color: #373737; }
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(20px, 2.6vw, 28px);
  letter-spacing: -0.035em;
`;

const Subtitle = styled.p`
  margin: 5px 0 0;
  color: #737373;
  font-size: 13px;
  line-height: 1.5;
`;

const Transcript = styled.div`
  min-height: 0;
  overflow-y: auto;
  padding: 28px clamp(16px, 4vw, 56px);
`;

const LoadOlderButton = styled.button`
  display: block;
  margin: 0 auto 22px;
  padding: 8px 12px;
  border: 1px solid #dededc;
  border-radius: 999px;
  background: #fff;
  color: #4a4a4a;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
`;

const MessageGroup = styled.article<{ $user?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ $user }) => ($user ? 'flex-end' : 'flex-start')};
  gap: 8px;
  margin: 0 0 24px;
`;

const Bubble = styled.div<{ $user?: boolean }>`
  max-width: min(700px, 88%);
  padding: 13px 16px;
  border-radius: ${({ $user }) => ($user ? '18px 18px 4px 18px' : '18px 18px 18px 4px')};
  background: ${({ $user }) => ($user ? '#242424' : '#f1f1ef')};
  color: ${({ $user }) => ($user ? '#fff' : '#242424')};
  font-size: 15px;
  line-height: 1.65;
  white-space: pre-wrap;

  [data-theme='dark'] & {
    background: ${({ $user }) => ($user ? '#f5f5f5' : '#303030')};
    color: ${({ $user }) => ($user ? '#202124' : '#f5f5f5')};
  }
`;

const AssistantCard = styled.div`
  width: min(760px, 100%);
  overflow: hidden;
  border: 1px solid #e5e5e3;
  border-radius: 18px;
  background: #fff;

  [data-theme='dark'] & {
    border-color: #414141;
    background: #242424;
  }
`;

const AssistantCopy = styled.p`
  margin: 0;
  padding: 15px 16px 8px;
  font-size: 14px;
  line-height: 1.65;
`;

const Places = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 16px 16px;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
`;

const PlaceCard = styled.article`
  flex: 0 0 min(220px, 68vw);
  overflow: hidden;
  border: 1px solid #e5e5e3;
  border-radius: 14px;
  background: #fff;
  scroll-snap-align: start;
  transition: transform 180ms ease, box-shadow 180ms ease;

  &:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1); }

  [data-theme='dark'] & { background: #2a2a2a; border-color: #444; }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover { transform: none; }
  }
`;

const PlaceImage = styled.div`
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #dededc;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PlaceContent = styled.div`
  padding: 11px 12px 12px;
`;

const PlaceTitle = styled.h3`
  margin: 0;
  font-size: 14px;
`;

const PlaceMeta = styled.p`
  margin: 4px 0 0;
  color: #777;
  font-size: 12px;
`;

const Source = styled.p`
  margin: 0;
  padding: 0 16px 14px;
  color: #777;
  font-size: 11px;
`;

const Progress = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 12px 14px;
  border-radius: 16px 16px 16px 4px;
  background: #f1f1ef;
  color: #4a4a4a;
  font-size: 14px;

  &::before {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #555;
    content: '';
    animation: pulse 1.1s ease-in-out infinite;
  }

  @keyframes pulse { 50% { opacity: 0.35; transform: scale(0.72); } }
  @media (prefers-reduced-motion: reduce) { &::before { animation: none; } }
`;

const Empty = styled.div`
  max-width: 620px;
  margin: 48px auto;
  color: #5f5f5f;
  text-align: center;
`;

const SuggestionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
`;

const Suggestion = styled.button`
  padding: 9px 12px;
  border: 1px solid #dededc;
  border-radius: 999px;
  background: #fff;
  color: #333;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
`;

const Composer = styled.form`
  display: flex;
  gap: 10px;
  padding: 15px clamp(16px, 4vw, 56px) 20px;
  border-top: 1px solid #ededeb;

  [data-theme='dark'] & { border-color: #373737; }
`;

const Input = styled.input`
  min-width: 0;
  flex: 1;
  padding: 13px 14px;
  border: 1px solid #d5d5d2;
  border-radius: 14px;
  background: #fff;
  color: inherit;
  font: inherit;

  [data-theme='dark'] & { background: #292929; border-color: #464646; }
`;

const SendButton = styled.button`
  padding: 0 16px;
  border: 0;
  border-radius: 14px;
  background: #242424;
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;

  &:disabled { cursor: not-allowed; opacity: 0.55; }
`;

function findPlaces(board: JourneyBoard | null): PlaceResource[] {
  return board?.resources.filter((resource): resource is PlaceResource => resource.ref.type === 'PLACE') ?? [];
}

function AssistantResponse({ turn }: { turn: ExplorationTurn }) {
  const { response } = turn;
  if (response.status === 'PENDING') return null;
  if (response.status === 'CANCELLED') return <Bubble>요청이 취소되었어요.</Bubble>;
  if (response.status === 'FAILED') return <Bubble>요청을 완료하지 못했어요. {response.error?.requestId ? `요청 번호: ${response.error.requestId}` : ''}</Bubble>;
  if (response.outcome === 'NO_RESULTS') return <Bubble>{response.summary ?? '조건에 맞는 여행 결과를 찾지 못했어요.'}</Bubble>;

  const places = findPlaces(response.board);
  return (
    <AssistantCard>
      <AssistantCopy>{response.summary ?? (response.board ? response.board.querySummary : '여행 결과를 준비했어요.')}</AssistantCopy>
      {places.length > 0 && (
        <Places aria-label="추천 장소">
          {places.map((place) => (
            <PlaceCard key={place.ref.id} tabIndex={0}>
              <PlaceImage>
                {place.image && <img src={place.image.url} alt={place.image.alt} />}
              </PlaceImage>
              <PlaceContent>
                <PlaceTitle>{place.title}</PlaceTitle>
                <PlaceMeta>{place.category} · {place.regionRef.id}</PlaceMeta>
                {place.summary && <PlaceMeta>{place.summary}</PlaceMeta>}
              </PlaceContent>
            </PlaceCard>
          ))}
        </Places>
      )}
      {places.some((place) => place.image?.sourceName) && (
        <Source>사진 출처: {places.map((place) => place.image?.sourceName).filter(Boolean).join(', ')}</Source>
      )}
    </AssistantCard>
  );
}

export default function JourneyChatInterface({
  explorations,
  activeExplorationId,
  turns,
  pendingQuery,
  progressMessage,
  loading,
  loadingOlder,
  hasOlderTurns,
  error,
  onSelectConversation,
  onLoadOlder,
  onSend,
  onCancel,
}: Props) {
  const [draft, setDraft] = useState('');
  const isRunning = Boolean(progressMessage);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const query = draft.trim();
    if (!query || isRunning) return;
    setDraft('');
    await onSend(query);
  };

  return (
    <Page>
      <Layout>
        <Sidebar aria-label="AI 여정 대화 목록">
          <NewChatButton type="button" onClick={() => onSelectConversation(null)}>새 대화</NewChatButton>
          <ConversationList>
            {explorations.map((conversation) => (
              <ConversationButton
                key={conversation.explorationId}
                type="button"
                $active={conversation.explorationId === activeExplorationId}
                onClick={() => onSelectConversation(conversation.explorationId)}
              >
                <ConversationTitle>{conversation.title}</ConversationTitle>
                <ConversationMeta>{conversation.lastUserQueryPreview ?? '여정 대화'}</ConversationMeta>
              </ConversationButton>
            ))}
          </ConversationList>
        </Sidebar>

        <Chat>
          <ChatHeader>
            <Title>AI 여정 대화</Title>
            <Subtitle>조건을 말해 주시면, 사진과 장소를 보며 함께 여행을 만들어 가요.</Subtitle>
          </ChatHeader>

          <Transcript aria-live="polite">
            {hasOlderTurns && <LoadOlderButton type="button" disabled={loadingOlder} onClick={onLoadOlder}>{loadingOlder ? '불러오는 중…' : '이전 대화 더 보기'}</LoadOlderButton>}
            {!activeExplorationId && !pendingQuery && (
              <Empty>
                <h2>어떤 여행을 함께 만들어 볼까요?</h2>
                <p>장소, 분위기, 이동 시간처럼 원하는 조건을 편하게 말해 주세요.</p>
                <SuggestionRow>
                  {['비 오는 날 조용한 서울 산책', '아이와 함께 가기 좋은 한옥 여행', '전주에서 하루 동안 걷는 여행'].map((suggestion) => (
                    <Suggestion key={suggestion} type="button" onClick={() => void onSend(suggestion)}>{suggestion}</Suggestion>
                  ))}
                </SuggestionRow>
              </Empty>
            )}
            {loading && activeExplorationId && <Empty>대화를 불러오는 중이에요.</Empty>}
            {turns.map((turn) => (
              <div key={turn.turnId}>
                <MessageGroup $user><Bubble $user>{turn.query}</Bubble></MessageGroup>
                <MessageGroup><AssistantResponse turn={turn} /></MessageGroup>
              </div>
            ))}
            {pendingQuery && <MessageGroup $user><Bubble $user>{pendingQuery}</Bubble></MessageGroup>}
            {progressMessage && <MessageGroup><Progress>{progressMessage}</Progress></MessageGroup>}
            {error && <MessageGroup><Bubble>{error}</Bubble></MessageGroup>}
          </Transcript>

          <Composer onSubmit={submit}>
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="여행 조건을 이어서 물어보세요" aria-label="여행 질문" disabled={isRunning} />
            {isRunning ? <SendButton type="button" onClick={() => void onCancel()}>취소</SendButton> : <SendButton type="submit" disabled={!draft.trim()}>보내기</SendButton>}
          </Composer>
        </Chat>
      </Layout>
    </Page>
  );
}
