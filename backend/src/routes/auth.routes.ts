import { Router } from 'express';
import { randomBytes, createHash } from 'node:crypto';
import { h, badRequest, conflict, unauthorized } from '../errors.ts';
import { requireAuth } from '../middleware/auth.middleware.ts';
import {
  User,
  PasswordReset,
  RefreshToken,
  Class,
  Enrollment,
  Assignment,
  CourseVersion,
} from '../models/index.ts';
import {
  checkLoginRate,
  clearLoginAttempts,
  hashPassword,
  issueRefreshToken,
  logLogin,
  noteLoginAttempt,
  revokeAllRefreshTokens,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
  toAuthUser,
  verifyPassword,
} from '../auth.ts';
import { audit } from '../audit.ts';

export const authRouter = Router();

authRouter.post(
  '/register',
  h(async (req, res) => {
    const fullName = String(req.body?.fullName ?? '').trim();
    const email = String(req.body?.email ?? '').trim();
    const password = String(req.body?.password ?? '');

    if (fullName.length < 2 || fullName.length > 120) throw badRequest('Ism-familiyani to‘g‘ri kiriting');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw badRequest('Email noto‘g‘ri');
    if (password.length < 8) throw badRequest('Parol kamida 8 belgidan iborat bo‘lishi kerak');

    const emailLower = email.toLowerCase();
    const exists = await User.findOne({ emailLower, deletedAt: null }).select('_id');
    if (exists) throw conflict('Bu email bilan akkaunt allaqachon mavjud');

    const published = await CourseVersion.findOne({ status: 'published' }).sort({ version: -1 });
    if (!published) throw conflict('Ro‘yxatdan o‘tish vaqtincha yopiq: faol kurs topilmadi');

    const assignment = await Assignment.findOne({ courseVersionId: published._id }).sort({ createdAt: 1 });
    if (!assignment) throw conflict('Ro‘yxatdan o‘tish vaqtincha yopiq: kurs sinfga biriktirilmagan');

    const cls = await Class.findOne({ _id: assignment.classId, deletedAt: null });
    if (!cls) throw conflict('Ro‘yxatdan o‘tish vaqtincha yopiq: faol sinf topilmadi');

    let user;
    try {
      user = await User.create({
        orgId: cls.orgId,
        email,
        emailLower,
        passwordHash: hashPassword(password),
        fullName,
        role: 'student',
      });
    } catch (error) {
      if ((error as { code?: number })?.code === 11000) {
        throw conflict('Bu email bilan akkaunt allaqachon mavjud');
      }
      throw error;
    }

    try {
      await Enrollment.create({ classId: cls._id, userId: user._id });
    } catch (error) {
      await User.deleteOne({ _id: user._id });
      throw error;
    }

    const authUser = toAuthUser(user);
    const accessToken = signAccessToken(authUser);
    const refreshToken = await issueRefreshToken(user._id, req.headers['user-agent']);
    await audit(user._id, 'auth.register', 'user', user._id, { classId: String(cls._id) });

    res.status(201).json({ user: authUser, accessToken, refreshToken, expiresIn: 15 * 60 });
  }),
);

authRouter.post(
  '/login',
  h(async (req, res) => {
    const email = String(req.body?.email ?? '').trim();
    const password = String(req.body?.password ?? '');
    if (!email || !password) throw badRequest('Email va parolni kiriting');

    const rateKey = `login:${email.toLowerCase()}`;
    await checkLoginRate(rateKey);
    await noteLoginAttempt(rateKey);

    const user = await User.findOne({ emailLower: email.toLowerCase(), deletedAt: null });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      await logLogin(user?._id ?? null, false);
      throw unauthorized('Email yoki parol noto‘g‘ri');
    }

    await clearLoginAttempts(rateKey);
    const authUser = toAuthUser(user);
    const accessToken = signAccessToken(authUser);
    const refreshToken = await issueRefreshToken(user._id, req.headers['user-agent']);
    await logLogin(user._id, true);

    res.json({ user: authUser, accessToken, refreshToken, expiresIn: 15 * 60 });
  }),
);

