'use client';

/**
 * 고른 장소에 곁들이는 실데이터 3종 — 한옥 도감 / 현장 오디오 해설 / 주변 맛집.
 *
 * useJourneyStore.explorationBoard와 같은 요청에서 나온 실데이터(TourAPI, 한국관광공사 오디).
 * 온마루 시그니처 주홍 테마와 8대 UX 라이팅 원칙(명확한 힌트, 군더더기 없는 문장, 따뜻한 공감 톤)을 적용한다.
 */

import { useRef, useState } from 'react';
import styled from '@emotion/styled';
import { motion, useReducedMotion } from 'framer-motion';
import { Pause, Play, MapPin, Clock, CalendarDays, Headphones } from 'lucide-react';
import { meok, palette, fontSize, ringShadow } from '@/design-system/tokens';
import { useJourneyStore } from '../store/useJourneyStore';

const Wrap = styled.section`
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  margin: 0 auto;
  padding: 8px 0 56px;
  display: flex;
  flex-direction: column;
  gap: 48px;

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
  }

  @media (max-width: 640px) {
    width: calc(100% - 24px);
    padding: 4px 0 40px;
    gap: 32px;
  }
`;

const Block = styled.div`
  padding-top: 36px;
  border-top: 1px solid #e2e8f0;

  [data-theme='dark'] & {
    border-top-color: #2e2a25;
  }

  @media (max-width: 640px) {
    padding-top: 24px;
  }
`;

const BlockHeader = styled.div`
  margin-bottom: 24px;

  @media (max-width: 640px) {
    margin-bottom: 16px;
  }
`;

const BlockTitle = styled.h3`
  font-family: var(--font-hanok);
  font-size: clamp(18px, 2.2vw, 22px);
  font-weight: 600;
  color: #0f172a;
  letter-spacing: -0.025em;
  margin: 0 0 6px;

  [data-theme='dark'] & {
    color: #f8fafc;
  }

  @media (max-width: 640px) {
    font-size: 18px;
    margin-bottom: 4px;
  }
`;

const BlockSubtitle = styled.p`
  font-size: ${fontSize.sm};
  color: #475569;
  line-height: 1.55;
  margin: 0;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: #94a3b8;
  }

  @media (max-width: 640px) {
    font-size: 13px;
    line-height: 1.5;
  }
`;

/* ── 1. 공간 이야기 (도감) ── */

const DoganList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;

  @media (max-width: 640px) {
    gap: 28px;
  }
`;

const DoganEntry = styled.div<{ $reverse: boolean }>`
  display: flex;
  gap: 32px;
  flex-direction: ${({ $reverse }) => ($reverse ? 'row-reverse' : 'row')};

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const DoganImageCol = styled.div`
  width: 42%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 768px) {
    width: 100%;
    gap: 6px;
  }
`;

const DoganHeroImage = styled.img`
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 12px;
  display: block;
  box-shadow: ${ringShadow.light.card};

  [data-theme='dark'] & {
    box-shadow: ${ringShadow.dark.card};
  }

  @media (max-width: 640px) {
    border-radius: 10px;
  }
`;

const DoganThumbRow = styled.div`
  display: flex;
  gap: 8px;

  @media (max-width: 640px) {
    gap: 6px;
  }
`;

const DoganThumb = styled.img`
  width: calc(33.33% - 6px);
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: ${ringShadow.light.button};
  transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;

  [data-theme='dark'] & {
    box-shadow: ${ringShadow.dark.button};
  }

  &:hover {
    transform: scale(1.03);
    opacity: 0.95;
    box-shadow: ${ringShadow.light.buttonHoverGlow};

    [data-theme='dark'] & {
      box-shadow: ${ringShadow.dark.buttonHoverGlow};
    }
  }

  @media (max-width: 640px) {
    border-radius: 6px;
  }
`;

const DoganTextCol = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const DoganLede = styled.p`
  font-family: var(--font-hanok);
  font-size: clamp(16px, 1.8vw, 20px);
  font-weight: 600;
  line-height: 1.55;
  color: #0f172a;
  margin: 0 0 10px;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: #f8fafc;
  }

  @media (max-width: 640px) {
    font-size: 16px;
    margin-bottom: 8px;
  }
`;

