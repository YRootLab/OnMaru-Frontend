// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { clearGridReveal, moveGridReveal } from './gridReveal';

describe('grid reveal pointer tracking', () => {
  it('projects one grid pointer position into every card coordinate space', () => {
    const grid = document.createElement('div');
    const firstCard = document.createElement('article');
    const secondCard = document.createElement('article');
    firstCard.dataset.revealCard = '';
    secondCard.dataset.revealCard = '';
    grid.append(firstCard, secondCard);

    vi.spyOn(firstCard, 'getBoundingClientRect').mockReturnValue({
      left: 20,
      top: 30,
      right: 320,
      bottom: 450,
      width: 300,
      height: 420,
      x: 20,
      y: 30,
      toJSON: () => ({}),
    });
    vi.spyOn(secondCard, 'getBoundingClientRect').mockReturnValue({
      left: 344,
      top: 30,
      right: 644,
      bottom: 450,
      width: 300,
      height: 420,
      x: 344,
      y: 30,
      toJSON: () => ({}),
    });

    moveGridReveal(grid, 330, 180);

    expect(grid.dataset.revealActive).toBe('true');
    expect(firstCard.style.getPropertyValue('--reveal-x')).toBe('310px');
    expect(firstCard.style.getPropertyValue('--reveal-y')).toBe('150px');
    expect(secondCard.style.getPropertyValue('--reveal-x')).toBe('-14px');
    expect(secondCard.style.getPropertyValue('--reveal-y')).toBe('150px');
  });

  it('turns off the shared reveal when the pointer leaves the grid', () => {
    const grid = document.createElement('div');
    grid.dataset.revealActive = 'true';

    clearGridReveal(grid);

    expect(grid.dataset.revealActive).toBeUndefined();
  });
});
