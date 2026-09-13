import { NextRequest } from 'next/server';
import { SorimaruService } from '@/features/sorimaru-audio/api/sorimaru.service';

/**
 * 한국관광공사 오디(Sorimaru) 오디오 가이드 프록시 API (Thin Controller)
 */
export async function GET(request: NextRequest) {
  return await SorimaruService.proxyRequest(request);
}
