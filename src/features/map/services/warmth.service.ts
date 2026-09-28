import { logger } from '@/lib/log';
import { isOnmaruApiError } from '@/lib/api/errors';
import {
  createMapInsightsRepository,
  defaultMapInsightsRepository,
  type MapInsightsRepository,
  type HeatmapSpot,
} from '@/features/map/services/mapInsights.service';
import { adaptSpringSpotsToHeatSpots, adaptObservationsToDaysAndSeries, type SpringHeatmapSpot } from '@/features/map/warmth/warmthAdapter';
import { fetchLegacyWarmthFallback } from '@/features/map/services/legacyWarmth.service';
import type { HeatDay, HeatSpot } from '@/features/map/types';

const log = logger('warmthService');

const CLIENT_CACHE_TTL = 60_000;

export interface WarmthFetchParams {
  date?: string;
  regionCode?: string;
  metric?: string;
  lat?: number;
  lng?: number;
  level?: number;
  radius?: number;
  signal?: AbortSignal;
}

export interface WarmthFetchResult {
  source: 'SPRING' | 'TOUR_API_FALLBACK';
  coverageStatus: 'COMPLETE' | 'PARTIAL' | 'MISSING';
  spots: HeatSpot[];
  days: HeatDay[];
  noticeMessage?: string;
  wakingStatus?: 'SERVER_WAKING' | 'SERVICE_UNAVAILABLE';
}

interface CacheEntry {
  expiresAt: number;
  result: WarmthFetchResult;
}

const clientMemoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<WarmthFetchResult>>();

export function getWarmthCacheKey(params: WarmthFetchParams): string {
  const dateStr = params.date || 'TODAY';
  const regionStr = params.regionCode || 'ALL';
  const metricStr = params.metric || 'VISIT_COUNT';
  return `heatmap:${dateStr}:${regionStr}:${metricStr}`;
}

export function clearWarmthCache(): void {
  clientMemoryCache.clear();
  inFlightRequests.clear();
}

export type DelayFn = (ms: number, signal?: AbortSignal) => Promise<void>;

const defaultDelay: DelayFn = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'));
    }
    const timer = setTimeout(() => resolve(), ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });

export interface WarmthServiceOptions {
  repository?: MapInsightsRepository;
  fallbackFetcher?: typeof fetchLegacyWarmthFallback;
  delayFn?: DelayFn;
}

export function isWakingOrUnavailableError(error: unknown): 'SERVER_WAKING' | 'SERVICE_UNAVAILABLE' | null {
  if (isOnmaruApiError(error)) {
    if (error.code === 'SERVER_WAKING' || error.status === 503 && !error.code) {
      return 'SERVER_WAKING';
    }
    if (error.code === 'SERVICE_UNAVAILABLE') {
      return 'SERVICE_UNAVAILABLE';
    }
    if (error.status === 408 || error.code === 'REQUEST_TIMEOUT') {
      return 'SERVER_WAKING';
    }
    if (error.status === 503) {
      return 'SERVER_WAKING';
    }
  }
  if (error instanceof Error) {
    if (error.name === 'AbortError') return 'SERVER_WAKING';
    if (error.message.includes('fetch failed') || error.message.includes('NetworkError') || error.message.includes('timeout')) {
      return 'SERVER_WAKING';
    }
  }
  return null;
}

