export type CsrfToken = {
  token: string;
  headerName: string;
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function isCsrfToken(value: unknown): value is CsrfToken {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { token?: unknown }).token === 'string' &&
    typeof (value as { headerName?: unknown }).headerName === 'string'
  );
}

export function createCsrfTokenProvider(fetcher: typeof fetch, baseUrl: string) {
  let cachedToken: CsrfToken | null = null;
  let pending: Promise<CsrfToken> | null = null;

  const load = async (): Promise<CsrfToken> => {
    const response = await fetcher(`${trimTrailingSlash(baseUrl)}/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }

    const payload = await response.json();
    if (!isCsrfToken(payload)) {
      throw new Error('Invalid CSRF token response');
    }
    return payload;
  };

  return {
    async getToken(): Promise<CsrfToken> {
      if (cachedToken) return cachedToken;
      if (!pending) {
        pending = load().then((token) => {
          cachedToken = token;
          pending = null;
          return token;
        });
      }
      return pending;
    },
    reset(): void {
      cachedToken = null;
      pending = null;
    },
  };
}
