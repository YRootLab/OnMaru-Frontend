'use client';

import { useEffect, useRef } from 'react';
import { Global, css } from '@emotion/react';
import { lightPalette, darkPalette, meok, surface , fontSize } from '@/design-system/tokens';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { useCinematicTourStore } from '@/features/cinematic-tour/store/useCinematicTourStore';

const styles = css`



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
    font-size: ${fontSize.micro};
    font-weight: 700;
    white-space: nowrap;

    backdrop-filter: blur(6px);
  }

  [data-theme='light'] .om-tour-pin-badge,
  :root:not([data-theme='dark']) .om-tour-pin-badge {
    background: #ffffff;
    color: ${lightPalette.jangmi[700]};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }

  [data-theme='dark'] .om-tour-pin-badge {
    background: ${surface.dark.card};
    color: ${darkPalette.jangmi[400]};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
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
    background: ${lightPalette.jangmi[500]};
    color: #ffffff;
    font-size: ${fontSize.xs};
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(212, 32, 88, 0.35);
  }

  [data-theme='dark'] .om-tour-pin-icon {
    background: ${darkPalette.jangmi[500]};
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(248, 78, 118, 0.4);
  }

  .om-tour-pin-icon span {
    transform: rotate(45deg);
  }


  .om-tour-pin[data-active='true'] .om-tour-pin-icon {
    transform: rotate(-45deg) scale(1.18);
    background: ${lightPalette.jangmi[700]};
    box-shadow: 0 3px 12px rgba(212, 32, 88, 0.5);
  }

  [data-theme='dark'] .om-tour-pin[data-active='true'] .om-tour-pin-icon {
    background: ${darkPalette.jangmi[400]};
    box-shadow: 0 3px 12px rgba(248, 78, 118, 0.6);
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
    background: rgba(212, 32, 88, 0.45);
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
  const auraPolylineRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);


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

      const syncAudioDuration = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
          useCinematicTourStore.setState({ duration: audio.duration });
        }
      };

      audio.onloadedmetadata = syncAudioDuration;
      audio.ondurationchange = syncAudioDuration;
      audio.oncanplay = syncAudioDuration;

      audio.ontimeupdate = () => {
        if (!audio.paused) {
          syncAudioDuration();
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


  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 2) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime]);


  useEffect(() => {
    if (!map || !isActive || !story?.waypoints || story.waypoints.length === 0) {

      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      if (auraPolylineRef.current) {
        auraPolylineRef.current.setMap(null);
        auraPolylineRef.current = null;
      }
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current = [];
      return;
    }

    const waypoints = story.waypoints;


    const path = waypoints.map((wp) => new window.kakao.maps.LatLng(wp.lat, wp.lng));
    if (polylineRef.current) polylineRef.current.setMap(null);
    if (auraPolylineRef.current) auraPolylineRef.current.setMap(null);


    auraPolylineRef.current = new window.kakao.maps.Polyline({
      path,
      strokeWeight: 7,
      strokeColor: isDark ? 'rgba(248, 78, 118, 0.3)' : '#ffffff',
      strokeOpacity: 0.9,
      strokeStyle: 'solid',
      zIndex: 10,
    });
    auraPolylineRef.current.setMap(map);


    polylineRef.current = new window.kakao.maps.Polyline({
      path,
      strokeWeight: 3.5,
      strokeColor: isDark ? darkPalette.jangmi[500] : lightPalette.jangmi[500],
      strokeOpacity: 0.95,
      strokeStyle: 'solid',
      zIndex: 11,
    });
    polylineRef.current.setMap(map);


    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    const newOverlays = waypoints.map((wp, idx) => {
      const isCurrent = idx === activeWaypointIndex;
      const cleanTitle = wp.title.replace(/^\d+[\.\s\-:]*\s*/, '');
      const el = document.createElement('div');
      el.className = 'om-tour-pin';
      el.dataset.active = String(isCurrent);

      el.innerHTML = `
        <div class="om-tour-pin-badge">
          ${isCurrent ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#D42058;margin-right:4px;vertical-align:middle;"></span>재생중' : `스팟 ${idx + 1}`} · ${cleanTitle}
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
      if (auraPolylineRef.current) auraPolylineRef.current.setMap(null);
      newOverlays.forEach((o) => o.setMap(null));
    };
  }, [map, isActive, story, activeWaypointIndex, isDark]);

  if (!isActive) return null;

  return <Global styles={styles} />;
}
