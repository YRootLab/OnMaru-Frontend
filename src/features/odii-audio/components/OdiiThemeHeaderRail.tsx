'use client';

import React from 'react';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { OdiiCategory } from '@/features/odii-audio/types/odii.types';

interface RealThemeCard {
  id: string;
  category: OdiiCategory;
  title: string;
  subTitle: string;
  placeCount: number;
  audioCount: number;
  examples: string;
  bgGradient: string;
  accentColor: string;
  tag: string;
}

const REAL_THEMES: RealThemeCard[] = [
  {
    id: 'hanok',
    category: '한옥',
    title: '한옥과 고운 숨결',
    subTitle: '기와 지붕 아래 머무는 한국의 멋',
    placeCount: 9,
    audioCount: 19,
    examples: '남산골 한옥마을, 전주 한옥마을, 송도 한옥마을',
    bgGradient: 'from-[#2e261f] to-[#1c1814]',
    accentColor: '#d4af37', // Gold
    tag: '한옥 19'
  },
  {
    id: 'palace',
    category: '궁',
    title: '궁궐과 전각의 역사',
    subTitle: '조선 왕조 500년 궁궐 건축의 서사',
    placeCount: 29,
    audioCount: 205,
    examples: '경복궁 근정전/영제교, 창덕궁, 덕수궁, 창경궁',
    bgGradient: 'from-[#381c19] to-[#1f0e0c]',
    accentColor: '#e06d53', // Coral Red
    tag: '궁궐 205'
  },
  {
    id: 'gotaek',
    category: '고택',
    title: '고택과 선비의 집',
    subTitle: '세월을 품은 종택과 선비의 지혜',
    placeCount: 8,
    audioCount: 21,
    examples: '안동 하회마을 하동고택, 작천고택, 북촌댁',
    bgGradient: 'from-[#272b22] to-[#141712]',
    accentColor: '#a1b88e', // Sage Green
    tag: '고택 21'
  },
  {
    id: 'bukchon',
    category: '북촌',
    title: '북촌 한옥길',
    subTitle: '궁궐 사이 고즈넉한 한옥 골목',
    placeCount: 3,
    audioCount: 12,
    examples: '북촌 솟을대문, 화경당, 가회동 한옥길',
    bgGradient: 'from-[#27252f] to-[#16151c]',
    accentColor: '#9b90c2', // Lavender
    tag: '북촌 12'
  },
  {
    id: 'jeonju',
    category: '전주',
    title: '전주 한옥마을',
    subTitle: '소리문화와 전통 풍류가 살아있는 곳',
    placeCount: 18,
    audioCount: 37,
    examples: '전주 한옥마을, 전주소리문화관, 전통술박물관',
    bgGradient: 'from-[#33261a] to-[#1e160e]',
    accentColor: '#e69d45', // Warm Ochre
    tag: '전주 37'
  },
  {
    id: 'market',
    category: '전통시장',
    title: '시장과 정겨운 장터',
    subTitle: '사람 냄새 가득한 우리 삶의 이야기',
    placeCount: 62,
    audioCount: 136,
    examples: '남대문시장, 부산 국제시장, 중앙전통시장',
    bgGradient: 'from-[#2b241e] to-[#191512]',
    accentColor: '#d98b6c', // Terrakotta
    tag: '전통시장 136'
  }
];

export const OdiiThemeHeaderRail: React.FC = () => {
  const selectedCategory = useOdiiAudioStore((s) => s.selectedCategory);
  const setSelectedCategory = useOdiiAudioStore((s) => s.setSelectedCategory);

  return (
    <section className="w-full py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-4 border-b border-[#211e19]/15">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#a94d35] uppercase">
            Odii Audio Curation
          </span>
          <h2 className="font-odii-sans text-2xl sm:text-3xl font-semibold text-[#211e19] mt-1">
            한국의 온기를 담은 6대 문화 테마
          </h2>
        </div>
        <p className="text-xs text-[#655b4d] mt-2 sm:mt-0">
          한국관광공사 공공 오디오 가이드 실시간 연동 (총 6,524개 음원 중 엄선)
        </p>
      </div>

      {/* 6대 실측 테마 카드리스트 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REAL_THEMES.map((theme) => {
          const isSelected = selectedCategory === theme.category;

          return (
            <div
              key={theme.id}
              onClick={() => setSelectedCategory(theme.category)}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl p-6 transition-all duration-300 bg-gradient-to-br ${theme.bgGradient} ${
                isSelected
                  ? 'ring-2 ring-offset-2 ring-offset-[#f3eee4]  scale-[1.02]'
                  : 'hover: hover:-translate-y-0.5 opacity-95 hover:opacity-100'
              }`}
              style={{
                borderColor: isSelected ? theme.accentColor : 'transparent',
              }}
            >
              {/* 상단 태그 뱃지 */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white/90 bg-white/10 backdrop-blur-md border border-white/15"
                  style={{ color: theme.accentColor }}
                >
                  {theme.tag} 오디오
                </span>
                <span className="text-[11px] text-white/50">
                  {theme.placeCount}개 장소
                </span>
              </div>

              {/* 제목 & 서브타이틀 */}
              <h3 className="font-odii-sans text-xl font-bold text-white group-hover:text-amber-100 transition-colors">
                {theme.title}
              </h3>
              <p className="text-xs text-white/70 mt-1.5 line-clamp-1">
                {theme.subTitle}
              </p>

              {/* 장소 예시 샘플 */}
              <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                <p className="text-[11px] text-white/50 truncate max-w-[85%]">
                  {theme.examples}
                </p>
                <span
                  className={`text-xs transition-transform duration-300 ${
                    isSelected ? 'translate-x-1 font-bold' : 'group-hover:translate-x-1'
                  }`}
                  style={{ color: theme.accentColor }}
                >
                  →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
