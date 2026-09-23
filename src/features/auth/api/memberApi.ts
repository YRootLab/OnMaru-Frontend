import { apiRequest, type ApiRequestOptions } from '@/lib/api/client';

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
}

/** DELETE /api/v1/members/me → 202 { status: "DELETING" } (탈퇴 접수, 비동기 처리). */
export interface DeleteAccountResponse {
  status?: string;
}

export interface MemberRepository {
  getMyProfile(): Promise<MemberProfile>;
  deleteMyAccount(): Promise<DeleteAccountResponse>;
  logout(): Promise<void>;
}

export function createMemberRepository(request: RequestFn = apiRequest): MemberRepository {
  return {
    getMyProfile() {
      return request<MemberProfile>('/members/me', { method: 'GET', cache: 'no-store' });
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
