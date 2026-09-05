import type { OdiiCategory } from '@/features/odii-audio/types/odii.types';

export interface OdiiAssistantFilters {
  category?: OdiiCategory | string;
  query?: string;
}

export interface OdiiAssistantRequest {
  question: string;
  filters?: OdiiAssistantFilters;
}

export interface OdiiAssistantSource {
  stid: string;
  title: string;
  locationName?: string;
  formattedDuration?: string;
}

export interface OdiiAssistantResponse {
  answer: string;
  sources: OdiiAssistantSource[];
}
