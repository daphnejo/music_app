# Canonical Solfedjio material

Bu papkadagi o‘quv kontenti uchun yagona manba loyiha egasi bergan quyidagi prezentatsiya hisoblanadi:

`SOLFEDJIO_1_SINF_pptx2_pptm1_pptm_aprel.pptm`

SHA-256 va media inventari `source.json`da saqlanadi.

## Qoidalar

- Appda ko‘rsatiladigan dars, nazariya, rasm, audio, video, mashq va test mazmuni shu materialdan olinadi.
- UI uchun matnni qisqartirish mumkin, lekin yangi o‘quv faktlari yoki topshiriqlar o‘zboshimchalik bilan qo‘shilmaydi.
- `content-pack.json` — prezentatsiyaning app/backend uchun strukturalangan ko‘rinishi.
- `asset-manifest.json` — ishlatiladigan media fayllarning metadata va checksum ro‘yxati.
- PowerPoint ichidagi test tugmalarining VBA actionlari (`Right`, `Wrong` va boshqalar) imkon qadar javob kaliti sifatida saqlanadi.
- `order` appdagi navigatsiya ketma-ketligini bildiradi.
- `declaredNumber` esa prezentatsiyada yozilgan dars raqamini saqlaydi. Manbada dars raqamlari ketma-ket bo‘lmagan joylar bor; ularni yashirincha qayta raqamlash mumkin emas.

## Tekshirish

```bash
npm run content:check
```

Bu 69 slaydning content packda qamrab olinganini va blocklarda ishlatilgan media assetlar manifestda mavjudligini tekshiradi.

## Eski kontentni tozalab qayta import qilish

```bash
npm run content:replace
```

Bu komanda:

1. canonical materialni tekshiradi;
2. eski kurs/course-version/dars/blok/test va ularga bog‘liq progress/attempt/assignmentlarni o‘chiradi;
3. user accountlar, sinflar va enrollmentlarni saqlab qoladi;
4. `content-pack.json` va `asset-manifest.json`dan kontentni MongoDBga qayta import qiladi.

Media fayllarning o‘zi R2 storagega alohida yuklanadi:

```bash
npm run media:upload
```

R2 bucketda eski, manifestda bo‘lmagan objectlar qolishi mumkin, lekin MongoDBdagi Asset yozuvi bo‘lmasa ular app orqali ochilmaydi.
