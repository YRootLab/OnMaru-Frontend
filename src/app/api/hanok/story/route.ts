import { NextResponse } from 'next/server';
import type {
  HanokStoryResponse,
  HanokStorySource,
  HanokStoryTimelineItem,
} from '@/features/hanok-archive/types/hanokStory';

interface StoryRequest {
  contentId?: unknown;
  name?: unknown;
  address?: unknown;
  type?: unknown;
  overview?: unknown;
}

interface GeminiGroundingChunk {
  web?: { uri?: string; title?: string };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    groundingMetadata?: { groundingChunks?: GeminiGroundingChunk[] };
  }>;
}

interface CachedStory {
  expiresAt: number;
  value: HanokStoryResponse;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const storyCache = new Map<string, CachedStory>();

function readText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function isAddressOnly(value: string, address: string): boolean {
  const text = stripHtml(value);
  const normalizedText = text.replace(/\s+/g, '');
  const normalizedAddress = stripHtml(address).replace(/\s+/g, '');
  if (!text) return false;
  if (normalizedAddress && (normalizedText === normalizedAddress || normalizedAddress.includes(normalizedText))) {
    return true;
  }
  return text.length < 100
    && /(?:특별시|광역시|특별자치시|특별자치도|[가-힣]+도)\s/.test(text)
    && /(?:로|길|동|읍|면|리)\s*\d/.test(text);
}

function cleanJsonBlock(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

function safeHttpsUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function normalizeTimeline(value: unknown): HanokStoryTimelineItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const period = readText(record.period, 40);
      const title = readText(record.title, 80);
      const detail = readText(record.detail, 220);
      return period && title && detail ? { period, title, detail } : null;
    })
    .filter((item): item is HanokStoryTimelineItem => Boolean(item))
    .slice(0, 3);
}

function normalizeHighlights(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => readText(item, 160))
    .filter(Boolean)
    .slice(0, 3);
}

function extractSources(response: GeminiResponse): HanokStorySource[] {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const seen = new Set<string>();

  return chunks.flatMap((chunk) => {
    const url = safeHttpsUrl(chunk.web?.uri);
    if (!url || seen.has(url)) return [];
    seen.add(url);
    return [{ title: readText(chunk.web?.title, 100) || new URL(url).hostname, url }];
  }).slice(0, 4);
}

function fallbackStory(name: string, address: string, type: string, overview: string): HanokStoryResponse {
  const cleanedOverview = stripHtml(overview);
  const knownDescription = isAddressOnly(cleanedOverview, address) ? '' : cleanedOverview;
  return {
    summary: knownDescription || `${name}의 역사 자료를 지금 불러오지 못했어요. 잠시 후 다시 검색하면 이 장소에 얽힌 이야기를 확인할 수 있습니다.`,
    timeline: [],
    highlights: [],
    sources: [],
    isAiGenerated: false,
    sourceMode: knownDescription ? 'public' : 'unavailable',
  };
}

function cacheStory(key: string, value: HanokStoryResponse) {
  if (storyCache.size >= 80) {
    const oldestKey = storyCache.keys().next().value;
    if (oldestKey) storyCache.delete(oldestKey);
  }
  storyCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
}

async function generateGroundedStory(
  apiKey: string,
  model: string,
  place: { name: string; address: string; type: string; overview: string },
): Promise<HanokStoryResponse> {
  const prompt = `당신은 한국 건축·지역사 도슨트입니다. 아래 장소를 Google 검색으로 조사해, 확인 가능한 사실만 한국어 JSON으로 작성하세요.

[장소]
- 이름: ${place.name}
- 주소: ${place.address || '주소 미상'}
- 분류: ${place.type || '전통 공간'}
- 기존 공공데이터 설명: ${place.overview || '없음'}

[원칙]
- 같은 이름의 다른 장소와 혼동하지 마세요. 이름과 주소가 함께 일치하는 자료를 우선하세요.
- 전설이나 구전은 사실처럼 단정하지 말고 "전해진다"고 표현하세요.
- 확인할 수 없는 연도, 인물, 사건은 만들지 마세요.
- 방문자가 지나치기 쉬운 공간적·건축적 관찰 포인트를 포함하세요.
- JSON 이외의 문장은 출력하지 마세요.

[JSON 형식]
{"summary":"장소의 역사와 의미를 3~4문장으로 설명","timeline":[{"period":"연도 또는 시대","title":"짧은 사건명","detail":"확인된 맥락 1~2문장"}],"highlights":["현장에서 눈여겨볼 점"]}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(30000),
    },
  );

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const body = await response.json() as GeminiResponse;
  const rawText = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
  const sources = extractSources(body);
  if (!rawText || sources.length === 0) throw new Error('Grounded story or sources missing');

  const parsed = JSON.parse(cleanJsonBlock(rawText)) as Record<string, unknown>;
  const summary = readText(parsed.summary, 900);
  if (!summary) throw new Error('Story summary missing');

  return {
    summary,
    timeline: normalizeTimeline(parsed.timeline),
    highlights: normalizeHighlights(parsed.highlights),
    sources,
    isAiGenerated: true,
    sourceMode: 'ai',
  };
}

export async function POST(request: Request) {
  const raw = await request.json().catch(() => ({})) as StoryRequest;
  const contentId = readText(raw.contentId, 80);
  const name = readText(raw.name, 120);
  const address = readText(raw.address, 220);
  const type = readText(raw.type, 80);
  const overview = readText(raw.overview, 4000);

  if (!name) {
    return NextResponse.json({ error: '장소 이름이 필요합니다.' }, { status: 400 });
  }

  const fallback = fallbackStory(name, address, type, overview);
  const cacheKey = `${contentId || name}:${address}`;
  const cached = storyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.value, { headers: { 'X-Onmaru-Cache': 'HIT' } });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json(fallback);

  for (const model of ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash']) {
    try {
      const story = await generateGroundedStory(apiKey, model, { name, address, type, overview });
      cacheStory(cacheKey, story);
      return NextResponse.json(story, {
        headers: { 'Cache-Control': 'private, max-age=3600, stale-while-revalidate=86400' },
      });
    } catch (error) {
      console.warn(`[Hanok story] ${model} failed`, error);
    }
  }

  return NextResponse.json(fallback);
}
