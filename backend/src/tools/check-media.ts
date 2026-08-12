import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { config } from '../config.ts';
import { connectDb, disconnectDb } from '../db.ts';
import { Asset, BlockAsset } from '../models/index.ts';

async function listAllKeys(client: S3Client): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: config.r2.bucket,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }),
    );
    for (const item of page.Contents ?? []) {
      if (item.Key) keys.push(item.Key);
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);
  return keys;
}

async function main() {
  const required = {
    R2_ENDPOINT: config.r2.endpoint,
    R2_ACCESS_KEY_ID: config.r2.accessKeyId,
    R2_SECRET_ACCESS_KEY: config.r2.secretAccessKey,
    R2_BUCKET: config.r2.bucket,
  };
  for (const [name, value] of Object.entries(required)) {
    if (!value) throw new Error(`${name} .env ichida yo'q`);
  }

  await connectDb();

  const assets = await Asset.find().select('_id file kind').lean();
  const links = await BlockAsset.find().select('assetId role').lean();
  const assetIdSet = new Set(assets.map((a) => String(a._id)));
  const brokenLinks = links.filter((l) => !assetIdSet.has(String(l.assetId)));

  const client = new S3Client({
    region: 'auto',
    endpoint: config.r2.endpoint,
    credentials: {
      accessKeyId: config.r2.accessKeyId,
      secretAccessKey: config.r2.secretAccessKey,
    },
  });
  const r2Keys = await listAllKeys(client);
  const r2Set = new Set(r2Keys);
  const dbFiles = assets.map((a) => a.file);
  const dbSet = new Set(dbFiles);
  const missing = dbFiles.filter((file) => !r2Set.has(file));
  const extra = r2Keys.filter((key) => !dbSet.has(key));

  const byKind = new Map<string, number>();
  for (const asset of assets) byKind.set(asset.kind, (byKind.get(asset.kind) ?? 0) + 1);
  const linkByRole = new Map<string, number>();
  for (const link of links) linkByRole.set(link.role, (linkByRole.get(link.role) ?? 0) + 1);

  console.log(`[media:check] DB: ${assets.length} asset, ${links.length} block-media link`);
  console.log(`[media:check] DB asset kinds: ${[...byKind.entries()].map(([k, v]) => `${k}=${v}`).join(', ')}`);
  console.log(`[media:check] Block link roles: ${[...linkByRole.entries()].map(([k, v]) => `${k}=${v}`).join(', ')}`);
  console.log(`[media:check] R2 bucket: ${config.r2.bucket}, objects=${r2Keys.length}`);
  console.log(`[media:check] R2 missing=${missing.length}, extra=${extra.length}, brokenBlockLinks=${brokenLinks.length}`);

  if (missing.length) {
    console.log('[media:check] R2 da yo\u2018q birinchi fayllar:');
    for (const file of missing.slice(0, 25)) console.log(`  - ${file}`);
  }
  if (extra.length) {
    console.log('[media:check] DB manifestda yo\u2018q R2 objectlar (birinchi 25):');
    for (const file of extra.slice(0, 25)) console.log(`  - ${file}`);
  }
  if (brokenLinks.length) {
    console.log('[media:check] Asset hujjati yo\u2018q BlockAsset linklar (birinchi 10):');
    for (const link of brokenLinks.slice(0, 10)) console.log(`  - ${String(link.assetId)} (${link.role})`);
  }

  if (!missing.length && !brokenLinks.length && assets.length === 239) {
    console.log('[media:check] OK \u2014 MongoDB assetlari va R2 objectlari mos.');
  } else {
    process.exitCode = 1;
  }

  await disconnectDb();
}

main().catch(async (err) => {
  console.error('[media:check] XATO:', err instanceof Error ? err.message : err);
  try { await disconnectDb(); } catch {}
  process.exit(1);
});
