import { Router } from 'express';
import type { Types } from 'mongoose';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { h, forbidden, notFound } from '../errors.ts';
import { requireAuth } from '../middleware/auth.middleware.ts';
import { classIdsForUser, type AuthUser } from '../auth.ts';
import { config } from '../config.ts';
import { isStudentVisibleBlock, isStudentVisibleLesson } from '../student-content.ts';
import {
  CourseVersion,
  Lesson,
  Block,
  BlockAsset,
  Asset,
  Question,
  Attempt,
  Answer,
  Progress,
  LastPosition,
  Assignment,
  Notification,
} from '../models/index.ts';

export const contentRouter = Router();
contentRouter.use(requireAuth);

const r2 = new S3Client({
  region: 'auto',
  endpoint: config.r2.endpoint,
  credentials: { accessKeyId: config.r2.accessKeyId, secretAccessKey: config.r2.secretAccessKey },
});

async function directMediaUrl(file: string): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: config.r2.bucket, Key: file }),
    { expiresIn: config.mediaTokenTtlSeconds },
  );
}

async function mediaUrlByAssetId(assetId: string): Promise<string | null> {
  const asset = await Asset.findById(assetId).select('file');
  return asset ? directMediaUrl(asset.file) : null;
}

/** Foydalanuvchiga ochiq (o'z sinfiga tayinlangan va nashr qilingan) kurs versiyasi */
export async function accessibleVersionId(user: AuthUser): Promise<Types.ObjectId | null> {
  if (user.role === 'admin' || user.role === 'content_editor') {
    const cv = await CourseVersion.findOne({ status: 'published' }).sort({ version: -1 });
    return cv?._id ?? null;
  }
  const classIds = await classIdsForUser(user);
  if (!classIds.length) return null;
  const assignments = await Assignment.find({ classId: { $in: classIds } }).select('courseVersionId');
  const cvIds = assignments.map((a) => a.courseVersionId);
  if (!cvIds.length) return null;
  const cv = await CourseVersion.findOne({ _id: { $in: cvIds }, status: 'published' }).sort({ version: -1 });
  return cv?._id ?? null;
}

async function assetsForBlock(blockId: Types.ObjectId) {
  const links = await BlockAsset.find({ blockId }).sort({ role: 1, orderIndex: 1 }).populate('assetId');
  return Promise.all(
    links
      .filter((l) => l.assetId)
      .map(async (l) => {
        const a = l.assetId as unknown as {
          _id: Types.ObjectId;
          file: string;
          kind: string;
          mime: string;
          caption: string | null;
          transcript: string | null;
          rightsStatus: string;
        };
        return {
          id: String(a._id),
          file: a.file,
          kind: a.kind,
          mime: a.mime,
          role: l.role,
          caption: a.caption,
          transcript: a.transcript,
          rightsStatus: a.rightsStatus,
          // Native media local HTTP redirectdan o'tmaydi; R2 private qoladi, URL muddati config orqali boshqariladi.
          url: await directMediaUrl(a.file),
        };
      }),
  );
}

/** GET /api/course — kurs xaritasi + progress */
contentRouter.get(
  '/course',
  h(async (req, res) => {
    const user = req.auth!;
    const cvId = await accessibleVersionId(user);
    if (!cvId) {
      res.json({ course: null, message: 'Sizga hali biror kurs tayinlanmagan' });
      return;
    }

    const cv = await CourseVersion.findById(cvId).populate('courseId');
    const course = cv?.courseId as unknown as { _id: Types.ObjectId; code: string; title: string; subtitle: string };

    const allLessons = await Lesson.find({ courseVersionId: cvId }).sort({ orderIndex: 1 });
    const lessons = allLessons.filter((lesson) => isStudentVisibleLesson(lesson));
    const lessonById = new Map(allLessons.map((lesson) => [String(lesson._id), lesson]));
    const allBlocks = await Block.find({ lessonId: { $in: allLessons.map((lesson) => lesson._id) } }).sort({ orderIndex: 1 });
    const blocks = allBlocks.filter((block) => {
      const lesson = lessonById.get(String(block.lessonId));
      return !!lesson && isStudentVisibleBlock(lesson, block);
    });
    const blockIds = blocks.map((b) => b._id);
    const visibleBlockIds = new Set(blocks.map((block) => String(block._id)));
    const progressRows = blockIds.length
      ? await Progress.find({ userId: user.id, courseVersionId: cvId, blockId: { $in: blockIds } })
      : [];
    const progressByBlock = new Map(progressRows.map((p) => [String(p.blockId), p]));

    const lastPos = await LastPosition.findOne({ userId: user.id, courseVersionId: cvId });
    const lastBlockId = lastPos && visibleBlockIds.has(String(lastPos.blockId)) ? String(lastPos.blockId) : null;

    res.json({
      course: { id: String(course._id), code: course.code, title: course.title, subtitle: course.subtitle, version: cv!.version, courseVersionId: String(cvId) },
      lastBlockId,
      lessons: lessons.map((l) => {
        const own = blocks.filter((b) => String(b.lessonId) === String(l._id));
        return {
          id: String(l._id),
          order: l.orderIndex,
          declaredNumber: l.declaredNumber,
          title: l.title,
          blockCount: own.length,
          completed: own.filter((b) => progressByBlock.get(String(b._id))?.state === 'completed').length,
          blocks: own.map((b) => {
            const p = progressByBlock.get(String(b._id));
            return {
              id: String(b._id),
              order: b.orderIndex,
              type: b.type,
              title: b.title,
              needsReview: b.needsReview,
              state: p?.state ?? 'not_started',
              bestScore: p?.bestScore ?? null,
            };
          }),
        };
      }),
    });
  }),
);

