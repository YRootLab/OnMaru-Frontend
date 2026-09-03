import Link from 'next/link';
import { ODII_CONCEPTS, getOdiiConceptMeta } from '@/features/odii-audio/concepts/odiiConcept';

export default function OdiiConceptIndexPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF8] px-5 py-24 text-[#1D1D1F] sm:px-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-maruburi text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">소리마루 디자인 시안</h1>
        <p className="mt-4 text-sm text-[#746F68]">같은 이야기와 기능을 세 가지 시선으로 비교해 보세요.</p>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {ODII_CONCEPTS.map((concept) => {
            const meta = getOdiiConceptMeta(concept);
            return (
              <Link key={concept} href={`/odii/concepts/${concept}`} className="group rounded-[28px] border border-black/5 bg-white p-7 shadow-[0_18px_60px_rgba(29,29,31,.06)] transition-transform duration-500 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F84E76]">
                <h2 className="text-xl font-semibold tracking-[-0.04em]">{meta.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#746F68]">{meta.note}</p>
                <span className="mt-10 inline-flex text-sm font-semibold text-[#F84E76]">시안 보기 →</span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
