'use client';

import BeatFrame, { isInBeat } from './BeatFrame';

export const RANGE = [0.94, 1.0];

export default function Beat6_Invite({ progress }) {
  if (!isInBeat(progress, ...RANGE)) return null;

  return <BeatFrame>Beat6 영역입니다</BeatFrame>;
}
