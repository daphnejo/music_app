import { Router } from 'express';
import { h } from '../errors.ts';
import { requireAuth } from '../middleware/auth.middleware.ts';
import { accessibleVersionId } from './content.routes.ts';
import { isStudentVisibleBlock, isStudentVisibleLesson } from '../student-content.ts';
import { Lesson, Block, Progress, Attempt, Answer } from '../models/index.ts';

export const progressRouter = Router();
progressRouter.use(requireAuth);

/**
 * GET /api/progress/summary
 * Studentga ko'rsatiladigan progress statistikasi.
 * Metodist tasdig'ini kutayotgan bloklardagi eski/legacy urinishlar
 * test aniqligi va javoblar soniga kiritilmaydi.
 */
progressRouter.get(
  '/progress/summary',
  h(async (req, res) => {
    const user = req.auth!;
    const cvId = await accessibleVersionId(user);
    if (!cvId) {
      res.json({ summary: null, perLesson: [] });
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
    const reviewedBlockIds = blocks.filter((block) => !block.needsReview).map((block) => block._id);

    const progressRows = blockIds.length
      ? await Progress.find({
          userId: user.id,
          courseVersionId: cvId,
          blockId: { $in: blockIds },
        })
      : [];
    const progressByBlock = new Map(progressRows.map((progress) => [String(progress.blockId), progress]));
    const completedBlocks = progressRows.filter((progress) => progress.state === 'completed').length;

    const attempts = reviewedBlockIds.length
      ? await Attempt.find({
          userId: user.id,
          courseVersionId: cvId,
          status: 'submitted',
          questionId: { $ne: null },
          blockId: { $in: reviewedBlockIds },
        }).select('_id')
      : [];
    const answers = attempts.length
      ? await Answer.find({ attemptId: { $in: attempts.map((attempt) => attempt._id) } })
      : [];
    const correctAnswers = answers.filter((answer) => answer.isCorrect === true).length;

    const perLesson = lessons.map((lesson) => {
      const ownBlocks = blocks.filter((block) => String(block.lessonId) === String(lesson._id));
      const done = ownBlocks.filter((block) => progressByBlock.get(String(block._id))?.state === 'completed').length;
      return {
        lesson: lesson.title,
        orderIndex: lesson.orderIndex,
        total: ownBlocks.length,
        done,
      };
    });

    res.json({
      summary: {
        totalBlocks: blocks.length,
        completedBlocks,
        answeredQuestions: attempts.length,
        correctAnswers,
      },
      perLesson,
    });
  }),
);
