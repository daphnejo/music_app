import { Schema, model } from 'mongoose';

const courseSchema = new Schema({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: null },
  language: { type: String, default: 'uz' },
});
export const Course = model('Course', courseSchema);

export const COURSE_VERSION_STATUSES = ['draft', 'review', 'published', 'archived'] as const;

// Nashr atomik: yangi o'zgarmas versiya yaratiladi, eski urinishlar o'z course_version_id'siga bog'liq qoladi.
const courseVersionSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    version: { type: Number, required: true },
    status: { type: String, enum: COURSE_VERSION_STATUSES, required: true, default: 'draft' },
    notes: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    publishedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
courseVersionSchema.index({ courseId: 1, version: 1 }, { unique: true });
courseVersionSchema.index({ courseId: 1, status: 1 });
export const CourseVersion = model('CourseVersion', courseVersionSchema);

const lessonSchema = new Schema({
  courseVersionId: { type: Schema.Types.ObjectId, ref: 'CourseVersion', required: true },
  orderIndex: { type: Number, required: true },
  declaredNumber: { type: Number, default: null },
  title: { type: String, required: true },
});
lessonSchema.index({ courseVersionId: 1, orderIndex: 1 }, { unique: true });
export const Lesson = model('Lesson', lessonSchema);

export const BLOCK_TYPES = [
  'theory',
  'single_choice',
  'audio_single_choice',
  'image_choice',
  'sequence_order',
  'missing_fragment',
  'notation_input',
  'practice_acknowledgement',
] as const;

const blockSchema = new Schema({
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  orderIndex: { type: Number, required: true },
  type: { type: String, enum: BLOCK_TYPES, required: true },
  title: { type: String, required: true },
  body: { type: Schema.Types.Mixed, default: [] }, // avvalgi body_json o'rniga to'g'ridan-to'g'ri hujjat
  sourceSlide: { type: Number, default: null },
  needsReview: { type: Boolean, default: false },
  reviewNote: { type: String, default: null },
});
blockSchema.index({ lessonId: 1, orderIndex: 1 }, { unique: true });
export const Block = model('Block', blockSchema);
