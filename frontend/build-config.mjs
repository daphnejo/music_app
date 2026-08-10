// Vercel build vaqtida ishga tushadi: process.env.API_BASE_URL'ni statik config.js'ga yozadi.
// Bu build-siz vanilla JS frontend'ning yagona "build" qadami.
import { writeFileSync } from 'node:fs';

const apiBaseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:3000';

writeFileSync(
  'config.js',
  `window.__SOLFEDJIO_CONFIG__ = ${JSON.stringify({ apiBaseUrl }, null, 2)};\n`,
);

console.log(`[build-config] config.js yaratildi: apiBaseUrl=${apiBaseUrl}`);
