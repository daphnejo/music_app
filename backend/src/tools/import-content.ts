// Content-pack.json va asset-manifest.json'ni MongoDB'ga import qiladi. Idempotent:
// qayta ishga tushirish dublikat yaratmaydi (course_versions'da version=1 borligini tekshiradi).
// Ishga tushirish: npm run content:import
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDb, disconnectDb } from '../db.ts';
import { audit } from '../audit.ts';
import {
  Asset,
  Organization,
  User,
  Class,
  Enrollment,
  Course,
  CourseVersion,
  Lesson,
  Block,
  BlockAsset,
  Question,
  Assignment,
} from '../models/index.ts';
import { hashPassword } from '../auth.ts';

type PackOption = { ordinal: number; text: string; image: string | null; isCorrect: boolean; sourceAction: string };
type PackBlock = {
  sourceSlide: number;
  type: string;
  title: string;
  body: string[];
  audio: string[];
  video: string[];
  images: string[];
  needsMethodistReview: boolean;
  reviewNote: string | null;
  question?: { prompt: string; options: PackOption[] };
  unresolvedOptions?: PackOption[];
};
type PackLesson = { order: number; declaredNumber: number; title: string; slides: number[]; blocks: PackBlock[] };
type Pack = {
  course: { code: string; title: string; subtitle: string; language: string };
  lessons: PackLesson[];
  methodistTodos: string[];
};
type ManifestAsset = {
  file: string;
  kind: string;
  mime: string;
  bytes: number;
  checksumSha256: string;
  rightsStatus: string;
  rightsNote: string | null;
};

