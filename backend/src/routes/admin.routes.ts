// Admin panel va kontent muharriri: daraxt, qoralamalar, review/publish/archive, media, foydalanuvchilar, audit log.
import { Router } from 'express';
import mongoose from 'mongoose';
import { h, badRequest, conflict, notFound } from '../errors.ts';
import { requireAuth } from '../middleware/auth.middleware.ts';
import { requireRole, hashPassword } from '../auth.ts';
import { audit } from '../audit.ts';
import {
  CourseVersion,
  Lesson,
  Block,
  BlockAsset,
  Question,
  Asset,
  RIGHTS_STATUSES,
  User,
  ROLES,
  RefreshToken,
  AuditLog,
} from '../models/index.ts';

export const adminRouter = Router();
adminRouter.use(requireAuth);

/** GET /api/admin/content/tree — barcha kurs versiyalari daraxti */
adminRouter.get(
  '/content/tree',
  h(async (req, res) => {
    requireRole(req.auth, 'content_editor', 'admin');

    const versions = await CourseVersion.find().sort({ version: -1 });
    const withCounts = await Promise.all(
      versions.map(async (cv) => {
        const lessons = await Lesson.find({ courseVersionId: cv._id }).select('_id');
        const lessonIds = lessons.map((l) => l._id);
        const blocks = await Block.find({ lessonId: { $in: lessonIds } }).select('needsReview');
        return {
          id: String(cv._id),
          version: cv.version,
          status: cv.status,
          notes: cv.notes,
          createdAt: cv.createdAt,
          publishedAt: cv.publishedAt,
          lessons: lessons.length,
          blocks: blocks.length,
          needsReview: blocks.filter((b) => b.needsReview).length,
        };
      }),
    );
    res.json({ versions: withCounts });
  }),
);

/** GET /api/admin/versions/:id/lessons — versiyaning darslari va bloklari */
adminRouter.get(
  '/versions/:id/lessons',
  h(async (req, res) => {
    requireRole(req.auth, 'content_editor', 'admin');
    const cvId = req.params.id;
    const version = await CourseVersion.findById(cvId);
    if (!version) throw notFound('Versiya topilmadi');

    const lessons = await Lesson.find({ courseVersionId: cvId }).sort({ orderIndex: 1 });
    const blocks = await Block.find({ lessonId: { $in: lessons.map((l) => l._id) } }).sort({ orderIndex: 1 });

    res.json({
      version,
      lessons: lessons.map((l) => ({
        id: String(l._id),
        orderIndex: l.orderIndex,
        declaredNumber: l.declaredNumber,
        title: l.title,
        blocks: blocks
          .filter((b) => String(b.lessonId) === String(l._id))
          .map((b) => ({
            id: String(b._id),
            orderIndex: b.orderIndex,
            type: b.type,
            title: b.title,
            sourceSlide: b.sourceSlide,
            needsReview: b.needsReview,
            reviewNote: b.reviewNote,
          })),
      })),
    });
  }),
);

/** PATCH /api/admin/blocks/:id — blokni tahrirlash (faqat nashr qilinmagan versiyada) */
adminRouter.patch(
  '/blocks/:id',
  h(async (req, res) => {
    const user = requireRole(req.auth, 'content_editor', 'admin');
    const blockId = req.params.id;
    const body = req.body as { title?: string; body?: unknown[]; reviewNote?: string; needsReview?: boolean };

    const block = await Block.findById(blockId);
    if (!block) throw notFound('Blok topilmadi');
    const lesson = await Lesson.findById(block.lessonId);
    const cv = lesson ? await CourseVersion.findById(lesson.courseVersionId) : null;
    if (!cv) throw notFound('Blok topilmadi');
    if (cv.status === 'published' || cv.status === 'archived') {
      throw conflict("Nashr qilingan versiya o'zgarmas. Yangi versiya qoralamasini yarating.");
    }

    if (body.title !== undefined) block.title = body.title;
    if (body.body !== undefined) block.body = body.body;
    if (body.reviewNote !== undefined) block.reviewNote = body.reviewNote;
    if (body.needsReview !== undefined) block.needsReview = body.needsReview;
    await block.save();

    await audit(user.id, 'content.block.update', 'block', blockId, body);
    res.json({ ok: true });
  }),
);

