'use client';

import styled from '@emotion/styled';
import { MapPin, Medal, RefreshCw, ShieldCheck, Trophy, UserCheck, UserX } from 'lucide-react';
import type { StampRankingEntry, StampRankingStatusResponse } from '../domain/models';
import { meok } from '@/design-system/tokens';
import OniSearchEmpty from '@/shared/components/OniSearchEmpty/OniSearchEmpty';

interface StampLeaderboardProps {
  entries: StampRankingEntry[];
  myRanking: StampRankingStatusResponse | null;
  isLoggedIn: boolean;
  loading: boolean;
  hasError: boolean;
  mutationPending: boolean;
  retryAfterSeconds: number;
  onLogin: () => void;
  onJoin: () => void;
  onWithdraw: () => void;
  onRetry: () => void;
}

const Root = styled.div`
  display: grid;
  gap: 18px;
`;

const Participation = styled.section`
  display: grid;
  gap: 10px;
  padding: 18px;
  border-radius: 16px;
  background: #f8f8f7;
  border: 1px solid #e5e5e3;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.08);
  }
`;

const ParticipationTitle = styled.h3`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-traditional);
  font-size: 16px;
  color: ${meok[900]};
  [data-theme='dark'] & { color: #ffffff; }
`;

const Copy = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: ${meok[500]};
`;

const MyStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 13px;
  color: ${meok[700]};
  strong { color: ${meok[900]}; }
  [data-theme='dark'] & { color: ${meok[300]}; strong { color: #ffffff; } }
`;

const Action = styled.button<{ $danger?: boolean }>`
  width: fit-content;
  min-height: 38px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid ${({ $danger }) => ($danger ? '#cdcdca' : '#b91c1c')};
  border-radius: 10px;
  background: ${({ $danger }) => ($danger ? '#ffffff' : '#b91c1c')};
  color: ${({ $danger }) => ($danger ? meok[700] : '#ffffff')};
  font-weight: 700;
  cursor: pointer;
  &:disabled { opacity: 0.55; cursor: wait; }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Row = styled.div`
  min-height: 76px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(25, 31, 40, 0.025);
  [data-theme='dark'] & { background: rgba(255, 255, 255, 0.04); }
`;

const Rank = styled.div<{ $rank: number }>`
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 800;
  color: ${({ $rank }) => ($rank <= 3 ? '#ffffff' : meok[600])};
  background: ${({ $rank }) => (
    $rank === 1 ? '#b91c1c' : $rank <= 3 ? '#6b7280' : '#e5e5e3'
  )};
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const Nickname = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: ${meok[900]};
  [data-theme='dark'] & { color: #ffffff; }
`;

const Stats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 5px;
  font-size: 12px;
  color: ${meok[500]};
  span { display: inline-flex; align-items: center; gap: 4px; }
`;

const Empty = styled.div`
  min-height: 180px;
  display: grid;
  place-items: center;
  text-align: center;
  color: ${meok[500]};
  background: #f8f8f7;
  border-radius: 16px;
`;

const SkeletonLine = styled.div`
  width: 65%;
  height: 14px;
  border-radius: 7px;
  background: #e5e5e3;
`;

export default function StampLeaderboard({
  entries,
  myRanking,
  isLoggedIn,
  loading,
  hasError,
  mutationPending,
  retryAfterSeconds,
  onLogin,
  onJoin,
  onWithdraw,
  onRetry,
}: StampLeaderboardProps) {
  return (
    <Root>
      <Participation>
        <ParticipationTitle>
          <ShieldCheck size={17} /> 익명 탐방 랭킹
        </ParticipationTitle>
        {!isLoggedIn ? (
          <>
            <Copy>공개 랭킹은 동의한 회원만 참여하며 서버가 만든 익명 별명만 표시해요.</Copy>
            <Action type="button" onClick={onLogin}><UserCheck size={15} /> 로그인하고 참여하기</Action>
          </>
        ) : myRanking?.participating ? (
          <>
            <Copy>서버 생성 익명 별명 <strong>{myRanking.publicNickname}</strong>으로 참여 중이에요.</Copy>
            <MyStats>
              <span>내 순위 <strong>{myRanking.rank}위</strong></span>
              <span>참여자 <strong>{myRanking.participantCount}명</strong></span>
              <span>달성률 <strong>{myRanking.completionRate}%</strong></span>
            </MyStats>
            <Action $danger type="button" disabled={mutationPending} onClick={onWithdraw}>
              <UserX size={15} /> 참여 철회
            </Action>
          </>
        ) : (
          <>
            <Copy>
              수결 획득만으로 자동 등록되지 않아요. 참여하면 서버가 익명 별명을 만들고,
              철회하면 공개 목록에서 즉시 제외해요.
            </Copy>
            {myRanking && (
              <MyStats>
                <span>내 수결 <strong>{myRanking.stampCount}개</strong></span>
                <span>달성률 <strong>{myRanking.completionRate}%</strong></span>
              </MyStats>
            )}
            <Action
              type="button"
              disabled={mutationPending || retryAfterSeconds > 0}
              onClick={onJoin}
            >
              <UserCheck size={15} />
              {retryAfterSeconds > 0 ? `${retryAfterSeconds}초 뒤 참여 가능` : '익명 랭킹 참여'}
            </Action>
          </>
        )}
      </Participation>

      {loading && entries.length === 0 ? (
        <List aria-label="랭킹을 불러오는 중" aria-busy="true">
          {Array.from({ length: 5 }, (_, index) => (
            <Row key={index}><Rank $rank={index + 1}>{index + 1}</Rank><SkeletonLine /></Row>
          ))}
        </List>
      ) : hasError && entries.length === 0 ? (
        <OniSearchEmpty
          size="sm"
          title="랭킹을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          compact
          action={
            <Action type="button" onClick={onRetry}><RefreshCw size={15} /> 다시 시도</Action>
          }
        />
      ) : entries.length === 0 ? (
        <Empty>아직 공개 랭킹 참여자가 없어요.</Empty>
      ) : (
        <List>
          {entries.map((entry) => (
            <Row key={entry.publicId}>
              <Rank $rank={entry.rank}>
                {entry.rank === 1 ? <Trophy size={15} /> : entry.rank <= 3 ? <Medal size={15} /> : entry.rank}
              </Rank>
              <UserInfo>
                <Nickname>{entry.nickname}</Nickname>
                <Stats>
                  <span><Trophy size={12} /> 수결 {entry.stampCount}개</span>
                  <span><MapPin size={12} /> {entry.visitedRegionCount}개 권역</span>
                  <span>달성률 {entry.completionRate}%</span>
                </Stats>
              </UserInfo>
            </Row>
          ))}
        </List>
      )}
    </Root>
  );
}
