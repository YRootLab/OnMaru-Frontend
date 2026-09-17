'use client';

/**
 * 고른 장소에 곁들이는 실데이터 3종 — 한옥 도감 / 근처 오디 해설 미리듣기 / 근처 맛집.
 *
 * 전부 useJourneyStore.explorationBoard와 같은 요청에서 나온 실데이터다(TourAPI, 한국관광공사
 * 오디). BentoJourneyGrid(Gemini가 지어낸 옛 버전)를 대신한다.
 *
 * border·box-shadow 없이 여백과 얇은 구분선 하나로만 섹션을 나눈다. 도감은 읽는 콘텐츠라
 * 버튼을 두지 않는다(누르는 동작은 위 여정 카드가 책임진다). 움직임은 세 곳에만 둔다 —
 * 오디오 재생 버튼, 재생 진행선, 도감 이미지가 처음 나타날 때 한 번.
 */

import { useRef, useState } from 'react';
import styled from '@emotion/styled';
import { motion, useReducedMotion } from 'framer-motion';
import { Pause, Play, MapPin, Clock, CalendarDays } from 'lucide-react';
import { meok, palette, fontSize } from '@/design-system/tokens';
import { useJourneyStore } from '../store/useJourneyStore';

const Wrap = styled.section`
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  margin: 0 auto;
  padding: 8px 0 48px;
  display: flex;
  flex-direction: column;
  gap: 44px;

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
  }

  @media (max-width: 640px) {
    width: calc(100% - 24px);
  }
`;

const Block = styled.div`
  padding-top: 32px;
  border-top: 1px solid ${meok[200]};
`;

const BlockTitle = styled.h3`
  font-family: var(--font-hanok);
  font-size: ${fontSize.lg};
  font-weight: 500;
  color: ${meok[900]};
  margin: 0 0 20px;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

/* ── 공간 기록: 잡지식 좌우 배치, 첫 문장은 리드로 ── */

const DoganList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

const DoganEntry = styled.div<{ $reverse: boolean }>`
  display: flex;
  gap: 28px;
  flex-direction: ${({ $reverse }) => ($reverse ? 'row-reverse' : 'row')};

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const DoganImageCol = styled.div`
  width: 40%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const DoganHeroImage = styled.img`
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 6px;
  display: block;
`;

const DoganThumbRow = styled.div`
  display: flex;
  gap: 6px;
`;

const DoganThumb = styled.img`
  width: calc(33.33% - 4px);
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 4px;
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
  font-size: ${fontSize.lg};
  font-weight: 400;
  line-height: 1.5;
  color: ${meok[900]};
  margin: 0 0 10px;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const DoganRest = styled.p`
  font-size: ${fontSize.sm};
  line-height: 1.75;
  color: ${meok[600]};
  margin: 0 0 16px;

  [data-theme='dark'] & {
    color: ${meok[300]};
  }
`;

const DoganMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
`;

const DoganMetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: ${fontSize.xs};
  color: ${meok[500]};
`;

/** 첫 문장을 리드로 떼어내고 나머지를 본문으로 돌려준다. */
function splitLede(overview: string): [string, string] {
  const match = overview.match(/^[^.!?。]+[.!?。]/);
  if (!match) return [overview, ''];
  const lede = match[0].trim();
  const rest = overview.slice(match[0].length).trim();
  return [lede, rest];
}

/* ── 오디오 해설: 커스텀 재생 버튼 + 진행선 ── */

const AudioList = styled.div`
  display: flex;
  flex-direction: column;
`;

const AudioRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;

  & + & {
    border-top: 1px solid ${meok[200]};
  }
`;

const PlayButton = styled(motion.button)`
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  border: none;
  background: ${palette.jangmi[500]};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const AudioBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const AudioTitleRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
