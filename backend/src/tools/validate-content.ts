import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

type PackOption = { image: string | null; isCorrect: boolean; sourceAction?: string };
type PackBlock = {
  sourceSlide: number;
  type: string;
  title: string;
  audio: string[];
  video: string[];
  images: string[];
  question?: { prompt: string; options: PackOption[] };
};
type PackLesson = {
  order: number;
  declaredNumber: number;
  title: string;
  slides: number[];
  blocks: PackBlock[];
};
type Pack = {
  source: string;
  slideCount: number;
  course: { code: string; title: string; subtitle: string; language: string };
  lessons: PackLesson[];
};
type Manifest = { assets: Array<{ file: string; kind: string }> };

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const EXPECTED_SOURCE = 'SOLFEDJIO_1_SINF_pptx2_pptm1_pptm_aprel.pptm';
const EXPECTED_SLIDES = 69;
const wavToM4a = (file: string) => file.replace(/\.wav$/i, '.m4a');

const pack = JSON.parse(readFileSync(resolve(ROOT, 'content/content-pack.json'), 'utf8')) as Pack;
const manifest = JSON.parse(readFileSync(resolve(ROOT, 'content/asset-manifest.json'), 'utf8')) as Manifest;

const errors: string[] = [];
const manifestFiles = new Set(manifest.assets.map((asset) => asset.file));
const seenSlides = new Map<number, number>();
let blockCount = 0;
let questionCount = 0;

if (pack.source !== EXPECTED_SOURCE) errors.push(`source noto‘g‘ri: ${pack.source}`);
if (pack.slideCount !== EXPECTED_SLIDES) errors.push(`slideCount ${pack.slideCount}, kutilgan ${EXPECTED_SLIDES}`);
if (!pack.course?.code || !pack.course?.title) errors.push('course metadata yetarli emas');

for (const lesson of pack.lessons) {
  if (!lesson.title.trim()) errors.push(`lesson order=${lesson.order}: title bo‘sh`);
  if (!lesson.slides.length) errors.push(`lesson order=${lesson.order}: slides bo‘sh`);

  for (const slide of lesson.slides) seenSlides.set(slide, (seenSlides.get(slide) ?? 0) + 1);

  for (const block of lesson.blocks) {
    blockCount++;
    if (block.sourceSlide < 1 || block.sourceSlide > EXPECTED_SLIDES) {
      errors.push(`block "${block.title}": sourceSlide=${block.sourceSlide}`);
    }

    const refs = [
      ...block.audio.map(wavToM4a),
      ...block.video,
      ...block.images,
      ...(block.question?.options.map((option) => option.image).filter((x): x is string => Boolean(x)) ?? []),
    ];
    for (const file of refs) {
      if (!manifestFiles.has(file)) errors.push(`manifestda yo‘q asset: ${file} (slide ${block.sourceSlide})`);
    }

    if (block.question) {
      questionCount++;
      if (!block.question.prompt.trim()) errors.push(`slide ${block.sourceSlide}: savol prompt bo‘sh`);
      if (block.question.options.length < 2) errors.push(`slide ${block.sourceSlide}: savol variantlari yetarli emas`);
      if (!block.question.options.some((option) => option.isCorrect)) {
        errors.push(`slide ${block.sourceSlide}: savolda source'dan to‘g‘ri javob aniqlanmagan`);
      }
    }
  }
}

for (let slide = 1; slide <= EXPECTED_SLIDES; slide++) {
  const count = seenSlides.get(slide) ?? 0;
  if (count === 0) errors.push(`slide ${slide} content-packga kiritilmagan`);
  if (count > 1) errors.push(`slide ${slide} ${count} marta lesson slides ichida takrorlangan`);
}

const declaredNumbers = pack.lessons
  .map((lesson) => lesson.declaredNumber)
  .filter((n) => Number.isFinite(n) && n > 0);

console.log(`[content:check] source: ${pack.source}`);
console.log(`[content:check] course: ${pack.course.title}`);
console.log(
  `[content:check] lessons=${pack.lessons.length}, blocks=${blockCount}, questions=${questionCount}, assets=${manifest.assets.length}, slides=${pack.slideCount}`,
);
console.log(`[content:check] source lesson numbers: ${declaredNumbers.join(', ')}`);

if (errors.length) {
  console.error(`\n[content:check] ${errors.length} ta muammo topildi:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('[content:check] OK — content pack va asset manifest canonical materialga mos.');
