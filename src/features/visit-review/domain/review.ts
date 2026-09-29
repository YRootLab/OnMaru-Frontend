import type { CursorPage } from '@/lib/api/cursor';

export type VisitReviewReportReason = 'SPAM' | 'ABUSE' | 'PERSONAL_DATA' | 'COPYRIGHT' | 'OTHER';

export type VisitReview = {
  id: string;
  placeId: string;
  placeName: string;
  lat: number;
  lng: number;
  text: string;
  mood?: '북적' | '한적';
  score?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  likeCount: number;
  likedByMe: boolean;
  mine: boolean;
  createdAt: string;
};

export type VisitReviewPage = CursorPage<VisitReview>;

export type VisitReviewRegionItem = {
  region: {
    regionCode: string;
    parentRegionCode: string | null;
    name: string;
    level: 'PROVINCE' | 'CITY';
  };
  reviewCount: number;
};

export type VisitReviewTextValidation =
  | { ok: true; value: string }
  | { ok: false; reason: 'empty' | 'tooLong' | 'tooManyLines' };

export function validateVisitReviewText(text: string): VisitReviewTextValidation {
  const value = text.normalize('NFC').replace(/\r\n/g, '\n').trim();

  if (value.length === 0) {
    return { ok: false, reason: 'empty' };
  }
  if (Array.from(value).length > 300) {
    return { ok: false, reason: 'tooLong' };
  }
  if (value.split('\n').length > 5) {
    return { ok: false, reason: 'tooManyLines' };
  }

  return { ok: true, value };
}
