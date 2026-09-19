import { apiRequest, type ApiRequestOptions } from '@/lib/api/client';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;

/*
  백엔드 GET /api/v1/members/me 응답 shape.

  /v3/api-docs가 이 엔드포인트의 success response를 아직 문서화하지 않아
  (다른 미기재 엔드포인트들과 동일하게 Record<string, never>) 실제 필드명을
  라이브 호출로 확인하지 못했다 — 로그인 세션 쿠키가 있어야 하는 엔드포인트라
  이 세션에서는 재현할 수 없었다. 기존 프런트 `OnmaruUser` 계약과 호환되는
  필드로 최선 추정했으니, 실제 응답과 다르면 이 타입만 고치면 된다(호출부는
  그대로).
*/
export interface MemberProfile {
  id: string;
  nickname: string;
  email?: string | null;
  profileImageUrl?: string | null;
}

export interface MemberRepository {
  getMyProfile(): Promise<MemberProfile>;
  deleteMyAccount(): Promise<void>;
  logout(): Promise<void>;
}

export function createMemberRepository(request: RequestFn = apiRequest): MemberRepository {
  return {
    getMyProfile() {
      return request<MemberProfile>('/members/me', { method: 'GET', cache: 'no-store' });
    },
    deleteMyAccount() {
      return request<void>('/members/me', { method: 'DELETE', csrf: true });
    },
    logout() {
      return request<void>('/auth/logout', { method: 'POST', csrf: true });
    },
  };
}

export const defaultMemberRepository = createMemberRepository();
