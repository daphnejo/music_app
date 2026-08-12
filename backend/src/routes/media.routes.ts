// Media faqat qisqa muddatli HMAC-imzolangan havola orqali beriladi.
// Native Image/Audio/Video requestlari Authorization header yubormaydi, shuning uchun
// userId query parametrida keladi va token assetId + userId + expiry bilan tekshiriladi.
// Fayllarning o'zi Cloudflare R2'da (S3-mos API); bu yerda faqat qisqa muddatli presigned URL
// generatsiya qilinib, 302 bilan yo'naltiriladi — server orqali oqim (stream) qilinmaydi.
import { Router } from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { h, forbidden, notFound } from '../errors.ts';
import { verifyMediaToken } from '../auth.ts';
import { config } from '../config.ts';
import { Asset } from '../models/index.ts';

export const mediaRouter = Router();

const r2 = new S3Client({
  region: 'auto',
  endpoint: config.r2.endpoint,
  credentials: { accessKeyId: config.r2.accessKeyId, secretAccessKey: config.r2.secretAccessKey },
});

/** GET /api/media/:id?uid=...&token=... — HMAC tekshiriladi, so'ng R2 presigned URL'ga 302 */
mediaRouter.get(
  '/:id',
  h(async (req, res) => {
    const assetId = req.params.id;
    const userId = typeof req.query.uid === 'string' ? req.query.uid : undefined;
    const token = typeof req.query.token === 'string' ? req.query.token : undefined;

    if (!userId || !verifyMediaToken(assetId, userId, token)) {
      throw forbidden("Media havolasi yaroqsiz yoki muddati o'tgan");
    }

    const asset = await Asset.findById(assetId);
    if (!asset) throw notFound('Fayl topilmadi');

    const command = new GetObjectCommand({ Bucket: config.r2.bucket, Key: asset.file });
    const url = await getSignedUrl(r2, command, { expiresIn: 300 }); // 5 daqiqa — client darhol yuklaydi

    res.redirect(302, url);
  }),
);