/**
 * POST /api/admin/versions/:id/clone — yangi versiya qoralamasi.
 * Darslar/bloklar/savollar/variantlarni nusxalaydi. Eski urinishlar eski versiyada qoladi.
 */
adminRouter.post(
  '/versions/:id/clone',
  h(async (req, res) => {
    const user = requireRole(req.auth, 'content_editor', 'admin');
    const srcId = req.params.id;
    const src = await CourseVersion.findById(srcId);
    if (!src) throw notFound('Versiya topilmadi');

    const session = await mongoose.startSession();
    let newCvId: mongoose.Types.ObjectId;
    try {
      newCvId = await session.withTransaction(async () => {
        const maxVersion = await CourseVersion.findOne({ courseId: src.courseId }).sort({ version: -1 }).session(session);
        const next = (maxVersion?.version ?? 0) + 1;
        const [newCv] = await CourseVersion.create(
          [
            {
              courseId: src.courseId,
              version: next,
              status: 'draft',
              notes: `Qoralama, ${src.version}-versiyadan klonlangan`,
              createdBy: user.id,
            },
          ],
          { session },
        );

        const lessons = await Lesson.find({ courseVersionId: srcId }).sort({ orderIndex: 1 }).session(session);
        for (const l of lessons) {
          const [newLesson] = await Lesson.create(
            [{ courseVersionId: newCv._id, orderIndex: l.orderIndex, declaredNumber: l.declaredNumber, title: l.title }],
            { session },
          );

          const blocks = await Block.find({ lessonId: l._id }).sort({ orderIndex: 1 }).session(session);
          for (const b of blocks) {
            const [newBlock] = await Block.create(
              [
                {
                  lessonId: newLesson._id,
                  orderIndex: b.orderIndex,
                  type: b.type,
                  title: b.title,
                  body: b.body,
                  sourceSlide: b.sourceSlide,
                  needsReview: b.needsReview,
                  reviewNote: b.reviewNote,
                },
              ],
              { session },
            );

            const blockAssets = await BlockAsset.find({ blockId: b._id }).session(session);
            if (blockAssets.length) {
              await BlockAsset.insertMany(
                blockAssets.map((ba) => ({ blockId: newBlock._id, assetId: ba.assetId, role: ba.role, orderIndex: ba.orderIndex })),
                { session },
              );
            }

            const q = await Question.findOne({ blockId: b._id }).select('+options.isCorrect').session(session);
            if (q) {
              await Question.create(
                [
                  {
                    blockId: newBlock._id,
                    type: q.type,
                    prompt: q.prompt,
                    explanation: q.explanation,
                    maxScore: q.maxScore,
                    options: q.options,
                  },
                ],
                { session },
              );
            }
          }
        }
        return newCv._id;
      });
    } finally {
      await session.endSession();
    }

    await audit(user.id, 'content.version.clone', 'course_version', newCvId!, { from: srcId });
    res.status(201).json({ id: String(newCvId!) });
  }),
);

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['review'],
  review: ['draft', 'published'],
  published: ['archived'],
  archived: [],
};

