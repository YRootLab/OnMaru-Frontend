'use client';

import { useState } from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import { UserAdd01Icon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth';
import { meok, ringShadow } from '@/design-system/tokens';

const Btn = styled.button<{ $copied: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px 8px 10px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
  pointer-events: auto;
  transition: background 0.15s ease, transform 0.15s ease;

  background: ${({ $copied }) => ($copied ? '#2a7a4b' : 'rgba(255,255,255,0.92)')};
  color: ${({ $copied }) => ($copied ? '#fff' : meok[900])};
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid ${({ $copied }) => ($copied ? 'transparent' : 'rgba(0,0,0,0.07)')};
  box-shadow: ${ringShadow.light.card};

  &:hover { transform: scale(1.03); }
  &:active { transform: scale(0.97); }

  [data-theme='dark'] & {
    background: ${({ $copied }) => ($copied ? '#2a7a4b' : 'rgba(20,24,32,0.92)')};
    color: ${({ $copied }) => ($copied ? '#fff' : '#f0f0f0')};
    border-color: ${({ $copied }) => ($copied ? 'transparent' : 'rgba(255,255,255,0.12)')};
    box-shadow: ${ringShadow.dark.card};
  }
`;

export function ShareCollabButton() {
  const { isLoggedIn } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!isLoggedIn) return null;

  function handleShare() {
    const roomId = crypto.randomUUID();
    const url = `${window.location.origin}/map?room=${roomId}`;

    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success('친구 초대 링크가 복사됐어요!', { description: '링크를 붙여넣어 친구에게 공유하세요.' });
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // fallback: select text manually isn't possible here, just show the URL
      toast.info('링크 복사 실패', { description: url });
    });
  }

  return (
    <Btn type="button" onClick={handleShare} $copied={copied} aria-label="친구와 지도 공유하기">
      <HugeiconsIcon
        icon={copied ? CheckmarkCircle01Icon : UserAdd01Icon}
        size={16}
        strokeWidth={2}
      />
      <span>{copied ? '링크 복사됨' : '친구 초대'}</span>
    </Btn>
  );
}