authRouter.post(
  '/refresh',
  h(async (req, res) => {
    const refreshToken = String(req.body?.refreshToken ?? '');
    if (!refreshToken) throw badRequest('refreshToken kerak');
    const result = await rotateRefreshToken(refreshToken);
    if (!result) throw unauthorized('Refresh token yaroqsiz yoki muddati o‘tgan');
    const accessToken = signAccessToken(result.user);
    res.json({ user: result.user, accessToken, refreshToken: result.newRefreshToken, expiresIn: 15 * 60 });
  }),
);

authRouter.post(
  '/logout',
  h(async (req, res) => {
    const refreshToken = String(req.body?.refreshToken ?? '');
    if (refreshToken) await revokeRefreshToken(refreshToken);
    if (req.auth) await audit(req.auth.id, 'auth.logout', 'user', req.auth.id);
    res.json({ ok: true });
  }),
);

authRouter.post(
  '/logout-all',
  requireAuth,
  h(async (req, res) => {
    await revokeAllRefreshTokens(req.auth!.id as never);
    res.json({ ok: true });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  h(async (req, res) => {
    const user = await User.findOne({ _id: req.auth!.id, deletedAt: null });
    if (!user) throw unauthorized('Akkaunt topilmadi');
    res.json({ user: toAuthUser(user) });
  }),
);

authRouter.patch(
  '/me',
  requireAuth,
  h(async (req, res) => {
    const fullName = String(req.body?.fullName ?? '').trim();
    if (fullName.length < 2 || fullName.length > 120) throw badRequest('Ism-familiyani to‘g‘ri kiriting');

    const user = await User.findOne({ _id: req.auth!.id, deletedAt: null });
    if (!user) throw unauthorized('Akkaunt topilmadi');

    user.fullName = fullName;
    await user.save();
    await audit(user._id, 'auth.profile.update', 'user', user._id);
    res.json({ user: toAuthUser(user) });
  }),
);

authRouter.post(
  '/change-password',
  requireAuth,
  h(async (req, res) => {
    const currentPassword = String(req.body?.currentPassword ?? '');
    const newPassword = String(req.body?.newPassword ?? '');
    if (!currentPassword) throw badRequest('Joriy parolni kiriting');
    if (newPassword.length < 8) throw badRequest('Yangi parol kamida 8 belgidan iborat bo‘lishi kerak');
    if (currentPassword === newPassword) throw badRequest('Yangi parol joriy paroldan farq qilishi kerak');

    const user = await User.findOne({ _id: req.auth!.id, deletedAt: null });
    if (!user) throw unauthorized('Akkaunt topilmadi');
    if (!verifyPassword(currentPassword, user.passwordHash)) throw unauthorized('Joriy parol noto‘g‘ri');

    user.passwordHash = hashPassword(newPassword);
    await user.save();
    await revokeAllRefreshTokens(user._id);
    await audit(user._id, 'auth.password.change', 'user', user._id);
    res.json({ ok: true, reloginRequired: true });
  }),
);

authRouter.post(
  '/password-reset/request',
  h(async (req, res) => {
    const email = String(req.body?.email ?? '').trim();
    if (!email) throw badRequest('Emailni kiriting');

    const user = await User.findOne({ emailLower: email.toLowerCase(), deletedAt: null });

    let devToken: string | null = null;
    if (user) {
      const token = randomBytes(24).toString('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      await PasswordReset.create({ userId: user._id, tokenHash, expiresAt: new Date(Date.now() + 3600_000) });
      await audit(user._id, 'auth.password_reset.requested', 'user', user._id);
      if (process.env.NODE_ENV !== 'production') devToken = token;
    }

    res.json({ ok: true, message: "Agar bunday email mavjud bo'lsa, ko'rsatma yuborildi", devToken });
  }),
);

authRouter.post(
  '/password-reset/confirm',
  h(async (req, res) => {
    const token = String(req.body?.token ?? '');
    const password = String(req.body?.password ?? '');
    if (token.length < 10 || password.length < 8) throw badRequest('Yaroqli token va kamida 8 belgili parol kerak');

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const row = await PasswordReset.findOne({ tokenHash, usedAt: null, expiresAt: { $gt: new Date() } });
    if (!row) throw badRequest('Token yaroqsiz yoki muddati o‘tgan');

    await User.updateOne({ _id: row.userId }, { passwordHash: hashPassword(password) });
    row.usedAt = new Date();
    await row.save();
    await revokeAllRefreshTokens(row.userId);
    await audit(row.userId, 'auth.password_reset.completed', 'user', row.userId);
    res.json({ ok: true });
  }),
);
