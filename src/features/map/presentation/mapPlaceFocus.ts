import type { KakaoMap } from '@/features/map/types';

const DESKTOP_MIN_WIDTH = 1024;
const COMPACT_MAX_WIDTH = 1439;
const RAIL_LEFT = 14;
const RAIL_WIDTH = 68;
const PANEL_LEFT_GAP = 14;
const PANEL_GAP = 12;
const LIST_PANEL_WIDTH = 400;
const LIST_PANEL_WIDTH_COMPACT = 358;
const DETAIL_PANEL_WIDTH = 380;
const DETAIL_PANEL_WIDTH_COMPACT = 360;

interface VisibleMapCenterOptions {
  viewportWidth: number;
  listPanelOpen: boolean;
}

interface ScreenPoint {
  getX(): number;
  getY(): number;
}

interface MapProjection {
  containerPointFromCoords(coords: unknown): ScreenPoint;
  coordsFromContainerPoint(point: unknown): unknown;
}

interface FocusableMap {
  getProjection(): MapProjection;
  panTo(coords: unknown): void;
}

export function getVisibleMapCenterOffset({
  viewportWidth,
  listPanelOpen,
}: VisibleMapCenterOptions): number {
  if (viewportWidth < DESKTOP_MIN_WIDTH) return 0;

  const compact = viewportWidth <= COMPACT_MAX_WIDTH;
  const listWidth = listPanelOpen
    ? (compact ? LIST_PANEL_WIDTH_COMPACT : LIST_PANEL_WIDTH)
    : 0;
  const detailWidth = compact ? DETAIL_PANEL_WIDTH_COMPACT : DETAIL_PANEL_WIDTH;
  const coveredWidth = RAIL_LEFT + RAIL_WIDTH + PANEL_LEFT_GAP
    + listWidth + PANEL_GAP + detailWidth;

  return coveredWidth / 2;
}

interface FocusPlaceOptions {
  map: FocusableMap;
  target: unknown;
  viewportWidth: number;
  listPanelOpen: boolean;
  createPoint: (x: number, y: number) => unknown;
}

export function focusPlaceInVisibleMap({
  map,
  target,
  viewportWidth,
  listPanelOpen,
  createPoint,
}: FocusPlaceOptions): void {
  const offset = getVisibleMapCenterOffset({ viewportWidth, listPanelOpen });
  if (offset === 0) {
    map.panTo(target);
    return;
  }

  const projection = map.getProjection();
  const targetPoint = projection.containerPointFromCoords(target);
  const adjustedCenter = projection.coordsFromContainerPoint(
    createPoint(targetPoint.getX() - offset, targetPoint.getY()),
  );
  map.panTo(adjustedCenter);
}

export function focusMapOnPlace(
  map: KakaoMap,
  lat: number,
  lng: number,
  listPanelOpen: boolean,
): void {
  const maps = window.kakao?.maps;
  if (!maps) return;

  focusPlaceInVisibleMap({
    map,
    target: new maps.LatLng(lat, lng),
    viewportWidth: window.innerWidth,
    listPanelOpen,
    createPoint: (x, y) => new maps.Point(x, y),
  });
}
