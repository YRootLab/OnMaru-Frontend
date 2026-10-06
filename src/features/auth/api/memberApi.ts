import { apiRequest, USE_MOCK, type ApiRequestOptions } from '@/lib/api/client';
import { useAuthSessionStore } from '../store/useAuthSessionStore';

function isMockSession(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  try {
    return typeof window !== 'undefined' && window.sessionStorage.getItem('onmaru.mock_session') === '1';
  } catch {
    return false;
  }
}

function buildMockProfile(
  current?: { id?: string; displayName?: string; characterId?: string; backgroundId?: string } | null,
  input?: UpdateProfileInput,
): MemberProfile {
  return {
    id: current?.id ?? 'mock_guest',
    displayName: input?.displayName ?? current?.displayName ?? '도담',
    characterId: input?.characterId ?? current?.characterId ?? 'CHARACTER_01',
    backgroundId: input?.backgroundId ?? current?.backgroundId ?? 'BACKGROUND_01',
  };
}

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

export interface NicknameAvailability {
  available: boolean;
}

export interface MemberRepository {
  getMyProfile(): Promise<MemberProfile>;
  updateMyProfile(input: UpdateProfileInput): Promise<MemberProfile>;
  deleteMyAccount(): Promise<DeleteAccountResponse>;
  logout(): Promise<void>;
  checkNicknameAvailability(nickname: string): Promise<NicknameAvailability>;
}

export function createMemberRepository(request: RequestFn = apiRequest): MemberRepository {
  return {
    async getMyProfile() {
      if (USE_MOCK || isMockSession()) {
        return buildMockProfile(useAuthSessionStore.getState().user);
      }
      return request<MemberProfile>('/members/me', { method: 'GET', cache: 'no-store' });
    },
    async updateMyProfile(input) {
      if (USE_MOCK || isMockSession()) {
        return buildMockProfile(useAuthSessionStore.getState().user, input);
      }
      return request<MemberProfile>('/members/me', { method: 'PATCH', body: input, csrf: true });
    },
    deleteMyAccount() {
      return request<DeleteAccountResponse>('/members/me', { method: 'DELETE', csrf: true });
    },
    logout() {
      return request<void>('/auth/logout', { method: 'POST', csrf: true });
    },
    async checkNicknameAvailability(nickname: string) {
      if (USE_MOCK || isMockSession()) {
        const trimmed = nickname.trim();
        const length = Array.from(trimmed).length;
        if (length < 2 || length > 20) {
          return { available: false };
        }
        if (trimmed === '중복닉네임' || trimmed === '이미사용중') {
          return { available: false };
        }
        return { available: true };
      }
      return request<NicknameAvailability>('/members/nickname/check', {
        method: 'GET',
        params: { value: nickname },
        cache: 'no-store',
      });
    },
  };
}

export const defaultMemberRepository = createMemberRepository();
