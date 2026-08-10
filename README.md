# Solfedjio, 1-sinf — monorepo

Bitta repo, ikkita mustaqil deploy qilinadigan qism:

```
solfedjio-monorepo/
├── backend/    → Render'ga deploy qilinadi (Express + MongoDB Atlas + JWT)
└── frontend/   → Vercel'ga deploy qilinadi (build-siz vanilla JS)
```

Har bir papka o'z ichida mustaqil loyiha (o'z `package.json`i bilan) — bitta repo, lekin
Render va Vercel har biri faqat o'ziga tegishli papkani "ko'radi" (quyida ko'rsatilgan
**Root Directory** sozlamasi orqali).

## 1. GitHub'ga yuklash

```bash
cd solfedjio-monorepo
git init
git add .
git status   # .env fayl ko'rinmasligi kerak — agar ko'rinsa, .gitignore'ni tekshir
git commit -m "Solfedjio: MongoDB + JWT backend, Vercel frontend"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

## 2. Backend → Render

1. Render dashboard → **New → Blueprint**.
2. Repo'ni tanla — Render root'dagi `render.yaml`ni avtomatik topadi va `backend/` papkasini
   ishlatadi (`rootDir: backend` shu yerda ko'rsatilgan).
3. **Environment** bo'limida qo'l bilan qo'sh (`.env.example`ga qara):
   `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGINS`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`,
   `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`, `NODE_ENV=production`.
4. Deploy tugagach: `https://<servis-nomi>.onrender.com/api/health` tekshir.

## 3. Frontend → Vercel

1. Vercel dashboard → **Add New → Project** → shu repo'ni tanla.
2. **Root Directory:** `frontend` (Vercel "Edit" tugmasi bilan papkani ko'rsatishni so'raydi).
3. **Environment Variables** bo'limiga qo'sh: `API_BASE_URL` = Render'dagi backend manzili
   (masalan `https://solfedjio-backend.onrender.com`).
4. Deploy. `frontend/vercel.json`dagi `buildCommand` (`node build-config.mjs`) avtomatik
   ishlab, `API_BASE_URL`ni `config.js`ga yozadi.
5. Vercel'dan olingan domenni (masalan `https://solfedjio.vercel.app`) Render'dagi
   `CORS_ORIGINS`ga qo'shishni unutma — aks holda brauzer so'rovlari CORS xatosi beradi.

## 4. Kontent va media (bir martalik)

Backend deploy bo'lgach, **lokal** kompyuteringdan (Render shell orqali ham mumkin,
lekin lokal osonroq):

```bash
cd backend
cp .env.example .env        # MONGO_URI'ni Atlas manziliga o'zgartir
npm install
npm run content:import      # 22 dars / 69 blok / 8 savol + demo foydalanuvchilar
MEDIA_DIR=/path/to/media npm run media:upload   # 239 faylni R2'ga yuklaydi
```

## Ishlash tartibi (tekshiruv ro'yxati)

- [ ] MongoDB Atlas: klaster yaratildi, Network Access'da `0.0.0.0/0` ochildi
- [ ] Backend Render'da ishga tushdi, `/api/health` → `{"ok":true,"db":"connected"}`
- [ ] `content:import` ishlatildi (bazada darslar/savollar bor)
- [ ] Cloudflare R2: bucket yaratildi, `media:upload` bilan fayllar yuklandi
- [ ] Frontend Vercel'da ishga tushdi, `API_BASE_URL` to'g'ri ko'rsatilgan
- [ ] Render'dagi `CORS_ORIGINS`ga Vercel domeni qo'shilgan
- [ ] `admin@example.com` / `admin12345` bilan kirib ko'rildi

Har bir qismning batafsil hujjati: `backend/README.md`.
