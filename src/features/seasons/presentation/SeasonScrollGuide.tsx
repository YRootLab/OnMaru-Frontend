'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import { getSeasonParticles } from '@/features/hanok-year/presentation/seasonParticles';
import type { SeasonPlace, SeasonScene } from '../application/buildSeasonsGuide';
import type { SeasonId } from '../domain/seasons';
import { canonicalPlaceId } from '../domain/placeId';
import styles from './SeasonScrollGuide.module.css';

const PARTICLE_MONTH: Record<SeasonId, number> = { spring: 4, summer: 7, autumn: 10, winter: 1 };
const SEASON_ONI: Record<SeasonId, { src: string; alt: string }> = {
  autumn: { src: '/images/character/Oni_total.png', alt: '가을의 온이' },
  winter: { src: '/images/character/Oni_tea.png', alt: '겨울의 온이' },
  spring: { src: '/images/character/Oni_sogo.png', alt: '봄의 온이' },
  summer: { src: '/images/character/Oni_today.png', alt: '여름의 온이' },
};
const NEARBY_HINT_STORAGE_KEY = 'onmaru-season-nearby-hint';
const SHORT_REGIONS: Record<string, string> = {
  서울특별시: '서울', 부산광역시: '부산', 대구광역시: '대구', 인천광역시: '인천',
  광주광역시: '광주', 대전광역시: '대전', 울산광역시: '울산', 세종특별자치시: '세종',
  경기도: '경기', 강원도: '강원', 강원특별자치도: '강원', 충청북도: '충북', 충청남도: '충남',
  전라북도: '전북', 전북특별자치도: '전북', 전라남도: '전남', 경상북도: '경북',
  경상남도: '경남', 제주특별자치도: '제주',
};

function shortLocation(place: SeasonPlace): string {
  const parts = place.address.trim().split(/\s+/);
  const region = SHORT_REGIONS[place.region] ?? (place.region === '주변 한옥' ? SHORT_REGIONS[parts[0]] ?? parts[0] : place.region);
  const district = parts.slice(1).find((part) => /(?:시|군|구)$/.test(part));
  return district ? `${region} · ${district}` : region;
}

function mapHref(place: SeasonPlace): string {
  if (place.lat === null || place.lng === null) return `/hanok?q=${encodeURIComponent(place.name)}#hanok-grid`;
  const params = new URLSearchParams({
    mode: 'info', id: canonicalPlaceId(place.id), lat: String(place.lat), lng: String(place.lng),
    title: place.name, addr: place.address, category: 'spot', from: 'journal',
  });
  if (place.image) params.set('image', place.image);
  return `/map?${params.toString()}`;
}

function PlaceCard({ place, focus, onPreview }: { place: SeasonPlace; focus?: string; onPreview?: (place: SeasonPlace | null) => void }) {
  return <div className={`${styles.placeCard} ${focus ? styles.featuredCard : styles.companionCard}`}
    onClick={() => onPreview?.(focus ? null : place)}>
    <div className={styles.cardTop}><h3>{place.name}</h3></div>
    {focus && <p className={styles.focus}>{focus}</p>}
    <p className={styles.cardMeta}>{place.region} · {place.address}</p>
    <div className={styles.cardFoot}><Link href={mapHref(place)}>지도에서 보기 <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} strokeWidth={2} aria-hidden="true" /></Link><details className={styles.sourceDetails}><summary>자료 출처</summary><div>장소 데이터: {place.source === 'live' ? '온마루 장소 API' : `TourAPI 스냅샷 ${place.snapshotAt.slice(0, 10)}`}</div><a href={place.image} target="_blank" rel="noopener noreferrer">{place.imageSource === 'live' ? '장소 API' : 'TourAPI'} 사진 원본 ↗</a><p>사진의 촬영 계절과 현재 풍경은 다를 수 있습니다.</p></details></div>
  </div>;
}

