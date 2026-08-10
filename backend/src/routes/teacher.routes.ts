import { Router } from 'express';
import { h, badRequest, forbidden, notFound } from '../errors.ts';
import { requireAuth } from '../middleware/auth.middleware.ts';
import { requireRole, classIdsForUser, canViewStudent } from '../auth.ts';
import { audit } from '../audit.ts';
import {
  Class,
  Enrollment,
  User,
  Progress,
  Attempt,
  Answer,
  Block,
  Lesson,
  CourseVersion,
  TeacherComment,
  Notification,
  Assignment,
} from '../models/index.ts';

export const teacherRouter = Router();
teacherRouter.use(requireAuth);

/** GET /api/teacher/classes — faqat o'zining sinflari (admin uchun — hammasi) */
teacherRouter.get(
  '/classes',
  h(async (req, res) => {
    const user = requireRole(req.auth, 'teacher', 'admin');
    const ids = await classIdsForUser(user);
    if (!ids.length) return res.json({ classes: [] });

    const classes = await Class.find({ _id: { $in: ids }, deletedAt: null }).sort({ name: 1 });
    const counts = await Enrollment.aggregate([
      { $match: { classId: { $in: classes.map((c) => c._id) } } },
      { $group: { _id: '$classId', n: { $sum: 1 } } },
    ]);
    const countByClass = new Map(counts.map((c) => [String(c._id), c.n]));

    res.json({
      classes: classes.map((c) => ({ id: String(c._id), name: c.name, students: countByClass.get(String(c._id)) ?? 0 })),
    });
  }),
);

/** GET /api/teacher/classes/:id/progress — sinf o'quvchilari progressi */
teacherRouter.get(
  '/classes/:id/progress',
  h(async (req, res) => {
    const user = requireRole(req.auth, 'teacher', 'admin');
    const classId = req.params.id;
    const myClassIds = (await classIdsForUser(user)).map(String);
    if (!myClassIds.includes(classId)) throw forbidden('Bu sizning sinfingiz emas');

    const enrollments = await Enrollment.find({ classId }).populate('userId');
    const students = enrollments
      .map((e) => e.userId as unknown as { _id: string; fullName: string; email: string; deletedAt: Date | null })
      .filter((u) => u && !u.deletedAt);

    const publishedBlockCount = await Block.countDocuments({
      lessonId: {
        $in: (
          await Lesson.find({
            courseVersionId: { $in: (await CourseVersion.find({ status: 'published' }).select('_id')).map((c) => c._id) },
          }).select('_id')
        ).map((l) => l._id),
      },
    });

    const rows = await Promise.all(
      students.map(async (st) => {
        const completed = await Progress.countDocuments({ userId: st._id, state: 'completed' });
        const progressRows = await Progress.find({ userId: st._id, state: 'completed' }).select('bestScore');
        const avgScore = progressRows.length
          ? progressRows.reduce((s, p) => s + (p.bestScore ?? 0), 0) / progressRows.length
          : null;

        const attempts = await Attempt.find({ userId: st._id, status: 'submitted', questionId: { $ne: null } }).select('_id');
        const answers = await Answer.find({ attemptId: { $in: attempts.map((a) => a._id) } });
        const correct = answers.filter((a) => a.isCorrect).length;

        return {
          id: String(st._id),
          fullName: st.fullName,
          email: st.email,
          completedBlocks: completed,
          totalBlocks: publishedBlockCount,
          avgScore,
          answeredQuestions: attempts.length,
          correctAnswers: correct,
        };
      }),
    );

    res.json({ classId, students: rows });
  }),
);

