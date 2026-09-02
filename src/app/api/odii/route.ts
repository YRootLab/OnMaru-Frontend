import { NextRequest } from 'next/server';
import { OdiiService } from '@/features/odii-audio/api/odii.service';

/**
 * 한국관광공사 오디(Odii) 오디오 가이드 프록시 API (Thin Controller)
 */
export async function GET(request: NextRequest) {
  return await OdiiService.proxyRequest(request);
}
