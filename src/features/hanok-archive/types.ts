







export { STAY_TYPE } from './domain/village';
export type { Village, VillageMeta, VillageType } from './domain/village';

export interface RepeatInfoItem {
  title: string;
  content: string;
}

export interface VillageDetailResponse {
  overview: string | null;
  homepage?: string | null;
  tel?: string | null;
  usetime?: string | null;
  restdate?: string | null;
  parking?: string | null;
  expguide?: string | null;
  checkin?: string | null;
  checkout?: string | null;
  roomtype?: string | null;
  roomcount?: string | null;
  subfacility?: string | null;
  barbecue?: string | null;
  chkcooking?: string | null;
  refundregulation?: string | null;
  repeatInfo?: RepeatInfoItem[];
  images?: string[];
  lat?: number | null;
  lng?: number | null;
  addr?: string | null;

  contentTags?: string[];
  source: 'TourAPI' | 'none' | 'backend';
  item?: any;
}

export type SectionId = 'hero' | 'grid' | 'map' | 'monthly' | 'cta';