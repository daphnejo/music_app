export type LessonStatus = 'completed' | 'active' | 'locked';

export type Lesson = {
  id: string;
  number: number;
  title: string;
  description: string;
  progress: number;
  durationMinutes: number;
  status: LessonStatus;
  sections: Array<{
    id: string;
    type: 'theory' | 'audio' | 'video' | 'practice' | 'quiz';
    title: string;
    description: string;
  }>;
};

export type PracticeCategory = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
};
