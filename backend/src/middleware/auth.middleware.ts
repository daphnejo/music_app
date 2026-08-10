import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, toAuthUser, type AuthUser } from '../auth.ts';
import { unauthorized } from '../errors.ts';
import { User } from '../models/index.ts';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

/**
 * Ixtiyoriy autentifikatsiya: token bo'lsa req.auth to'ldiriladi, bo'lmasa ham so'rov davom etadi.
 * Foydalanuvchi hali bazadan o'chirilmaganini tekshiradi (deletedAt).
 */
export async function attachAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next();
    const token = header.slice('Bearer '.length);
    const payload = verifyAccessToken(token);
    const user = await User.findOne({ _id: payload.sub, deletedAt: null });
    if (!user) return next();
    req.auth = toAuthUser(user);
    next();
  } catch {
    // Noto'g'ri/eskirgan token — jim o'tkazamiz, requireAuth keyinroq 401 qaytaradi
    next();
  }
}

/** So'rov uchun majburiy autentifikatsiya */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth) return next(unauthorized());
  next();
}