function NearbyPlaces({ scene, showHint, onDismissHint, onPreview }: { scene: SeasonScene; showHint: boolean; onDismissHint: () => void; onPreview: (place: SeasonPlace | null) => void }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [highlighted, setHighlighted] = useState<SeasonPlace | null>(null);
  const pages = [scene.nearbyPlaces.slice(0, 4), scene.nearbyPlaces.slice(4, 8)].filter((items) => items.length > 0);
  const panelId = `nearby-places-${scene.id}`;
  const showPreview = (place: SeasonPlace | null) => { setHighlighted(place); onPreview(place); };
  const close = () => { setOpen(false); setPage(0); showPreview(null); };
  const changePage = (next: number) => { setPage(next); showPreview(null); };

  return <div className={styles.nearbyPlaces} data-open={open}>
    <button type="button" className={styles.nearbyToggle} aria-expanded={open} aria-controls={panelId} onClick={() => { setOpen((current) => !current); setPage(0); showPreview(null); }}>
      주변 한옥 {scene.nearbyPlaces.length}곳 더 <span aria-hidden="true">↗</span>
    </button>
    <div className={styles.nearbyBody} id={panelId} aria-hidden={!open} inert={!open}>
      <div className={styles.nearbyBodyInner}>
        <div className={styles.nearbyPanelHead}><div className={styles.nearbyPanelTitle}><h3>주변 한옥 {scene.nearbyPlaces.length}곳</h3></div><div className={styles.nearbyActions}><span aria-live="polite">{String(page + 1).padStart(2, '0')} / {String(pages.length).padStart(2, '0')}</span><button type="button" onClick={() => changePage(page - 1)} disabled={page === 0} aria-label="이전 한옥 4곳"><HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2} aria-hidden="true" /></button><button type="button" onClick={() => changePage(page + 1)} disabled={page === pages.length - 1} aria-label="다음 한옥 4곳"><HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={2} aria-hidden="true" /></button><button type="button" onClick={close} aria-label="주변 한옥 목록 닫기">닫기 <span aria-hidden="true">×</span></button></div></div>
        {showHint && <div className={styles.nearbyHint}><p>카드를 눌러 사진 보기</p><button type="button" onClick={onDismissHint} aria-label="안내 문구 닫기">닫기</button></div>}
        <div className={styles.nearbyViewport}><div className={styles.nearbyTrack} style={{ transform: `translateX(-${page * 100}%)` }}>{pages.map((places, pageIndex) => <ol key={pageIndex} aria-hidden={page !== pageIndex} inert={page !== pageIndex}>{places.map((place, index) => <li key={place.id} data-active={highlighted?.id === place.id} style={{ '--nearby-index': index } as CSSProperties}
          onClick={(e) => {
            // 지도에서 보기 링크 클릭이 아니면 배경 사진 미리보기 선택
            if ((e.target as HTMLElement).closest('a')) return;
            showPreview(place);
          }}>
          <button type="button" className={styles.nearbyPreviewButton} aria-label={`${place.name} 소개 미리보기`}><strong>{place.name}</strong></button>
          <small className={styles.nearbyArea}>{shortLocation(place)}</small>
          <p className={styles.nearbyDescription}>{place.description}</p>
          <Link href={mapHref(place)}>지도에서 보기 <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} strokeWidth={2} aria-hidden="true" /></Link>
        </li>)}</ol>)}</div></div>
      </div>
    </div>
  </div>;
}

