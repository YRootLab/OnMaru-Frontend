/**
 * /map 데스크탑 진입 연출의 타이밍 표.
 *
 * 순서 (한옥·오디 등 다른 페이지에서 /map으로 이동하는 순간 전부 같은 타이밍에서 출발):
 *   - 상단 GNB(Header)가 3D flip(달력 페이지가 위로 넘어가듯)으로 사라짐과
 *     "동시에" 지도모드 상단 카테고리 바(MapChips)가 그 자리로 아래에서
 *     tilt-in하며 나타난다 — 하나의 카드가 뒤집혀 교체되는 것처럼 보이도록 둘 다
 *     HEADER_EXIT_S 길이로 같은 순간 시작한다.
 *   - 좌측 네비게이션 레일(MapNavRail)도 화면 밖 왼쪽에서 같은 순간 슬라이드 인한다
 *     (지연 없음 — 위 flip 스왑과 동시에 들어온다).
 *   - 레일이 자리 잡을 즈음, 정보/온기 플로팅 패널(ListPanel · DetailPanel)이 레일
 *     쪽에서 오른쪽으로 차분한 스프링 애니메이션으로 등장한다.
 *
 * Header.tsx / MapPage.tsx(MapChips) / MapNavRail.tsx가 서로 다른 파일에서 이 값을
 * 가져다 쓰므로, 숫자가 어긋나면 flip 스왑이 어긋나 보인다 — 반드시 한 곳에서만
 * 관리한다.
 */

/** 헤더 flip-out과 카테고리 바 tilt-in이 함께 걸리는 시간. */
export const HEADER_EXIT_S = 0.32;
/** MapChips(지도모드 상단 카테고리)가 아래에서 올라오는 데 걸리는 시간 — 헤더와 맞춘다. */
export const CATEGORY_RISE_S = HEADER_EXIT_S;

/** 좌측 레일은 헤더/카테고리 flip 스왑과 동시에 시작한다. */
export const RAIL_ENTER_DELAY_S = 0;
export const RAIL_ENTER_DURATION_S = 0.34;

const GAP_AFTER_RAIL_S = 0.06;

/** 플로팅 리스트/상세 패널은 레일이 자리 잡을 즈음 스프링으로 등장한다. */
export const FLOATING_ENTER_DELAY_S = RAIL_ENTER_DELAY_S + RAIL_ENTER_DURATION_S + GAP_AFTER_RAIL_S;
export const FLOATING_SPRING_DURATION_S = 0.5;
export const FLOATING_SPRING_TRANSITION = {
  type: 'spring' as const,
  duration: FLOATING_SPRING_DURATION_S,
  bounce: 0.16,
};

export const ENTRANCE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
/** 카드가 뒤집히는 무게감을 위한 이징 — 시작·끝 모두 완만한 대칭 곡선. */
export const FLIP_TRANSFORM_EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];
/** 실제 카드처럼 정면을 보다가 거의 직각(엣지온)이 될 때 확 사라지도록 하는 곡선. */
export const FLIP_OPACITY_EASE: [number, number, number, number] = [0.7, 0, 1, 1];
