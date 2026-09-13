import { useEffect, useRef } from 'react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';

const hasMediaSession = () => typeof navigator !== 'undefined' && 'mediaSession' in navigator;

export function useSorimaruAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentStory = useSorimaruAudioStore((s) => s.currentStory);
  const isPlaying = useSorimaruAudioStore((s) => s.isPlaying);
  const setIsPlaying = useSorimaruAudioStore((s) => s.setIsPlaying);
  const setCurrentTime = useSorimaruAudioStore((s) => s.setCurrentTime);
  const setDuration = useSorimaruAudioStore((s) => s.setDuration);

  // Audio 객체 싱글톤 초기화
  useEffect(() => {
    if (!audioRef.current && typeof window !== 'undefined') {
      const audio = new Audio();
      audioRef.current = audio;
    }

    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (hasMediaSession() && audio.duration && !isNaN(audio.duration)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime,
          });
        } catch {
          // Safari 등 setPositionState 미지원 브라우저는 조용히 무시한다.
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [setCurrentTime, setDuration, setIsPlaying]);

  // 이야기 변경 시 오디오 URL 로드
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentStory.audioUrl) return;

    if (audio.src !== currentStory.audioUrl) {
      audio.src = currentStory.audioUrl;
      audio.load();
      if (isPlaying) {
        audio.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentStory, isPlaying, setIsPlaying]);

  // 재생/일시정지 동기화
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, setIsPlaying]);

  // Seek 시 오디오 위치 동기화
  const seekTo = (seconds: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  // 잠금화면 · 미디어 허브(안드로이드 알림, macOS/iOS 미디어 위젯) 재생 정보 표시
  useEffect(() => {
    if (!hasMediaSession()) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentStory.title,
      artist: currentStory.speaker || '온마루 문화해설사',
      album: currentStory.locationName || '온마루 소리마루',
      artwork: currentStory.imageUrl ? [{ src: currentStory.imageUrl, sizes: '512x512', type: 'image/jpeg' }] : [],
    });
  }, [currentStory]);

  // 잠금화면 재생/일시정지 아이콘 상태 동기화
  useEffect(() => {
    if (!hasMediaSession()) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // 잠금화면 · 이어폰 컨트롤 액션 연결 (탭이 백그라운드로 가도 계속 동작)
  useEffect(() => {
    if (!hasMediaSession()) return;

    navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
    navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const audio = audioRef.current;
      if (!audio) return;
      seekTo(Math.max(0, audio.currentTime - (details.seekOffset || 10)));
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const audio = audioRef.current;
      if (!audio) return;
      seekTo(Math.min(audio.duration || Infinity, audio.currentTime + (details.seekOffset || 10)));
    });

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIsPlaying]);

  return {
    audioRef,
    seekTo,
  };
}