export default function SeasonScrollGuide({ scenes }: { scenes: SeasonScene[] }) {
  const [activeId, setActiveId] = useState<SeasonId>(scenes[0].id);
  const [preview, setPreview] = useState<{ sceneId: SeasonId; place: SeasonPlace } | null>(null);
  const [previousPreview, setPreviousPreview] = useState<{ sceneId: SeasonId; place: SeasonPlace } | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [showNearbyHint, setShowNearbyHint] = useState(false);
  const entryTime = useRef<number | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const active = scenes.find((scene) => scene.id === activeId) ?? scenes[0];
  const particles = useMemo(() => getSeasonParticles(PARTICLE_MONTH[active.id], active.id === 'summer' ? 24 : 34), [active.id]);
  const showScenePreview = (sceneId: SeasonId, place: SeasonPlace | null) => {
    if (place) {
      if (previewVisible && preview && preview.place.id !== place.id) setPreviousPreview(preview);
      setPreview({ sceneId, place });
      setPreviewVisible(true);
    } else {
      setPreviousPreview(null);
      setPreviewVisible(false);
    }
  };

  // 저장소를 읽을 수 없으면 힌트를 보여 줍니다. 마운트 후에 읽어 서버 렌더링과 어긋나지 않게 합니다.
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(NEARBY_HINT_STORAGE_KEY) === 'dismissed';
    } catch {
      dismissed = false;
    }
    setShowNearbyHint(!dismissed);
  }, []);

  const dismissNearbyHint = () => {
    setShowNearbyHint(false);
    try {
      localStorage.setItem(NEARBY_HINT_STORAGE_KEY, 'dismissed');
    } catch {
      // 저장에 실패해도 이번 방문에서는 힌트가 사라집니다.
    }
  };

  useEffect(() => {
    let shouldAutoScroll = false;
    try {
      const stored = sessionStorage.getItem('onmaru-season-entry');
      if (stored) {
        entryTime.current = Number(stored);
        sessionStorage.removeItem('onmaru-season-entry');
        if (Date.now() - entryTime.current < 60_000) {
          shouldAutoScroll = true;
        }
      }
    } catch {
      entryTime.current = 0;
    }

    if (shouldAutoScroll) {
      setShowScrollHint(true);
      const hintTimer = window.setTimeout(() => setShowScrollHint(false), 3000);

      // 자연스럽게 첫 번째 계절 섹션으로 자동 스크롤
      const scrollTimer = window.setTimeout(() => {
        const target = document.getElementById(`season-${scenes[0].id}`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }, 350);

      return () => {
        window.clearTimeout(hintTimer);
        window.clearTimeout(scrollTimer);
      };
    }
  }, [scenes]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-season-step]'));
    const layers = Array.from(root.querySelectorAll<HTMLElement>('[data-season-layer]'));
    let frame = 0;
    const update = () => {
      frame = 0;
      const centers = steps.map((step) => {
        const rect = step.getBoundingClientRect();
        return rect.top + rect.height / 2;
      });
      const viewportCenter = window.innerHeight * .5;
      let from = 0;
      while (from < centers.length - 2 && viewportCenter > centers[from + 1]) from++;
      const to = Math.min(from + 1, centers.length - 1);
      const range = centers[to] - centers[from];
      const progress = range > 0 ? Math.max(0, Math.min(1, (viewportCenter - centers[from]) / range)) : 0;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const visible = progress >= .5 ? to : from;
      layers.forEach((layer, index) => {
        layer.style.opacity = String(reducedMotion ? Number(index === visible) : index === from ? 1 - progress : index === to ? progress : 0);
      });
      setActiveId((previous) => previous === scenes[visible].id ? previous : scenes[visible].id);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => { if (frame) cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [scenes]);

  return <section id="season-story" ref={rootRef} className={`${styles.story} ${styles[active.id]}`} data-entering={showScrollHint} aria-labelledby="season-title">
    <div className={styles.stage} aria-hidden="true">
      {scenes.map((scene, index) => <div key={scene.id} data-season-layer={scene.id} className={`${styles.sceneLayer} ${styles[scene.id]}`} style={{ opacity: index === 0 ? 1 : 0 }}>
        {scene.places[0]?.image && (index === 0
          ? <span className={`${styles.scenePhoto} ${styles.heroPhoto}`}><Image src={scene.places[0].image} alt="" fill unoptimized priority sizes="(max-width: 900px) 100vw, 63vw" className={styles.heroImage} /></span>
          : <Image src={scene.places[0].image} alt="" fill unoptimized loading="lazy" sizes="(max-width: 900px) 100vw, 63vw" />)}
        <span className={styles.shade} />
        <span className={styles.seasonMark}>{scene.name}</span>
      </div>)}
      {previousPreview?.place.image && previewVisible && previousPreview.sceneId === activeId && <span key={`previous-${previousPreview.place.id}-${preview?.place.id}`} className={`${styles.hoverPhoto} ${styles.hoverPhotoOutgoing}`} aria-hidden="true"><Image src={previousPreview.place.image} alt="" fill unoptimized sizes="(max-width: 1100px) 100vw, 63vw" /></span>}
      {preview?.place.image && <span key={preview.place.id} className={styles.hoverPhoto} data-visible={previewVisible && preview.sceneId === activeId} data-preview-id={preview.place.id}><Image src={preview.place.image} alt="" fill unoptimized sizes="(max-width: 1100px) 100vw, 63vw" onError={() => setPreviewVisible(false)} /></span>}
      <div className={styles.atmosphere}>{particles.map((particle, index) => <i key={index} style={{ '--left': particle.left, '--top': particle.top, '--size': particle.size, '--duration': particle.duration, '--delay': particle.delay, '--drift': particle.drift, '--opacity': particle.opacity } as CSSProperties} />)}</div>
    </div>

    <div className={styles.intro}>
      <div className={styles.fourSeasonsOniRow} aria-hidden="true">
        {(['spring', 'summer', 'autumn', 'winter'] as const).map((seasonKey) => {
          const oni = SEASON_ONI[seasonKey];
          return (
            <div key={seasonKey} className={styles.seasonOniItem}>
              <Image
                src={oni.src}
                alt={oni.alt}
                width={80}
                height={80}
                className={styles.fourSeasonsOniImage}
                priority
              />
              <span className={styles.seasonOniLabel}>
                {seasonKey === 'spring' ? '봄' : seasonKey === 'summer' ? '여름' : seasonKey === 'autumn' ? '가을' : '겨울'}
              </span>
            </div>
          );
        })}
      </div>
      <h1 id="season-title" className={styles.heroTitle}>한옥의 사계.</h1>
      <p className={styles.introLead}>집은 같은 자리에, 계절은 다시 찾아옵니다.</p>
      {scenes[1] && <p className={styles.seasonNotice}>지금은 {scenes[0].name}, 다음은 {scenes[1].name}이에요. 계절이 바뀌면 다시 걸어 보세요.</p>}
      <p>지금의 {scenes[0].name}에서 시작해 네 계절의 한옥을 걸어보세요. 장소는 실제 관광정보를 확인하고, 이미지와 계절의 관계는 구분해 전합니다.</p>
      <a
        href={`#season-${scenes[0].id}`}
        onClick={(e) => {
          e.preventDefault();
          const target = document.getElementById(`season-${scenes[0].id}`);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      >
        이번 계절의 한옥 만나기 <HugeiconsIcon icon={ArrowDown01Icon} size={18} strokeWidth={2} aria-hidden="true" />
      </a>
    </div>

    <nav className={styles.seasonNav} data-active-season={activeId} aria-label="사계절 장면 바로가기">
      {scenes.map((scene) => {
        const isSelected = activeId === scene.id;
        return (
          <a
            key={scene.id}
            href={`#season-${scene.id}`}
            aria-current={isSelected ? 'location' : undefined}
            className={styles.seasonNavItem}
            data-season={scene.id}
            onClick={(e) => {
              e.preventDefault();
              const target = document.getElementById(`season-${scene.id}`);
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            {isSelected && (
              <span
                className={styles.seasonNavIndicator}
                data-season={scene.id}
              />
            )}
            <span className={styles.seasonNavLabel}>{scene.name}</span>
          </a>
        );
      })}
    </nav>
    {showScrollHint && <p className={styles.scrollHint} role="status">스크롤하여 다음 한옥을 만나보세요 <HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={2} aria-hidden="true" /></p>}

    <div className={styles.steps}>{scenes.map((scene) => {
      const oni = SEASON_ONI[scene.id] ?? SEASON_ONI.autumn;
      return (
        <article id={`season-${scene.id}`} data-season-step={scene.id} key={scene.id} className={styles.step}>
          <div className={styles.stepHead}>
            <div className={styles.titleWithOni}>
              <div className={styles.stepOniFigure} aria-hidden="true">
                <Image
                  src={oni.src}
                  alt={oni.alt}
                  width={88}
                  height={88}
                  className={styles.stepOniImage}
                />
              </div>
              <h2>{scene.title}</h2>
            </div>
            <span className={styles.kicker}>{scene.name}의 한옥</span>
            <p className={styles.thought}>{scene.thought}</p>
            <p className={styles.detail}>{scene.detail}</p>
          </div>
          <div className={styles.placeList}>{scene.places.map((place, placeIndex) => <PlaceCard key={place.id} place={place} focus={placeIndex === 0 ? scene.focus : undefined} onPreview={(selected) => showScenePreview(scene.id, selected)} />)}</div>
          {scene.nearbyPlaces.length > 0 && <NearbyPlaces scene={scene} showHint={showNearbyHint} onDismissHint={dismissNearbyHint} onPreview={(place) => showScenePreview(scene.id, place)} />}
          <p className={styles.photoNote}>대표 사진은 첫 장소의 자료입니다. 촬영 계절과 방문 가능 여부는 현장 공식 안내를 확인해 주세요.</p>
        </article>
      );
    })}</div>
    <div className={styles.end}>
      <h2>다음 계절에도,<br />같은 집을 다시.</h2>
      <p>마음에 머문 한옥을 저장하고 나만의 여정을 떠나보세요. 시간과 계절이 빚어낸 고즈넉한 온기가 언제나 당신의 걸음을 기다립니다.</p>
      <Link href="/hanok">한옥마루에서 더 알아보기 <HugeiconsIcon icon={ArrowUpRight01Icon} size={18} strokeWidth={2} aria-hidden="true" /></Link>
    </div>
  </section>;
}
