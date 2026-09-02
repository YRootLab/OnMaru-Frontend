'use client';

import { useEffect, useRef } from 'react';
import { Global, css } from '@emotion/react';
import { lightPalette, darkPalette, meok, surface } from '@/design-system/tokens';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { useMapStore } from '@/map/hooks/useMapStore';
import { useCinematicTourStore } from '@/features/cinematic-tour/store/useCinematicTourStore';

const styles = css`
  /* ------------------------------------------------------------
   * 시네마틱 투어 경유지 핀 스타일
   * ------------------------------------------------------------ */
  .om-tour-pin {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    user-select: none;
    transform: translate(-50%, -100%);
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .om-tour-pin:hover {
    transform: translate(-50%, -108%) scale(1.1);
  }

  .om-tour-pin-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    margin-bottom: 4px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;

    backdrop-filter: blur(6px);
  }

  [data-theme='light'] .om-tour-pin-badge,
  :root:not([data-theme='dark']) .om-tour-pin-badge {
    background: #ffffff;
    color: ${lightPalette.juhong[700]};

  }

  [data-theme='dark'] .om-tour-pin-badge {
    background: ${surface.dark.card};
    color: ${darkPalette.juhong[200]};

  }

  .om-tour-pin-icon {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    background: ${lightPalette.juhong[500]};

    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
  }

  [data-theme='dark'] .om-tour-pin-icon {
    background: ${darkPalette.juhong[500]};
    border-color: ${surface.dark.card};

  }

  .om-tour-pin-icon span {
    transform: rotate(45deg);
  }

  /* 현재 활성화된(재생 중인) 스팟 펄스 링 */
  .om-tour-pin[data-active='true'] .om-tour-pin-icon {
    transform: rotate(-45deg) scale(1.15);
    background: ${lightPalette.jangmi[500]};

  }

  [data-theme='dark'] .om-tour-pin[data-active='true'] .om-tour-pin-icon {
    background: ${darkPalette.jangmi[500]};

  }

  .om-tour-pin[data-active='true']::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: rgba(232, 90, 24, 0.5);
    animation: om-tour-radar 2s ease-out infinite;
  }

  @keyframes om-tour-radar {
    0% { transform: translateX(-50%) scale(0.6); opacity: 0.9; }
    100% { transform: translateX(-50%) scale(3.5); opacity: 0; }
  }
`;

export default function CinematicTourMapLayer() {
  const map = useMapStore((s) => s.map);
  const isActive = useCinematicTourStore((s) => s.isActive);
  const story = useCinematicTourStore((s) => s.story);
  const activeWaypointIndex = useCinematicTourStore((s) => s.activeWaypointIndex);
  const isPlaying = useCinematicTourStore((s) => s.isPlaying);
  const currentTime = useCinematicTourStore((s) => s.currentTime);
  const setCurrentTime = useCinematicTourStore((s) => s.setCurrentTime);
  const jumpToWaypoint = useCinematicTourStore((s) => s.jumpToWaypoint);
  const setIsPlaying = useCinematicTourStore((s) => s.setIsPlaying);

  const { mode: colorMode } = useOnmaruTheme();
  const isDark = colorMode === 'dark';

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const polylineRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);

  // 1. 오디오 스트리밍 엘리먼트 관리
  useEffect(() => {
    if (!isActive || !story?.audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    if (!audioRef.current || audioRef.current.src !== story.audioUrl) {
      const audio = new Audio(story.audioUrl);
      audio.currentTime = currentTime;
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        if (!audio.paused) {
          setCurrentTime(audio.currentTime);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
      };
    }

    if (isPlaying) {
      audioRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isActive, story?.audioUrl, isPlaying]);

  // 재생 위치 동기화 (외부 점프 시)
  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 2) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // 2. 지도 위 보행 동선(Polyline) 및 경유지 핀 렌더링
  useEffect(() => {
    if (!map || !isActive || !story?.waypoints || story.waypoints.length === 0) {
      // 투어 종료 시 걷어내기
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current = [];
      return;
    }

    const waypoints = story.waypoints;

    // A. 동선 폴리라인 그리기
    const path = waypoints.map((wp) => new window.kakao.maps.LatLng(wp.lat, wp.lng));
    if (polylineRef.current) polylineRef.current.setMap(null);

    polylineRef.current = new window.kakao.maps.Polyline({
      path,
      strokeWeight: 4,
      strokeColor: isDark ? '#F85700' : '#E85A18',
      strokeOpacity: 0.85,
      strokeStyle: 'dash',
      zIndex: 10,
    });
    polylineRef.current.setMap(map);

    // B. 경유지 핀 오버레이 렌더링
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    const newOverlays = waypoints.map((wp, idx) => {
      const isCurrent = idx === activeWaypointIndex;
      const el = document.createElement('div');
      el.className = 'om-tour-pin';
      el.dataset.active = String(isCurrent);

      el.innerHTML = `
        <div class="om-tour-pin-badge">
          ${isCurrent ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#D42058;margin-right:4px;vertical-align:middle;"></span>재생중' : `스팟 ${idx + 1}`} : ${wp.title}
        </div>
        <div class="om-tour-pin-icon">
          <span>${idx + 1}</span>
        </div>
      `;

      el.addEventListener('click', () => {
        jumpToWaypoint(idx);
      });

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(wp.lat, wp.lng),
        content: el,
        yAnchor: 1.0,
        xAnchor: 0.5,
        zIndex: isCurrent ? 35 : 20,
      });

      overlay.setMap(map);
      return overlay;
    });

    overlaysRef.current = newOverlays;

    return () => {
      if (polylineRef.current) polylineRef.current.setMap(null);
      newOverlays.forEach((o) => o.setMap(null));
    };
  }, [map, isActive, story, activeWaypointIndex, isDark]);

  if (!isActive) return null;

  return <Global styles={styles} />;
}
