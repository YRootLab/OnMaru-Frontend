const REVEAL_CARD_SELECTOR = '[data-reveal-card]';

export function moveGridReveal(container: HTMLElement, clientX: number, clientY: number) {
  container.dataset.revealActive = 'true';

  container.querySelectorAll<HTMLElement>(REVEAL_CARD_SELECTOR).forEach((card) => {
    const bounds = card.getBoundingClientRect();
    card.style.setProperty('--reveal-x', `${clientX - bounds.left}px`);
    card.style.setProperty('--reveal-y', `${clientY - bounds.top}px`);
  });
}

export function clearGridReveal(container: HTMLElement) {
  delete container.dataset.revealActive;
}
