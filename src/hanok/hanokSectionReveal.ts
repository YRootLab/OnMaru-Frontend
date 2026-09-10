/*
  스크롤 리빌의 경계. 나열 순서는 페이지에 서는 순서와 같게 둔다 —
  다르면 이 목록만 보고는 어느 섹션이 먼저인지 알 수 없다.

  구조 챕터는 오래 빠져 있었다. 다른 여섯이 전부 리빌로 올라오는데 이 섹션만
  툭 나타나서, 챕터가 갈리는 자리인데도 갈린 티가 안 났다.
*/
export const HANOK_REVEAL_SECTIONS = {
  intro: 'hanok-intro',
  distribution: 'hanok-distribution',
  monthly: 'hanok-monthly',
  grid: 'hanok-grid',
  stay: 'hanok-stay',
  map: 'hanok-map',
  structure: 'hanok-structure',
  parts: 'hanok-parts',
  manifesto: 'hanok-manifesto',
} as const;

export const HANOK_REVEAL_SECTION_IDS = Object.values(HANOK_REVEAL_SECTIONS);
