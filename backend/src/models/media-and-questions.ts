import { Schema, model } from 'mongoose';

export const ASSET_KINDS = ['audio', 'video', 'image'] as const;
export const RIGHTS_STATUSES = ['unknown', 'cleared', 'restricted'] as const;

const assetSchema = new Schema(
  {
    // R2 (S3-mos) bucket ichidagi object key, masalan "media/audio12.m4a"
    file: { type: String, required: true, unique: true },
    kind: { type: String, enum: ASSET_KINDS, required: true },
    mime: { type: String, required: true },
    bytes: { type: Number, required: true },
    checksumSha256: { type: String, required: true },
    rightsStatus: { type: String, enum: RIGHTS_STATUSES, default: 'unknown' },
    rightsNote: { type: String, default: null },
    transcript: { type: String, default: null },
    caption: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
assetSchema.index({ rightsStatus: 1 });
export const Asset = model('Asset', assetSchema);

// Blok <-> asset bog'lanishi endi Block hujjatining o'zida saqlanishi ham mumkin,
// lekin alohida jadval sifatida qoldirilgan — ko'p-ko'pga bog'lanish va order_index kerak.
const blockAssetSchema = new Schema({
  blockId: { type: Schema.Types.ObjectId, ref: 'Block', required: true },
  assetId: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  role: { type: String, enum: ASSET_KINDS, required: true },
  orderIndex: { type: Number, default: 0 },
});
blockAssetSchema.index({ blockId: 1 });
export const BlockAsset = model('BlockAsset', blockAssetSchema);

const notationSchema = new Schema({
  blockId: { type: Schema.Types.ObjectId, ref: 'Block', required: true },
  format: { type: String, enum: ['musicxml', 'vexflow_json', 'svg_asset'], required: true },
  payload: { type: String, default: null },
  assetId: { type: Schema.Types.ObjectId, ref: 'Asset', default: null },
  altText: { type: String, required: true },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  verifiedAt: { type: Date, default: null },
});
export const Notation = model('Notation', notationSchema);

// Variant sub-hujjat sifatida Question ichiga joylashtirilgan (Mongo'da bu tabiiy —
// har doim question bilan birga o'qiladi, alohida so'rov shart emas).
const optionSchema = new Schema(
  {
    ordinal: { type: Number, required: true },
    text: { type: String, required: true },
    imageAssetId: { type: Schema.Types.ObjectId, ref: 'Asset', default: null },
    // is_correct HECH QACHON submit'gacha clientga berilmaydi — routes/assessment.ts'da select bilan olib tashlanadi
    isCorrect: { type: Boolean, default: false, select: false },
    sourceAction: { type: String, default: null },
  },
  { _id: true },
);

const questionSchema = new Schema({
  blockId: { type: Schema.Types.ObjectId, ref: 'Block', required: true, unique: true },
  type: { type: String, required: true },
  prompt: { type: String, required: true },
  explanation: { type: String, default: null },
  maxScore: { type: Number, default: 1 },
  options: { type: [optionSchema], default: [] },
});
export const Question = model('Question', questionSchema);
