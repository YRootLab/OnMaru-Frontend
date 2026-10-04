import { apiRequest, USE_MOCK, type ApiRequestOptions } from '@/lib/api/client';
import { useAuthSessionStore } from '../store/useAuthSessionStore';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;

/*
  백엔드 GET /api/v1/members/me 응답 shape (FE 카카오 로그인 연동 가이드 2026-09-21 기준).

  { schemaVersion, id, displayName } — 카카오 ID·이메일·provider subject를 식별자로
  쓰지 않는다. 개인화 응답은 Cache-Control: no-store이며 HttpOnly 세션 쿠키로만
  인증되므로, 이 객체를 localStorage에 캐싱하지 않는다(항상 서버에서 다시 조회).
*/
export interface MemberProfile {
  schemaVersion?: string;
  id: string;
  displayName: string;
  /** @deprecated BE #552 이후 characterId/backgroundId로 대체. 과도기 호환용. */
  profileImageUrl?: string;
  characterId?: string;
  backgroundId?: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  characterId?: string;
  backgroundId?: string;
}

/** DELETE /api/v1/members/me → 202 { status: "DELETING" } (탈퇴 접수, 비동기 처리). */
export interface DeleteAccountResponse {
  status?: string;
}

export interface MemberRepository {
  getMyProfile(): Promise<MemberProfile>;
  updateMyProfile(input: UpdateProfileInput): Promise<MemberProfile>;
  deleteMyAccount(): Promise<DeleteAccountResponse>;
  logout(): Promise<void>;
}

export function createMemberRepository(request: RequestFn = apiRequest): MemberRepository {
  return {
    async getMyProfile() {
      if (USE_MOCK || (typeof window !== 'undefined' && window.sessionStorage.getItem('onmaru.mock_session'))) {
        const currentUser = useAuthSessionStore.getState().user;
        return {
          id: currentUser?.id || 'mock_guest',
          displayName: currentUser?.displayName || '도담',
          characterId: currentUser?.characterId || 'CHARACTER_01',
          backgroundId: currentUser?.backgroundId || 'BACKGROUND_01',
        };
      }
      return request<MemberProfile>('/members/me', { method: 'GET', cache: 'no-store' });
    },
    async updateMyProfile(input) {
      if (USE_MOCK || (typeof window !== 'undefined' && window.sessionStorage.getItem('onmaru.mock_session'))) {
        const currentUser = useAuthSessionStore.getState().user;
        return {
          id: currentUser?.id || 'mock_guest',
          displayName: input.displayName ?? currentUser?.displayName ?? '도담',
          characterId: input.characterId ?? currentUser?.characterId ?? 'CHARACTER_01',
          backgroundId: input.backgroundId ?? currentUser?.backgroundId ?? 'BACKGROUND_01',
        };
      }
      try {
        return await request<MemberProfile>('/members/me', { method: 'PATCH', body: input, csrf: true });
      } catch (err) {
        if (typeof window !== 'undefined' && window.sessionStorage.getItem('onmaru.mock_session')) {
          const currentUser = useAuthSessionStore.getState().user;
          return {
            id: currentUser?.id || 'mock_guest',
            displayName: input.displayName ?? currentUser?.displayName ?? '도담',
            characterId: input.characterId ?? currentUser?.characterId ?? 'CHARACTER_01',
            backgroundId: input.backgroundId ?? currentUser?.backgroundId ?? 'BACKGROUND_01',
          };
        }
        throw err;
      }
    },
    deleteMyAccount() {
      return request<DeleteAccountResponse>('/members/me', { method: 'DELETE', csrf: true });
    },
    logout() {
      return request<void>('/auth/logout', { method: 'POST', csrf: true });
    },
  };
}

export const defaultMemberRepository = createMemberRepository();
