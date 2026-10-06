/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import PlaceDetailCarousel from './PlaceDetailCarousel';

afterEach(cleanup);

describe('PlaceDetailCarousel image loading states', () => {
  it('shows a fixed-size skeleton while place detail is loading', () => {
    render(<PlaceDetailCarousel images={[]} title="테스트 장소" loading />);

    expect(screen.getByRole('status', { name: '장소 이미지 불러오는 중' })).not.toBeNull();
    expect(screen.queryByText('한국의 아름다운 전통 공간')).toBeNull();
  });

  it('keeps the skeleton until the real image finishes loading', () => {
    render(<PlaceDetailCarousel images={['https://example.com/place.jpg']} title="테스트 장소" />);

    const image = screen.getByRole('img', { name: '테스트 장소 사진 1' });
    expect(screen.getByRole('status', { name: '장소 이미지 불러오는 중' })).not.toBeNull();

    fireEvent.load(image);

    expect(screen.queryByRole('status', { name: '장소 이미지 불러오는 중' })).toBeNull();
  });

  it('shows the category fallback only after every image fails', () => {
    render(<PlaceDetailCarousel images={['https://example.com/broken.jpg']} title="테스트 장소" category="stay" />);

    expect(screen.queryByText('마당이 있는 한옥 스테이')).toBeNull();
    fireEvent.error(screen.getByRole('img', { name: '테스트 장소 사진 1' }));

    expect(screen.getByText('마당이 있는 한옥 스테이')).not.toBeNull();
  });
});
