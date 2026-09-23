import { useEffect, useRef } from 'react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { recordOdiiPlay } from '@/features/sorimaru-audio/api/odiiEngagementApi';

const hasMediaSession = () => typeof navigator !== 'undefined' && 'mediaSession' in navigator;

export function useSorimaruAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordedStoryRef = useRef<string | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const currentStory = useSorimaruAudioStore((s) => s.currentStory);
  const isPlaying = useSorimaruAudioStore((s) => s.isPlaying);
  const setIsPlaying = useSorimaruAudioStore((s) => s.setIsPlaying);
  const setCurrentTime = useSorimaruAudioStore((s) => s.setCurrentTime);
  const setDuration = useSorimaruAudioStore((s) => s.setDuration);


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
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      setIsPlaying(false);
      audioContextRef.current?.close().catch(() => undefined);
      audioContextRef.current = null;
      analyserRef.current = null;
    };
  }, [setCurrentTime, setDuration, setIsPlaying]);


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

  useEffect(() => {
    if (!isPlaying || !currentStory.stid || recordedStoryRef.current === currentStory.stid) return;
    recordedStoryRef.current = currentStory.stid;
    void recordOdiiPlay(currentStory.stid).catch(() => undefined);
  }, [currentStory.stid, isPlaying]);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audioContextRef.current?.resume().catch(() => undefined);
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, setIsPlaying]);


  const playbackRate = useSorimaruAudioStore((s) => s.playbackRate);
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate]);


  const seekTo = (seconds: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };


  useEffect(() => {
    if (!hasMediaSession()) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentStory.title,
      artist: currentStory.speaker || '온마루 문화해설사',
      album: currentStory.locationName || '온마루 소리마루',
      artwork: currentStory.imageUrl ? [{ src: currentStory.imageUrl, sizes: '512x512', type: 'image/jpeg' }] : [],
    });
  }, [currentStory]);


  useEffect(() => {
    if (!hasMediaSession()) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);


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
    analyserRef,
    seekTo,
  };
}
