/**
 * /map 데스크탑 진입 연출의 타이밍 표.
 *
 * 순서 (한옥·오디 등 다른 페이지에서 /map으로 이동하는 순간 전부 같은 타이밍에서 출발):
 *   - 상단 GNB(Header)가 위로 자연스럽게 슬라이드되며 사라짐과 "동시에" 지도모드
 *     상단 카테고리 바(MapChips)가 그 자리로 아래에서 차분한 스프링으로 떠오른다
 *     — 회전(flip)이 아니라 순수한 상승 이동이라 더 자연스럽다.
 *   - 좌측 네비게이션 레일(MapNavRail)도 화면 밖 왼쪽에서 같은 순간 슬라이드 인한다
 *     (지연 없음 — 위 스왑과 동시에 들어온다).
 *   - 레일이 자리 잡을 즈음, 정보/온기 플로팅 패널(ListPanel · DetailPanel)이 레일
 *     쪽에서 오른쪽으로 차분한 스프링 애니메이션으로 등장한다.
 *
 * Header.tsx / MapPage.tsx(MapChips) / MapNavRail.tsx가 서로 다른 파일에서 이 값을
 * 가져다 쓰므로, 숫자가 어긋나면 스왑이 어긋나 보인다 — 반드시 한 곳에서만 관리한다.
 */

/** 헤더가 위로 슬라이드되며 사라지는 데 걸리는 시간 — 차분하게 보이도록 여유를 뒀다. */
export const HEADER_EXIT_S = 0.38;

/** 1단계: 좌측 레일은 0s 시점에 화면 밖 좌측에서 우측으로 부드럽게 슬라이드 인한다. */
export const RAIL_ENTER_DELAY_S = 0;
export const RAIL_ENTER_DURATION_S = 0.42;

/** 2단계: 플로팅 리스트/상세 패널은 레일이 안착하는 흐름을 이어받아 좌에서 우로 슬라이드 인한다. */
export const FLOATING_ENTER_DELAY_S = 0.22;
export const FLOATING_SPRING_DURATION_S = 0.56;
export const FLOATING_SPRING_TRANSITION = {
  type: 'spring' as const,
  duration: FLOATING_SPRING_DURATION_S,
  bounce: 0.08,
};

/** 3단계(동시): 카테고리 칩셋은 플로팅 패널이 등장할 때 패널 우측 확정 위치에서 부드럽게 Fade & Slide Down 된다. */
export const CATEGORY_ENTER_DELAY_S = 0.24;
export const CATEGORY_SPRING_TRANSITION = {
  type: 'spring' as const,
  duration: 0.52,
  bounce: 0.08,
};

export const ENTRANCE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
