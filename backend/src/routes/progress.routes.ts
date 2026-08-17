import { Router } from 'express';
import { h, forbidden } from '../errors.ts';
import { requireAuth } from '../middleware/auth.middleware.ts';
import { accessibleVersionId } from './content.routes.ts';
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

    const lessons = await Lesson.find({ courseVersionId: cvId }).sort({ orderIndex: 1 });
    const lessonIds = lessons.map((lesson) => lesson._id);
    const blocks = await Block.find({ lessonId: { $in: lessonIds } });
    const blockIds = blocks.map((block) => block._id);
    const reviewedBlockIds = blocks.filter((block) => !block.needsReview).map((block) => block._id);

    const progressRows = await Progress.find({
      userId: user.id,
      courseVersionId: cvId,
      blockId: { $in: blockIds },
    });
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
