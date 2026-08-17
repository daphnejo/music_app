export type BlockState = 'not_started' | 'in_progress' | 'completed';

export type CourseBlockSummary = {
  id: string;
  order: number;
  type: string;
  title: string;
  needsReview: boolean;
  state: BlockState;
  bestScore: number | null;
};

export type CourseLessonSummary = {
  id: string;
  order: number;
  declaredNumber: number | null;
  title: string;
  blockCount: number;
  completed: number;
  blocks: CourseBlockSummary[];
};

export type CourseMapResponse = {
  course: null | {
    id: string;
    code: string;
    title: string;
    subtitle: string | null;
    version: number;
    courseVersionId: string;
  };
  lastBlockId: string | null;
  lessons: CourseLessonSummary[];
  message?: string;
};

export type BlockAsset = {
  id: string;
  file: string;
  kind: 'audio' | 'video' | 'image';
  mime: string;
  role: 'audio' | 'video' | 'image';
  caption: string | null;
  transcript: string | null;
  rightsStatus: string;
  url: string;
};

export type BlockDetailResponse = {
  block: {
    id: string;
    type: string;
    title: string;
    body: unknown;
    sourceSlide: number | null;
    needsReview: boolean;
    reviewNote: string | null;
    lesson: { id: string; title: string; order: number; declaredNumber: number | null };
  };
  assets: BlockAsset[];
  question: null | {
    id: string;
    type: string;
    prompt: string;
    options: Array<{
      id: string;
      ordinal: number;
      text: string;
      imageUrl: string | null;
    }>;
  };
  draftPayload: unknown;
  progress: { state: BlockState; bestScore: number | null };
  navigation: {
    prevBlockId: string | null;
    nextBlockId: string | null;
    position: number;
    total: number;
  };
};

export function lessonProgress(lesson: CourseLessonSummary): number {
  if (!lesson.blockCount) return 0;
  return Math.round((lesson.completed / lesson.blockCount) * 100);
}