const DoganRest = styled.p`
  font-size: ${fontSize.sm};
  line-height: 1.8;
  color: #334155;
  margin: 0 0 16px;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: #cbd5e1;
  }

  @media (max-width: 640px) {
    font-size: 13px;
    line-height: 1.7;
    margin-bottom: 12px;
  }
`;

const DoganMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 14px;
  border-top: 1px dashed #e2e8f0;

  [data-theme='dark'] & {
    border-top-color: #332f29;
  }

  @media (max-width: 640px) {
    gap: 12px;
    padding-top: 10px;
  }
`;

const DoganMetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: ${fontSize.xs};
  color: #64748b;
  font-weight: 500;

  svg {
    color: ${palette.juhong[500]};
  }

  [data-theme='dark'] & {
    color: #94a3b8;
  }

  @media (max-width: 640px) {
    font-size: 12px;
    gap: 4px;
  }
`;

function splitLede(overview: string): [string, string] {
  const match = overview.match(/^[^.!?。]+[.!?。]/);
  if (!match) return [overview, ''];
  const lede = match[0].trim();
  const rest = overview.slice(match[0].length).trim();
  return [lede, rest];
}

/* ── 2. 오디오 해설: 온마루 주홍 재생 버튼 + 진행 바 ── */

const AudioList = styled.div`
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 16px;
  padding: 8px 20px;
  box-shadow: ${ringShadow.light.card};

  [data-theme='dark'] & {
    background: #24211d;
    box-shadow: ${ringShadow.dark.card};
  }

  @media (max-width: 640px) {
    padding: 4px 14px;
    border-radius: 14px;
  }
`;

const AudioRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;

  & + & {
    border-top: 1px solid #f1f5f9;

    [data-theme='dark'] & {
      border-top-color: #2e2a25;
    }
  }

  @media (max-width: 640px) {
    gap: 12px;
    padding: 13px 0;
  }
`;

const PlayButton = styled(motion.button)`
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 50%;
  border: none;
  background: ${palette.juhong[500]};
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(255, 85, 0, 0.28);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: ${palette.juhong[600]};
    transform: scale(1.06);
    box-shadow: 0 5px 14px rgba(255, 85, 0, 0.38);
  }

  &:active {
    transform: scale(0.94);
  }

  [data-theme='dark'] & {
    background: ${palette.juhong[500]};
    box-shadow: 0 3px 12px rgba(255, 110, 30, 0.32);

    &:hover {
      background: ${palette.juhong[400]};
    }
  }

  @media (max-width: 640px) {
    width: 38px;
    height: 38px;
  }
`;

const AudioBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const AudioTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;

  @media (max-width: 640px) {
    gap: 8px;
    margin-bottom: 6px;
  }
`;

const AudioTitle = styled.span`
  font-size: ${fontSize.sm};
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  [data-theme='dark'] & {
    color: #f8fafc;
  }

  @media (max-width: 640px) {
    font-size: 13.5px;
  }
`;

const AudioMeta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: ${fontSize.xs};
  color: #64748b;
  white-space: nowrap;
  flex-shrink: 0;

  [data-theme='dark'] & {
    color: #94a3b8;
  }

  @media (max-width: 640px) {
    font-size: 11.5px;
  }
`;

const ProgressTrack = styled.div`
  height: 4px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;

  [data-theme='dark'] & {
    background: #332f29;
  }
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: ${palette.juhong[500]};
  transform-origin: left;
