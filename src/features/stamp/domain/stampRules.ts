import type {
  ApiStampRarity,
  CollectedStamp,
  RegionCode,
  StampBookItem,
  StampBookResponse,
  StampCatalogResponse,
  StampCollectionView,
  StampDefinition,
  StampErrorLike,
  StampRarity,
  StampSummary,
  StampView,
} from './models';

const REGION_NAMES: Record<RegionCode, string> = {
  all: '전국',
  seoul: '서울',
  gyeonggi: '경기',
  gangwon: '강원',
  chungcheong: '충청',
  jeolla: '전라',
  gyeongsang: '경상',
  jeju: '제주',
};

const REGION_ALIASES: Record<string, RegionCode> = {
  SEOUL: 'seoul',
  GYEONGGI: 'gyeonggi',
  GANGWON: 'gangwon',
  CHUNGCHEONG: 'chungcheong',
  JEOLLA: 'jeolla',
  GYEONGSANG: 'gyeongsang',
  JEJU: 'jeju',
};

const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: '위치 정보를 새로 확인한 뒤 다시 시도해 주세요.',
  IDEMPOTENCY_KEY_MISSING: '방문 기록 요청을 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
  IDEMPOTENCY_KEY_INVALID: '방문 기록 요청을 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
  AUTH_REQUIRED: '로그인 후 이용해 주세요.',
  CSRF_INVALID: '보안 확인이 만료됐어요. 다시 시도해 주세요.',
  NOT_FOUND: '현재 이 장소에서는 방문 도장을 남길 수 없어요.',
  IDEMPOTENCY_CONFLICT: '방문 기록 요청이 충돌했어요. 문의 코드를 확인해 주세요.',
  LOCATION_ACCURACY_TOO_LOW: '야외로 이동해 위치 정확도가 좋아진 뒤 다시 시도해 주세요.',
  OUTSIDE_CHECK_IN_RADIUS: '장소 가까이 이동한 뒤 다시 시도해 주세요.',
  CHECK_IN_RATE_LIMITED: '오늘 가능한 방문 기록 횟수를 모두 사용했어요.',
  RATE_LIMITED: '잠시 후 랭킹 참여를 다시 시도해 주세요.',
  SERVICE_UNAVAILABLE: '서버가 잠시 불안정해요. 현재 화면에서 다시 시도해 주세요.',
  GEOLOCATION_UNSUPPORTED: '이 브라우저는 위치 확인을 지원하지 않아요.',
  GEOLOCATION_PERMISSION_DENIED: '브라우저와 OS 설정에서 위치 권한을 허용해 주세요.',
  GEOLOCATION_POSITION_UNAVAILABLE: '기기의 위치 서비스를 켠 뒤 다시 시도해 주세요.',
  GEOLOCATION_TIMEOUT: '위치 확인 시간이 초과됐어요. 다시 시도해 주세요.',
};

export function toStampRarity(value: ApiStampRarity): StampRarity {
  return value.toLowerCase() as StampRarity;
}

export function toRegionCode(regionGroup: string | null): RegionCode {
  if (!regionGroup) return 'all';
  return REGION_ALIASES[regionGroup.toUpperCase()] ?? 'all';
}

function toCollectedStamp(item: StampBookItem | undefined): CollectedStamp | null {
  if (!item?.collected || !item.collectedAt) return null;
  return {
    stampId: item.code,
    placeId: item.triggerPlaceId ?? '',
    placeName: '',
    collectedAt: item.collectedAt,
    rarity: toStampRarity(item.rarity),
  };
}

function toStampView(definition: StampDefinition, personal?: StampBookItem): StampView {
  const region = toRegionCode(definition.regionGroup);
  return {
    id: definition.code,
    name: definition.name,
    rarity: toStampRarity(definition.rarity),
    region,
    regionName: definition.regionGroup ? REGION_NAMES[region] : '전국 특수',
    condition: definition.conditionLabel,
    description: definition.description,
    sealText: definition.sealText,
    iconName: definition.iconName,
    color: definition.color,
    requiredCount: definition.requiredCount ?? undefined,
    collected: toCollectedStamp(personal),
  };
}

function guestSummary(catalog: StampCatalogResponse): StampSummary {
  const requiredRegionCount = catalog.stamps.find(
    (stamp) => stamp.conditionType === 'REGION_COUNT',
  )?.requiredCount ?? 0;
  return {
    collectedCount: 0,
    totalCount: catalog.stamps.length,
    visitedRegionCount: 0,
    requiredRegionCount,
    completionRate: 0,
  };
}

export function mergeStampCatalog(
  catalog: StampCatalogResponse,
  book: StampBookResponse | null,
): StampCollectionView {
  const personal = new Map(book?.stamps.map((stamp) => [stamp.code, stamp]) ?? []);
  return {
    summary: book?.summary ?? guestSummary(catalog),
    stamps: catalog.stamps
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((stamp) => toStampView(stamp, personal.get(stamp.code))),
  };
}

export function stampErrorMessage(error: StampErrorLike): string {
  const message = ERROR_MESSAGES[error.code] ?? '요청을 처리하지 못했어요. 다시 시도해 주세요.';
  return error.requestId ? `${message} (문의 코드: ${error.requestId})` : message;
}

interface StampBookViewStateInput {
  authLoading: boolean;
  loggedIn: boolean;
  hasCatalog: boolean;
  hasBook: boolean;
  catalogError: boolean;
  bookError: boolean;
}

export type StampBookViewState = 'loading' | 'catalog-error' | 'book-error' | 'ready';

export function resolveStampBookViewState(input: StampBookViewStateInput): StampBookViewState {
  if (!input.hasCatalog) return input.catalogError ? 'catalog-error' : 'loading';
  if (input.authLoading) return 'loading';
  if (input.loggedIn && !input.hasBook) return input.bookError ? 'book-error' : 'loading';
  return 'ready';
}
