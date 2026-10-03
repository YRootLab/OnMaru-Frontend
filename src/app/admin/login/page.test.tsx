// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminLoginPage from './page';

const push = vi.fn();
const login = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/features/admin/hooks/useAdminAuth', () => ({ useAdminAuth: () => ({ login }) }));

describe('AdminLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'production');
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  function submitCredentials() {
    fireEvent.change(screen.getByPlaceholderText('admin@onmaru.kr'), { target: { value: 'admin@onmaru.kr' } });
    fireEvent.change(screen.getByPlaceholderText('비밀번호 입력'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));
  }

  it('moves to /admin after a successful login result', async () => {
    login.mockResolvedValue({ ok: true });
    render(<AdminLoginPage />);
    submitCredentials();
    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin'));
  });

  it('shows the credential message only for an actual 401 login failure', async () => {
    login.mockResolvedValue({ ok: false, code: 'INVALID_CREDENTIALS' });
    render(<AdminLoginPage />);
    submitCredentials();
    expect(await screen.findByText('이메일 또는 비밀번호를 확인해 주세요.')).toBeDefined();
  });

  it('shows a session recovery message for refresh or csrf failures', async () => {
    login.mockResolvedValue({ ok: false, code: 'SESSION_RECOVERY_FAILED' });
    render(<AdminLoginPage />);
    submitCredentials();
    expect(await screen.findByText('로그인은 성공했지만 관리자 세션을 불러오지 못했습니다. 다시 시도해 주세요.')).toBeDefined();
    expect(screen.queryByText('이메일 또는 비밀번호를 확인해 주세요.')).toBeNull();
  });

  it('does not render development quick-login controls outside development mode', () => {
    render(<AdminLoginPage />);
    expect(screen.queryByRole('button', { name: 'ADMIN으로 로그인' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'EDITOR로 로그인' })).toBeNull();
  });
});
