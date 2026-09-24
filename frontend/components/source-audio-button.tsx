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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const stopOtherAudio = (event: Event) => {
      const custom = event as CustomEvent<{ id?: string }>;
      if (custom.detail?.id === id) return;
      audioRef.current?.pause();
    };

    window.addEventListener(AUDIO_PLAY_EVENT, stopOtherAudio);
    return () => window.removeEventListener(AUDIO_PLAY_EVENT, stopOtherAudio);
  }, [id]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    window.dispatchEvent(new CustomEvent(AUDIO_PLAY_EVENT, { detail: { id } }));
    setFailed(false);

    if (audio.ended || (audio.duration && audio.currentTime >= audio.duration - 0.05)) {
      audio.currentTime = 0;
    }

    try {
      await audio.play();
    } catch {
      setFailed(true);
      setPlaying(false);
    }
  };

  return (
    <>
      <button
        {...buttonProps}
        type={buttonProps.type ?? 'button'}
        data-source-audio={source}
        data-playing={playing ? 'true' : 'false'}
        data-media-error={failed ? 'true' : 'false'}
        aria-pressed={playing}
        title={failed ? 'Audio yuklanmadi. Backend/R2 media sozlamalarini tekshiring.' : title}
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
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => {
          setFailed(true);
          setPlaying(false);
        }}
      />
    </>
  );
}
