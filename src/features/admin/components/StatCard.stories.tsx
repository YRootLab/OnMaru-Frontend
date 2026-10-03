import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { StatCard } from './StatCard';

const meta = {
  component: StatCard,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: '오늘 방문자', value: 1234 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('1,234')).toBeVisible();
    await expect(canvas.getByText('오늘 방문자')).toBeVisible();
  },
};

export const WithIncrease: Story = {
  args: { label: '신규 등록', value: 42, delta: 7, deltaType: 'increase', comparisonText: '어제 대비' },
};

export const WithDecrease: Story = {
  args: { label: '이탈률', value: 3, delta: 2, deltaType: 'decrease', unit: '%' },
};

export const Highlighted: Story = {
  args: { label: '신고 접수', value: 5, delta: 5, deltaType: 'increase', highlight: true },
};

export const Clickable: Story = {
  args: { label: '총 한옥 수', value: 128, unit: '개', onClick: () => {} },
};
