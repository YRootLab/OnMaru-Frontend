'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styled from '@emotion/styled';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { OniAvatar } from '@/features/profile/OniAvatar';
import {
  CHARACTER_IDS,
  BACKGROUND_IDS,
  PROFILE_BACKGROUNDS,
  PROFILE_CHARACTER_NAMES,
  type CharacterId,
  type BackgroundId,
} from '@/features/profile/assets';
import { defaultMemberRepository } from '@/features/auth/api/memberApi';
import { useAuthSessionStore } from '@/features/auth/store/useAuthSessionStore';

const ONBOARDING_KEY = 'onmaru_onboarding_v1';

// open redirect 방지: 같은 오리진 상대 경로만 허용
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/mypage';
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://www.onmaru.site';
    const u = new URL(raw, base);
    if (u.origin !== base) return '/mypage';
    const out = u.pathname + u.search + u.hash;
    if (!out.startsWith('/') || out.startsWith('//') || out.startsWith('/\\')) return '/mypage';
    return out;
  } catch { return '/mypage'; }
}

function markOnboardingDone(userId: string) {
  try {
    localStorage.setItem(`${ONBOARDING_KEY}_${userId}`, '1');
  } catch { /* 무시 */ }
}

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: calc(100vh - 120px);
  padding: 40px 20px 60px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const Heading = styled.h1`
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: inherit;
  margin: 0;
  text-align: center;
`;

const Sub = styled.p`
  font-size: 14px;
  color: var(--color-text-secondary, #888);
  text-align: center;
  margin: -20px 0 0;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Label = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary, #888);
  letter-spacing: 0.04em;
`;

const PreviewWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
`;

const CharGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
`;

const CharCell = styled.button<{ selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 8px 4px;
  border-radius: 12px;
  border: 2px solid ${({ selected }) => (selected ? 'var(--color-primary, #C84B00)' : 'transparent')};
  background: ${({ selected }) => (selected ? 'rgba(200, 75, 0, 0.06)' : 'transparent')};
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
`;

const CharName = styled.span`
  font-size: 10px;
  color: var(--color-text-secondary, #888);
  text-align: center;
  line-height: 1.3;
  word-break: keep-all;
`;

const BgGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
`;

const BgCell = styled.button<{ color: string; selected: boolean }>`
  height: 36px;
  border-radius: 8px;
  background: ${({ color }) => color};
  border: 2px solid ${({ selected }) => (selected ? 'var(--color-primary, #C84B00)' : 'transparent')};
  cursor: pointer;
  transition: border-color 0.15s;
  &:hover {
    opacity: 0.85;
  }
`;

const NicknameInput = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1.5px solid var(--color-border, #e0e0e0);
  font-size: 15px;
  font-weight: 500;
  background: var(--color-surface, #fff);
  color: inherit;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
  &:focus {
    border-color: var(--color-primary, #C84B00);
  }
`;

const NicknameHint = styled.p`
  font-size: 12px;
  color: var(--color-text-secondary, #888);
  margin: -6px 0 0;
`;

const StartButton = styled.button<{ disabled: boolean }>`
  width: 100%;
  height: 52px;
  border-radius: 12px;
  border: none;
  background: ${({ disabled }) => (disabled ? '#ccc' : '#C84B00')};
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: background 0.18s, transform 0.12s;
  &:hover:not(:disabled) {
    background: #a83c00;
    transform: translateY(-1px);
  }
  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = safeNext(searchParams.get('next'));
  const { user, isLoading, isLoggedIn } = useAuth();
  const { theme } = useOnmaruTheme();
  const applyProfile = useAuthSessionStore((s) => s.applyProfile);

  const [charId, setCharId] = useState<CharacterId>('CHARACTER_01');
  const [bgId, setBgId] = useState<BackgroundId>('BACKGROUND_01');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  // 로그인 체크
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [isLoading, isLoggedIn, router]);

  // 기존 프로필 초기값 설정 (이미 온보딩 완료 시 마이페이지로)
  useEffect(() => {
    if (!user || initialized.current) return;
    initialized.current = true;
    const done = (() => {
      try { return localStorage.getItem(`${ONBOARDING_KEY}_${user.id}`) === '1'; } catch { return false; }
    })();
    if (done) {
      router.replace(nextUrl);
      return;
    }
    setNickname(user.displayName || '');
    if (user.characterId) setCharId(user.characterId as CharacterId);
    if (user.backgroundId) setBgId(user.backgroundId as BackgroundId);
  }, [user, nextUrl, router]);

  const nicknameValid = nickname.trim().length >= 2 && nickname.trim().length <= 20;

  const handleSave = async () => {
    if (!user || !nicknameValid || saving) return;
    setSaving(true);
    try {
      const updated = await defaultMemberRepository.updateMyProfile({
        displayName: nickname.trim(),
        characterId: charId,
        backgroundId: bgId,
      });
      applyProfile(updated);
      markOnboardingDone(user.id);
      toast.success('프로필이 설정됐어요! 온마루를 즐겨보세요 ✨');
      router.replace(nextUrl);
    } catch {
      toast.error('저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !user) return null;

  const c = theme.colors;

  return (
    <PageWrapper>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' }}>
          <Heading style={{ color: c.text.primary }}>온마루에 오신 걸 환영해요!</Heading>
          <Sub>프로필을 설정하고 한옥 여정을 시작해보세요</Sub>
        </div>

        {/* 미리보기 */}
        <PreviewWrap>
          <OniAvatar characterId={charId} backgroundId={bgId} size={100} />
        </PreviewWrap>

        {/* 캐릭터 선택 */}
        <Section>
          <Label>온이 캐릭터 선택</Label>
          <CharGrid>
            {CHARACTER_IDS.map((id) => (
              <CharCell key={id} selected={charId === id} onClick={() => setCharId(id)}>
                <OniAvatar characterId={id} backgroundId={bgId} size={48} />
                <CharName>{PROFILE_CHARACTER_NAMES[id]}</CharName>
              </CharCell>
            ))}
          </CharGrid>
        </Section>

        {/* 배경색 선택 */}
        <Section>
          <Label>배경 색상 선택</Label>
          <BgGrid>
            {BACKGROUND_IDS.map((id) => (
              <BgCell
                key={id}
                color={PROFILE_BACKGROUNDS[id]}
                selected={bgId === id}
                onClick={() => setBgId(id)}
              />
            ))}
          </BgGrid>
        </Section>

        {/* 닉네임 설정 */}
        <Section>
          <Label>닉네임</Label>
          <NicknameInput
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력해주세요"
            maxLength={20}
          />
          <NicknameHint>2~20자로 입력해주세요</NicknameHint>
        </Section>

        <StartButton disabled={!nicknameValid || saving} onClick={handleSave}>
          {saving ? '저장 중…' : '온마루 시작하기'}
        </StartButton>
      </Card>
    </PageWrapper>
  );
}
