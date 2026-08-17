// Topshiriqlar dvigateli. To'g'riligini tekshirish — FAQAT shu yerda, serverda.
import { Router } from 'express';
import mongoose from 'mongoose';
import { h, badRequest, conflict, forbidden, notFound } from '../errors.ts';
import { requireAuth } from '../middleware/auth.middleware.ts';
import { accessibleVersionId } from './content.routes.ts';
import { recordEvent } from './analytics.routes.ts';
import { audit } from '../audit.ts';
import { Block, Lesson, Question, Attempt, Answer, Progress } from '../models/index.ts';

export const assessmentRouter = Router();
assessmentRouter.use(requireAuth);

type AnswerPayload = { optionId?: string; order?: string[]; notes?: string; acknowledged?: boolean };

async function assertBlockAccessible(blockId: string, cvId: mongoose.Types.ObjectId) {
  const block = await Block.findById(blockId);
  if (!block) throw notFound('Blok topilmadi');
  const lesson = await Lesson.findOne({ _id: block.lessonId, courseVersionId: cvId });
  if (!lesson) throw notFound('Blok sizga ochiq kurs versiyasida topilmadi');
  return block;
}

function assertQuestionReviewed(needsReview: boolean) {
  if (needsReview) {
    throw conflict("Bu topshiriqning javob kaliti metodist tasdig'ini kutmoqda. Hozircha avtomatik baholash o'chirilgan.");
  }
}

/** Javobni baholash. options.isCorrect o'qiladigan yagona joy (select:false'ni +bilan ochamiz). */
async function grade(questionId: mongoose.Types.ObjectId, type: string, maxScore: number, payload: AnswerPayload) {
  const question = await Question.findById(questionId).select('+options.isCorrect');
  if (!question) throw notFound('Savol topilmadi');
  const correctIds = question.options.filter((o) => o.isCorrect).map((o) => String(o._id));

  switch (type) {
    case 'single_choice':
    case 'audio_single_choice':
    case 'image_choice':
    case 'missing_fragment': {
      if (!payload.optionId) throw badRequest('Javob varianti tanlanmagan');
      const belongs = question.options.some((o) => String(o._id) === payload.optionId);
      if (!belongs) throw badRequest('Variant bu savolga tegishli emas');
      const correct = correctIds.includes(payload.optionId);
      return { correct, score: correct ? maxScore : 0, correctOptionIds: correctIds };
    }
    default:
      // sequence_order va notation_input metodist tasdig'idan keyin qo'shiladi (content-inventory'ga qarang)
      throw badRequest(`"${type}" turi hozircha tekshiruv dvigateli tomonidan qo'llab-quvvatlanmaydi`);
  }
}

async function upsertProgress(userId: string, cvId: mongoose.Types.ObjectId, blockId: mongoose.Types.ObjectId, score: number) {
  const existing = await Progress.findOne({ userId, courseVersionId: cvId, blockId });
  const bestScore = Math.max(existing?.bestScore ?? 0, score);
  await Progress.updateOne(
    { userId, courseVersionId: cvId, blockId },
    { state: 'completed', bestScore, updatedAt: new Date() },
    { upsert: true },
  );
}

/** POST /api/blocks/:id/draft — qoralamani saqlash (sahifa yangilansa ham yo'qolmaydi) */
assessmentRouter.post(
  '/blocks/:id/draft',
  h(async (req, res) => {
    const user = req.auth!;
    const blockId = req.params.id;
    const cvId = await accessibleVersionId(user);
    if (!cvId) throw forbidden('Kurs sizga tayinlanmagan');
    const block = await assertBlockAccessible(blockId, cvId);

    const payload = req.body as AnswerPayload;
    const question = await Question.findOne({ blockId: block._id });

    let attempt = await Attempt.findOne({ userId: user.id, blockId: block._id, status: 'draft' });
    if (!attempt) {
      attempt = await Attempt.create({
        userId: user.id,
        blockId: block._id,
        questionId: question?._id ?? null,
        courseVersionId: cvId,
        status: 'draft',
      });
    }
    await Answer.deleteMany({ attemptId: attempt._id });
    await Answer.create({ attemptId: attempt._id, payload });

    res.json({ ok: true, savedAt: new Date().toISOString() });
  }),
);

/**
 * POST /api/blocks/:id/submit — javobni yuborish.
 * Idempotency-Key majburiy: bir xil kalit bilan qayta yuborish bir xil natijani qaytaradi.
 */
