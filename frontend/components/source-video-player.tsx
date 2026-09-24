'use client';

import { useState, type VideoHTMLAttributes } from 'react';
import { sourceMediaUrl } from '@/lib/source-media';

type Props = Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src'> & {
  source: string;
  label: string;
};

export function SourceVideoPlayer({ source, label, ...videoProps }: Props) {
  const [failed, setFailed] = useState(false);

  return (
    <div data-media-error={failed ? 'true' : 'false'}>
      <video
        {...videoProps}
        src={sourceMediaUrl(source)}
        controls
        preload="metadata"
        aria-label={label}
        onError={(event) => {
          setFailed(true);
          videoProps.onError?.(event);
        }}
        onLoadedData={(event) => {
          setFailed(false);
          videoProps.onLoadedData?.(event);
        }}
      />
      {failed ? <p role="status">Video yuklanmadi. Keyinroq qayta urinib ko‘ring.</p> : null}
    </div>
  );
}
