const PRIVATE_STORAGE_KEYS = [
  'onmaru_user',
  'onmaru_access_token',
  'onmaru_refresh_token',
  'onmaru.pendingSaveIntent.v1',
];

export function clearPrivateClientState(storage?: Storage): void {
  if (typeof window === 'undefined' && !storage) return;

  const targetStorage = storage ?? window.localStorage;
  PRIVATE_STORAGE_KEYS.forEach((key) => targetStorage.removeItem(key));
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem('onmaru.pendingSaveIntent.v1');
  }
}
