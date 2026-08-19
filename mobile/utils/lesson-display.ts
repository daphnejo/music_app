type LessonDisplayLike = {
  declaredNumber?: number | null;
  title: string;
};

const FRIENDLY_TITLES: Record<number, string> = {
  1: 'Solfedjio bilan tanishamiz',
  2: 'Baland va past tovushlar',
  3: 'Klaviatura bilan tanishamiz',
  4: 'Nota yo‘li',
  5: 'Skripka kaliti',
  6: 'Tovush qator',
  7: 'Oktava',
};

export function childLessonTitle(lesson: LessonDisplayLike): string {
  if (lesson.declaredNumber && FRIENDLY_TITLES[lesson.declaredNumber]) {
    return FRIENDLY_TITLES[lesson.declaredNumber];
  }

  return lesson.title
    .replace(/^\s*registr\.\s*/i, '')
    .replace(/^\s*\d+\s*[-.]?\s*dars\s*[.:'’\-–—]*\s*/i, '')
    .replace(/[.\s]+$/, '')
    .trim();
}
