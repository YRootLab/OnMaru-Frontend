export interface PageContainerPresentation {
  isFullBleed: boolean;
  background: string;
  surface?: 'hanok';
}

export function getPageContainerPresentation(pathname: string): PageContainerPresentation {
  // 홈, 한옥이야기, 소리마루, 지도 등 모든 페이지가 자체 1140px 컨테이너와 반응형 패딩을
  // 직접 제어하므로, 외곽 PageContainer의 이중 max-width 및 패딩 간섭을 제거한다.
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