`;

const AudioTitle = styled.span`
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: ${meok[900]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const AudioMeta = styled.span`
  font-size: ${fontSize.xs};
  color: ${meok[500]};
  white-space: nowrap;
  flex-shrink: 0;
`;

const ProgressTrack = styled.div`
  height: 2px;
  background: ${meok[200]};
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: ${palette.jangmi[500]};
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
        whileTap={{ scale: 0.9 }}
        aria-label={isPlaying ? '일시정지' : '재생'}
      >
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />}
      </PlayButton>
      <AudioBody>
        <AudioTitleRow>
          <AudioTitle>{story.audioTitle || story.title}</AudioTitle>
          <AudioMeta>
            {story.formattedDuration}
            {story.distance ? ` · 직선 약 ${story.distance}` : ''}
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

/* ── 맛집 ── */

const FoodRow = styled.div`
  display: flex;
  gap: 18px;
  overflow-x: auto;
  padding-bottom: 4px;
  scroll-snap-type: x proximity;
`;

const FoodCard = styled.div`
  width: 196px;
  flex-shrink: 0;
  scroll-snap-align: start;
`;

const FoodImage = styled.div<{ $bg: string | null }>`
  width: 100%;
  height: 130px;
  border-radius: 8px;
  background: ${({ $bg }) => ($bg ? `url(${$bg}) center/cover` : meok[200])};
  margin-bottom: 10px;
`;

const FoodTitle = styled.p`
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: ${meok[900]};
  margin: 0 0 4px;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }
`;

const FoodAddr = styled.p`
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: ${fontSize.micro};
  color: ${meok[500]};
  margin: 0 0 3px;
  line-height: 1.4;

  svg {
    flex-shrink: 0;
    margin-top: 1px;
  }
`;

const FoodDistance = styled.p`
  font-size: ${fontSize.micro};
  color: ${meok[400]};
  margin: 0;
`;

/** "서울특별시 종로구 필운대로16길 5-5" → "필운대로16길 5-5" (행정구역 접두어는 이미 지역명으로 알고 있으므로 생략) */
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
          <BlockTitle>공간 기록</BlockTitle>
          <DoganList>
            {hanokDogan.map((entry, idx) => {
              const [lede, rest] = entry.overview ? splitLede(entry.overview) : ['', ''];
              return (
                <DoganEntry key={entry.placeId} $reverse={idx % 2 === 1}>
                  {entry.images.length > 0 && (
                    <DoganImageCol>
                      <motion.div
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                        whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      >
                        <DoganHeroImage src={entry.images[0]} alt="" />
                      </motion.div>
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
                            {entry.usetime}
                          </DoganMetaItem>
                        )}
                        {entry.restdate && (
                          <DoganMetaItem>
                            <CalendarDays size={13} strokeWidth={2} />
                            {entry.restdate}
                          </DoganMetaItem>
                        )}
                      </DoganMetaRow>
                    )}
                  </DoganTextCol>
                </DoganEntry>
              );
            })}
          </DoganList>
        </Block>
      )}

      {nearbyAudio.length > 0 && (
        <Block>
          <BlockTitle>오디오 해설 미리듣기</BlockTitle>
          <AudioList>
            {nearbyAudio.map((story) => (
              <AudioItem key={story.stid} story={story} isActive={false} onPlay={handlePlay} />
            ))}
          </AudioList>
        </Block>
      )}

      {nearbyFood.length > 0 && (
        <Block>
          <BlockTitle>근처 맛집</BlockTitle>
          <FoodRow>
            {nearbyFood.map((food) => (
              <FoodCard key={food.id}>
                <FoodImage $bg={food.image} />
                <FoodTitle>{food.title}</FoodTitle>
                {food.addr && (
                  <FoodAddr>
                    <MapPin size={11} strokeWidth={2} />
                    <span>{shortStreetAddr(food.addr)}</span>
                  </FoodAddr>
                )}
                <FoodDistance>직선 약 {food.distanceMeters}m</FoodDistance>
              </FoodCard>
            ))}
          </FoodRow>
        </Block>
      )}
    </Wrap>
  );
}
