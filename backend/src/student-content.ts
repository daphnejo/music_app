type LessonLike = {
  declaredNumber?: number | null;
};

type BlockLike = {
  sourceSlide?: number | null;
};

/**
 * Student-facing content curation.
 * Raw imported source stays untouched; this only decides what the learner sees.
 */
export function isStudentVisibleLesson(lesson: LessonLike): boolean {
  return lesson.declaredNumber !== 0;
}

export function isStudentVisibleBlock(lesson: LessonLike, block: BlockLike): boolean {
  if (!isStudentVisibleLesson(lesson)) return false;

  // User-approved curation: lesson 1 starts from source slide 3.
  if (lesson.declaredNumber === 1 && block.sourceSlide === 2) return false;

  return true;
}
