import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { EmphasisBadge } from './EmphasisBadge';

const meta = {
  component: EmphasisBadge,
  tags: ['ai-generated'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof EmphasisBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: '한옥체험업' } };
export const Small: Story = { args: { children: '국가민속문화유산', size: 'sm' } };
export const WithIcon: Story = { args: { children: '한옥', showIcon: true } };
export const SmallWithIcon: Story = { args: { children: '한옥', size: 'sm', showIcon: true } };

/** CSS 로딩 검증 — juhong[500] = #FF5500 = rgb(255, 85, 0) */
export const CssCheck: Story = {
  args: { children: '한옥', showIcon: false, size: 'md' },
  play: async ({ canvas }) => {
    const badge = canvas.getByText('한옥');
    await expect(getComputedStyle(badge).backgroundColor).toBe('rgb(255, 85, 0)');
  },
};
