import { Schema, model, type InferSchemaType, Types } from 'mongoose';

export const ROLES = ['student', 'teacher', 'content_editor', 'admin'] as const;
export type Role = (typeof ROLES)[number];

const organizationSchema = new Schema(
  {
    name: { type: String, required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
export const Organization = model('Organization', organizationSchema);

const userSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null },
    email: { type: String, required: true },
    emailLower: { type: String, required: true }, // case-insensitive unikal indeks uchun
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
userSchema.pre('validate', function (next) {
  if (this.email) this.emailLower = this.email.toLowerCase();
  next();
});
// Faqat o'chirilmagan foydalanuvchilar orasida email unikal (SQLite'dagi partial unique index'ga mos)
userSchema.index(
  { emailLower: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);
userSchema.index({ orgId: 1 });
export const User = model('User', userSchema);
export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

const classSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
classSchema.index({ orgId: 1 });
export const Class = model('Class', classSchema);

const enrollmentSchema = new Schema(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
enrollmentSchema.index({ classId: 1, userId: 1 }, { unique: true });
export const Enrollment = model('Enrollment', enrollmentSchema);

// Parolni tiklash (JWT bo'lsa ham, "unutgan parol" oqimi uchun token saqlanadi)
const passwordResetSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
});
export const PasswordReset = model('PasswordReset', passwordResetSchema);

// Login rate-limit uchun (TTL indeks bilan o'zi tozalanadi)
const loginAttemptSchema = new Schema({
  key: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 30 }, // 30 daqiqadan keyin o'chadi
});
loginAttemptSchema.index({ key: 1, createdAt: 1 });
export const LoginAttempt = model('LoginAttempt', loginAttemptSchema);

// JWT refresh tokenlarni invalidatsiya qilish uchun (logout / "barcha qurilmalardan chiqish")
const refreshTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true, unique: true },
  userAgent: { type: String, default: null },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});
refreshTokenSchema.index({ userId: 1 });
export const RefreshToken = model('RefreshToken', refreshTokenSchema);
