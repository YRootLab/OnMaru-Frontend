














const noop = () => {};

function enabled(ns: string): boolean {
  const raw =
    typeof window === 'undefined' ? process.env.DEBUG : window.localStorage.getItem('debug');
  const v = raw ?? '';
  return v === '*' || v.split(',').some((s) => s.trim() === ns);
}

export function logger(ns: string) {
  const on = enabled(ns);

  const tag = [`%c${ns}`, 'color:#e85a18;font-weight:700'] as const;
  return {
    log: on ? console.log.bind(console, ...tag) : noop,
    table: on ? console.table.bind(console) : noop,
    warn: console.warn.bind(console, ...tag),
    error: console.error.bind(console, ...tag),
  };
}

export const __test = { enabled };