`;

function AudioItem({
  story,
  isActive,
  onPlay,
}: {
  story: { stid: string; title: string; audioTitle: string; audioUrl: string; distance?: string; formattedDuration: string };
  isActive: boolean;
  onPlay: (el: HTMLAudioElement) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      onPlay(el);
      el.play();
      setIsPlaying(true);
    }
  }

  return (
    <AudioRow>
      <PlayButton
        type="button"
        onClick={toggle}
        whileTap={{ scale: 0.92 }}
        aria-label={isPlaying ? '오디오 일시정지' : '오디오 해설 듣기'}
        title={isPlaying ? '일시정지' : '오디오 해설 듣기'}
      >
        {isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" style={{ marginLeft: 2 }} />}
      </PlayButton>
      <AudioBody>
        <AudioTitleRow>
          <AudioTitle>{story.audioTitle || story.title}</AudioTitle>
          <AudioMeta>
            <Headphones size={12} />
            <span>{story.formattedDuration}</span>
            {story.distance ? ` · 약 ${story.distance}` : ''}
          </AudioMeta>
        </AudioTitleRow>
        <ProgressTrack>
          <ProgressFill style={{ scaleX: progress }} />
        </ProgressTrack>
        <audio
          ref={audioRef}
          src={story.audioUrl}
          preload="none"
          hidden
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            if (el.duration) setProgress(el.currentTime / el.duration);
          }}
          onEnded={() => {
            setIsPlaying(false);
            setProgress(0);
          }}
        />
      </AudioBody>
    </AudioRow>
  );
}

/* ── 3. 주변 맛집 ── */

const FoodRow = styled.div`
  display: flex;
  gap: 18px;
  overflow-x: auto;
  padding: 6px 4px 12px;
  margin: -6px -4px -12px;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  @media (max-width: 640px) {
    gap: 14px;
    padding-bottom: 8px;
  }
`;

const FoodCard = styled.div`
  width: 200px;
  flex-shrink: 0;
  scroll-snap-align: start;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  @media (max-width: 640px) {
    width: 175px;
  }
`;

const FoodImage = styled.div<{ $bg: string | null }>`
  width: 100%;
  height: 130px;
  border-radius: 10px;
  background: ${({ $bg }) => ($bg ? `url(${$bg}) center/cover` : '#f1f5f9')};
  margin-bottom: 10px;
  box-shadow: ${ringShadow.light.card};

  [data-theme='dark'] & {
    background: ${({ $bg }) => ($bg ? `url(${$bg}) center/cover` : '#27272a')};
    box-shadow: ${ringShadow.dark.card};
  }

  @media (max-width: 640px) {
    height: 115px;
    border-radius: 8px;
    margin-bottom: 8px;
  }
`;

const FoodTitle = styled.p`
  font-size: ${fontSize.sm};
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  [data-theme='dark'] & {
    color: #f8fafc;
  }

  @media (max-width: 640px) {
    font-size: 13.5px;
  }
`;

const FoodAddr = styled.p`
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: ${fontSize.xs};
  color: #64748b;
  margin: 0 0 4px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  svg {
    color: ${palette.juhong[500]};
    flex-shrink: 0;
    margin-top: 2px;
  }

  [data-theme='dark'] & {
    color: #94a3b8;
  }
`;

const FoodDistance = styled.p`
  font-size: ${fontSize.micro};
  color: #94a3b8;
  margin: 0;
