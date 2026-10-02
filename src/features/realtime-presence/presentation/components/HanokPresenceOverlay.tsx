'use client';

import dynamic from 'next/dynamic';

/*
 * NODE_ENV는 빌드 시 webpack이 상수로 인라인한다.
 * 운영 빌드에서 이 조건은 false → dynamic()가 dead code → Mock이 번들에 포함되지 않음.
 * 개발 환경에서만 PresenceDevCore chunk를 생성한다.
 */
const PresenceDevCore =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('./PresenceDevCore'), { ssr: false })
    : null;

/** NEXT_PUBLIC_PRESENCE_ENABLED=true 일 때만 켜짐. 기본값 꺼짐. */
const isEnabled = process.env.NEXT_PUBLIC_PRESENCE_ENABLED === 'true';

interface HanokPresenceOverlayProps {
  roomId: string;
}

/**
 * 한옥 페이지 Presence 오버레이.
 * - 플래그 꺼짐: 렌더링 없음, 타이머·네트워크 없음.
 * - 운영 환경(SSE 미구현): 렌더링 없음.
 * - 개발 환경 + 플래그 켜짐: Mock Transport로 모든 UI 표시.
 */
export function HanokPresenceOverlay({ roomId }: HanokPresenceOverlayProps) {
  if (!isEnabled || !PresenceDevCore) return null;
  return <PresenceDevCore roomId={roomId} />;
}
