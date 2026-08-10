import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Muhit o'zgaruvchisi kerak: ${name}`);
  return v;
}

export const config = {
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 3000),

  // MongoDB Atlas connection string, masalan:
  // mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/solfedjio?retryWrites=true&w=majority
  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/solfedjio_dev'),

  // JWT
  jwtSecret: required('JWT_SECRET', 'dev-insecure-secret-change-me'),
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',

  // CORS — Vercel frontend manzili(lari), vergul bilan ajratilgan
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((s) => s.trim()),

  loginRateLimit: {
    max: Number(process.env.LOGIN_RATE_MAX ?? 10),
    windowSeconds: Number(process.env.LOGIN_RATE_WINDOW_SECONDS ?? 300),
  },

  mediaTokenTtlSeconds: Number(process.env.MEDIA_TOKEN_TTL_SECONDS ?? 3600),

  // Cloudflare R2 (S3-mos API)
  r2: {
    endpoint: process.env.R2_ENDPOINT ?? '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    bucket: process.env.R2_BUCKET ?? 'solfedjio-media',
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL ?? '',
  },
};
