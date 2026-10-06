// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminLayout from './layout';

const { replace, useAdminAuth } = vi.hoisted(() => ({
  replace: vi.fn(),
  useAdminAuth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useRouter: () => ({ push: vi.fn(), replace }),
}));
vi.mock('@/features/admin/hooks/useAdminAuth', () => ({ useAdminAuth }));
vi.mock('@/features/admin/components/AdminSidebar', () => ({
  AdminSidebar: () => <nav>관리자 사이드바</nav>,
}));
vi.mock('@/features/admin/components/AdminHeader', () => ({
  AdminHeader: () => <header>관리자 헤더</header>,
}));

describe('AdminLayout auth guard', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it('redirects an unauthenticated visitor without exposing protected content', async () => {
    useAdminAuth.mockReturnValue({
      user: null,
      role: null,
      isAdmin: false,
      isEditor: false,
      isLoading: false,
      logout: vi.fn(),
    });

    render(
      <AdminLayout>
        <div>보호된 대시보드</div>
      </AdminLayout>,
    );

    expect(screen.queryByText('보호된 대시보드')).toBeNull();
    expect(screen.queryByText('관리자 사이드바')).toBeNull();
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/login'));
  });
});
