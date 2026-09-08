/**
 * /map 데스크탑 진입 연출의 타이밍 표.
 *
 * 순서 (한옥·오디 등 다른 페이지에서 /map으로 이동하는 순간 전부 같은 타이밍에서 출발):
 *   1. 상단 GNB(Header)가 위로 flip되며 사라짐과 "동시에" 좌측 네비게이션 레일
 *      (MapNavRail)이 화면 밖 왼쪽에서 슬라이드 인한다 — 지연 없이 같은 순간 시작.
 *   2. 레일이 자리 잡으면, 정보/온기 플로팅 패널(ListPanel · DetailPanel)이 레일
 *      쪽에서 오른쪽으로 차분한 스프링 애니메이션으로 등장한다.
 *   3. 플로팅 패널이 안착하고 나서야, 지도모드 상단 카테고리 바(MapChips)가 그
 *      자리로 아래에서 올라오며 맨 마지막에 나타난다.
 *
 * Header.tsx / MapPage.tsx(MapChips) / MapNavRail.tsx가 서로 다른 파일에서 이 값을
 * 가져다 쓰므로, 숫자가 어긋나면 순서가 겹치거나 역전돼 보인다 — 반드시 한 곳에서만
 * 관리한다.
 */

/** 헤더가 flip으로 사라지는 데 걸리는 시간. */
export const HEADER_EXIT_S = 0.3;

/** 좌측 레일은 헤더 flip과 동시에 시작한다. */
export const RAIL_ENTER_DELAY_S = 0;
export const RAIL_ENTER_DURATION_S = 0.34;

const GAP_AFTER_RAIL_S = 0.06;

/** 플로팅 리스트/상세 패널은 레일이 자리 잡을 즈음 스프링으로 등장한다. */
export const FLOATING_ENTER_DELAY_S = RAIL_ENTER_DELAY_S + RAIL_ENTER_DURATION_S + GAP_AFTER_RAIL_S;
/** duration 기반 스프링 — bounce로 "차분함"을 조절하고, duration을 알아야
 *  카테고리 바가 그 뒤에 등장하도록 정확히 이어붙일 수 있다. */
export const FLOATING_SPRING_DURATION_S = 0.5;
export const FLOATING_SPRING_TRANSITION = {
  type: 'spring' as const,
  duration: FLOATING_SPRING_DURATION_S,
  bounce: 0.16,
};

const GAP_AFTER_FLOATING_S = 0.05;

/** 카테고리 바(MapChips)는 플로팅 패널이 다 안착한 뒤 맨 마지막에 올라온다. */
export const CATEGORY_ENTER_DELAY_S = FLOATING_ENTER_DELAY_S + FLOATING_SPRING_DURATION_S + GAP_AFTER_FLOATING_S;
export const CATEGORY_RISE_S = 0.3;

export const ENTRANCE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
