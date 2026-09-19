import type { SorimaruCategory } from '@/features/sorimaru-audio/types/sorimaru.types';

export interface SorimaruAssistantFilters {
  category?: SorimaruCategory | string;
  query?: string;
}

export interface SorimaruAssistantRequest {
  question: string;
  filters?: SorimaruAssistantFilters;
}

export interface SorimaruAssistantSource {
  stid: string;
  title: string;
  locationName?: string;
  formattedDuration?: string;
}

export interface SorimaruAssistantResponse {
  answer: string;
  sources: SorimaruAssistantSource[];
}