`;

function shortStreetAddr(addr: string): string {
  const parts = addr.trim().split(/\s+/);
  return parts.length > 2 ? parts.slice(2).join(' ') : addr;
}

export default function JourneyEnrichmentSections() {
  const hanokDogan = useJourneyStore((s) => s.hanokDogan);
  const nearbyAudio = useJourneyStore((s) => s.nearbyAudio);
  const nearbyFood = useJourneyStore((s) => s.nearbyFood);
  const reduceMotion = useReducedMotion();

  const playingRef = useRef<HTMLAudioElement | null>(null);
  function handlePlay(el: HTMLAudioElement) {
    if (playingRef.current && playingRef.current !== el) playingRef.current.pause();
    playingRef.current = el;
  }

  if (hanokDogan.length === 0 && nearbyAudio.length === 0 && nearbyFood.length === 0) return null;

  return (
    <Wrap>
      {hanokDogan.length > 0 && (
        <Block>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18, filter: 'blur(8px)' }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <BlockHeader>
              <BlockTitle>공간에 깃든 이야기</BlockTitle>
              <BlockSubtitle>공간의 내력과 고유한 정취를 사진과 함께 천천히 살펴보세요.</BlockSubtitle>
            </BlockHeader>
          </motion.div>
          <DoganList>
            {hanokDogan.map((entry, idx) => {
              const [lede, rest] = entry.overview ? splitLede(entry.overview) : ['', ''];
              return (
                <motion.div
                  key={entry.placeId}
                  initial={reduceMotion ? false : { opacity: 0, y: 28, filter: 'blur(12px)' }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.65, delay: reduceMotion ? 0 : 0.05, ease: [0.16, 1, 0.3, 1] }}
                >
                  <DoganEntry $reverse={idx % 2 === 1}>
                    {entry.images.length > 0 && (
                      <DoganImageCol>
                        <DoganHeroImage src={entry.images[0]} alt="" />
                        {entry.images.length > 1 && (
                          <DoganThumbRow>
                            {entry.images.slice(1, 4).map((src) => (
                              <DoganThumb key={src} src={src} alt="" />
                            ))}
                          </DoganThumbRow>
                        )}
                      </DoganImageCol>
                    )}
                    <DoganTextCol>
                      {lede && <DoganLede>{lede}</DoganLede>}
                      {rest && <DoganRest>{rest}</DoganRest>}
                      {(entry.usetime || entry.restdate) && (
                        <DoganMetaRow>
                          {entry.usetime && (
                            <DoganMetaItem>
                              <Clock size={13} strokeWidth={2} />
                              <span>이용시간 {entry.usetime}</span>
                            </DoganMetaItem>
                          )}
                          {entry.restdate && (
                            <DoganMetaItem>
                              <CalendarDays size={13} strokeWidth={2} />
                              <span>휴무일 {entry.restdate}</span>
                            </DoganMetaItem>
                          )}
                        </DoganMetaRow>
                      )}
                    </DoganTextCol>
                  </DoganEntry>
                </motion.div>
              );
            })}
          </DoganList>
        </Block>
      )}

      {nearbyAudio.length > 0 && (
        <Block>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18, filter: 'blur(8px)' }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <BlockHeader>
              <BlockTitle>현장 오디오 해설</BlockTitle>
              <BlockSubtitle>발걸음 옮기며 귀로 감상할 수 있는 생생한 해설이에요.</BlockSubtitle>
            </BlockHeader>
          </motion.div>
          <AudioList>
            {nearbyAudio.map((story, idx) => (
              <motion.div
                key={story.stid}
                initial={reduceMotion ? false : { opacity: 0, y: 16, filter: 'blur(8px)' }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: reduceMotion ? 0 : idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <AudioItem story={story} isActive={false} onPlay={handlePlay} />
              </motion.div>
            ))}
          </AudioList>
        </Block>
      )}

      {nearbyFood.length > 0 && (
        <Block>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18, filter: 'blur(8px)' }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <BlockHeader>
              <BlockTitle>함께 들르기 좋은 맛집</BlockTitle>
              <BlockSubtitle>코스 주변에서 편안하게 식사와 차를 즐길 수 있는 곳이에요.</BlockSubtitle>
            </BlockHeader>
          </motion.div>
          <FoodRow>
            {nearbyFood.map((food, idx) => (
              <motion.div
                key={food.id}
                initial={reduceMotion ? false : { opacity: 0, y: 22, filter: 'blur(10px)' }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.55, delay: reduceMotion ? 0 : idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
              >
                <FoodCard>
                  <FoodImage $bg={food.image} />
                  <FoodTitle>{food.title}</FoodTitle>
                  {food.addr && (
                    <FoodAddr>
                      <MapPin size={11} strokeWidth={2} />
                      <span>{shortStreetAddr(food.addr)}</span>
                    </FoodAddr>
                  )}
                  <FoodDistance>약 {food.distanceMeters}m</FoodDistance>
                </FoodCard>
              </motion.div>
            ))}
          </FoodRow>
        </Block>
      )}
    </Wrap>
  );
}
