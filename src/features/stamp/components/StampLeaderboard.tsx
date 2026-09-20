'use client';

import { useRef } from 'react';
import styled from '@emotion/styled';
import { Trophy, Medal, MapPin, UserCheck } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { LeaderboardUser } from '../types';
import { meok } from '@/design-system/tokens';

// GSAP 플러그인 등록
gsap.registerPlugin(useGSAP);

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

// --- Styled Components ---

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px; /* 간격 살짝 넓힘 */
  visibility: hidden; /* GSAP 로드 전 숨김 */
`;

const RankRow = styled.div<{ $isTop3: boolean; $isCurrent?: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 16px;
  /* 활성화/비활성화 색상을 화사한 테마로 변경 */
  background: ${({ $isCurrent }) =>
    $isCurrent ? 'rgba(249, 115, 22, 0.08)' : 'rgba(25, 31, 40, 0.02)'};
  border: 1px solid ${({ $isCurrent }) =>
    $isCurrent ? 'rgba(249, 115, 22, 0.2)' : 'transparent'};
  cursor: pointer;
  
  /* GSAP 애니메이션 충돌 방지를 위해 transition은 background/border만 남김 */
  transition: background 0.2s ease, border-color 0.2s ease;

  [data-theme='dark'] & {
    background: ${({ $isCurrent }) =>
      $isCurrent ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)'};
    border-color: ${({ $isCurrent }) =>
      $isCurrent ? 'rgba(245, 158, 11, 0.2)' : 'transparent'};
  }

  &:hover {
    background: ${({ $isCurrent }) =>
      $isCurrent ? 'rgba(249, 115, 22, 0.12)' : 'rgba(25, 31, 40, 0.04)'};

    [data-theme='dark'] &:hover {
      background: ${({ $isCurrent }) =>
        $isCurrent ? 'rgba(245, 158, 11, 0.16)' : 'rgba(255, 255, 255, 0.06)'};
    }
  }
`;

const RankBadge = styled.div<{ $rank: number }>`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  flex-shrink: 0;
  
  /* 1~3위 뱃지 색상을 더 눈에 띄고 고급스럽게 변경 */
  background: ${({ $rank }) =>
    $rank === 1
      ? 'linear-gradient(135deg, #fef08a 0%, #f59e0b 100%)' // 금빛 그라데이션
      : $rank === 2
      ? 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)' // 은빛 그라데이션
      : $rank === 3
      ? 'linear-gradient(135deg, #ffedd5 0%, #ea580c 100%)' // 동빛 그라데이션
      : 'rgba(25, 31, 40, 0.06)'};
      
  color: ${({ $rank }) =>
    $rank === 1
      ? '#ffffff'
      : $rank === 2
      ? '#334155'
      : $rank === 3
      ? '#ffffff'
      : meok[500]};
      
  box-shadow: ${({ $rank }) => 
    $rank <= 3 ? '0 4px 10px rgba(0,0,0,0.08)' : 'none'};

  [data-theme='dark'] & {
    background: ${({ $rank }) =>
      $rank > 3 ? 'rgba(255, 255, 255, 0.08)' : ''};
  }
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const NicknameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Nickname = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const UserTitle = styled.span`
  font-family: var(--font-traditional);
  font-size: 11.5px;
  font-weight: 700;
  
  /* 칙칙한 갈색에서 맑고 화사한 오렌지로 톤업 */
  color: #ea580c; 
  background: rgba(234, 88, 12, 0.12);
  padding: 3px 8px;
  border-radius: 6px;
  letter-spacing: 0.02em;

  [data-theme='dark'] & {
    color: #fdba74;
    background: rgba(249, 115, 22, 0.2);
  }
`;

const StatsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  font-size: 12px;
  color: ${meok[500]};
`;

const StatItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  
  /* 아이콘에 포인트 컬러 추가 */
  svg {
    color: #f59e0b;
  }
`;

// --- Main Component ---

export default function StampLeaderboard() {
  const containerRef = useRef<HTMLDivElement>(null);

  // --- GSAP Animations ---
  
  useGSAP(() => {
    if (!containerRef.current) return;

    // 1. 리스트 순차적 등장 애니메이션 (Stagger)
    gsap.set(containerRef.current, { visibility: 'visible' });
    
    gsap.from('.rank-row-item', {
      opacity: 0,
      x: -15, // 왼쪽에서 살짝 밀려들어오는 느낌
      duration: 0.5,
      stagger: 0.08, // 1위부터 순서대로 파도타듯 등장
      ease: 'back.out(1.2)',
    });
  }, { scope: containerRef });

  // 2. 호버 시 쫀득한 3D 효과 (오른쪽으로 살짝 이동하며 커짐)
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { 
      scale: 1.015, 
      x: 6, 
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.06)',
      duration: 0.3, 
      ease: 'power2.out' 
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { 
      scale: 1, 
      x: 0, 
      boxShadow: 'none',
      duration: 0.4, 
      ease: 'back.out(1.5)' 
    });
  };

  return (
    <ListContainer ref={containerRef}>
      {LEADERBOARD_MOCK.map((user) => {
        const isTop3 = user.rank <= 3;
        // 실제 운영 시 로그인한 유저 ID와 비교하여 내 랭킹 하이라이트
        const isCurrent = user.id === 'u1'; 

        return (
          <RankRow 
            key={user.id} 
            className="rank-row-item"
            $isTop3={isTop3}$isCurrent={isCurrent}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <RankBadge $rank={user.rank}>
              {user.rank === 1 ? (
                <Trophy size={15} strokeWidth={2.5} />
              ) : user.rank <= 3 ? (
                <Medal size={15} strokeWidth={2.5} />
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
                  <Trophy size={12} strokeWidth={2.5} />
                  <span>수결 {user.stampCount}개</span>
                </StatItem>
                <StatItem>
                  <MapPin size={12} strokeWidth={2.5} />
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