import { Router } from 'express';
import mongoose from 'mongoose';

export const miscRouter = Router();

miscRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  });
});
