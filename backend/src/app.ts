import express from 'express';
import cors from 'cors';
import { config } from './config.ts';
import { errorMiddleware } from './errors.ts';
import { attachAuth } from './middleware/auth.middleware.ts';
import { authRouter } from './routes/auth.routes.ts';
import { contentRouter } from './routes/content.routes.ts';
import { miscRouter } from './routes/misc.routes.ts';
import { assessmentRouter } from './routes/assessment.routes.ts';
import { teacherRouter } from './routes/teacher.routes.ts';
import { adminRouter } from './routes/admin.routes.ts';
import { mediaRouter } from './routes/media.routes.ts';
import { analyticsRouter } from './routes/analytics.routes.ts';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: false, // JWT Authorization header ishlatiladi — cookie/credentials shart emas
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(attachAuth);

  app.use('/api', miscRouter);
  app.use('/api/auth', authRouter);

  // Native Image/Audio/Video signed media URL'ni Authorization headersiz ochadi.
  // contentRouter global requireAuth ishlatgani uchun media route undan oldin mount qilinishi shart.
  app.use('/api/media', mediaRouter);

  app.use('/api', contentRouter);
  app.use('/api', assessmentRouter);
  app.use('/api/teacher', teacherRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/analytics', analyticsRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'not_found', message: 'Marshrut topilmadi' } });
  });
  app.use(errorMiddleware);

  return app;
}
