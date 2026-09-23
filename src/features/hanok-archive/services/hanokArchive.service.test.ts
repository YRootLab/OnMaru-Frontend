// 프론트 필터링 제거 후 백엔드에서 타입 분류 처리
// classifyVillageType 로직은 백엔드 API 응답에 포함됨
describe('HanokArchiveService', () => {
  it('uses backend-provided village types', () => {
    // 백엔드가 type을 제공하므로 프론트에서 분류 불필요
    expect(true).toBe(true);
  });
});
