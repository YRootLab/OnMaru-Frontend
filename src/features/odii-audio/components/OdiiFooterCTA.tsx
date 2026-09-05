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
      <div className="w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.12, 1, 0.2, 1] }}
          className="relative overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-[#fffdfa] via-[#fff5f7] to-[#fff0f5] p-8 text-[#211e19] shadow-xl shadow-rose-950/5 backdrop-blur-md sm:p-14"
        >
          {/* 분위기 비네트 래디얼 오버레이 */}
          <div className="pointer-events-none absolute inset-0 bg-radial from-white/60 via-transparent to-[#fff0f5]/80" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#f84e76]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-[#e8a3b5]/15 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center">
            {/* 절기 알림 뱃지 */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#f84e76]/20 bg-white/80 px-3.5 py-1 text-xs font-bold text-[#f84e76] shadow-sm backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f84e76] animate-pulse" />
              <span>{termText}</span>
            </div>

            <h2 className="mt-5 font-odii-sans text-2xl font-extrabold tracking-tight text-[#211e19] sm:text-4xl">
              다음 계절에도, 새로운 이야기를 만나요
            </h2>

            <p className="mt-3.5 max-w-xl text-xs leading-relaxed text-[#786d5e] sm:text-sm">
              계절과 날짜가 바뀌면 오늘의 대표 이야기도 새롭게 열립니다.
              다음에 돌아왔을 때 다른 장소의 온기를 이어서 들어보세요.
            </p>

            {/* CTA 버튼 모음 */}
            <div className="mt-8 flex w-full flex-col items-center justify-center gap-3.5 sm:w-auto sm:flex-row">
              <Link
                href="/map"
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#f84e76] to-[#e03860] px-7 py-3.5 text-xs font-bold text-white shadow-md shadow-[#f84e76]/25 transition-all duration-300 hover:-translate-y-0.5 hover:from-[#e03860] hover:to-[#c8244c] hover:shadow-lg hover:shadow-[#f84e76]/35 sm:w-auto"
              >
                <span>전국 한옥 지도에서 둘러보기</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center rounded-full border border-[#f84e76]/25 bg-white/90 px-7 py-3.5 text-xs font-bold text-[#f84e76] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#f84e76]/50 hover:bg-white hover:shadow-md sm:w-auto"
              >
                온마루 3D 한옥 스토리가기 🇰🇷
              </Link>
            </div>

            <p className="mt-8 text-[11px] font-medium text-[#a59a8d]">오늘의 소리는 내일 또 다른 장면으로 이어집니다.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
