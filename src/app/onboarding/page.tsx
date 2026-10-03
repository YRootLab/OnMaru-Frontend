'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth';
import { useAuthSessionStore } from '@/features/auth/store/useAuthSessionStore';
import { defaultMemberRepository } from '@/features/auth/api/memberApi';
import { OniAvatar } from '@/features/profile/OniAvatar';
import {
  CHARACTER_IDS,
  BACKGROUND_IDS,
  PROFILE_BACKGROUNDS,
  PROFILE_CHARACTER_NAMES,
} from '@/features/profile/assets';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';

export default function OnboardingPage() {
  const router = useRouter();
  const { theme } = useOnmaruTheme();
  const { isLoading, isLoggedIn } = useAuth();
  const applyProfile = useAuthSessionStore((s) => s.applyProfile);

  const [name, setName] = useState('');
  const [character, setCharacter] = useState('CHARACTER_01');
  const [background, setBackground] = useState('BACKGROUND_01');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.replace('/auth/login');
  }, [isLoading, isLoggedIn, router]);

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) {
      toast.error('닉네임을 2자 이상 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const updated = await defaultMemberRepository.updateMyProfile({
        displayName: name.trim(),
        characterId: character,
        backgroundId: background,
      });
      applyProfile(updated);
      toast.success('온마루에 오신 걸 환영해요!');
      router.replace('/');
    } catch {
      toast.error('저장에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return null;

  const c = theme.colors;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100dvh', padding: '48px 16px 80px', backgroundColor: c.bg.app }}>
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* 헤더 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '26px', fontWeight: 800, color: c.text.primary, letterSpacing: '-0.03em', marginBottom: '8px' }}>
            나만의 온이를 만들어요
          </div>
          <div style={{ fontSize: '14px', color: c.text.muted, lineHeight: 1.6 }}>
            온마루에서 사용할 이름과 캐릭터를 선택해 주세요
          </div>
        </div>

        {/* 미리보기 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <OniAvatar characterId={character} backgroundId={background} size={96} />
          <div style={{ fontSize: '12px', fontWeight: 600, color: c.text.muted }}>
            {PROFILE_CHARACTER_NAMES[character as keyof typeof PROFILE_CHARACTER_NAMES]}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: c.text.primary }}>
            {name || '이름을 입력하세요'}
          </div>
        </div>

        {/* 닉네임 */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: c.text.secondary, marginBottom: '8px' }}>닉네임</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="2~20자"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '12px',
              border: `1.5px solid ${c.bg.card}`,
              backgroundColor: c.bg.surface,
              color: c.text.primary,
              fontSize: '15px',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = c.action.primary; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = c.bg.card; }}
          />
        </div>

        {/* 캐릭터 선택 */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: c.text.secondary, marginBottom: '10px' }}>캐릭터</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {CHARACTER_IDS.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={character === id}
                onClick={() => setCharacter(id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 4px',
                  borderRadius: '12px',
                  border: `2px solid ${character === id ? c.action.primary : 'transparent'}`,
                  backgroundColor: character === id ? `${c.action.primary}15` : c.bg.surface,
                  cursor: 'pointer',
                }}
              >
                <OniAvatar characterId={id} backgroundId={background} size={44} />
                <span style={{ fontSize: '9px', color: c.text.muted, lineHeight: 1.2, textAlign: 'center', wordBreak: 'keep-all' }}>
                  {PROFILE_CHARACTER_NAMES[id as keyof typeof PROFILE_CHARACTER_NAMES]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 배경색 선택 */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: c.text.secondary, marginBottom: '10px' }}>배경색</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {BACKGROUND_IDS.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={background === id}
                onClick={() => setBackground(id)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: `3px solid ${background === id ? c.action.primary : 'transparent'}`,
                  backgroundColor: PROFILE_BACKGROUNDS[id as keyof typeof PROFILE_BACKGROUNDS],
                  cursor: 'pointer',
                  outline: background === id ? `2px solid ${c.bg.app}` : 'none',
                  outlineOffset: '-5px',
                }}
              />
            ))}
          </div>
        </div>

        {/* 저장 버튼 */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || name.trim().length < 2}
          style={{
            width: '100%',
            height: '52px',
            borderRadius: '14px',
            border: 'none',
            backgroundColor: name.trim().length >= 2 ? c.action.primary : c.bg.card,
            color: name.trim().length >= 2 ? '#fff' : c.text.muted,
            fontSize: '15px',
            fontWeight: 700,
            cursor: saving || name.trim().length < 2 ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {saving ? '저장 중...' : '온마루 시작하기'}
        </button>
      </div>
    </div>
  );
}
