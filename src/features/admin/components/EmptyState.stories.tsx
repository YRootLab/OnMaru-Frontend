import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';
import { EmptyState } from './EmptyState';

const meta = {
  component: EmptyState,
  tags: ['ai-generated'],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText('데이터가 없습니다')).toBeVisible();
  },
};

export const WithAction: Story = {
  args: {
    title: '등록된 한옥이 없습니다',
    description: '새로운 한옥을 추가해 주세요.',
    actionText: '한옥 등록하기',
    onAction: fn(),
  },
};

export const CustomTitle: Story = {
  args: {
    title: '검색 결과가 없습니다',
    description: '다른 키워드로 검색해 보세요.',
  },
};
