import type { Preview } from '@storybook/nextjs-vite';
import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import '../src/app/globals.css';
import { OnmaruThemeProvider } from '../src/design-system/ThemeProvider';
import koMessages from '../messages/ko.json';

const preview: Preview = {
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="ko" messages={koMessages}>
        <OnmaruThemeProvider defaultMode="light">
          <Story />
        </OnmaruThemeProvider>
      </NextIntlClientProvider>
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