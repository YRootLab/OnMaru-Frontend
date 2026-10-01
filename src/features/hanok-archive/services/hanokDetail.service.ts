import { getHanokDetail } from '@/features/hanok-archive/application/getHanokDetail';

export const HanokDetailService = {
  getHanokDetail: (placeId: string, contentTypeId?: string | null) => getHanokDetail(placeId, contentTypeId),
};