/** GET /api/blocks/:id — blok tarkibi. To'g'ri javoblar HECH QACHON qaytarilmaydi. */
contentRouter.get(
  '/blocks/:id',
  h(async (req, res) => {
    const user = req.auth!;
    const blockId = req.params.id;
    const cvId = await accessibleVersionId(user);
    if (!cvId) throw forbidden('Kurs sizga tayinlanmagan');

    const block = await Block.findById(blockId);
    if (!block) throw notFound('Blok topilmadi');
    const lesson = await Lesson.findOne({ _id: block.lessonId, courseVersionId: cvId });
    if (!lesson || !isStudentVisibleBlock(lesson, block)) throw notFound('Blok sizga ochiq kurs versiyasida topilmadi');

    // is_correct maydoni schema darajasida select:false — clientga hech qachon ketmaydi
    const question = await Question.findOne({ blockId: block._id }).select('type prompt options');
    const options = question
      ? await Promise.all(
          question.options.map(async (o) => ({
            id: String(o._id),
            ordinal: o.ordinal,
            text: o.text,
            imageUrl: o.imageAssetId ? await mediaUrlByAssetId(String(o.imageAssetId)) : null,
          })),
        )
      : [];

    const draftAttempt = await Attempt.findOne({ userId: user.id, blockId: block._id, status: 'draft' });
    const draftAnswer = draftAttempt
      ? await Answer.findOne({ attemptId: draftAttempt._id }).sort({ createdAt: -1 })
      : null;

    const best = await Progress.findOne({ userId: user.id, courseVersionId: cvId, blockId: block._id });

    const lessonsOrdered = (await Lesson.find({ courseVersionId: cvId }).sort({ orderIndex: 1 }))
      .filter((item) => isStudentVisibleLesson(item));
    const neighbours: string[] = [];
    for (const l of lessonsOrdered) {
      const bs = await Block.find({ lessonId: l._id }).sort({ orderIndex: 1 });
      neighbours.push(...bs.filter((b) => isStudentVisibleBlock(l, b)).map((b) => String(b._id)));
    }
    const idx = neighbours.indexOf(String(block._id));

    // Oxirgi pozitsiyani eslab qolamiz — "oxirgi blokdan davom etish"
    await LastPosition.updateOne(
      { userId: user.id, courseVersionId: cvId },
      { blockId: block._id, updatedAt: new Date() },
      { upsert: true },
    );
    if (!best) {
      await Progress.updateOne(
        { userId: user.id, courseVersionId: cvId, blockId: block._id },
        { $setOnInsert: { state: 'in_progress' } },
        { upsert: true },
      );
    }

    res.json({
      block: {
        id: String(block._id),
        type: block.type,
        title: block.title,
        body: block.body,
        sourceSlide: block.sourceSlide,
        needsReview: block.needsReview,
        reviewNote: block.reviewNote,
        lesson: {
          id: String(lesson._id),
          title: lesson.title,
          order: lesson.orderIndex,
          declaredNumber: lesson.declaredNumber,
        },
      },
      assets: await assetsForBlock(block._id),
      question: question ? { id: String(question._id), type: question.type, prompt: question.prompt, options } : null,
      draftPayload: draftAnswer?.payload ?? null,
      progress: { state: best?.state ?? 'in_progress', bestScore: best?.bestScore ?? null },
      navigation: {
        prevBlockId: idx > 0 ? neighbours[idx - 1] : null,
        nextBlockId: idx >= 0 && idx < neighbours.length - 1 ? neighbours[idx + 1] : null,
        position: idx + 1,
        total: neighbours.length,
      },
    });
  }),
);

