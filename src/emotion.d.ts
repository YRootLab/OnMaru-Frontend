import type { OnmaruTheme } from '@/design-system/tokens'

declare module '@emotion/react' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface Theme extends OnmaruTheme {}
}
