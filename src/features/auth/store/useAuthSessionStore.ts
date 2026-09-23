import { create } from 'zustand';
import { defaultMemberRepository, type MemberProfile } from '../api/memberApi';

/*
  카카오 로그인 세션의 단일 소스(single source of truth).

  세션 쿠키(__Host-onmaru-session)는 HttpOnly라 JS로 읽을 수 없으므로 로그인
  여부는 항상 GET /members/me 응답으로만 판단한다(200 = 로그인, 401 = 비로그인).
  그래서 이 스토어는 메모리에만 존재한다 — 새로고침하면 비워지고, 각 세션 진입 시
  ensureSessionLoaded()가 서버에 다시 물어본다. 개인화 응답을 localStorage 등에
  캐싱하지 않는다(가이드 §4: 개인 응답은 Cache-Control: no-store).
*/

export interface AuthUser {
  id: string;
  displayName: string;
}

interface AuthSessionState {
  /** null = 비로그인(401 확정). undefined = 아직 서버 확인 전(로딩 중). */
  user: AuthUser | null | undefined;
  hasLoadedOnce: boolean;
  ensureSessionLoaded: () => Promise<void>;
  applyProfile: (profile: MemberProfile) => AuthUser;
  clear: () => void;
}

export function toAuthUser(profile: MemberProfile): AuthUser {
  return { id: profile.id, displayName: profile.displayName };
}

export const useAuthSessionStore = create<AuthSessionState>((set, get) => ({
  user: undefined,
  hasLoadedOnce: false,

  ensureSessionLoaded: async () => {
    if (get().hasLoadedOnce) return;
    set({ hasLoadedOnce: true });
    try {
      const profile = await defaultMemberRepository.getMyProfile();
      set({ user: toAuthUser(profile) });
    } catch {
      // 401 등 — 비로그인이 맞다. 자동 재시도하지 않는다(가이드 §1-5).
      set({ user: null });
    }
  },

  applyProfile: (profile) => {
    const nextUser = toAuthUser(profile);
    set({ user: nextUser });
    return nextUser;
  },

  clear: () => set({ user: null }),
}));
