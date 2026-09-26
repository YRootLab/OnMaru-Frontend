import type { StampBookResponse } from '../domain/models';
import type { LegacyStampStorage, StampRepository } from './ports';

export async function loadPersonalStampBook(
  repository: Pick<StampRepository, 'getMyStampBook'>,
  storage: LegacyStampStorage,
): Promise<StampBookResponse> {
  const book = await repository.getMyStampBook();
  storage.removeLegacyStampData();
  return book;
}
