import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HanokIcon } from './HanokIcon';

const meta = {
  component: HanokIcon,
  tags: ['ai-generated'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof HanokIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { size: 24 } };
export const Small: Story = { args: { size: 16 } };
export const Large: Story = { args: { size: 48 } };
export const Colored: Story = {
  args: { size: 32, style: { color: '#FF5500' } },
};
