import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import TranquilityGauge from './TranquilityGauge';
import type { TranquilityData } from '../hooks/useHanokTranquility';

const sampleData: TranquilityData = {
  temp: '18',
  tempCelsius: 18,
  feelIndex: '쾌적',
  district: '경주',
  score: 72,
  level: '고즈넉함',
  goldenHour: '오전 7–9시',
  advice: '이른 아침 방문을 추천드립니다. 관광객이 적어 한옥 본연의 고요함을 즐길 수 있습니다.',
  badgeColor: '#249878',
};

const meta = {
  component: TranquilityGauge,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TranquilityGauge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { data: sampleData, loading: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('72')).toBeVisible();
    await expect(canvas.getByText('경주 권역')).toBeVisible();
  },
};

export const Loading: Story = {
  args: { data: null, loading: true },
};

export const HighScore: Story = {
  args: { data: { ...sampleData, score: 95, level: '깊은 고요', district: '안동', badgeColor: '#0A6EFF' }, loading: false },
};

export const LowScore: Story = {
  args: { data: { ...sampleData, score: 23, level: '북적북적', district: '전주', badgeColor: '#FF5500' }, loading: false },
};