/** POST /api/admin/versions/:id/status — draft → review → published → archived */
adminRouter.post(
  '/versions/:id/status',
  h(async (req, res) => {
    const user = requireRole(req.auth, 'content_editor', 'admin');
    const cvId = req.params.id;
    const target = String(req.body?.status ?? '');

    const cv = await CourseVersion.findById(cvId);
    if (!cv) throw notFound('Versiya topilmadi');
    if (!STATUS_TRANSITIONS[cv.status]?.includes(target)) {
      throw badRequest(`${cv.status} \u2192 ${target} o'tishga ruxsat yo'q`);
    }
    // Faqat admin nashr qila oladi: content_editor faqat review'ga yuboradi
    if (target === 'published' && user.role !== 'admin') {
      throw conflict('Nashr qilish faqat admin roliga ruxsat etilgan');
    }

    const fromStatus = cv.status;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        if (target === 'published') {
          // Atomik: eski nashr qilingan versiya arxivga, yangisi joriy nashr bo'ladi
          await CourseVersion.updateMany(
            { courseId: cv.courseId, status: 'published' },
            { status: 'archived', archivedAt: new Date() },
            { session },
          );
          cv.status = 'published';
          cv.publishedAt = new Date();
        } else if (target === 'archived') {
          cv.status = 'archived';
          cv.archivedAt = new Date();
        } else {
          cv.status = target as typeof cv.status;
        }
        await cv.save({ session });
      });
    } finally {
      await session.endSession();
    }

    await audit(user.id, `content.version.${target}`, 'course_version', cvId, { from: fromStatus });
    res.json({ ok: true, status: target });
  }),
);

/** GET /api/admin/assets — huquq holati bilan mediateka */
adminRouter.get(
  '/assets',
  h(async (req, res) => {
    requireRole(req.auth, 'content_editor', 'admin');
    const rights = typeof req.query.rights === 'string' ? req.query.rights : undefined;

    const filter = rights ? { rightsStatus: rights } : {};
    const assets = await Asset.find(filter).sort({ kind: 1, file: 1 });
    const summaryAgg = await Asset.aggregate([{ $group: { _id: '$rightsStatus', n: { $sum: 1 } } }]);

    res.json({
      assets: assets.map((a) => ({
        id: String(a._id),
        file: a.file,
        kind: a.kind,
        mime: a.mime,
        bytes: a.bytes,
        rightsStatus: a.rightsStatus,
        rightsNote: a.rightsNote,
        caption: a.caption,
      })),
      summary: summaryAgg.map((s) => ({ rightsStatus: s._id, n: s.n })),
    });
  }),
);

/** PATCH /api/admin/assets/:id — huquq holati, transkript, izoh */
adminRouter.patch(
  '/assets/:id',
  h(async (req, res) => {
    const user = requireRole(req.auth, 'content_editor', 'admin');
    const id = req.params.id;
    const body = req.body as { rightsStatus?: string; rightsNote?: string; caption?: string; transcript?: string };

    if (body.rightsStatus && !(RIGHTS_STATUSES as readonly string[]).includes(body.rightsStatus)) {
      throw badRequest("Noto'g'ri huquq holati");
    }
    const asset = await Asset.findById(id);
    if (!asset) throw notFound('Fayl topilmadi');
    if (body.rightsStatus) asset.rightsStatus = body.rightsStatus as typeof asset.rightsStatus;
    if (body.rightsNote !== undefined) asset.rightsNote = body.rightsNote;
    if (body.caption !== undefined) asset.caption = body.caption;
    if (body.transcript !== undefined) asset.transcript = body.transcript;
    await asset.save();

    await audit(user.id, 'media.asset.update', 'asset', id, body);
    res.json({ ok: true });
  }),
);

/** GET /api/admin/users */
adminRouter.get(
  '/users',
  h(async (req, res) => {
    requireRole(req.auth, 'admin');
    const users = await User.find({ deletedAt: null }).sort({ role: 1, fullName: 1 }).populate('orgId');
    res.json({
      users: users.map((u) => ({
        id: String(u._id),
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        createdAt: u.createdAt,
        org: (u.orgId as unknown as { name?: string })?.name ?? null,
      })),
    });
  }),
);

