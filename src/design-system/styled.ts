/**
 * Emotion은 `styled.div` / `styled('div')` 처럼 **태그**를 감쌀 때만 유효하지 않은 prop을 걸러낸다.
 * `styled(motion.div)` / `styled(Link)` 처럼 **컴포넌트**를 감싸면 그대로 흘려보내고,
 * 그 컴포넌트가 DOM에 spread 하는 순간 터진다:
 *
 *   React does not recognize the `$bg` prop on a DOM element.
 *   Invalid attribute name: `$bg`
 *
 * 그래서 컴포넌트를 감쌀 때는 항상 붙인다:
 *
 *   const Photo = styled(motion.div, transientProps)<{ $bg: string }>`...`;
 */
export const transientProps = {
  shouldForwardProp: (prop: string) => !prop.startsWith('$'),
};
