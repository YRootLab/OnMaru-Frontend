/**
 * 페이지 전체 스크롤 진행도(0 ~ 1)를 담는 전역 변수.
 *
 * React state나 zustand로 들고 있으면 scrub 갱신마다(초당 60회) 구독 트리가 통째로
 * 리렌더된다. 이 값은 "매 프레임 읽히지만 렌더 트리와는 무관한" 값이므로 모듈 스코프
 * 변수 하나로 두고, 3D는 useFrame 안에서 직접 읽고 DOM 오버레이는 구독으로 받는다.
 */

let scrollProgress = 0;

type Listener = (progress: number) => void;

const listeners = new Set<Listener>();

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** 매 프레임 호출되는 경로(useFrame 등)에서 최신값을 읽는다. */
export function getScrollProgress(): number {
  return scrollProgress;
}

/** ScrollTrigger가 갱신할 때만 호출한다. */
export function setScrollProgress(next: number): void {
  scrollProgress = clamp01(next);

  for (const listener of listeners) {
    listener(scrollProgress);
  }
}

/**
 * DOM 쪽(오버레이 텍스트 등)에서 진행도를 받아쓰기 위한 구독.
 * 리렌더 없이 style을 직접 쓰는 용도로 설계했다.
 */
export function subscribeScrollProgress(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