/** POST /api/admin/users */
adminRouter.post(
  '/users',
  h(async (req, res) => {
    const actor = requireRole(req.auth, 'admin');
    const email = String(req.body?.email ?? '').trim();
    const fullName = String(req.body?.fullName ?? '').trim();
    const role = String(req.body?.role ?? '');
    const password = String(req.body?.password ?? '');

    if (!email.includes('@')) throw badRequest("Email noto'g'ri");
    if (!fullName) throw badRequest('Ismni kiriting');
    if (!(ROLES as readonly string[]).includes(role)) throw badRequest("Noto'g'ri rol");
    if (password.length < 8) throw badRequest("Parol kamida 8 belgi bo'lishi kerak");

    const exists = await User.findOne({ emailLower: email.toLowerCase(), deletedAt: null });
    if (exists) throw conflict('Bu email bilan foydalanuvchi allaqachon mavjud');

    const user = await User.create({
      orgId: req.body?.orgId ?? actor.orgId,
      email,
      passwordHash: hashPassword(password),
      fullName,
      role,
    });
    await audit(actor.id, 'user.create', 'user', user._id, { role });
    res.status(201).json({ id: String(user._id) });
  }),
);

/** PATCH /api/admin/users/:id/role */
adminRouter.patch(
  '/users/:id/role',
  h(async (req, res) => {
    const actor = requireRole(req.auth, 'admin');
    const id = req.params.id;
    const role = String(req.body?.role ?? '');
    if (!(ROLES as readonly string[]).includes(role)) throw badRequest("Noto'g'ri rol");
    if (id === actor.id) throw badRequest("O'zingizning rolingizni o'zgartira olmaysiz");

    const target = await User.findOne({ _id: id, deletedAt: null });
    if (!target) throw notFound('Foydalanuvchi topilmadi');

    target.role = role as typeof target.role;
    await target.save();
    await RefreshToken.updateMany({ userId: id, revokedAt: null }, { revokedAt: new Date() }); // rol o'zgarsa — barcha sessiyalar bekor
    await audit(actor.id, 'user.role.change', 'user', id, { role });
    res.json({ ok: true });
  }),
);

/** GET /api/admin/audit */
adminRouter.get(
  '/audit',
  h(async (req, res) => {
    requireRole(req.auth, 'admin');
    const entries = await AuditLog.find().sort({ createdAt: -1 }).limit(200).populate('actorId');
    res.json({
      entries: entries.map((e) => ({
        id: String(e._id),
        action: e.action,
        entity: e.entity,
        entityId: e.entityId,
        meta: e.meta,
        createdAt: e.createdAt,
        actor: (e.actorId as unknown as { fullName?: string })?.fullName ?? null,
      })),
    });
  }),
);

/** GET /api/admin/review-queue — metodist kutayotgan hamma narsa */
adminRouter.get(
  '/review-queue',
  h(async (req, res) => {
    requireRole(req.auth, 'content_editor', 'admin');

    const blocks = await Block.find({ needsReview: true }).populate('lessonId');
    const withContext = await Promise.all(
      blocks.map(async (b) => {
        const lesson = b.lessonId as unknown as { _id: string; title: string; orderIndex: number; courseVersionId: string };
        const cv = lesson ? await CourseVersion.findById(lesson.courseVersionId) : null;
        return {
          id: String(b._id),
          title: b.title,
          type: b.type,
          sourceSlide: b.sourceSlide,
          reviewNote: b.reviewNote,
          lesson: lesson?.title ?? null,
          version: cv?.version ?? null,
          status: cv?.status ?? null,
        };
      }),
    );
    const unknownRights = await Asset.countDocuments({ rightsStatus: 'unknown' });

    res.json({
      blocksNeedingReview: withContext,
      assetsWithUnknownRights: unknownRights,
      note: "Metodist tasdiqlamagan bloklar va media nashr qilishga loyiha siyosati bilan bloklangan.",
    });
  }),
);
