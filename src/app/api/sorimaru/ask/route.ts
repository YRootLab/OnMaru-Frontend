import { NextRequest, NextResponse } from 'next/server';
import { askSorimaruAssistant, validateSorimaruAssistantRequest } from '@/features/sorimaru-audio/api/sorimaruAssistant.service';

export async function POST(request: NextRequest) {
  try {
    const payload = validateSorimaruAssistantRequest(await request.json());
    const answer = await askSorimaruAssistant(payload);
    return NextResponse.json(answer, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sorimaru 안내를 준비하지 못했습니다';
    const status = message.includes('질문') ? 400 : message.includes('아직 구성되지') ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
