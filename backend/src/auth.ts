import { randomBytes, scryptSync, timingSafeEqual, createHash, createHmac } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Types } from 'mongoose';
import { config } from './config.ts';
import { forbidden, tooMany, unauthorized } from './errors.ts';
import { User, Class, Enrollment, LoginAttempt, RefreshToken } from './models/index.ts';
import type { Role } from './models/identity.ts';

export type AuthUser = {
  id: string;
  orgId: string | null;
  email: string;
  fullName: string;
  role: Role;
};

// ---------- Parollar (scrypt — SQLite versiyasi bilan bir xil, migratsiya oson) ----------

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(plain, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [scheme, saltHex, keyHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = scryptSync(plain, Buffer.from(saltHex, 'hex'), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// ---------- Login rate limiting (Mongo TTL indeksi orqali o'zi tozalanadi) ----------

export async function checkLoginRate(key: string): Promise<void> {
  const { max, windowSeconds } = config.loginRateLimit;
  const since = new Date(Date.now() - windowSeconds * 1000);
  const n = await LoginAttempt.countDocuments({ key, createdAt: { $gt: since } });
  if (n >= max) throw tooMany("Kirish urinishlari juda ko'p, birozdan so'ng qayta urinib ko'ring");
}

export async function noteLoginAttempt(key: string): Promise<void> {
  await LoginAttempt.create({ key });
}

export async function clearLoginAttempts(key: string): Promise<void> {
  await LoginAttempt.deleteMany({ key });
}

// ---------- JWT access token ----------

type AccessTokenPayload = { sub: string; role: Role; orgId: string | null };

export function signAccessToken(user: AuthUser): string {
  const payload: AccessTokenPayload = { sub: user.id, role: user.role, orgId: user.orgId };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtAccessTtl });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AccessTokenPayload;
}

// ---------- Refresh token (opaque, DB'da hash sifatida saqlanadi — chaqirib olish mumkin) ----------

function ttlToMs(ttl: string): number {
  const m = /^(\d+)([smhd])$/.exec(ttl);
  if (!m) return 30 * 24 * 3600 * 1000;
  const n = Number(m[1]);
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[m[2] as 's' | 'm' | 'h' | 'd'];
  return n * mult;
}

export async function issueRefreshToken(userId: Types.ObjectId, userAgent?: string): Promise<string> {
  const raw = randomBytes(40).toString('hex');
  const tokenHash = createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + ttlToMs(config.jwtRefreshTtl));
  await RefreshToken.create({ userId, tokenHash, userAgent: userAgent ?? null, expiresAt });
  return raw;
}

export async function rotateRefreshToken(
  raw: string,
): Promise<{ user: AuthUser; newRefreshToken: string } | null> {
  const tokenHash = createHash('sha256').update(raw).digest('hex');
  const row = await RefreshToken.findOne({ tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } });
  if (!row) return null;
  const user = await User.findOne({ _id: row.userId, deletedAt: null });
  if (!user) return null;
  row.revokedAt = new Date();
  await row.save();
  const newRefreshToken = await issueRefreshToken(user._id);
  return { user: toAuthUser(user), newRefreshToken };
}

export async function revokeRefreshToken(raw: string): Promise<void> {
  const tokenHash = createHash('sha256').update(raw).digest('hex');
  await RefreshToken.updateOne({ tokenHash }, { revokedAt: new Date() });
}

export async function revokeAllRefreshTokens(userId: Types.ObjectId): Promise<void> {
  await RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
}

// ---------- Helper: Mongo hujjatini AuthUser'ga aylantirish ----------

export function toAuthUser(u: {
  _id: Types.ObjectId;
  orgId?: Types.ObjectId | null;
  email: string;
  fullName: string;
  role: Role;
}): AuthUser {
  return {
    id: String(u._id),
    orgId: u.orgId ? String(u.orgId) : null,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
  };
}

// ---------- Tenancy / scope ----------

export async function classIdsForUser(user: AuthUser): Promise<Types.ObjectId[]> {
  if (user.role === 'admin' || user.role === 'content_editor') {
    const rows = await Class.find({ deletedAt: null }).select('_id');
    return rows.map((r) => r._id);
  }
  if (user.role === 'teacher') {
    const rows = await Class.find({ teacherId: user.id, deletedAt: null }).select('_id');
    return rows.map((r) => r._id);
  }
  const rows = await Enrollment.find({ userId: user.id }).select('classId');
  return rows.map((r) => r.classId);
}

/** Actor studentId ma'lumotlarini ko'ra oladimi (IDOR himoyasi) */
export async function canViewStudent(actor: AuthUser, studentId: string): Promise<boolean> {
  if (actor.id === studentId) return true;
  if (actor.role === 'admin') return true;
  if (actor.role !== 'teacher') return false;
  const teacherClassIds = (await Class.find({ teacherId: actor.id, deletedAt: null }).select('_id')).map(
    (c) => c._id,
  );
  if (!teacherClassIds.length) return false;
  const n = await Enrollment.countDocuments({ userId: studentId, classId: { $in: teacherClassIds } });
  return n > 0;
}

// ---------- Media uchun imzolangan token (SQLite versiyasi bilan bir xil HMAC sxemasi) ----------

export function signMediaToken(assetId: string, userId: string): { token: string; expiresAt: number } {
  const exp = Math.floor(Date.now() / 1000) + config.mediaTokenTtlSeconds;
  const payload = `${assetId}.${userId}.${exp}`;
  const sig = createHmac('sha256', config.jwtSecret).update(payload).digest('hex').slice(0, 32);
  return { token: `${exp}.${sig}`, expiresAt: exp };
}

export function verifyMediaToken(assetId: string, userId: string, token: string | undefined): boolean {
  if (!token) return false;
  const [expRaw, sig] = token.split('.');
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac('sha256', config.jwtSecret)
    .update(`${assetId}.${userId}.${exp}`)
    .digest('hex')
    .slice(0, 32);
  if (!sig || sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export async function logLogin(userId: Types.ObjectId | null, ok: boolean): Promise<void> {
  const { audit } = await import('./audit.ts');
  await audit(ok ? userId : null, ok ? 'auth.login.success' : 'auth.login.failure', 'user', userId ?? undefined);
}

// ---------- Express middleware ----------

// req.auth kengaytmasi middleware/auth.middleware.ts'da e'lon qilingan
export function requireRole(user: AuthUser | undefined, ...roles: Role[]): AuthUser {
  if (!user) throw unauthorized();
  if (!roles.includes(user.role)) throw forbidden(`${user.role} roli bu amalga ruxsatga ega emas`);
  return user;
}
