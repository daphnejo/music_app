import { Router } from 'express';
import { createHmac } from 'node:crypto';
import { config } from '../config.ts';
import { h, badRequest } from '../errors.ts';
import { requireAuth } from '../middleware/auth.middleware.ts';
import { requireRole } from '../auth.ts';
import { AnalyticsEvent, Attempt, Answer, Block } from '../models/index.ts';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

const ALLOWED_PROPS = new Set(['blockId', 'lessonId', 'questionType', 'correct', 'durationMs', 'source']);

export function pseudonym(userId: string): string {
  return createHmac('sha256', config.jwtSecret).update(`analytics:${userId}`).digest('hex').slice(0, 24);
}

export async function recordEvent(userId: string, name: string, props: Record<string, unknown> = {}): Promise<void> {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (!ALLOWED_PROPS.has(k)) continue;
    if (typeof v === 'string' && v.length > 64) continue;
    safe[k] = v;
  }
  await AnalyticsEvent.create({ userHash: pseudonym(userId), name, props: safe });
}

/** POST /api/analytics/events — klient hodisalari (server tomonida ham filtrlanadi) */
analyticsRouter.post(
  '/events',
  h(async (req, res) => {
    const name = String(req.body?.name ?? '').slice(0, 64);
    if (!name) throw badRequest("Hodisa nomi ko'rsatilmagan");
    await recordEvent(req.auth!.id, name, req.body?.props ?? {});
    res.status(202).json({ ok: true });
  }),
);

/** GET /api/analytics/dashboard — faqat agregatlar, alohida o'quvchi bo'yicha emas */
analyticsRouter.get(
  '/dashboard',
  h(async (req, res) => {
    requireRole(req.auth, 'admin', 'teacher', 'content_editor');

    const since30 = new Date(Date.now() - 30 * 86400_000);
    const since14 = new Date(Date.now() - 14 * 86400_000);

    const byName = await AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gt: since30 } } },
      { $group: { _id: '$name', n: { $sum: 1 } } },
      { $sort: { n: -1 } },
    ]);

    const activeUsers = await AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gt: since14 } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, users: { $addToSet: '$userHash' } } },
      { $project: { _id: 1, n: { $size: '$users' } } },
      { $sort: { _id: 1 } },
    ]);

    const submitted = await Attempt.find({ status: 'submitted', questionId: { $ne: null } }).select('_id blockId');
    const answersByAttempt = new Map<string, boolean>();
    const answers = await Answer.find({ attemptId: { $in: submitted.map((a) => a._id) } }).sort({ createdAt: -1 });
    for (const a of answers) {
      const key = String(a.attemptId);
      if (!answersByAttempt.has(key)) answersByAttempt.set(key, !!a.isCorrect);
    }
    const perBlock = new Map<string, { attempts: number; correct: number }>();
    for (const a of submitted) {
      const key = String(a.blockId);
      const entry = perBlock.get(key) ?? { attempts: 0, correct: 0 };
      entry.attempts += 1;
      if (answersByAttempt.get(String(a._id))) entry.correct += 1;
      perBlock.set(key, entry);
    }
    const blockIds = [...perBlock.keys()];
    const blocks = await Block.find({ _id: { $in: blockIds } }).select('title');
    const titleById = new Map(blocks.map((b) => [String(b._id), b.title]));
    const hardestBlocks = [...perBlock.entries()]
      .map(([blockId, v]) => ({
        blockId,
        title: titleById.get(blockId) ?? '',
        attempts: v.attempts,
        correctRate: Math.round((v.correct / v.attempts) * 100) / 100,
      }))
      .sort((a, b) => a.correctRate - b.correctRate || b.attempts - a.attempts)
      .slice(0, 10);

    res.json({
      eventsByName: byName.map((r) => ({ name: r._id, n: r.n })),
      activeUsersByDay: activeUsers.map((r) => ({ d: r._id, n: r.n })),
      hardestBlocks,
      retentionPolicy: "Hodisalar 12 oy saqlanadi, keyin o'chiriladi. PII va javob mazmuni saqlanmaydi.",
    });
  }),
);
