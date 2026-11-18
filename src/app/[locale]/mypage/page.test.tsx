// @vitest-environment jsdom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MyPage from './page';
import { defaultMemberRepository } from '@/features/auth/api/memberApi';
import { useAuthSessionStore } from '@/features/auth/store/useAuthSessionStore';
import { toast } from 'sonner';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: {
      id: 'member-1',
      displayName: '길손',
      characterId: 'CHARACTER_01',
      backgroundId: 'BACKGROUND_01',
    },
    isLoading: false,
    isLoggedIn: true,
    logout: vi.fn(),
    deleteAccount: vi.fn(),
  }),
}));

vi.mock('@/design-system/components', () => ({
  ThemeModeSwitch: () => <div data-testid="theme-mode-switch" />,
}));

vi.mock('@/design-system/ThemeProvider', () => ({
  useOnmaruTheme: () => ({
    theme: {
      colors: {
        bg: { app: '#fff', card: '#f5f5f4', surface: '#ffffff' },
        text: { primary: '#111', secondary: '#666', muted: '#999', inverse: '#fff' },
        action: { primary: '#d4af37' },
      },
      borderRadius: { full: '9999px' },
    },
  }),
}));

vi.mock('@/features/journey-curator/api/journeyThreadsApi', () => ({
  defaultJourneyThreadsRepository: {
    listThreads: vi.fn().mockResolvedValue({ items: [] }),
  },
}));

vi.mock('@/features/visit-review/api/visitReviewApi', () => ({
  defaultVisitReviewRepository: {
    listReviews: vi.fn().mockResolvedValue({ items: [] }),
  },
}));

describe('MyPage 닉네임 수정 및 검증 연동 (OnMaru-backend#640)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
  });

  function openProfileEdit() {
    const editBtn = screen.getByRole('button', { name: /프로필 변경/i });
    fireEvent.click(editBtn);
  }

  it('사용 가능한 새로운 닉네임 입력 시 확인 피드백이 표시되고 정상 저장된다', async () => {
    const checkSpy = vi
      .spyOn(defaultMemberRepository, 'checkNicknameAvailability')
      .mockResolvedValue({ available: true });
    const updateSpy = vi
      .spyOn(defaultMemberRepository, 'updateMyProfile')
      .mockResolvedValue({
        id: 'member-1',
        displayName: '새로운이름',
        characterId: 'CHARACTER_01',
        backgroundId: 'BACKGROUND_01',
      });
    const applyProfileSpy = vi.spyOn(useAuthSessionStore.getState(), 'applyProfile');

    render(<MyPage />);
    openProfileEdit();

    const input = screen.getByPlaceholderText('2~20자 닉네임');
    fireEvent.change(input, { target: { value: '새로운이름' } });

    await waitFor(() => {
      expect(checkSpy).toHaveBeenCalledWith('새로운이름');
    });

    expect(await screen.findByText('사용 가능한 닉네임입니다.')).toBeDefined();

    const saveBtn = screen.getByRole('button', { name: '저장' });
    expect((saveBtn as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith({
        displayName: '새로운이름',
        characterId: 'CHARACTER_01',
        backgroundId: 'BACKGROUND_01',
      });
      expect(applyProfileSpy).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('프로필을 변경했어요.');
    });
  });

  it('이미 사용 중인 닉네임(available: false) 입력 시 저장 버튼이 비활성화되고 안내 메시지를 표시한다', async () => {
    vi.spyOn(defaultMemberRepository, 'checkNicknameAvailability').mockResolvedValue({
      available: false,
    });
    const updateSpy = vi.spyOn(defaultMemberRepository, 'updateMyProfile');

    render(<MyPage />);
    openProfileEdit();

    const input = screen.getByPlaceholderText('2~20자 닉네임');
    fireEvent.change(input, { target: { value: '중복된이름' } });

    expect(await screen.findByText('이미 사용 중인 닉네임입니다.')).toBeDefined();

    const saveBtn = screen.getByRole('button', { name: '저장' });
    expect((saveBtn as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(saveBtn);

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('PATCH 409 NICKNAME_DUPLICATED 발생 시 저장을 성공 처리하지 않고 편집 폼을 유지한다', async () => {
    vi.spyOn(defaultMemberRepository, 'checkNicknameAvailability').mockResolvedValue({
      available: true,
    });
    vi.spyOn(defaultMemberRepository, 'updateMyProfile').mockRejectedValue({
      status: 409,
      code: 'NICKNAME_DUPLICATED',
      message: 'Nickname is already in use.',
    });

    render(<MyPage />);
    openProfileEdit();

    const input = screen.getByPlaceholderText('2~20자 닉네임');
    fireEvent.change(input, { target: { value: '경쟁중복이름' } });

    await screen.findByText('사용 가능한 닉네임입니다.');

    const saveBtn = screen.getByRole('button', { name: '저장' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('이미 사용 중인 닉네임입니다.');
    });

    // 편집 모드가 닫히지 않고 여전히 열려 있어야 함
    expect(screen.getByPlaceholderText('2~20자 닉네임')).toBeDefined();
    expect(await screen.findByText('이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해 주세요.')).toBeDefined();
  });
});
