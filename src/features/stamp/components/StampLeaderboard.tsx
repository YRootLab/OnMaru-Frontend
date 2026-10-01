'use client';

import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react'
import { MapPinIcon, Medal01Icon, RefreshCwIcon, ShieldCheckIcon, TrophyIcon, UserCheck01Icon, UserXIcon } from '@hugeicons/core-free-icons'
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

const RankList = styled.div`
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
          <HugeiconsIcon icon={ShieldCheckIcon} size={17} /> 익명 탐방 랭킹
        </ParticipationTitle>
        {!isLoggedIn ? (
          <>
            <Copy>익명 랭킹에 참여하면 임의로 생성된 별명으로 표시돼요.</Copy>
            <Action type="button" onClick={onLogin}><HugeiconsIcon icon={UserCheck01Icon} size={15} /> 로그인하고 참여하기</Action>
          </>
        ) : myRanking?.participating ? (
          <>
            <Copy>익명 별명 <strong>{myRanking.publicNickname}</strong>으로 참여 중이에요.</Copy>
            <MyStats>
              <span>내 순위 <strong>{myRanking.rank}위</strong></span>
              <span>참여자 <strong>{myRanking.participantCount}명</strong></span>
              <span>달성률 <strong>{myRanking.completionRate}%</strong></span>
            </MyStats>
            <Action $danger type="button" disabled={mutationPending} onClick={onWithdraw}>
              <HugeiconsIcon icon={UserXIcon} size={15} /> 참여 취소하기
            </Action>
          </>
        ) : (
          <>
            <Copy>
              도장을 모아도 자동으로 등록되지 않아요. 언제든 참여하거나 취소할 수 있어요.
            </Copy>
            {myRanking && (
              <MyStats>
                <span>모은 도장 <strong>{myRanking.stampCount}개</strong></span>
                <span>달성률 <strong>{myRanking.completionRate}%</strong></span>
              </MyStats>
            )}
            <Action
              type="button"
              disabled={mutationPending || retryAfterSeconds > 0}
              onClick={onJoin}
            >
              <HugeiconsIcon icon={UserCheck01Icon} size={15} />
              {retryAfterSeconds > 0 ? `${retryAfterSeconds}초 뒤 참여 가능` : '익명 랭킹 참여하기'}
            </Action>
          </>
        )}
      </Participation>

      {loading && entries.length === 0 ? (
        <RankList aria-label="랭킹을 불러오는 중" aria-busy="true">
          {Array.from({ length: 5 }, (_, index) => (
            <Row key={index}><Rank $rank={index + 1}>{index + 1}</Rank><SkeletonLine /></Row>
          ))}
        </RankList>
      ) : hasError && entries.length === 0 ? (
        <OniSearchEmpty
          size="sm"
          title="랭킹을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          compact
          action={
            <Action type="button" onClick={onRetry}><HugeiconsIcon icon={RefreshCwIcon} size={15} /> 다시 시도하기</Action>
          }
        />
      ) : entries.length === 0 ? (
        <Empty>아직 공개 랭킹 참여자가 없어요.</Empty>
      ) : (
        <RankList>
          {entries.map((entry) => (
            <Row key={entry.publicId}>
              <Rank $rank={entry.rank}>
                {entry.rank === 1 ? <HugeiconsIcon icon={TrophyIcon} size={15} /> : entry.rank <= 3 ? <HugeiconsIcon icon={Medal01Icon} size={15} /> : entry.rank}
              </Rank>
              <UserInfo>
                <Nickname>{entry.nickname}</Nickname>
                <Stats>
                  <span><HugeiconsIcon icon={TrophyIcon} size={12} /> 도장 {entry.stampCount}개</span>
                  <span><HugeiconsIcon icon={MapPinIcon} size={12} /> {entry.visitedRegionCount}개 권역</span>
                  <span>달성률 {entry.completionRate}%</span>
                </Stats>
              </UserInfo>
            </Row>
          ))}
        </RankList>
      )}
    </Root>
  );
}
