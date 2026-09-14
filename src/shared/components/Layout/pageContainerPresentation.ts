export interface PageContainerPresentation {
  isFullBleed: boolean;
  background: string;
  surface?: 'hanok';
}

export function getPageContainerPresentation(pathname: string): PageContainerPresentation {
  const isFullBleed = pathname.startsWith('/map') || pathname.startsWith('/sorimaru');

  return {
    isFullBleed,
    background: 'transparent',
    surface: pathname.startsWith('/hanok') ? 'hanok' : undefined,
  };
}
