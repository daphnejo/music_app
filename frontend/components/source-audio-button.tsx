'use client';

import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { sourceMediaUrl } from '@/lib/source-media';

const AUDIO_PLAY_EVENT = 'solfedjio:audio-play';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  source: string;
  children: ReactNode;
};

export function SourceAudioButton({ source, children, onClick, title, ...buttonProps }: Props) {
  const id = useId();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const stopOtherAudio = (event: Event) => {
      const custom = event as CustomEvent<{ id?: string }>;
      if (custom.detail?.id === id) return;

      const audio = audioRef.current;
      if (!audio) return;

      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
      setLoading(false);
    };

    window.addEventListener(AUDIO_PLAY_EVENT, stopOtherAudio);
    return () => window.removeEventListener(AUDIO_PLAY_EVENT, stopOtherAudio);
  }, [id]);

  useEffect(() => {
    setPlaying(false);
    setLoading(false);
    setFailed(false);
  }, [source]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    window.dispatchEvent(new CustomEvent(AUDIO_PLAY_EVENT, { detail: { id } }));
    setFailed(false);
    setLoading(true);

    if (audio.ended || (Number.isFinite(audio.duration) && audio.currentTime >= audio.duration - 0.05)) {
      audio.currentTime = 0;
    }

    try {
      await audio.play();
    } catch {
      setFailed(true);
      setLoading(false);
      setPlaying(false);
    }
  };

  const accessibleTitle = failed
    ? 'Audio ochilmadi. Qayta urinib ko‘ring.'
    : loading
      ? 'Audio yuklanmoqda'
      : title;

  return (
    <>
      <button
        {...buttonProps}
        type={buttonProps.type ?? 'button'}
        data-source-audio={source}
        data-loading={loading ? 'true' : 'false'}
        data-playing={playing ? 'true' : 'false'}
        data-media-error={failed ? 'true' : 'false'}
        aria-busy={loading}
        aria-pressed={playing}
        title={accessibleTitle}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) void toggle();
        }}
      >
        {children}
      </button>
      <audio
        ref={audioRef}
        src={sourceMediaUrl(source)}
        preload="metadata"
        onLoadStart={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onPlaying={() => {
          setLoading(false);
          setPlaying(true);
        }}
        onWaiting={() => setLoading(true)}
        onPause={() => {
          setLoading(false);
          setPlaying(false);
        }}
        onEnded={() => {
          setLoading(false);
          setPlaying(false);
        }}
        onError={() => {
          setFailed(true);
          setLoading(false);
          setPlaying(false);
        }}
      />
      <span className="sr-only" aria-live="polite">
        {failed ? 'Audio ochilmadi.' : playing ? 'Audio ijro etilmoqda.' : loading ? 'Audio yuklanmoqda.' : ''}
      </span>
    </>
  );
}
