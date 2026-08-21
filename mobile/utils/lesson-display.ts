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
  8: 'Notalar cho‘zimlari',
  9: '2/4 o‘lchovi va takt',
  10: '3/4 o‘lchovi',
  11: 'Bas kaliti notalari',
  12: 'Repriza',
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
