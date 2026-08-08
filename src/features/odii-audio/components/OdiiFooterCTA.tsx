'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import SHADOW from '@/data/solarShadow.json';

function getNextSolarTerm(now = new Date()) {
  const year = now.getFullYear();
  const dated = [year, year + 1].flatMap((y) =>
    (SHADOW.stops || []).map((term) => ({ name: term.name, date: new Date(y, term.month - 1, term.day) })),
  );
  const next = dated.filter((term) => term.date >= now).sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  if (!next) return null;
  return {
    name: next.name,
    daysLeft: Math.ceil((next.date.getTime() - now.getTime()) / 86400000),
  };
}

export const OdiiFooterCTA: React.FC = () => {
  const term = useMemo(() => getNextSolarTerm(), []);

  const termText = (() => {
    if (!term) return '절기 알림';
    if (term.daysLeft === 0) return `${term.name} 오늘`;
    if (term.daysLeft === 1) return `${term.name} 내일`;
    return `${term.name}까지 D-${term.daysLeft}`;
  })();

  return (
    <section aria-label="다음에 또 방문하기" className="w-full py-12 sm:py-16">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.12, 1, 0.2, 1] }}
          className="relative overflow-hidden border-y border-white/15 bg-[#211e19] p-8 text-white shadow-[0_18px_48px_rgba(33,30,25,0.14)] sm:p-12"
        >
          {/* 아늑한 비네트 배경 */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#a94d35]/20 via-transparent to-[#a94d35]/20 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <p className="text-xs font-semibold tracking-[0.12em] text-[#d68a6f]">{termText}</p>

            <h2 className="mt-4 font-odii-sans text-2xl font-bold tracking-tight sm:text-4xl text-white">
              다음 계절에도, 새로운 이야기를 만나요
            </h2>

            <p className="mt-3 max-w-xl text-xs sm:text-sm leading-relaxed text-white/80">
              계절과 날짜가 바뀌면 오늘의 대표 이야기도 새롭게 열립니다.
              다음에 돌아왔을 때 다른 장소의 온기를 이어서 들어보세요.
            </p>

            {/* 버튼 모음 */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/map"
                className="w-full sm:w-auto rounded-full bg-[#a94d35] px-6 py-3 text-xs font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#c4563a]"
              >
                전국 한옥 지도에서 둘러보기 →
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto rounded-full border border-white/30 px-6 py-3 text-xs font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
              >
                온마루 3D 한옥 스토리가기
              </Link>
            </div>

            <p className="mt-8 text-[11px] text-white/50">오늘의 소리는 내일 또 다른 장면으로 이어집니다.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
