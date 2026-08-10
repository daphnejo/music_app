// 239 ta media faylni (public/media/*) Cloudflare R2 bucket'iga yuklaydi.
// Fayl nomlari asset-manifest.json'dagi "file" maydoniga mos kelishi kerak (masalan audio1.m4a).
//
// Ishga tushirish:
//   MEDIA_DIR=/path/to/solfedjio-app/public/media node tools/upload-media-to-r2.mjs
//
// .env'da R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET to'ldirilgan bo'lishi kerak.
import 'dotenv/config';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const MEDIA_DIR = process.env.MEDIA_DIR;
if (!MEDIA_DIR) {
  console.error('MEDIA_DIR muhit o\u2018zgaruvchisini ko\u2018rsating (media fayllar joylashgan papka).');
  process.exit(1);
}

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const MIME_BY_EXT = {
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

async function alreadyUploaded(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const files = readdirSync(MEDIA_DIR).filter((f) => !f.startsWith('.'));
  console.log(`[r2-upload] ${files.length} ta fayl topildi: ${MEDIA_DIR}`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const key = file; // Asset.file bilan bir xil bo'lishi kerak — masalan "audio1.m4a"
    const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? 'application/octet-stream';
    const path = resolve(MEDIA_DIR, file);

    if (await alreadyUploaded(key)) {
      skipped++;
      continue;
    }

    try {
      const body = readFileSync(path);
      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: key,
          Body: body,
          ContentType: contentType,
          ContentLength: statSync(path).size,
        }),
      );
      uploaded++;
      if (uploaded % 20 === 0) console.log(`[r2-upload] ${uploaded} ta yuklandi...`);
    } catch (err) {
      failed++;
      console.error(`[r2-upload] XATO: ${file}`, err.message);
    }
  }

  console.log(`[r2-upload] Tugadi: yuklandi=${uploaded} o'tkazib yuborildi (mavjud)=${skipped} xato=${failed}`);
}

main().catch((err) => {
  console.error('[r2-upload] umumiy xato:', err);
  process.exit(1);
});
