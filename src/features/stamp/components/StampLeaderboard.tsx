'use client';

import styled from '@emotion/styled';
import { Trophy, Medal, MapPin, UserCheck } from 'lucide-react';
import type { LeaderboardUser } from '../types';
import { meok } from '@/design-system/tokens';

const LEADERBOARD_MOCK: LeaderboardUser[] = [
  {
    id: 'u1',
    rank: 1,
    nickname: '달빛나그네',
    title: '삼천리 풍류도인',
    stampCount: 12,
    provincesCount: 7,
  },
  {
    id: 'u2',
    rank: 2,
    nickname: '한옥도편수',
    title: '팔도 유람가',
    stampCount: 10,
    provincesCount: 6,
  },
  {
    id: 'u3',
    rank: 3,
    nickname: '처마끝솔바람',
    title: '고택 탐방 명인',
    stampCount: 8,
    provincesCount: 5,
  },
  {
    id: 'u4',
    rank: 4,
    nickname: '북촌지킴이',
    title: '한양 풍류객',
    stampCount: 7,
    provincesCount: 4,
  },
  {
    id: 'u5',
    rank: 5,
    nickname: '지리산들꽃',
    title: '남도 산천 유람객',
    stampCount: 5,
    provincesCount: 3,
  },
];

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const RankRow = styled.div<{ $isTop3: boolean; $isCurrent?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: ${({ $isCurrent }) =>
    $isCurrent ? 'rgba(212, 175, 55, 0.12)' : 'rgba(25, 31, 40, 0.03)'};
  transition: background 0.15s ease;

  [data-theme='dark'] & {
    background: ${({ $isCurrent }) =>
      $isCurrent ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.04)'};
  }

  &:hover {
    background: rgba(25, 31, 40, 0.06);

    [data-theme='dark'] &:hover {
      background: rgba(255, 255, 255, 0.08);
    }
  }
`;

const RankBadge = styled.div<{ $rank: number }>`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  flex-shrink: 0;
  background: ${({ $rank }) =>
    $rank === 1
      ? '#fef08a'
      : $rank === 2
      ? '#e2e8f0'
      : $rank === 3
      ? '#ffedd5'
      : 'transparent'};
  color: ${({ $rank }) =>
    $rank === 1
      ? '#a16207'
      : $rank === 2
      ? '#475569'
      : $rank === 3
      ? '#c2410c'
      : meok[500]};
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const NicknameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Nickname = styled.span`
  font-size: 13.5px;
  font-weight: 700;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const UserTitle = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #b45309;
  background: rgba(212, 175, 55, 0.15);
  padding: 1px 6px;
  border-radius: 4px;

  [data-theme='dark'] & {
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.2);
  }
`;

const StatsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  font-size: 11.5px;
  color: ${meok[500]};
`;

const StatItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
`;

export default function StampLeaderboard() {
  return (
    <ListContainer>
      {LEADERBOARD_MOCK.map((user) => {
        const isTop3 = user.rank <= 3;
        return (
          <RankRow key={user.id} $isTop3={isTop3}>
            <RankBadge $rank={user.rank}>
              {user.rank === 1 ? (
                <Trophy size={14} />
              ) : user.rank <= 3 ? (
                <Medal size={14} />
              ) : (
                user.rank
              )}
            </RankBadge>

            <UserInfo>
              <NicknameRow>
                <Nickname>{user.nickname}</Nickname>
                <UserTitle>{user.title}</UserTitle>
              </NicknameRow>
              <StatsRow>
                <StatItem>
                  <Trophy size={11} />
                  <span>수결 {user.stampCount}개</span>
                </StatItem>
                <StatItem>
                  <MapPin size={11} />
                  <span>{user.provincesCount}개 권역</span>
                </StatItem>
              </StatsRow>
            </UserInfo>
          </RankRow>
        );
      })}
    </ListContainer>
  );
}
