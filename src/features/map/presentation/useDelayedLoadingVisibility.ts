'use client';

import { useEffect, useState } from 'react';

export function useDelayedLoadingVisibility(
  loading: boolean,
  delayMs = 2_000,
): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!loading) {
      setVisible(false);
      return;
    }

    setVisible(false);
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, loading]);

  return visible;
}
