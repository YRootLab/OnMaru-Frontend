import type { Preview } from '@storybook/nextjs-vite';
import React from 'react';
import '../src/app/globals.css';
import { OnmaruThemeProvider } from '../src/design-system/ThemeProvider';

const preview: Preview = {
  decorators: [
    (Story) => (
      <OnmaruThemeProvider defaultMode="light">
        <Story />
      </OnmaruThemeProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
  async beforeEach() {
    localStorage.setItem('onmaru-color-mode', 'light');
  },
};

export default preview;