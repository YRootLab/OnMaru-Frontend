export type PlaceSlipMotion = {
  initial: { opacity: number; y: number; scaleY: number };
  animate: { opacity: number; y: number; scaleY: number };
  transition: { duration: number; delay?: number; ease?: number[] };
};

export function getPlaceSlipMotion(options: { reducedMotion: boolean; index?: number }): PlaceSlipMotion {
  if (options.reducedMotion) {
    return {
      initial: { opacity: 1, y: 0, scaleY: 1 },
      animate: { opacity: 1, y: 0, scaleY: 1 },
      transition: { duration: 0 },
    };
  }

  return {
    initial: { opacity: 0, y: 10, scaleY: 0.96 },
    animate: { opacity: 1, y: 0, scaleY: 1 },
    transition: {
      duration: 0.32,
      delay: Math.min((options.index ?? 0) * 0.05, 0.28),
      ease: [0.16, 1, 0.3, 1],
    },
  };
}
