import { useEffect, useRef, useState } from 'react';
import type { Village, VillageMeta } from '@/features/hanok-archive/types';
import { decodeHanokArchivePayload } from '@/features/hanok-archive/data/hanokArchiveFallback';

/**
 * 서버가 내려준 스냅샷(villages/meta)으로 먼저 그리고, 배경에서 실데이터로 한 번만 바꿔치기한다.
 * 컴포넌트는 이 훅의 반환값만 받아 그린다 — fetch/스왑 타이밍은 여기가 전담한다.
 */
export function useArchiveData(villages: Village[], meta: VillageMeta) {
  const [archiveData, setArchiveData] = useState(() => ({ villages, meta }));
  // 스냅샷 → 실데이터 교체는 방문당 딱 한 번이어야 한다. 개발 모드의 StrictMode
  // 이중 실행처럼 이 effect가 두 번 걸리면 archiveData가 다시 한번 바뀌어 regions
  // 참조도 또 바뀌고, 이미 끝난 분포 차트 입장 연출이 또 리셋된다 — "표가 나타났다가
  // 안 나타나"가 재발했던 원인. isActive 가드는 취소만 막을 뿐 두 번째로 실제 도착한
  // 응답까지는 못 막으므로, 교체 자체를 컴포넌트 생애주기당 한 번으로 못박는다.
  const hasSwappedRef = useRef(false);

  useEffect(() => {
    if (hasSwappedRef.current) return undefined;

    let isActive = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);

    async function refreshArchive() {
      try {
        const response = await fetch('/api/tourapi', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) return;
        const nextData = decodeHanokArchivePayload(await response.json());
        if (isActive && nextData && !hasSwappedRef.current) {
          hasSwappedRef.current = true;
          setArchiveData(nextData);
        }
      } catch {
        // Snapshot remains visible when the future backend is unavailable or changes shape.
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    void refreshArchive();
    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return archiveData;
}
