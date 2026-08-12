const base = (process.env.SMOKE_API_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const email = process.env.SMOKE_EMAIL ?? 'student@example.com';
const password = process.env.SMOKE_PASSWORD ?? 'student12345';

type LoginResponse = {
  accessToken?: string;
  user?: { email?: string };
  error?: unknown;
};

type CourseResponse = {
  lessons?: Array<{ blocks?: Array<{ id: string }> }>;
};

type BlockResponse = {
  block?: { title?: string };
  assets?: Array<{ kind: string; file: string; url: string }>;
};

async function expectJson<T>(response: Response, label: string): Promise<T> {
  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${label}: JSON emas (HTTP ${response.status}): ${text.slice(0, 200)}`);
  }
  if (!response.ok) throw new Error(`${label}: HTTP ${response.status} ${JSON.stringify(payload)}`);
  return payload as T;
}

async function main() {
  console.log(`[media:smoke] API: ${base}`);

  let health: Response;
  try {
    health = await fetch(`${base}/api/health`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Backendga ulanib bo‘lmadi (${base}). Avval boshqa CMD oynada npm start ishlating. ${message}`);
  }
  const healthPayload = await expectJson<{ ok?: boolean; db?: string }>(health, 'health');
  console.log(`[media:smoke] health: ok=${healthPayload.ok === true} db=${healthPayload.db ?? 'unknown'}`);

  const loginResponse = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const login = await expectJson<LoginResponse>(loginResponse, 'login');
  if (!login.accessToken) throw new Error('login: accessToken qaytmadi');
  console.log(`[media:smoke] login: ${login.user?.email ?? email}`);

  const courseResponse = await fetch(`${base}/api/course`, {
    headers: { authorization: `Bearer ${login.accessToken}` },
  });
  const course = await expectJson<CourseResponse>(courseResponse, 'course');
  const blocks = (course.lessons ?? []).flatMap((lesson) => lesson.blocks ?? []);
  console.log(`[media:smoke] course blocks: ${blocks.length}`);

  let selected: BlockResponse | null = null;
  for (const block of blocks) {
    const response = await fetch(`${base}/api/blocks/${block.id}`, {
      headers: { authorization: `Bearer ${login.accessToken}` },
    });
    const detail = await expectJson<BlockResponse>(response, `block ${block.id}`);
    if (detail.assets?.length) {
      selected = detail;
      break;
    }
  }

  if (!selected?.assets?.length) throw new Error('Hech bir blokda media asset topilmadi');

  const asset = selected.assets[0];
  console.log(`[media:smoke] block: ${selected.block?.title ?? '(nomi yo‘q)'}`);
  console.log(`[media:smoke] asset: kind=${asset.kind} file=${asset.file}`);

  const isDirectHttps = /^https:\/\//i.test(asset.url);
  console.log(`[media:smoke] media URL: ${isDirectHttps ? 'direct HTTPS R2' : 'backend route'}`);

  let r2Response: Response;
  if (isDirectHttps) {
    r2Response = await fetch(asset.url, { headers: { Range: 'bytes=0-0' } });
  } else {
    const mediaUrl = /^https?:\/\//i.test(asset.url) ? asset.url : `${base}${asset.url}`;
    const mediaResponse = await fetch(mediaUrl, { redirect: 'manual' });
    console.log(`[media:smoke] media route: HTTP ${mediaResponse.status}`);
    const location = mediaResponse.headers.get('location');
    if (mediaResponse.status !== 302 || !location) {
      const text = await mediaResponse.text();
      throw new Error(`Media route R2'ga redirect qilmadi. HTTP ${mediaResponse.status}: ${text.slice(0, 300)}`);
    }
    console.log('[media:smoke] R2 redirect: YES');
    r2Response = await fetch(location, { headers: { Range: 'bytes=0-0' } });
  }

  console.log(`[media:smoke] R2 file: HTTP ${r2Response.status}`);
  console.log(`[media:smoke] content-type: ${r2Response.headers.get('content-type') ?? 'unknown'}`);

  if (![200, 206].includes(r2Response.status)) {
    const text = await r2Response.text();
    throw new Error(`R2 faylni bermadi. HTTP ${r2Response.status}: ${text.slice(0, 300)}`);
  }

  console.log('[media:smoke] OK — API → private R2 media zanjiri ishlayapti.');
}

main().catch((err) => {
  console.error('[media:smoke] XATO:', err instanceof Error ? err.message : err);
  process.exit(1);
});
