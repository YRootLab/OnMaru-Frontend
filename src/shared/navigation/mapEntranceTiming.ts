
















export const HEADER_EXIT_S = 0.38;


export const RAIL_ENTER_DELAY_S = 0;
export const RAIL_ENTER_DURATION_S = 0.42;


export const FLOATING_ENTER_DELAY_S = 0.22;
export const FLOATING_SPRING_DURATION_S = 0.56;
export const FLOATING_SPRING_TRANSITION = {
  type: 'spring' as const,
  duration: FLOATING_SPRING_DURATION_S,
  bounce: 0.08,
};


export const CATEGORY_ENTER_DELAY_S = 0.24;
export const CATEGORY_SPRING_TRANSITION = {
  type: 'spring' as const,
  duration: 0.52,
  bounce: 0.08,
};

export const ENTRANCE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
