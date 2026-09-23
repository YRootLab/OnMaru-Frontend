











export const transientProps = {
  shouldForwardProp: (prop: string) => !prop.startsWith('$'),
};