export async function fetchWarmthData(
  params: WarmthFetchParams = {},
  options: WarmthServiceOptions = {},
): Promise<WarmthFetchResult> {
  const cacheKey = getWarmthCacheKey(params);
  const cached = clientMemoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    log.log(`[warmthService] Cache hit for key: ${cacheKey}`);
    return cached.result;
  }

  const inFlight = inFlightRequests.get(cacheKey);
  if (inFlight) {
    log.log(`[warmthService] In-flight deduplication hit for key: ${cacheKey}`);
    return inFlight;
  }

  const promise = executeWarmthFetchFlow(params, options)
    .then((res) => {
      clientMemoryCache.set(cacheKey, {
        expiresAt: Date.now() + CLIENT_CACHE_TTL,
        result: res,
      });
      return res;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

async function executeWarmthFetchFlow(
  params: WarmthFetchParams,
  options: WarmthServiceOptions,
): Promise<WarmthFetchResult> {
  const repository = options.repository ?? defaultMapInsightsRepository;
  const fallbackFetcher = options.fallbackFetcher ?? fetchLegacyWarmthFallback;
  const delay = options.delayFn ?? defaultDelay;

  const date = params.date || new Date().toISOString().split('T')[0];
  const metric = params.metric || 'VISIT_COUNT';
  const regionCode = params.regionCode;

  const retryIntervals = [3000, 7000];
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retryIntervals.length; attempt++) {
    if (attempt > 0) {
      const waitMs = retryIntervals[attempt - 1];
      log.warn(`[warmthService] Spring API attempt ${attempt} failed. Retrying in ${waitMs}ms...`);
      try {
        await delay(waitMs, params.signal);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw err;
        }
      }
    }

    try {
      const response = await repository.getHeatmap({
        date,
        metric,
        regionCode,
      });

      const coverageStatus = response.coverageStatus || 'COMPLETE';

      if (coverageStatus === 'MISSING') {
        log.log('[warmthService] Spring returned MISSING coverageStatus');
        return {
          source: 'SPRING',
          coverageStatus: 'MISSING',
          spots: [],
          days: [],
          noticeMessage: '현재 선택한 지역의 온기 데이터가 준비되지 않았어요.',
        };
      }

      let spots = adaptSpringSpotsToHeatSpots((response.spots as unknown as SpringHeatmapSpot[]) || []);
      let days: HeatDay[] = [];

      const targetRegion = regionCode || (response.spots?.[0] as any)?.region?.regionCode;
      if (targetRegion) {
        try {
          const obsResult = await repository.getObservations({
            regionCode: targetRegion,
            metric,
          });
          if (obsResult && Array.isArray(obsResult.items)) {
            const adapted = adaptObservationsToDaysAndSeries(obsResult.items as any, spots);
            days = adapted.days;
            spots = adapted.spots;
          }
        } catch (obsErr) {
          log.warn('[warmthService] Optional observations API call failed:', obsErr);
        }
      }

      log.log(`[warmthService] Spring API success: ${spots.length} spots retrieved, ${days.length} days (source: SPRING)`);

      return {
        source: 'SPRING',
        coverageStatus: coverageStatus as 'COMPLETE' | 'PARTIAL',
        spots,
        days,
      };
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
      lastError = err;
      const errorType = isWakingOrUnavailableError(err);
      log.warn(`[warmthService] Spring API call failed (attempt ${attempt + 1}/${retryIntervals.length + 1}), errorType: ${errorType}`);
    }
  }

  log.warn('[warmthService] Spring API failed after 2 retries. Switching to Tour API/DataLab fallback.');
  try {
    const fallbackResult = await fallbackFetcher({
      lat: params.lat,
      lng: params.lng,
      level: params.level,
      radius: params.radius,
      signal: params.signal,
    });
    return fallbackResult;
  } catch (fallbackErr) {
    log.error('[warmthService] Tour API fallback also failed:', fallbackErr);
    const errorType = isWakingOrUnavailableError(lastError);
    return {
      source: 'TOUR_API_FALLBACK',
      coverageStatus: 'MISSING',
      spots: [],
      days: [],
      wakingStatus: errorType || 'SERVER_WAKING',
      noticeMessage:
        errorType === 'SERVICE_UNAVAILABLE'
          ? '온기 데이터를 잠시 불러오지 못했어요.'
          : '서비스를 준비하고 있어요.\n잠시 후 다시 불러올게요.',
    };
  }
}
