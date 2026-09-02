import { useEffect, useRef } from 'react';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';

export function useOdiiAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentStory = useOdiiAudioStore((s) => s.currentStory);
  const isPlaying = useOdiiAudioStore((s) => s.isPlaying);
  const currentTime = useOdiiAudioStore((s) => s.currentTime);
  const setIsPlaying = useOdiiAudioStore((s) => s.setIsPlaying);
  const setCurrentTime = useOdiiAudioStore((s) => s.setCurrentTime);
  const setDuration = useOdiiAudioStore((s) => s.setDuration);

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

  return {
    audioRef,
    seekTo,
  };
}
