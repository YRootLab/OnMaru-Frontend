export type CharacterId =
  | 'CHARACTER_01' | 'CHARACTER_02' | 'CHARACTER_03' | 'CHARACTER_04' | 'CHARACTER_05'
  | 'CHARACTER_06' | 'CHARACTER_07' | 'CHARACTER_08' | 'CHARACTER_09' | 'CHARACTER_10';

export type BackgroundId =
  | 'BACKGROUND_01' | 'BACKGROUND_02' | 'BACKGROUND_03' | 'BACKGROUND_04' | 'BACKGROUND_05'
  | 'BACKGROUND_06' | 'BACKGROUND_07' | 'BACKGROUND_08' | 'BACKGROUND_09' | 'BACKGROUND_10';

/** 실제 캐릭터 WebP 파일이 배포되기 전까지는 /images/character/Oni_hi.png를 fallback으로 사용.
 *  파일을 public/images/profile/character_XX.webp 에 추가하면 자동으로 적용됩니다. */
export const PROFILE_CHARACTER_PATHS: Record<CharacterId, string> = {
  CHARACTER_01: '/images/profile/character_01.webp',
  CHARACTER_02: '/images/profile/character_02.webp',
  CHARACTER_03: '/images/profile/character_03.webp',
  CHARACTER_04: '/images/profile/character_04.webp',
  CHARACTER_05: '/images/profile/character_05.webp',
  CHARACTER_06: '/images/profile/character_06.webp',
  CHARACTER_07: '/images/profile/character_07.webp',
  CHARACTER_08: '/images/profile/character_08.webp',
  CHARACTER_09: '/images/profile/character_09.webp',
  CHARACTER_10: '/images/profile/character_10.webp',
};

export const PROFILE_BACKGROUNDS: Record<BackgroundId, string> = {
  BACKGROUND_01: '#E8D5C0', // 연한 황토
  BACKGROUND_02: '#C4DEC8', // 연한 초록
  BACKGROUND_03: '#D4C5E2', // 연한 보라
  BACKGROUND_04: '#F5D5C5', // 연한 살구
  BACKGROUND_05: '#C8D8E8', // 연한 파랑
  BACKGROUND_06: '#E8C8C8', // 연한 분홍
  BACKGROUND_07: '#D8E0C4', // 연한 황록
  BACKGROUND_08: '#E8E0C0', // 연한 황금
  BACKGROUND_09: '#C8D8D8', // 연한 청록
  BACKGROUND_10: '#D8C8B8', // 연한 갈색
};

const FALLBACK_CHARACTER_PATH = '/images/character/Oni_hi.png';
const FALLBACK_BACKGROUND = '#E8D5C0';

export function resolveCharacterPath(id: string | undefined): string {
  if (!id) return FALLBACK_CHARACTER_PATH;
  return PROFILE_CHARACTER_PATHS[id as CharacterId] ?? FALLBACK_CHARACTER_PATH;
}

export function resolveBackground(id: string | undefined): string {
  if (!id) return FALLBACK_BACKGROUND;
  return PROFILE_BACKGROUNDS[id as BackgroundId] ?? FALLBACK_BACKGROUND;
}

export const CHARACTER_IDS = Object.keys(PROFILE_CHARACTER_PATHS) as CharacterId[];
export const BACKGROUND_IDS = Object.keys(PROFILE_BACKGROUNDS) as BackgroundId[];
