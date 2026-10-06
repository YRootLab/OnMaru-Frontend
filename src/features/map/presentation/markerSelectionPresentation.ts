export type MarkerTheme = 'light' | 'dark';

export interface SelectedMarkerVisualStyle {
  background: string;
  foreground: string;
  border: string;
  transform: string;
  animation: 'none';
}

export function getSelectedMarkerVisualStyle(theme: MarkerTheme): SelectedMarkerVisualStyle {
  if (theme === 'dark') {
    return {
      background: '#3a4352',
      foreground: '#ffffff',
      border: '#ff8a5c',
      transform: 'translateY(-2px)',
      animation: 'none',
    };
  }

  return {
    background: '#f5f5f4',
    foreground: '#191f28',
    border: '#ff5a1f',
    transform: 'translateY(-2px)',
    animation: 'none',
  };
}
