import { palette, meok } from '@/design-system/tokens';

export type CharacterId =
  | 'CHARACTER_01' | 'CHARACTER_02' | 'CHARACTER_03' | 'CHARACTER_04' | 'CHARACTER_05'
  | 'CHARACTER_06' | 'CHARACTER_07' | 'CHARACTER_08' | 'CHARACTER_09' | 'CHARACTER_10';

export type BackgroundId =
  | 'BACKGROUND_01' | 'BACKGROUND_02' | 'BACKGROUND_03' | 'BACKGROUND_04' | 'BACKGROUND_05'
  | 'BACKGROUND_06' | 'BACKGROUND_07' | 'BACKGROUND_08' | 'BACKGROUND_09' | 'BACKGROUND_10';

export const PROFILE_CHARACTER_PATHS: Record<CharacterId, string> = {
  CHARACTER_01: '/images/profile/눈웃음온이.png',
  CHARACTER_02: '/images/profile/다도쉼온이.png',
  CHARACTER_03: '/images/profile/명필온이.png',
  CHARACTER_04: '/images/profile/무사도령온이.png',
  CHARACTER_05: '/images/profile/소리몰입온이.png',
  CHARACTER_06: '/images/profile/쿨쿨낮잠온이.png',
  CHARACTER_07: '/images/profile/꿀약과온이.png',
  CHARACTER_08: '/images/profile/윙크온이.png',
  CHARACTER_09: '/images/profile/청사초롱온이.png',
  CHARACTER_10: '/images/profile/호기심온이.png',
};

export const PROFILE_CHARACTER_NAMES: Record<CharacterId, string> = {
  CHARACTER_01: '눈웃음온이',
  CHARACTER_02: '다도쉼온이',
  CHARACTER_03: '명필온이',
  CHARACTER_04: '무사도령온이',
  CHARACTER_05: '소리몰입온이',
  CHARACTER_06: '쿨쿨낮잠온이',
  CHARACTER_07: '꿀약과온이',
  CHARACTER_08: '윙크온이',
  CHARACTER_09: '청사초롱온이',
  CHARACTER_10: '호기심온이',
};

export const PROFILE_BACKGROUNDS: Record<BackgroundId, string> = {
  BACKGROUND_01: palette.juhong[100],    // 연한 주황
  BACKGROUND_02: palette.hwanggeum[100], // 연한 노랑
  BACKGROUND_03: palette.cheongrok[100], // 연한 초록
  BACKGROUND_04: palette.kobalt[100],    // 연한 파랑
  BACKGROUND_05: palette.nam[100],       // 연한 남색
  BACKGROUND_06: palette.jaha[100],      // 연한 보라
  BACKGROUND_07: palette.jangmi[100],    // 연한 장미
  BACKGROUND_08: palette.danpung[100],   // 연한 단풍
  BACKGROUND_09: meok[200],              // 연한 회색
  BACKGROUND_10: palette.juhong[50],     // 아이보리
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
