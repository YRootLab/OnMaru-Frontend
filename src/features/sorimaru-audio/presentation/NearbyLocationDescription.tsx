'use client';

import styled from '@emotion/styled';
import { useTranslations } from 'next-intl';
import { meok, palette } from '@/design-system/tokens';

const NEARBY_FALLBACK_MESSAGE =
  '반경 3km 안에는 아직 등록된 이야기가 없어요. 전국 큐레이션을 보여드릴게요.';

const NeutralText = styled.span`
  color: ${meok[700]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const Emphasis = styled.strong`
  font-weight: 700;
  color: ${palette.juhong[500]};

  [data-theme='dark'] & {
    color: ${palette.juhong[300]};
  }
`;

interface NearbyLocationDescriptionProps {
  message: string;
}

export function NearbyLocationDescription({ message }: NearbyLocationDescriptionProps) {
  const t = useTranslations('sorimaru.nearby');

  if (message !== NEARBY_FALLBACK_MESSAGE && message !== t('fallbackFull')) {
    return <NeutralText data-tone="neutral">{message}</NeutralText>;
  }

  return (
    <NeutralText data-tone="neutral">
      <Emphasis data-emphasis="nearby-radius">{t('radius')}</Emphasis>
      {t('noStoriesInRadius')}
      <Emphasis data-emphasis="national-curation">{t('nationalCuration')}</Emphasis>
      {t('showNational')}
    </NeutralText>
  );
}
