import { getHanokDetail } from '@/features/hanok-archive/application/getHanokDetail';

export const HanokDetailService = {
  getHanokDetail: (placeId: string, _contentTypeId?: string | null) => getHanokDetail(placeId),
};
