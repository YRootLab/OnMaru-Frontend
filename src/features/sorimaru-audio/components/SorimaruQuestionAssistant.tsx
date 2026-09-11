'use client';

import React, { FormEvent, useState } from 'react';
import { ArrowUp, RotateCcw, Search } from 'lucide-react';
import type { SorimaruAssistantFilters, SorimaruAssistantResponse, SorimaruAssistantSource } from '@/features/sorimaru-audio/api/sorimaruAssistant.types';

interface SorimaruQuestionAssistantProps {
  filters: SorimaruAssistantFilters;
  onOpenSource: (source: SorimaruAssistantSource) => void;
}

const SUGGESTIONS = [
  '경주에서 10분 안에 들을 수 있는 이야기를 찾아줘',
  '아이와 함께 듣기 좋은 한옥 이야기를 알려줘',
  '조용히 걸으며 듣기 좋은 자연 이야기가 있을까?',
];

export function SorimaruQuestionAssistant({ filters, onOpenSource }: SorimaruQuestionAssistantProps) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<SorimaruAssistantResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const ask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/sorimaru/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed, filters }),
      });
      const payload = await response.json() as SorimaruAssistantResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || '안내를 불러오지 못했습니다');
      setResult(payload);
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : '안내를 불러오지 못했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section aria-labelledby="sorimaru-question-heading" className="mt-12 pt-7 sm:mt-14 sm:pt-8">
      <div className="grid gap-5 rounded-[18px] bg-[#f8f8f7] p-5 sm:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)] sm:items-start sm:p-6">
        <div>
          <h3 id="sorimaru-question-heading" className="font-sorimaru-sans text-lg font-bold tracking-[-0.035em] text-[#191f28]">어떤 이야기를 찾고 있나요?</h3>
          <p className="mt-1.5 text-xs leading-5 text-[#4e5968]">장소, 분위기, 듣는 시간으로 자연스럽게 물어보세요. 답변에는 오디 이야기 출처를 함께 보여드립니다.</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => setQuestion(suggestion)} className="rounded-full bg-white px-2.5 py-1.5 text-left text-micro leading-4 text-[#4e5968] transition-colors hover:bg-[#FFF0F6] hover:text-[#d93d63]">
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={ask} className="self-stretch">
          <label htmlFor="sorimaru-natural-question" className="sr-only">찾고 싶은 오디오 이야기 질문</label>
          <div className="flex min-h-11 items-center gap-2 rounded-full bg-white px-3 focus-within:bg-[#FFF0F6]">
            <Search size={16} strokeWidth={2} className="shrink-0 text-[#8b95a1]" />
            <input id="sorimaru-natural-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} placeholder="예: 부여에서 짧게 들을 역사 이야기" className="min-w-0 flex-1 bg-transparent text-xs text-[#191f28] outline-none placeholder:text-[#8b95a1]" />
            <button type="submit" disabled={!question.trim() || isLoading} aria-label="질문 보내기" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#FF2A85] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-35">
              {isLoading ? <RotateCcw size={14} strokeWidth={2} className="animate-spin" /> : <ArrowUp size={16} strokeWidth={2} />}
            </button>
          </div>
          {isLoading && <p className="mt-3 text-micro text-[#4e5968]">오디 이야기에서 근거를 찾고 있어요.</p>}
          {error && <p className="mt-3 text-micro leading-5 text-[#4e5968]">{error.includes('아직 구성되지') ? '자연어 안내는 준비 중입니다. 지금은 카테고리와 검색으로 이야기를 찾아보세요.' : error}</p>}
        </form>
      </div>

      {result && (
        <div className="mt-3 rounded-[18px] bg-white p-5 sm:p-6">
          <p className="text-sm leading-6 text-[#191f28]">{result.answer}</p>
          <div className="mt-4 flex flex-wrap gap-2 pt-4">
            {result.sources.map((source) => (
              <button key={source.stid} type="button" onClick={() => onOpenSource(source)} className="max-w-full rounded-[8px] bg-[#f5f5f4] px-3 py-2 text-left transition-colors hover:bg-[#FFF0F6]">
                <span className="block truncate text-xs font-semibold text-[#191f28]">{source.title}</span>
                <span className="mt-0.5 block truncate text-micro text-[#4e5968]">{[source.locationName, source.formattedDuration].filter(Boolean).join(' · ')}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
