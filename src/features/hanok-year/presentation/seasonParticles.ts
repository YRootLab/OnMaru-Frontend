export interface SeasonParticle {
  left: string;
  top: string;
  size: string;
  duration: string;
  delay: string;
  drift: string;
  opacity: number;
}

function unit(seed: number): number {
  let value = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 0x100000000;
}

export function getSeasonParticles(month: number, count = 44): SeasonParticle[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = month * 1009 + index * 79;
    return {
      left: `${Math.round(3 + unit(seed + 1) * 94)}%`,
      top: `${Math.round(2 + unit(seed + 2) * 94)}%`,
      size: `${Math.round(7 + unit(seed + 3) * 12)}px`,
      duration: `${Math.round(12 + unit(seed + 4) * 13)}s`,
      delay: `${Math.round(-unit(seed + 5) * 24)}s`,
      drift: `${Math.round(-110 + unit(seed + 6) * 220)}px`,
      opacity: Number((0.52 + unit(seed + 7) * 0.4).toFixed(2)),
    };
  });
}