/** POST /api/blocks/:id/complete — nazariya/amaliyot bloklarini "o'rganildi" deb belgilash */
contentRouter.post(
  '/blocks/:id/complete',
  h(async (req, res) => {
    const user = req.auth!;
    const blockId = req.params.id;
    const cvId = await accessibleVersionId(user);
    if (!cvId) throw forbidden('Kurs sizga tayinlanmagan');

    const block = await Block.findById(blockId);
    if (!block) throw notFound('Blok topilmadi');
    const lesson = await Lesson.findOne({ _id: block.lessonId, courseVersionId: cvId });
    if (!lesson || !isStudentVisibleBlock(lesson, block)) throw notFound('Blok topilmadi');

    await Progress.updateOne(
      { userId: user.id, courseVersionId: cvId, blockId: block._id },
      { state: 'completed', updatedAt: new Date() },
      { upsert: true },
    );
    res.json({ ok: true, state: 'completed' });
  }),
);

/** GET /api/progress — o'quvchi progressi bo'yicha xulosa */
contentRouter.get(
  '/progress',
  h(async (req, res) => {
    const user = req.auth!;
    const cvId = await accessibleVersionId(user);
    if (!cvId) {
      res.json({ summary: null });
      return;
    }

    const allLessons = await Lesson.find({ courseVersionId: cvId }).sort({ orderIndex: 1 });
    const lessons = allLessons.filter((lesson) => isStudentVisibleLesson(lesson));
    const lessonById = new Map(allLessons.map((lesson) => [String(lesson._id), lesson]));
    const allBlocks = await Block.find({ lessonId: { $in: allLessons.map((lesson) => lesson._id) } });
    const blocks = allBlocks.filter((block) => {
      const lesson = lessonById.get(String(block.lessonId));
      return !!lesson && isStudentVisibleBlock(lesson, block);
    });
    const blockIds = blocks.map((block) => block._id);
    const total = blocks.length;

    const progressRows = blockIds.length
      ? await Progress.find({ userId: user.id, courseVersionId: cvId, blockId: { $in: blockIds } })
      : [];
    const done = progressRows.filter((p) => p.state === 'completed').length;
    const progressByBlock = new Map(progressRows.map((p) => [String(p.blockId), p]));

    const attempts = await Attempt.find({ userId: user.id, status: 'submitted', questionId: { $ne: null }, blockId: { $in: blockIds } }).select('_id');
    const answers = await Answer.find({ attemptId: { $in: attempts.map((a) => a._id) } });
    const correct = answers.filter((a) => a.isCorrect).length;

    const perLesson = lessons.map((l) => {
      const own = blocks.filter((b) => String(b.lessonId) === String(l._id));
      const doneInLesson = own.filter((b) => progressByBlock.get(String(b._id))?.state === 'completed').length;
      return { lesson: l.title, orderIndex: l.orderIndex, total: own.length, done: doneInLesson };
    });

    res.json({
      summary: { totalBlocks: total, completedBlocks: done, answeredQuestions: attempts.length, correctAnswers: correct },
      perLesson,
    });
  }),
);

/** GET /api/notifications */
contentRouter.get(
  '/notifications',
  h(async (req, res) => {
    const user = req.auth!;
    const notifications = await Notification.find({ userId: user.id }).sort({ createdAt: -1 }).limit(50);
    const unread = await Notification.countDocuments({ userId: user.id, readAt: null });
    res.json({
      notifications: notifications.map((n) => ({
        id: String(n._id),
        kind: n.kind,
        title: n.title,
        body: n.body,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
      unread,
    });
  }),
);

/** POST /api/notifications/:id/read */
contentRouter.post(
  '/notifications/:id/read',
  h(async (req, res) => {
    const user = req.auth!;
    await Notification.updateOne({ _id: req.params.id, userId: user.id }, { readAt: new Date() });
    res.json({ ok: true });
  }),
);
