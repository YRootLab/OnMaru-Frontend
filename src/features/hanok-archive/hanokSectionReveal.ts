/*
  스크롤 리빌의 경계. 나열 순서는 페이지에 서는 순서와 같게 둔다 —
  다르면 이 목록만 보고는 어느 섹션이 먼저인지 알 수 없다.
*/
export const HANOK_REVEAL_SECTIONS = {
  intro: 'hanok-intro',
  kculture: 'hanok-kculture-themes',
  structure: 'hanok-structure',
  grid: 'hanok-grid',
  stay: 'hanok-stay',
  map: 'hanok-map',
  manifesto: 'hanok-manifesto',
} as const;

export const HANOK_REVEAL_SECTION_IDS = Object.values(HANOK_REVEAL_SECTIONS);
