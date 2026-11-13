'use client';

import styled from '@emotion/styled';
import { useCollab } from './MapCollabProvider';
import { palette, meok, ringShadow } from '@/design-system/tokens';

const USER_COLORS = [
  palette.kobalt[500],
  palette.danpung[500],
  palette.juhong[500],
  palette.jaha[500],
  palette.cheongrok[600],
  palette.jangmi[500],
] as const;

function colorForUser(memberId: string) {
  let hash = 0;
  for (const ch of memberId) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return USER_COLORS[hash % USER_COLORS.length];
}

const Panel = styled.div`
  position: absolute; top: 96px; right: 14px; z-index: 35;
  display: flex; flex-direction: column; gap: 6px; pointer-events: none;
  @media (max-width: 1023px) { top: auto; bottom: calc(58px + max(12px, env(safe-area-inset-bottom)) + 8px); right: 14px; }
`;

const Header = styled.div`
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.88); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(0,0,0,0.07); border-radius: 14px; padding: 6px 10px;
  box-shadow: ${ringShadow.light.card};
  [data-theme='dark'] & { background: rgba(20,24,32,0.88); border-color: rgba(255,255,255,0.12); box-shadow: ${ringShadow.dark.card}; }
`;

const Dot = styled.span<{ $color: string; $online?: boolean }>`
  width: 8px; height: 8px; border-radius: 50%;
  background: ${({ $online, $color }) => ($online === false ? '#9ca3af' : $color)};
  flex-shrink: 0;
`;

const Name = styled.span`
  font-size: 12px; font-weight: 600; color: ${meok[800]};
  max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  [data-theme='dark'] & { color: #e8e8e8; }
`;

const MeBadge = styled.span`font-size: 10px; color: ${meok[400]}; font-weight: 500;`;
const CountBadge = styled.div`
  font-size: 11px; font-weight: 700; color: ${meok[500]}; padding: 0 2px;
  [data-theme='dark'] & { color: ${meok[400]}; }
`;

export function CollabParticipants() {
  const ctx = useCollab();
  if (!ctx) return null;

  const { myMemberId, myDisplayName, members } = ctx;
  const onlineCount = members.filter((m) => m.online).length;
  const others = members.filter((m) => m.memberId !== myMemberId);

  return (
    <Panel>
      <Header>
        <CountBadge>{onlineCount}명 참여 중</CountBadge>
      </Header>

      {myMemberId && (
        <Header>
          <Dot $color={colorForUser(myMemberId)} $online={true} />
          <Name>{myDisplayName || '나'}</Name>
          <MeBadge>(나)</MeBadge>
        </Header>
      )}

      {others.map((m) => (
        <Header key={m.memberId}>
          <Dot $color={colorForUser(m.memberId)} $online={m.online} />
          <Name>{m.displayName.slice(0, 20)}</Name>
        </Header>
      ))}
    </Panel>
  );
}
