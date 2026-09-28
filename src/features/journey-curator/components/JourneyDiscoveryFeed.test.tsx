import { Children, type ReactElement, type SyntheticEvent } from 'react';
import { describe, expect, it } from 'vitest';
import { CourseImageLayer } from './JourneyDiscoveryFeed';

describe('CourseImageLayer', () => {
  it('renders a provided image after its placeholder so the image is the top layer', () => {
    const layer = CourseImageLayer({
      name: '북촌 산책',
      thumbnailUrl: 'https://tong.visitkorea.or.kr/photo.jpg',
    });
    const children = Children.toArray(layer.props.children) as ReactElement<{
      role?: string;
      src?: string;
    }>[];

    expect(children[0].props.role).toBe('img');
    expect(children[1].props.src).toBe('https://tong.visitkorea.or.kr/photo.jpg');
  });

  it('keeps only the placeholder when the image URL is whitespace', () => {
    const layer = CourseImageLayer({ name: '북촌 산책', thumbnailUrl: '   ' });
    const children = Children.toArray(layer.props.children).filter(
      (child): child is ReactElement<{ role?: string; src?: string }> => typeof child === 'object',
    );

    expect(children).toHaveLength(1);
    expect(children[0].props.role).toBe('img');
    expect(children[0].props.src).toBeUndefined();
  });

  it('hides a failed image and leaves the placeholder underneath', () => {
    const layer = CourseImageLayer({
      name: '북촌 산책',
      thumbnailUrl: 'https://tong.visitkorea.or.kr/missing.jpg',
    });
    const children = Children.toArray(layer.props.children) as ReactElement<{
      onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
    }>[];
    const imageStyle = { display: '' };

    children[1].props.onError?.({ currentTarget: { style: imageStyle } } as SyntheticEvent<HTMLImageElement>);

    expect(imageStyle.display).toBe('none');
  });
});
