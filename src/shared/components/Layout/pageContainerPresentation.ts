export interface PageContainerPresentation {
  isFullBleed: boolean;
  background: string;
  surface?: 'hanok';
}

export function getPageContainerPresentation(pathname: string): PageContainerPresentation {


  const isFullBleed =
    pathname === '/' ||
    pathname.startsWith('/hanok') ||
    pathname.startsWith('/sorimaru') ||
    pathname.startsWith('/map') ||
    pathname.startsWith('/mypage') ||
    pathname.startsWith('/stamps') ||
    pathname.startsWith('/discover');

  return {
    isFullBleed,
    background: 'transparent',
    surface: pathname.startsWith('/hanok') ? 'hanok' : undefined,
  };
}
