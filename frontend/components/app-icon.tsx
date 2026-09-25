import type { CSSProperties, SVGProps } from 'react';

export type AppIconName =
  | 'music'
  | 'note'
  | 'star'
  | 'history'
  | 'speaker'
  | 'bulb'
  | 'play'
  | 'arrow-left'
  | 'arrow-right'
  | 'check'
  | 'x'
  | 'circle'
  | 'dot'
  | 'user'
  | 'rocket'
  | 'medal'
  | 'flame'
  | 'sparkle';

type AppIconProps = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: AppIconName;
  size?: number;
};

export function AppIcon({ name, size = 20, style, ...props }: AppIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': props['aria-hidden'] ?? true,
    focusable: false,
    style: { flex: '0 0 auto', ...style } as CSSProperties,
  };

  const body = (() => {
    switch (name) {
      case 'music':
        return <><path d="M9 18V6.4l10-2V16" /><path d="M9 9.4l10-2" /><ellipse cx="6.2" cy="18" rx="2.8" ry="2.1" /><ellipse cx="16.2" cy="16" rx="2.8" ry="2.1" /></>;
      case 'note':
        return <><path d="M10 17V6.5l7-1.6v9.5" /><ellipse cx="7.2" cy="17" rx="2.6" ry="2" /><ellipse cx="14.2" cy="14.4" rx="2.6" ry="2" /></>;
      case 'star':
        return <path d="m12 3 1.9 4.9 5.1.4-3.9 3.3 1.2 5-4.3-2.7-4.3 2.7 1.2-5L5 8.3l5.1-.4L12 3Z" />;
      case 'history':
        return <><path d="M4.5 5.5h10.2A2.8 2.8 0 0 1 17.5 8v10.5H7.3a2.8 2.8 0 0 0-2.8 2.8V5.5Z" /><path d="M17.5 8h2v10.5h-2M7.5 9h6M7.5 12h6M7.5 15h4" /></>;
      case 'speaker':
        return <><path d="M4 9.2h4l4.8-4v13.6L8 14.8H4V9.2Z" /><path d="M16.1 8.1c2.1 2.1 2.1 5.7 0 7.8M18.7 5.5c3.6 3.6 3.6 9.4 0 13" /></>;
      case 'bulb':
        return <><path d="M8.2 15.2a6 6 0 1 1 7.6 0c-1.1.8-1.5 1.5-1.5 2.3H9.7c0-.8-.4-1.5-1.5-2.3Z" /><path d="M9.7 20h4.6M10.4 17.5h3.2M12 2V.8M4.9 5 4 4.1M19.1 5l.9-.9M3 11.3H1.8M22.2 11.3H21" /></>;
      case 'play':
        return <path d="m8.2 5.4 10 6.6-10 6.6V5.4Z" />;
      case 'arrow-left':
        return <><path d="M19 12H5" /><path d="m10.5 6.5-5.5 5.5 5.5 5.5" /></>;
      case 'arrow-right':
        return <><path d="M5 12h14" /><path d="m13.5 6.5 5.5 5.5-5.5 5.5" /></>;
      case 'check':
        return <path d="m5.5 12.5 4 4 9-9" />;
      case 'x':
        return <><path d="m6.5 6.5 11 11" /><path d="m17.5 6.5-11 11" /></>;
      case 'circle':
        return <circle cx="12" cy="12" r="6.5" />;
      case 'dot':
        return <circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none" />;
      case 'user':
        return <><circle cx="12" cy="8" r="3.2" /><path d="M5.6 19c.8-3.3 3.2-5 6.4-5s5.6 1.7 6.4 5" /></>;
      case 'rocket':
        return <><path d="M13.7 4.2c2.4-1.6 4.9-1.4 6.1-1.1.3 1.2.5 3.7-1.1 6.1l-4.8 4.8-4-4 3.8-5.8Z" /><path d="m9.9 10-3.5.7-2.2 2.2 4.1.7M14 14.1l-.7 3.5-2.2 2.2-.7-4.1" /><circle cx="15.8" cy="7.2" r="1.2" /><path d="M6.7 17.3c-.8.1-1.7.7-2.5 1.5.8.1 1.6.1 2.1-.1.3-.1.5-.4.4-.7Z" /></>;
      case 'medal':
        return <><circle cx="12" cy="14" r="4.2" /><path d="m8.8 4 3.2 5 3.2-5M8.8 4H6.5l3 5M15.2 4h2.3l-3 5" /><path d="m12 11.6.8 1.6 1.8.3-1.3 1.2.3 1.8-1.6-.9-1.6.9.3-1.8-1.3-1.2 1.8-.3.8-1.6Z" /></>;
      case 'flame':
        return <path d="M12.3 2.8c1.6 3.2-.1 4.5 1.4 6.2 1-1 1.5-2 1.5-3.2 2.3 2.3 3.3 4.6 3.3 7a6.5 6.5 0 0 1-13 0c0-2.4 1.1-4.8 3.3-6.7-.1 2 .5 3.2 1.7 4.2.2-2.7.9-5.2 1.8-7.5Z" />;
      case 'sparkle':
        return <><path d="m12 3 1.2 3.2L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.3L12 3Z" /><path d="m18.5 13 .7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" /><path d="m6 14 .7 1.8 1.8.7-1.8.7L6 19l-.7-1.8-1.8-.7 1.8-.7L6 14Z" /></>;
    }
  })();

  return <svg {...common} {...props}>{body}</svg>;
}
