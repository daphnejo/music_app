import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDb, disconnectDb } from '../db.ts';
import {
  Asset,
  Course,
  CourseVersion,
  Lesson,
  Block,
  BlockAsset,
  Notation,
  Question,
  Assignment,
  Attempt,
  Answer,
  Progress,
  LastPosition,
  TeacherComment,
} from '../models/index.ts';

type Pack = { course: { code: string; title: string } };

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function main() {
  await connectDb();

  try {
    const pack = JSON.parse(readFileSync(resolve(ROOT, 'content/content-pack.json'), 'utf8')) as Pack;
    const course = await Course.findOne({ code: pack.course.code }).select('_id');

    const courseVersionIds = course
      ? (await CourseVersion.find({ courseId: course._id }).select('_id')).map((row) => row._id)
      : [];
    const lessonIds = (await Lesson.find({ courseVersionId: { $in: courseVersionIds } }).select('_id')).map(
      (row) => row._id,
    );
    const blockIds = (await Block.find({ lessonId: { $in: lessonIds } }).select('_id')).map((row) => row._id);
    const attemptIds = (
      await Attempt.find({
        $or: [{ courseVersionId: { $in: courseVersionIds } }, { blockId: { $in: blockIds } }],
      }).select('_id')
    ).map((row) => row._id);

    // User accounts, organizations, classes and enrollments are intentionally preserved.
    await TeacherComment.deleteMany({ attemptId: { $in: attemptIds } });
    await Answer.deleteMany({ attemptId: { $in: attemptIds } });
    await Attempt.deleteMany({ _id: { $in: attemptIds } });
    await Progress.deleteMany({ courseVersionId: { $in: courseVersionIds } });
    await LastPosition.deleteMany({ courseVersionId: { $in: courseVersionIds } });
    await Assignment.deleteMany({ courseVersionId: { $in: courseVersionIds } });

    await BlockAsset.deleteMany({ blockId: { $in: blockIds } });
    await Notation.deleteMany({ blockId: { $in: blockIds } });
    await Question.deleteMany({ blockId: { $in: blockIds } });
    await Block.deleteMany({ _id: { $in: blockIds } });
    await Lesson.deleteMany({ _id: { $in: lessonIds } });
    await CourseVersion.deleteMany({ _id: { $in: courseVersionIds } });

    if (course) await Course.deleteOne({ _id: course._id });

    // This project has one canonical material pack. Rebuild asset metadata only from its manifest.
    await Asset.deleteMany({});

    console.log('[content:reset] Eski o‘quv kontenti va unga bog‘liq progress tozalandi.');
    console.log(`[content:reset] Kurs: ${pack.course.title} (${pack.course.code})`);
    console.log(
      `[content:reset] O‘chirildi: versions=${courseVersionIds.length}, lessons=${lessonIds.length}, blocks=${blockIds.length}, attempts=${attemptIds.length}`,
    );
    console.log('[content:reset] Userlar, sinflar va enrollmentlar saqlandi.');
  } finally {
    await disconnectDb();
  }
}

main().catch((err) => {
  console.error('[content:reset] xato:', err);
  process.exit(1);
});
