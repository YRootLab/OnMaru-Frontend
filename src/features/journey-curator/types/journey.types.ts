export type NodeCategory = 'region' | 'hanok' | 'market' | 'odii' | 'warmth';

export type MoodId = 'quiet' | 'market' | 'story' | 'rainy' | 'rest';

import React from 'react';

export interface MoodOption {
  id: MoodId;
  label: string;
  icon: React.ReactNode;
  query: string;
}

export interface GraphNode {
  id: string;
  label: string;
  category: NodeCategory;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  badge?: string;
  description?: string;
  color?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  dashed?: boolean;
}

export interface RouteStop {
  time: string;
  name: string;
  category: string;
  description: string;
}

export interface BentoRouteCard {
  title: string;
  duration: string;
  walkingTime: string;
  stops: RouteStop[];
  mapLink: string;
}

export interface BentoHanokCard {
  title: string;
  location: string;
  imageUrl: string;
  architecturalPoint: string;
  era: string;
  hanokLink: string;
}

export interface BentoOdiiCard {
  title: string;
  subtitle: string;
  duration: string;
  audioUrl?: string;
  narrator: string;
  excerpt: string;
  odiiLink: string;
}

export interface BentoWarmthCard {
  status: '한적함' | '보통' | '북적임';
  percentage: number;
  bestTime: string;
  vibeComment: string;
  recentCount: number;
}

export interface BentoJourneyPlan {
  id: string;
  querySummary: string;
  title: string;
  tagline: string;
  region: string;
  moodKeywords: string[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  routeCard: BentoRouteCard;
  hanokCard: BentoHanokCard;
  odiiCard: BentoOdiiCard;
  warmthCard: BentoWarmthCard;
}
