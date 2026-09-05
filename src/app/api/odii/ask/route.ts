import { NextRequest, NextResponse } from 'next/server';
import { askOdiiAssistant, validateOdiiAssistantRequest } from '@/features/odii-audio/api/odiiAssistant.service';

export async function POST(request: NextRequest) {
  try {
    const payload = validateOdiiAssistantRequest(await request.json());
    const answer = await askOdiiAssistant(payload);
    return NextResponse.json(answer, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Odii 안내를 준비하지 못했습니다';
    const status = message.includes('질문') ? 400 : message.includes('아직 구성되지') ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
