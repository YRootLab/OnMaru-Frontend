import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { StatusBadge } from './StatusBadge';

const meta = {
  component: StatusBadge,
  tags: ['ai-generated'],
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Published: Story = {
  args: { status: 'PUBLISHED' },
  play: async ({ canvas }) => {
    const badge = canvas.getByText('게시중');
    await expect(badge).toBeVisible();
    await expect(badge.tagName).toBe('SPAN');
  },
};

export const Pending: Story = { args: { status: 'PENDING' } };
export const Hidden: Story = { args: { status: 'HIDDEN' } };
export const Deleted: Story = { args: { status: 'DELETED' } };
export const Active: Story = { args: { status: 'ACTIVE' } };
export const Suspended: Story = { args: { status: 'SUSPENDED' } };
export const Rejected: Story = { args: { status: 'REJECTED' } };
export const Unknown: Story = { args: { status: '미확인' } };
