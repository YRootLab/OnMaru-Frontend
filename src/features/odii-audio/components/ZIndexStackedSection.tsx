'use client';

import React, { useState } from 'react';
import { useOdiiAudioStore } from '../store/useOdiiAudioStore';

interface HanokChapter {
  id: string;
  chapterNum: string;
  title: string;
  subtitle: string;
  concept: string;
  description: string;
  hanokElement: string;
  quote: string;
  imageUrl: string;
  accentColor: string;
  bgGradient: string;
  details: { label: string; val: string }[];
}

const HANOK_CHAPTERS: HanokChapter[] = [
  {
    id: '01',
    chapterNum: 'CHAPTER 01',
    title: '대청마루 — 바람의 길과 안팎의 경계',
    subtitle: '여름의 통풍과 한국의 개방적 환대(Hospitality) 문화',
    concept: '바람의 통로',
    description:
      '남쪽 마당을 통과한 차가운 바람이 대청마루를 지나 북쪽 마당으로 유유히 빠져나갑니다. 안과 밖이 하나로 연결되는 대청마루는 손님을 따스하게 맞이하는 한옥 환대의 중심 공간입니다.',
    hanokElement: '목조 대청 구조 • 사창지 문살',
    quote: '"한옥의 마루는 자연을 차단하는 벽이 아니라, 바람과 사람을 이어주는 열린 무대입니다."',
    imageUrl: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=1000&q=80',
    accentColor: '#D42058',
    bgGradient: 'from-[#FFF0F4] to-[#FAF6F0]',
    details: [
      { label: '건축적 특징', val: '우물마루 정교한 짜맞춤 목공 기법' },
      { label: '소리 메타포', val: '처마 끝 쇠소리 풍경음 & 바람 잎 소리' },
    ],
  },
  {
    id: '02',
    chapterNum: 'CHAPTER 02',
    title: '온돌과 구들장 — 흙과 불이 품은 체온',
    subtitle: '천년의 시간을 축열(蓄熱)하여 은근히 전하는 겨울의 온기',
    concept: '은근한 체온',
    description:
      '아궁이에 피운 장작불의 기운이 암석으로 된 구들장을 따스하게 데우고, 열기가 방 전체로 은은하게 스며듭니다. 차가운 밖의 기운 속에서도 윗목과 아랫목을 채우는 조용하고 깊은 한국 고유의 온열 과학입니다.',
    hanokElement: '황토 구들장 • 보물 자경전 굴뚝',
    quote: '"구들장이 품은 온기는 어머니의 넉넉한 품처럼 밤새도록 방안을 감쌉니다."',
    imageUrl: 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=1000&q=80',
    accentColor: '#E85A18',
    bgGradient: 'from-[#FFF3ED] to-[#FAF6F0]',
    details: [
      { label: '건축적 특징', val: '연도를 통한 열기 순환 및 황토 미장' },
      { label: '소리 메타포', val: '타오르는 아궁이 숯불 소리 & 바람 연기' },
    ],
  },
  {
    id: '03',
    chapterNum: 'CHAPTER 03',
    title: '기와와 처마 — 자연의 곡선을 품은 지붕',
    subtitle: '비와 볕을 가리고 자연의 산세와 조화를 이루는 지혜',
    concept: '유기적 곡선',
    description:
      '하늘을 향해 살포시 들린 한옥의 처마 선은 한국 산천의 능선과 부드럽게 이어집니다. 여름의 강렬한 볕은 가려주고 겨울의 낮은 햇살은 방 깊숙이 들여보내는 사계절 기후에 순응하는 기학적 조형미입니다.',
    hanokElement: '암기와 • 수기와 • 암막새 • 여새',
    quote: '"하늘과 땅 사이, 겹겹이 올려진 기와 곡선은 산능선의 물결을 닮았습니다."',
    imageUrl: 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=1000&q=80',
    accentColor: '#1E7A68',
    bgGradient: 'from-[#E6F5F0] to-[#FAF6F0]',
    details: [
      { label: '건축적 특징', val: '낙수물 받이 곡선 및 모서리 솟음 기법' },
      { label: '소리 메타포', val: '기와에 떨어지는 낙수 빗소리' },
    ],
  },
  {
    id: '04',
    chapterNum: 'CHAPTER 04',
    title: '창호와 문 종이 — 빛을 들이는 조영의 한지',
    subtitle: '직사광을 부드럽게 산란시켜 그윽한 여백을 만드는 빛의 프레임',
    concept: '은은한 조영',
    description:
      '닥나무로 빚은 창호지는 강한 햇빛을 머금어 눈부심 없는 온화한 미색(米色)의 빛으로 바꾸어 놓습니다. 문살의 격자무늬 그림자가 아침저녁으로 마루 위에 한 편의 산수화처럼 수놓아집니다.',
    hanokElement: '닥나무 창호지 • 용자살 • 아자살 문살',
    quote: '"창호지는 밖의 풍경을 단절하지 않고, 은은한 서광만을 기품 있게 들여놓습니다."',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
    accentColor: '#F5A623',
    bgGradient: 'from-[#FFF8E0] to-[#FAF6F0]',
    details: [
      { label: '건축적 특징', val: '천연 닥나무 섬유의 습도 조절 기능' },
      { label: '소리 메타포', val: '바람에 사그라드는 창호 문풍지 소리' },
    ],
  },
];

