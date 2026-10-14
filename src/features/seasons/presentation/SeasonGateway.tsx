'use client';

import { useRouter } from 'next/navigation';
import { type CSSProperties, type MouseEvent, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { getSeasonParticles } from '@/features/hanok-year/presentation/seasonParticles';
import type { SeasonId } from '../domain/seasons';
import styles from './SeasonGateway.module.css';

const PARTICLE_MONTH: Record<SeasonId, number> = { spring: 4, summer: 7, autumn: 10, winter: 1 };

export interface SeasonGatewayData {
  id: SeasonId;
  name: string;
  image: string;
}

const SEASON_ONI: Record<SeasonId, { src: string; alt: string }> = {
  spring: { src: '/images/character/Oni_sogo.png', alt: '봄의 온이' },
  summer: { src: '/images/character/Oni_today.png', alt: '여름의 온이' },
  autumn: { src: '/images/character/Oni_total.png', alt: '가을의 온이' },
  winter: { src: '/images/character/Oni_tea.png', alt: '겨울의 온이' },
};

export default function SeasonGateway({ season }: { season: SeasonGatewayData }) {
  const router = useRouter();

  useEffect(() => {
    router.prefetch('/seasons');
  }, [router]);

  const particles = useMemo(
    () => getSeasonParticles(PARTICLE_MONTH[season.id], season.id === 'summer' ? 24 : 34),
    [season.id],
  );

  const handleNavigate = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();

    try {
      sessionStorage.setItem('onmaru-season-entry', String(Date.now()));
    } catch {
      // ignore storage quota / sandbox restrictions
    }

    router.push('/seasons');
  };

  return (
    <section id="hanok-seasons" className={styles.gateway} data-season={season.id} aria-labelledby="hanok-seasons-title">
      <div className={styles.atmosphere} aria-hidden="true">
        {particles.map((particle, index) => (
          <i key={index} style={{ '--left': particle.left, '--top': particle.top, '--size': particle.size, '--duration': particle.duration, '--delay': particle.delay, '--drift': particle.drift, '--opacity': particle.opacity } as CSSProperties} />
        ))}
      </div>
      <div className={styles.copy}>
        <div className={styles.fourSeasonsOniRow} aria-hidden="true">
          {(['spring', 'summer', 'autumn', 'winter'] as const).map((seasonKey) => {
            const oni = SEASON_ONI[seasonKey];
            const isCurrent = seasonKey === season.id;
            return (
              <div key={seasonKey} className={styles.seasonOniItem} data-current={isCurrent}>
                <Image
                  src={oni.src}
                  alt={oni.alt}
                  width={64}
                  height={64}
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
        <h2 id="hanok-seasons-title" className={styles.heroTitle}>한옥의 사계.</h2>
        <p className={styles.lead}>집은 같은 자리에, 계절은 다시 찾아옵니다.</p>
        <p className={styles.description}>지금의 {season.name}에서 시작해 네 계절의 한옥을 걸어보세요.</p>
        <Link
          href="/seasons"
          prefetch={true}
          onClick={handleNavigate}
          className={styles.enterButton}
        >
          이번 계절의 한옥 만나기 <HugeiconsIcon icon={ArrowRight01Icon} size={19} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>

      <Link
        href="/seasons"
        prefetch={true}
        onClick={handleNavigate}
        className={styles.visualLink}
        aria-label={`${season.name}의 한옥 전체 화면으로 보기`}
        tabIndex={-1}
      >
        <div className={styles.visual}>
          <div className={styles.photo}>
            <Image
              src={season.image}
              alt={`${season.name}의 한옥`}
              fill
              unoptimized
              priority
              sizes="(max-width: 760px) 100vw, 63vw"
              className={styles.heroImage}
            />
          </div>
          <div className={styles.shadeOverlay} />
          <span className={styles.mark} aria-hidden="true">{season.name}</span>
        </div>
      </Link>
    </section>
  );
}

