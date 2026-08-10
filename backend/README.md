# Solfedjio backend — 2-versiya (MongoDB Atlas + JWT + Render)

Bu — asl loyihaning (Node.js + SQLite) qayta qurilgan qismi: **MongoDB Atlas**,
**JWT (Bearer token)** autentifikatsiya, va **Render**ga deploy uchun tayyorlangan.

## Hozircha nima tayyor

- Barcha 19 ta SQL jadvali Mongoose modellariga aylantirildi (`src/models/`)
- JWT auth: login, refresh-token rotatsiyasi, logout, logout-all, parolni tiklash
- **Barcha route'lar to'liq ko'chirildi**: content, assessment (test dvigateli, offline-sync),
  teacher, admin (versiyalash/publish workflow), media (R2 presigned URL), analytics
- CORS, xato-konverti (error envelope), health-check
- **Kontentni import qilish** (`src/tools/import-content.ts`) — asl `content-pack.json` va
  `asset-manifest.json`dan 22 dars/69 blok/8 savolni to'liq Mongo'ga ko'chiradi
- **Media yuklash** (`tools/upload-media-to-r2.mjs`) — 239 faylni Cloudflare R2'ga yuklaydi
- Render (`render.yaml`) va `.env.example`

## Qolgan ishlar

- `npm install` tarmoq cheklovi tufayli sinov muhitida bajarilmadi — Render'da avtomatik ishlaydi,
  lekin birinchi deploydan oldin lokal `npm install && npm run dev` bilan tekshirib ko'rish tavsiya etiladi
- Yakuniy end-to-end test (login → kurs → test topshirish → admin panel) hali qilinmagan
- `docx`/`pptx` snoat kabi qo'shimcha kontent turlarini keyinchalik qo'shish (notation_input, sequence_order)
  — bu metodist tasdig'idan keyin, loyihaning o'zida ham hali yo'q edi

## Nega JWT (cookie-sessiya emas)

Frontend (Vercel) va backend (Render) **turli domenlarda** turadi. httpOnly cookie-sessiya
bunday holatda `SameSite=None; Secure` + murakkab CORS/CSRF sozlamalarini talab qiladi.
JWT (`Authorization: Bearer <token>`) esa domenga bog'liq emas — frontend tokenni
`localStorage`/xotirada saqlaydi va har so'rovga header sifatida qo'shadi. Bonus: CSRF himoyasi
shart emas, chunki brauzer bu header'ni o'zi avtomatik yubormaydi.

**Frontend'da eslatma:** tokenni oddiy `localStorage`da saqlash XSS xavfi bilan bog'liq (agar
saytda begona JS ishga tushsa, token o'g'irlanishi mumkin). Eng yaxshi amaliyot — access token'ni
faqat JS xotirasida (`useState`/`Context`) saqlash, refresh token'ni esa alohida, cookie orqali
emas, balki foydalanuvchi login qilganda olib, har safar `/api/auth/refresh`ga yuborish.

## MongoDB Atlas sozlash

1. https://cloud.mongodb.com — bepul (M0) klaster yaratasan.
2. **Database Access** — foydalanuvchi yaratib, parol beriladi.
3. **Network Access** — Render statik IP bermaydi (free tier), shuning uchun
   `0.0.0.0/0` (hamma joydan) ruxsat berish kerak — bu hujjatlashtiring, xavfsizlik trade-off.
4. **Connect → Drivers** dan ulanish satrini ol, `.env`ga `MONGO_URI` sifatida qo'y.

## Render'ga deploy

1. GitHub'ga repo'ni push qil.
2. Render dashboard → **New → Blueprint** → repo'ni tanla (`render.yaml` avtomatik topiladi).
3. `MONGO_URI`, `CORS_ORIGINS`, R2 kalitlarini Render dashboard'da **Environment**da qo'l bilan kirit
   (`sync: false` bo'lganlar maxfiy — Blueprint ularni so'raydi).
4. Deploy tugagach `https://solfedjio-backend.onrender.com/api/health` tekshir.

**Eslatma:** Render'ning bepul tarifi 15 daqiqa harakatsizlikdan keyin serverni "uxlatadi" —
birinchi so'rov 30-60 soniya kutishi mumkin. Production uchun kamida Starter ($7/oy) tavsiya etiladi.

## Frontend (Vercel) bilan bog'lash

Frontend'da atrof-muhit o'zgaruvchisi: `NEXT_PUBLIC_API_URL=https://solfedjio-backend.onrender.com/api`
(yoki qaysi freymvork bo'lsa, shunga mos prefiks). Har so'rovga:

```js
fetch(`${API_URL}/course`, {
  headers: { Authorization: `Bearer ${accessToken}` }
})
```

## Media (Cloudflare R2)

1. Cloudflare dashboard → R2 → bucket yarat (`solfedjio-media`).
2. **Manage R2 API Tokens** → Access Key ID/Secret yarat.
3. Bucket'ni public qilmang — backend media so'rovlarini imzolangan token bilan tekshirib,
   R2'dan presigned URL generatsiya qiladi (`@aws-sdk/s3-request-presigner`, keyingi bosqichda
   `media.routes.ts` bilan birga qo'shiladi).
4. 239 media faylni ko'chirish uchun `tools/` papkasida skript yozib, bir martalik yuklashni
   avtomatlashtiramiz (keyingi bosqich).

## Ishga tushirish (lokal)

```bash
npm install
cp .env.example .env   # MONGO_URI'ni lokal yoki Atlas'ga yo'naltir
npm run content:import  # to'liq: demo foydalanuvchilar + sinflar + 69 slaydlik kurs kontenti
npm run dev
```

`npm run seed` — faqat demo foydalanuvchilarni yaratadigan yengil variant (kontentsiz, tezkor
auth testlash uchun). Production/staging uchun `content:import`ni ishlating.

## Media fayllarni R2'ga yuklash

Kontent import qilingandan so'ng, haqiqiy audio/video/rasm fayllari alohida yuklanadi
(ular Mongo'da emas, faqat metama'lumotlari saqlanadi):

```bash
MEDIA_DIR=/path/to/solfedjio-app/public/media npm run media:upload
```

Bu skript `public/media/`dagi barcha fayllarni R2 bucket'iga ularning nomi bilan (masalan
`audio1.m4a`) yuklaydi — bu nom `Asset.file` maydoniga mos kelishi shart. Fayl allaqachon
R2'da bo'lsa, qayta yuklanmaydi (idempotent).

