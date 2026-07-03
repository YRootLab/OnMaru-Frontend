import type { OnmaruTheme } from '@/design-system/tokens'

declare module '@emotion/react' {
  export interface Theme extends OnmaruTheme {}
}