assessmentRouter.post(
  '/blocks/:id/submit',
  h(async (req, res) => {
    const user = req.auth!;
    const blockId = req.params.id;
    const cvId = await accessibleVersionId(user);
    if (!cvId) throw forbidden('Kurs sizga tayinlanmagan');
    const block = await assertBlockAccessible(blockId, cvId);

    const idemKey = req.headers['idempotency-key'];
    const key = Array.isArray(idemKey) ? idemKey[0] : idemKey;
    if (!key || key.length < 8) throw badRequest("Idempotency-Key header kerak (kamida 8 belgi)");

    const payload = req.body as AnswerPayload;
    const question = await Question.findOne({ blockId: block._id });

    // Source'dan olingan javob kaliti hali metodist tasdig'ini kutayotgan bo'lsa,
    // uni studentga authoritative natija sifatida bermaymiz.
    if (question) assertQuestionReviewed(block.needsReview);

    const existing = await Attempt.findOne({ userId: user.id, blockId: block._id, idempotencyKey: key, status: 'submitted' });
    if (existing) {
      const answer = await Answer.findOne({ attemptId: existing._id }).sort({ createdAt: -1 });
      res.json({
        attemptId: String(existing._id),
        correct: !!answer?.isCorrect,
        score: existing.score,
        maxScore: existing.maxScore,
        replayed: true,
      });
      return;
    }

    // Savolsiz blok — amaliyot: bajarilganini tasdiqlash
    if (!question) {
      if (block.type !== 'practice_acknowledgement') throw badRequest('Bu blokda topshiriq yo\u2018q');
      const attempt = await Attempt.create({
        userId: user.id,
        blockId: block._id,
        questionId: null,
        courseVersionId: cvId,
        status: 'submitted',
        score: 1,
        maxScore: 1,
        idempotencyKey: key,
        submittedAt: new Date(),
      });
      await Answer.create({ attemptId: attempt._id, payload, isCorrect: true });
      await Attempt.deleteMany({ userId: user.id, blockId: block._id, status: 'draft' });
      await upsertProgress(user.id, cvId, block._id, 1);
      await recordEvent(user.id, 'practice.acknowledged', { blockId });
      res.json({ attemptId: String(attempt._id), correct: true, score: 1, maxScore: 1, replayed: false });
      return;
    }

    const result = await grade(question._id, question.type, question.maxScore, payload);

    let attempt;
    try {
      attempt = await Attempt.create({
        userId: user.id,
        blockId: block._id,
        questionId: question._id,
        courseVersionId: cvId,
        status: 'submitted',
        score: result.score,
        maxScore: question.maxScore,
        idempotencyKey: key,
        submittedAt: new Date(),
      });
    } catch (e) {
      if (e instanceof Error && (e as { code?: number }).code === 11000) {
        throw conflict('Bunday yuborish allaqachon qayta ishlanmoqda', { idempotencyKey: key });
      }
      throw e;
    }
    await Answer.create({ attemptId: attempt._id, payload, isCorrect: result.correct });
    await Attempt.deleteMany({ userId: user.id, blockId: block._id, status: 'draft' });
    await upsertProgress(user.id, cvId, block._id, result.score);

    await recordEvent(user.id, 'question.submitted', {
      blockId,
      questionType: question.type,
      correct: result.correct, // javob mazmunisiz, faqat to'g'ri/noto'g'ri fakti
    });

    res.json({
      attemptId: String(attempt._id),
      correct: result.correct,
      score: result.score,
      maxScore: question.maxScore,
      // Asl prezentatsiyada izohlar yo'q — TODO(methodist)
      explanation: question.explanation,
      correctOptionIds: result.correctOptionIds,
      replayed: false,
    });
  }),
);

/** GET /api/blocks/:id/attempts — o'zining urinishlari */
assessmentRouter.get(
  '/blocks/:id/attempts',
  h(async (req, res) => {
    const user = req.auth!;
    const attempts = await Attempt.find({ userId: user.id, blockId: req.params.id, status: 'submitted' })
      .sort({ createdAt: -1 })
      .limit(20);
    const withCorrectness = await Promise.all(
      attempts.map(async (a) => {
        const ans = await Answer.findOne({ attemptId: a._id }).sort({ createdAt: -1 });
        return {
          id: String(a._id),
          score: a.score,
          maxScore: a.maxScore,
          submittedAt: a.submittedAt,
          isCorrect: ans?.isCorrect ?? null,
        };
      }),
    );
    res.json({ attempts: withCorrectness });
  }),
);

/** POST /api/attempts/sync — offline navbat: kechiktirilgan yuborishlar paketi */
assessmentRouter.post(
  '/attempts/sync',
  h(async (req, res) => {
    const user = req.auth!;
    const items = (req.body?.items ?? []) as Array<{ blockId: string; idempotencyKey: string; payload: AnswerPayload }>;
    if (items.length > 100) throw badRequest("Sinxronizatsiya paketi juda katta");

    const cvId = await accessibleVersionId(user);
    if (!cvId) throw forbidden('Kurs sizga tayinlanmagan');

    const results: Array<{ blockId: string; status: string; correct?: boolean }> = [];
    for (const item of items) {
      try {
        const block = await assertBlockAccessible(item.blockId, cvId);
        const already = await Attempt.findOne({ userId: user.id, blockId: item.blockId, idempotencyKey: item.idempotencyKey });
        if (already) {
          results.push({ blockId: item.blockId, status: 'duplicate_ignored' });
          continue;
        }
        const question = await Question.findOne({ blockId: item.blockId });
        if (!question) {
          results.push({ blockId: item.blockId, status: 'skipped_no_question' });
          continue;
        }
        if (block.needsReview) {
          results.push({ blockId: item.blockId, status: 'pending_methodist_review' });
          continue;
        }
        const r = await grade(question._id, question.type, question.maxScore, item.payload);
        const attempt = await Attempt.create({
          userId: user.id,
          blockId: item.blockId,
          questionId: question._id,
          courseVersionId: cvId,
          status: 'submitted',
          score: r.score,
          maxScore: question.maxScore,
          idempotencyKey: item.idempotencyKey,
          submittedAt: new Date(),
        });
        await Answer.create({ attemptId: attempt._id, payload: item.payload, isCorrect: r.correct });
        await upsertProgress(user.id, cvId, attempt.blockId, r.score);
        results.push({ blockId: item.blockId, status: 'accepted', correct: r.correct });
      } catch {
        results.push({ blockId: item.blockId, status: 'rejected' });
      }
    }
    await audit(user.id, 'attempts.offline_sync', 'user', user.id, { count: items.length });
    res.json({ results });
  }),
);
