import { Schema, model } from 'mongoose';

const teacherCommentSchema = new Schema(
  {
    attemptId: { type: Schema.Types.ObjectId, ref: 'Attempt', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
export const TeacherComment = model('TeacherComment', teacherCommentSchema);

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
notificationSchema.index({ userId: 1, readAt: 1 });
export const Notification = model('Notification', notificationSchema);

const auditLogSchema = new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  action: { type: String, required: true },
  entity: { type: String, default: null },
  entityId: { type: String, default: null },
  meta: { type: Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
});
auditLogSchema.index({ actorId: 1, createdAt: 1 });
export const AuditLog = model('AuditLog', auditLogSchema);

// PII'siz, javob mazmunisiz analitika (loyihaning Step 9 talabi)
const analyticsEventSchema = new Schema({
  userHash: { type: String, required: true },
  name: { type: String, required: true },
  props: { type: Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
});
analyticsEventSchema.index({ name: 1, createdAt: 1 });
export const AnalyticsEvent = model('AnalyticsEvent', analyticsEventSchema);
