const DEFAULT_API_BASE_URL = 'https://solfedjio-backend-mlfe.onrender.com';

export function sourceMediaUrl(sourceFile: string) {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
  return `${base}/api/media/source/${encodeURIComponent(sourceFile)}`;
}
