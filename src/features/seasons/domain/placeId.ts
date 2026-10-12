export function canonicalPlaceId(id: string): string {
  return /^\d+$/.test(id) ? `p-tourapi-${id}` : id;
}
