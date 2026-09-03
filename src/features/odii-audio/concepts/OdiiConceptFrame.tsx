import Link from 'next/link';
import type { ReactNode } from 'react';
import { ODII_CONCEPTS, getOdiiConceptMeta, type OdiiConcept } from './odiiConcept';

export function OdiiConceptFrame({ concept, children }: { concept?: OdiiConcept; children: ReactNode }) {
  return (
    <div className={`odii-feature odii-concept-frame relative isolate min-h-screen pb-24 text-[#1D1D1F] selection:bg-[#F84E76] selection:text-white${concept ? ` odii-concept--${concept}` : ''}`}>
      {concept ? (
        <nav aria-label="오디 디자인 시안" className="sticky top-0 z-50 border-b border-black/[0.04] bg-[#FAFAF8]/80 px-4 py-2 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <Link href="/odii/concepts" className="text-xs font-semibold text-[#746F68] transition-colors hover:text-[#1D1D1F]">시안 비교</Link>
            <div className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
              {ODII_CONCEPTS.map((item) => (
                <Link key={item} href={`/odii/concepts/${item}`} aria-current={item === concept ? 'page' : undefined} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F84E76] ${item === concept ? 'bg-[#1D1D1F] text-white' : 'text-[#746F68] hover:bg-black/[0.04] hover:text-[#1D1D1F]'}`}>
                  {getOdiiConceptMeta(item).title}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      ) : null}
      <div aria-hidden="true" className="odii-concept-ambient pointer-events-none absolute inset-0 -z-10" />
      {children}
    </div>
  );
}