export const ZIndexStackedSection: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="w-full py-20 border-t border-b border-[#EAE0D0] my-12 bg-gradient-to-b from-[#FAF6F0] via-[#F5EFE6]/40 to-[#FAF6F0]">
      {/* 섹션 헤더 (전통 한옥 타이포그래피 & 문양) */}
      <div className="text-center mb-16 px-4">
        <div className="inline-flex items-center justify-center space-x-2 px-4 py-1.5 rounded-full bg-[#FFF0F4] border border-[#F8A8C0]/40 text-[#D42058] text-xs font-bold mb-4 shadow-sm">
          <span>🏯</span>
          <span>ANATOMY OF HANOK SPACE</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2A1A0A] tracking-tight font-serif">
          한옥의 4대 공간 해부학 & 서사
        </h2>
        <p className="text-sm sm:text-base text-[#786050] mt-3 max-w-xl mx-auto leading-relaxed">
          스크롤에 따라 깊어지는 한옥 고유의 건축 요소와 바람, 빛, 온기의 스토리를 차례대로 감상해보세요.
        </p>
      </div>

      {/* 스태킹 카드 컨테이너 (Shopify Editions & Editorial Style) */}
      <div className="relative w-full max-w-5xl mx-auto px-4 space-y-16">
        {HANOK_CHAPTERS.map((chapter, idx) => {
          const isExpanded = expandedId === chapter.id;
          const zIndex = (idx + 1) * 10;
          const topSticky = 90 + idx * 30;

          return (
            <div
              key={chapter.id}
              style={{
                zIndex,
                top: `${topSticky}px`,
              }}
              className={`sticky w-full rounded-3xl p-6 sm:p-10 border transition-all duration-500 shadow-xl overflow-hidden bg-gradient-to-br ${chapter.bgGradient} ${
                isExpanded ? 'ring-2 ring-[#D42058] shadow-2xl' : 'border-[#EAE0D0]'
              }`}
            >
              {/* 은은한 배경 문살 한지 패턴 메타포 */}
              <div className="absolute right-0 top-0 w-96 h-96 opacity-5 pointer-events-none bg-[radial-gradient(#2A1A0A_1px,transparent_1px)] [background-size:16px_16px]" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                {/* 좌측 에디토리얼 서사 */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="px-3 py-1 text-xs font-extrabold text-white rounded-full shadow-sm"
                      style={{ backgroundColor: chapter.accentColor }}
                    >
                      {chapter.chapterNum}
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-white/80 text-[#2A1A0A] rounded-md border border-[#EAE0D0]">
                      {chapter.hanokElement}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2A1A0A] tracking-tight leading-tight">
                      {chapter.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-[#D42058] mt-1">
                      {chapter.subtitle}
                    </p>
                  </div>

                  <p className="text-sm sm:text-base text-[#786050] leading-relaxed">
                    {chapter.description}
                  </p>

                  {/* 인용구 및 사운드 상세 */}
                  <blockquote className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border-l-4 border-[#D42058] text-xs sm:text-sm font-medium italic text-[#2A1A0A] shadow-sm">
                    {chapter.quote}
                  </blockquote>

                  {/* 세부 명세 그리드 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {chapter.details.map((d, i) => (
                      <div
                        key={i}
                        className="bg-white/60 p-2.5 rounded-xl border border-[#EAE0D0]/50 text-xs"
                      >
                        <span className="font-bold text-[#D42058] block mb-0.5">
                          {d.label}
                        </span>
                        <span className="text-[#2A1A0A] font-medium">{d.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 우측 한옥 이미지 & 비주얼 */}
                <div className="lg:col-span-5">
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-md group border border-white">
                    <img
                      src={chapter.imageUrl}
                      alt={chapter.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-white text-xs">
                      <span className="font-bold">📍 한옥 공간 해부</span>
                      <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-md">
                        {chapter.concept}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