const wavToM4a = (f: string): string => f.replace(/\.wav$/i, '.m4a');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function main() {
  await connectDb();

  const pack = JSON.parse(readFileSync(resolve(ROOT, 'content/content-pack.json'), 'utf8')) as Pack;
  const manifest = JSON.parse(readFileSync(resolve(ROOT, 'content/asset-manifest.json'), 'utf8')) as {
    assets: ManifestAsset[];
  };

  // ---- Assetlar (Asset hujjatlari — haqiqiy fayllar R2'ga alohida, tools/upload-media-to-r2.mjs bilan yuklanadi) ----
  let assetCount = 0;
  for (const a of manifest.assets) {
    const exists = await Asset.findOne({ file: a.file });
    if (exists) continue;
    await Asset.create({
      file: a.file,
      kind: a.kind,
      mime: a.mime,
      bytes: a.bytes,
      checksumSha256: a.checksumSha256,
      rightsStatus: a.rightsStatus,
      rightsNote: a.rightsNote,
    });
    assetCount++;
  }
  const assetIdByFile = new Map<string, string>();
  for (const a of await Asset.find().select('_id file')) assetIdByFile.set(a.file, String(a._id));

  // ---- Tashkilot, sinflar, demo foydalanuvchilar ----
  let org = await Organization.findOne({ name: '1-son bolalar musiqa maktabi' });
  if (!org) org = await Organization.create({ name: '1-son bolalar musiqa maktabi' });

  const demoUsers = [
    { email: 'admin@example.com', name: 'Admin Adminov', role: 'admin', pass: 'admin12345' },
    { email: 'editor@example.com', name: 'Metodist Editorov', role: 'content_editor', pass: 'editor12345' },
    { email: 'teacher@example.com', name: 'O\u2018qituvchi Teacherov', role: 'teacher', pass: 'teacher12345' },
    { email: 'student@example.com', name: 'O\u2018quvchi Studentov', role: 'student', pass: 'student12345' },
    { email: 'student2@example.com', name: 'Ikkinchi O\u2018quvchi', role: 'student', pass: 'student12345' },
    { email: 'teacher2@example.com', name: 'Boshqa O\u2018qituvchi', role: 'teacher', pass: 'teacher12345' },
    { email: 'student3@example.com', name: 'Boshqa Sinf O\u2018quvchisi', role: 'student', pass: 'student12345' },
    { email: 'reset@example.com', name: 'Parol Tiklovchi', role: 'student', pass: 'student12345' },
  ] as const;

  for (const u of demoUsers) {
    const exists = await User.findOne({ emailLower: u.email.toLowerCase() });
    if (exists) continue;
    await User.create({ orgId: org._id, email: u.email, passwordHash: hashPassword(u.pass), fullName: u.name, role: u.role });
  }
  const userIdByEmail = new Map<string, string>();
  for (const u of await User.find().select('_id email')) userIdByEmail.set(u.email.toLowerCase(), String(u._id));

  let cls = await Class.findOne({ name: '1-A sinf' });
  if (!cls) cls = await Class.create({ orgId: org._id, name: '1-A sinf', teacherId: userIdByEmail.get('teacher@example.com') });
  let cls2 = await Class.findOne({ name: '1-B sinf' });
  if (!cls2) cls2 = await Class.create({ orgId: org._id, name: '1-B sinf', teacherId: userIdByEmail.get('teacher2@example.com') });

  for (const [email, classId] of [
    ['student@example.com', cls._id],
    ['student2@example.com', cls._id],
    ['student3@example.com', cls2._id],
  ] as const) {
    const uid = userIdByEmail.get(email);
    const exists = await Enrollment.findOne({ classId, userId: uid });
    if (!exists) await Enrollment.create({ classId, userId: uid });
  }

  // ---- Kurs va versiya ----
  let course = await Course.findOne({ code: pack.course.code });
  if (!course) course = await Course.create(pack.course);

  const existingVersion = await CourseVersion.findOne({ courseId: course._id, version: 1 });
  if (existingVersion) {
    console.log(`[content:import] Kontent allaqachon import qilingan (v1). Yangi assetlar: ${assetCount}`);
    await disconnectDb();
    return;
  }

  const cv = await CourseVersion.create({
    courseId: course._id,
    version: 1,
    status: 'published',
    notes: "Asl prezentatsiyadan import (69 slayd). Javoblar va media huquqlari metodist tasdig'ini talab qiladi.",
    createdBy: userIdByEmail.get('editor@example.com'),
    publishedAt: new Date(),
  });

  // ---- Darslar va bloklar ----
  let blockCount = 0;
  let questionCount = 0;

  for (const lesson of pack.lessons) {
    const newLesson = await Lesson.create({
      courseVersionId: cv._id,
      orderIndex: lesson.order,
      declaredNumber: lesson.declaredNumber,
      title: lesson.title,
    });

    for (let i = 0; i < lesson.blocks.length; i++) {
      const b = lesson.blocks[i];
      const reviewNote =
        b.reviewNote ??
        (b.unresolvedOptions
          ? "Topshiriq mexanikasi bir ma'noli tiklanmadi — blok avto-tekshiruvsiz amaliyot sifatida ko'rsatilgan."
          : null);

      const block = await Block.create({
        lessonId: newLesson._id,
        orderIndex: i + 1,
        type: b.type,
        title: b.title,
        body: b.body,
        sourceSlide: b.sourceSlide,
        needsReview: b.needsMethodistReview,
        reviewNote,
      });
      blockCount++;

      const attach = async (files: string[], role: 'audio' | 'video' | 'image') => {
        for (let idx = 0; idx < files.length; idx++) {
          const f = files[idx];
          const id = assetIdByFile.get(role === 'audio' ? wavToM4a(f) : f);
          if (id) await BlockAsset.create({ blockId: block._id, assetId: id, role, orderIndex: idx });
        }
      };
      await attach(b.audio, 'audio');
      await attach(b.video, 'video');
      await attach(b.images, 'image');

      if (b.question) {
        await Question.create({
          blockId: block._id,
          type: b.type,
          prompt: b.question.prompt,
          explanation: null, // TODO(methodist): asl prezentatsiyada izohlar yo'q
          maxScore: 1,
          options: b.question.options.map((o) => ({
            ordinal: o.ordinal,
            text: o.text,
            imageAssetId: o.image ? assetIdByFile.get(o.image) : null,
            isCorrect: o.isCorrect,
            sourceAction: o.sourceAction,
          })),
        });
        questionCount++;
      }
    }
  }

  // ---- Kursni sinflarga tayinlash ----
  await Assignment.create({ classId: cls._id, courseVersionId: cv._id, assignedBy: userIdByEmail.get('teacher@example.com') });
  await Assignment.create({ classId: cls2._id, courseVersionId: cv._id, assignedBy: userIdByEmail.get('teacher2@example.com') });

  await audit(userIdByEmail.get('editor@example.com') ?? null, 'content.import', 'course_version', cv._id, {
    lessons: pack.lessons.length,
    blocks: blockCount,
    questions: questionCount,
  });

  console.log(
    `[content:import] Import qilindi: darslar=${pack.lessons.length} bloklar=${blockCount} savollar=${questionCount} assetlar=${assetCount}`,
  );
  console.log(`[content:import] TODO(methodist): ${pack.methodistTodos.length} band — docs/content-inventory.md'ga qarang`);
  console.log('[content:import] Diqqat: haqiqiy media fayllar hali R2\u2019ga yuklanmagan. tools/upload-media-to-r2.mjs\u2019ni ishga tushiring.');

  await disconnectDb();
}

main().catch((err) => {
  console.error('[content:import] xato:', err);
  process.exit(1);
});
