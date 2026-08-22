import type { Href } from 'expo-router';

const KID_LESSON_ROUTES: Record<number, string> = {
  2: '/lesson-two',
  3: '/lesson-three',
  4: '/lesson-four',
  5: '/lesson-five',
  6: '/lesson-six',
  7: '/lesson-seven',
  8: '/lesson-eight',
  9: '/lesson-nine',
  10: '/lesson-ten',
  11: '/lesson-eleven',
  12: '/lesson-twelve',
  13: '/lesson-thirteen',
  15: '/lesson-fifteen',
  16: '/lesson-sixteen',
  17: '/lesson-seventeen',
  18: '/lesson-eighteen',
};

export function kidLessonHref(declaredNumber: number | null | undefined, blockId: string | null | undefined): Href | null {
  if (!declaredNumber || !blockId) return null;
  const pathname = KID_LESSON_ROUTES[declaredNumber];
  if (!pathname) return null;
  return `${pathname}?blockId=${encodeURIComponent(blockId)}` as Href;
}

export function hasKidLessonRoute(declaredNumber: number | null | undefined) {
  return !!declaredNumber && !!KID_LESSON_ROUTES[declaredNumber];
}
