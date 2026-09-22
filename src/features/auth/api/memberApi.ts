import { apiRequest, type ApiRequestOptions } from '@/lib/api/client';

type RequestFn = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;











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
