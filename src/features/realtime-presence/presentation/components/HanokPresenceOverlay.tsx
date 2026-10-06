'use client';

import dynamic from 'next/dynamic';
import { resolvePresenceTransportKind } from '../../infrastructure/presenceTransportFactory';

const PresenceDevCore = dynamic(() => import('./PresenceDevCore'), { ssr: false });

interface HanokPresenceOverlayProps {
  roomId: string;
}

/**
 * 한옥 페이지 Presence 오버레이.
 * - 플래그 꺼짐(resolvePresenceTransportKind === 'none'): 렌더링 없음, 타이머·네트워크 없음.
 * - 플래그 켜짐: resolvePresenceTransportKind()에 따라 SSE 또는 Mock 연결.
 */
export function HanokPresenceOverlay({ roomId }: HanokPresenceOverlayProps) {
  if (resolvePresenceTransportKind() === 'none') return null;
  return <PresenceDevCore roomId={roomId} />;
}

