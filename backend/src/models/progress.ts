import { Schema, model } from 'mongoose';

const assignmentSchema = new Schema(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    courseVersionId: { type: Schema.Types.ObjectId, ref: 'CourseVersion', required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', default: null },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    dueAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
assignmentSchema.index({ classId: 1 });
export const Assignment = model('Assignment', assignmentSchema);

const attemptSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    blockId: { type: Schema.Types.ObjectId, ref: 'Block', required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', default: null },
    courseVersionId: { type: Schema.Types.ObjectId, ref: 'CourseVersion', required: true },
    status: { type: String, enum: ['draft', 'submitted'], required: true },
    score: { type: Number, default: null },
    maxScore: { type: Number, default: null },
    idempotencyKey: { type: String, default: null },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
// Submitted attempts are efficiently covered by this compound index as well,
// while the partial index below enforces a single draft per user/block.
attemptSchema.index(
  { userId: 1, blockId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
);
// Foydalanuvchida blok uchun faqat bitta qoralama bo'lishi mumkin.
attemptSchema.index(
  { userId: 1, blockId: 1 },
  { unique: true, partialFilterExpression: { status: 'draft' } },
);
export const Attempt = model('Attempt', attemptSchema);

const answerSchema = new Schema(
  {
    attemptId: { type: Schema.Types.ObjectId, ref: 'Attempt', required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    isCorrect: { type: Boolean, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
answerSchema.index({ attemptId: 1 });
export const Answer = model('Answer', answerSchema);

const progressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseVersionId: { type: Schema.Types.ObjectId, ref: 'CourseVersion', required: true },
    blockId: { type: Schema.Types.ObjectId, ref: 'Block', required: true },
    state: { type: String, enum: ['not_started', 'in_progress', 'completed'], required: true },
    bestScore: { type: Number, default: null },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);
progressSchema.index({ userId: 1, courseVersionId: 1, blockId: 1 }, { unique: true });
export const Progress = model('Progress', progressSchema);

const lastPositionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseVersionId: { type: Schema.Types.ObjectId, ref: 'CourseVersion', required: true },
    blockId: { type: Schema.Types.ObjectId, ref: 'Block', required: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);
lastPositionSchema.index({ userId: 1, courseVersionId: 1 }, { unique: true });
export const LastPosition = model('LastPosition', lastPositionSchema);
