'use client';

import React from 'react';

interface EditorialCard {
  id: string;
  step: string;
  title: string;
  subtitle: string;
  description: string;
  quote: string;
  imageUrl: string;
  accentColor: string;
  tags: string[];
}

const STACKED_CARDS: EditorialCard[] = [
  {
    id: '01',
    step: 'CHAPTER 01',
    title: '바람의 길, 대청마루의 소리',
    subtitle: '안과 밖의 경계가 무너지는 한국 건축의 공간 미학',
    description:
      '남향의 따스한 볕이 사창지 문살을 넘어 들어오고, 마당을 지나온 여름 바람이 대청마루를 시원하게 관통합니다. 처마 끝에 걸린 風景(풍경)의 은은한 쇠소리는 마음을 평온하게 만듭니다.',
    quote: '"한옥은 자연을 꺾지 않고, 바람의 길을 열어두는 건축입니다."',
    imageUrl: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=1000&q=80',
    accentColor: '#D42058',
    tags: ['#대청마루', '#바람의길', '#한옥미학'],
  },
  {
    id: '02',
    step: 'CHAPTER 02',
    title: '불과 흙이 다져낸 온돌의 온기',
    subtitle: '천년의 시간을 품어온 은근하고 깊은 방안의 체온',
    description:
      '아궁이에 지핀 장작불의 기운이 구들장을 따라 천천히 방 전체로 고루 퍼져나갑니다. 차가운 겨울 바람 속에서도 윗목과 아랫목을 채우는 아늑함은 한국인의 따뜻한 감성으로 이어집니다.',
    quote: '"구들장이 품은 온기는 그 옛날 어머니의 품처럼 따스합니다."',
    imageUrl: 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=1000&q=80',
    accentColor: '#E85A18',
    tags: ['#온돌', '#구들장', '#한국의온기'],
  },
  {
    id: '03',
    step: 'CHAPTER 03',
    title: '사람내음 샘솟는 시전 상인의 정(情)',
    subtitle: '조선 육의전에서부터 현대 시장까지 이어진 넉넉한 인심',
    description:
      '엽전을 주고받으며 도란도란 나누는 나지막한 활기와 덤으로 얹어주는 웃음소리. 사람과 사람이 만나는 전통 시장은 한국 고유의 환대와 정이 서려있는 오디오 가이드의 또 다른 무대입니다.',
    quote: '"말 한마디에 정이 얹어지고, 발걸음마다 온기가 전해집니다."',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=80',
    accentColor: '#1E7A68',
    tags: ['#전통시장', '#사람내음', '#고운정'],
  },
];

export const ZIndexStackedSection: React.FC = () => {
  return (
    <section className="w-full py-16">
      <div className="text-center mb-12">
        <span className="text-xs font-bold tracking-widest text-[#D42058] uppercase block mb-2">
          Shopify Editions Inspired Editorial
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2A1A0A] tracking-tight">
          한옥의 미학과 소리가 빚어내는 서사
        </h2>
        <p className="text-sm text-[#786050] mt-2 max-w-lg mx-auto">
          스크롤을 내리며 층층이 접혀 올라오는 한국의 공간과 정(情)의 이야기를 감상해보세요.
        </p>
      </div>

      {/* Z-Index Stacking Container */}
      <div className="relative w-full space-y-12">
        {STACKED_CARDS.map((card, idx) => {
          const zIndex = (idx + 1) * 10;
          const topOffset = 80 + idx * 24;

          return (
            <div
              key={card.id}
              style={{
                zIndex,
                top: `${topOffset}px`,
              }}
              className="sticky w-full bg-white rounded-3xl p-6 sm:p-10 border border-[#EAE0D0] shadow-xl transition-transform duration-500 hover:-translate-y-1 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* 좌측 텍스트 영역 */}
                <div className="md:col-span-7 space-y-4">
                  <div className="flex items-center space-x-3">
                    <span
                      className="px-3 py-1 text-xs font-bold text-white rounded-full"
                      style={{ backgroundColor: card.accentColor }}
                    >
                      {card.step}
                    </span>
                    <div className="flex space-x-1.5">
                      {card.tags.map((t) => (
                        <span key={t} className="text-xs font-medium text-[#786050]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-3xl font-bold text-[#2A1A0A] leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-sm font-semibold text-[#D42058]">
                    {card.subtitle}
                  </p>

                  <p className="text-sm sm:text-base text-[#786050] leading-relaxed">
                    {card.description}
                  </p>

                  <blockquote className="p-4 bg-[#FAF6F0] rounded-2xl border-l-4 border-[#D42058] text-xs sm:text-sm font-medium italic text-[#2A1A0A]">
                    {card.quote}
                  </blockquote>
                </div>

                {/* 우측 이미지 영역 */}
                <div className="md:col-span-5">
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg group">
                    <img
                      src={card.imageUrl}
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
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
