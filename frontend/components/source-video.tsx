'use client';

import type { VideoHTMLAttributes } from 'react';
import { sourceMediaUrl } from '@/lib/source-media';

type Props = Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src'> & {
  source: string;
};

export function SourceVideo({ source, ...props }: Props) {
  return (
    <video
      {...props}
      controls={props.controls ?? true}
      preload={props.preload ?? 'metadata'}
      src={sourceMediaUrl(source)}
      data-source-video={source}
    />
  );
}
