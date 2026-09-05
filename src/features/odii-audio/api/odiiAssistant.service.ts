import type { OdiiAssistantRequest, OdiiAssistantResponse, OdiiAssistantSource } from './odiiAssistant.types';

const MAX_QUESTION_LENGTH = 500;

function readSource(value: unknown): OdiiAssistantSource | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const stid = typeof source.stid === 'string' ? source.stid.trim() : '';
  const title = typeof source.title === 'string' ? source.title.trim() : '';
  if (!stid || !title) return null;

  return {
    stid,
    title,
    ...(typeof source.locationName === 'string' && source.locationName.trim() ? { locationName: source.locationName.trim() } : {}),
    ...(typeof source.formattedDuration === 'string' && source.formattedDuration.trim() ? { formattedDuration: source.formattedDuration.trim() } : {}),
  };
}

export function validateOdiiAssistantRequest(value: unknown): OdiiAssistantRequest {
  if (!value || typeof value !== 'object') throw new Error('질문 형식이 올바르지 않습니다');
  const payload = value as Record<string, unknown>;
  const question = typeof payload.question === 'string' ? payload.question.trim() : '';
  if (!question || question.length > MAX_QUESTION_LENGTH) throw new Error('질문은 1자 이상 500자 이하로 입력해 주세요');

  const rawFilters = payload.filters && typeof payload.filters === 'object' ? payload.filters as Record<string, unknown> : {};
  return {
    question,
    filters: {
      ...(typeof rawFilters.category === 'string' && rawFilters.category.trim() ? { category: rawFilters.category.trim() } : {}),
      ...(typeof rawFilters.query === 'string' && rawFilters.query.trim() ? { query: rawFilters.query.trim() } : {}),
    },
  };
}

export function validateOdiiAssistantResponse(value: unknown): OdiiAssistantResponse {
  if (!value || typeof value !== 'object') throw new Error('RAG 응답 형식이 올바르지 않습니다');
  const payload = value as Record<string, unknown>;
  const answer = typeof payload.answer === 'string' ? payload.answer.trim() : '';
  const sources = Array.isArray(payload.sources) ? payload.sources.map(readSource).filter((source): source is OdiiAssistantSource => Boolean(source)) : [];
  if (!answer) throw new Error('RAG 응답에 답변이 없습니다');
  if (sources.length === 0) throw new Error('Odii 출처가 없는 응답입니다');
  return { answer, sources };
}

export async function askOdiiAssistant(request: OdiiAssistantRequest): Promise<OdiiAssistantResponse> {
  const endpoint = process.env.ODII_RAG_API_URL;
  if (!endpoint) throw new Error('ODII RAG 서비스가 아직 구성되지 않았습니다');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.ODII_RAG_API_TOKEN ? { Authorization: `Bearer ${process.env.ODII_RAG_API_TOKEN}` } : {}),
    },
    body: JSON.stringify(request),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`ODII RAG 서비스 요청에 실패했습니다 (${response.status})`);
  return validateOdiiAssistantResponse(await response.json());
}
