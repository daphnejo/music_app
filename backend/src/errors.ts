import type { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (m: string, d?: unknown) => new ApiError(400, 'bad_request', m, d);
export const unauthorized = (m = "Kirish talab qilinadi") => new ApiError(401, 'unauthorized', m);
export const forbidden = (m = 'Ruxsat yetarli emas') => new ApiError(403, 'forbidden', m);
export const notFound = (m = 'Topilmadi') => new ApiError(404, 'not_found', m);
export const conflict = (m: string, d?: unknown) => new ApiError(409, 'conflict', m, d);
export const tooMany = (m = "Urinishlar juda ko'p") => new ApiError(429, 'rate_limited', m);

/** Async route handler'larni try/catch bilan o'rab, xatoni next()ga uzatadi */
export function h(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: unknown, req: Request, res: Response, next: NextFunction): void {
  const e =
    err instanceof ApiError ? err : new ApiError(500, 'internal_error', 'Ichki server xatosi');
  if (!(err instanceof ApiError)) console.error('[error]', err);
  res.status(e.status).json({ error: { code: e.code, message: e.message, details: e.details ?? null } });
}

export function intParam(value: string | undefined, what: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw badRequest(`Noto'g'ri ${what}`);
  return n;
}