/** GET /api/teacher/students/:id/attempts — o'quvchining urinishlari (IDOR himoyasi) */
teacherRouter.get(
  '/students/:id/attempts',
  h(async (req, res) => {
    const user = requireRole(req.auth, 'teacher', 'admin');
    const studentId = req.params.id;
    if (!(await canViewStudent(user, studentId))) throw forbidden('Bu o\u2018quvchi sizning sinfingizda emas');

    const attempts = await Attempt.find({ userId: studentId, status: 'submitted' })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('blockId');

    const withDetails = await Promise.all(
      attempts.map(async (a) => {
        const block = a.blockId as unknown as { _id: string; title: string; lessonId: string };
        const lesson = block ? await Lesson.findById(block.lessonId).select('title') : null;
        const answer = await Answer.findOne({ attemptId: a._id }).sort({ createdAt: -1 });
        return {
          id: String(a._id),
          blockId: block ? String(block._id) : null,
          blockTitle: block?.title ?? null,
          lessonTitle: lesson?.title ?? null,
          score: a.score,
          maxScore: a.maxScore,
          submittedAt: a.submittedAt,
          isCorrect: answer?.isCorrect ?? null,
        };
      }),
    );

    const comments = await TeacherComment.find({ attemptId: { $in: attempts.map((a) => a._id) } }).populate('authorId');
    res.json({
      studentId,
      attempts: withDetails,
      comments: comments.map((c) => ({
        attemptId: String(c.attemptId),
        body: c.body,
        createdAt: c.createdAt,
        author: (c.authorId as unknown as { fullName: string })?.fullName ?? null,
      })),
    });
  }),
);

/** POST /api/teacher/attempts/:id/comment */
teacherRouter.post(
  '/attempts/:id/comment',
  h(async (req, res) => {
    const user = requireRole(req.auth, 'teacher', 'admin');
    const attemptId = req.params.id;
    const text = String(req.body?.body ?? '').trim();
    if (!text) throw badRequest('Izoh bo\u2018sh');

    const attempt = await Attempt.findById(attemptId);
    if (!attempt) throw notFound('Urinish topilmadi');
    if (!(await canViewStudent(user, String(attempt.userId)))) throw forbidden('Bu o\u2018quvchi sizning sinfingizda emas');

    await TeacherComment.create({ attemptId, authorId: user.id, body: text });
    await Notification.create({
      userId: attempt.userId,
      kind: 'teacher_comment',
      title: 'Yangi izoh',
      body: 'O\u2018qituvchi sizning javobingizga izoh qoldirdi',
    });
    await audit(user.id, 'teacher.comment', 'attempt', attemptId);
    res.status(201).json({ ok: true });
  }),
);

/** POST /api/teacher/assignments — kurs/darsni sinfga tayinlash */
teacherRouter.post(
  '/assignments',
  h(async (req, res) => {
    const user = requireRole(req.auth, 'teacher', 'admin');
    const classId = String(req.body?.classId ?? '');
    const cvId = String(req.body?.courseVersionId ?? '');
    if (!classId || !cvId) throw badRequest('classId va courseVersionId kerak');
    const myClassIds = (await classIdsForUser(user)).map(String);
    if (!myClassIds.includes(classId)) throw forbidden('Bu sizning sinfingiz emas');

    const cv = await CourseVersion.findById(cvId);
    if (!cv) throw notFound('Kurs versiyasi topilmadi');
    if (cv.status !== 'published') throw badRequest("Faqat nashr qilingan versiyani tayinlash mumkin");

    const assignment = await Assignment.create({
      classId,
      courseVersionId: cvId,
      lessonId: req.body?.lessonId ?? null,
      assignedBy: user.id,
      dueAt: req.body?.dueAt ?? null,
    });

    const enrollments = await Enrollment.find({ classId }).select('userId');
    await Notification.insertMany(
      enrollments.map((e) => ({
        userId: e.userId,
        kind: 'assignment',
        title: 'Yangi topshiriq',
        body: 'Sizga yangi kurs/dars tayinlandi',
      })),
    );
    await audit(user.id, 'assignment.create', 'assignment', assignment._id, { classId, cvId });
    res.status(201).json({ id: String(assignment._id) });
  }),
);
