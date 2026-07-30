'use client';

import BeatFrame, { isInBeat } from './BeatFrame';

export const RANGE = [0.44, 0.58];

export default function Beat3c_CrossSection({ progress }) {
  if (!isInBeat(progress, ...RANGE)) return null;

  return <BeatFrame>Beat3c 영역입니다</BeatFrame>;
}
