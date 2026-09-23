// Permanent project-local assets exported from the approved Figma design.
// Keep page components pointed at these /public paths; Figma MCP asset URLs expire.
export const figmaAssets = {
  landingHero: '/assets/figma/landing-hero.png',
  teacher1: '/assets/figma/teacher-1.png',
  teacher2: '/assets/figma/teacher-2.png',
  teacher3: '/assets/figma/teacher-3.png',
  teacher4: '/assets/figma/teacher-4.png',
  testimonial1: '/assets/figma/testimonial-1.png',
  testimonial2: '/assets/figma/testimonial-2.png',
  testimonial3: '/assets/figma/testimonial-3.png',

  // The old dedicated course-cover raster no longer exists in the current Figma file.
  // Use the approved landing visual as a stable fallback until the cover visual is redrawn.
  coverVisual: '/assets/figma/landing-hero.png',

  lessonOneHistorical: '/assets/figma/lesson-1-guido.png',
  lessonOneCurrentIllustration: '/assets/figma/lesson-1-guido.png',
  lessonOneMusicIcon: '/assets/figma/lesson-1-music.png',
  lessonOneFactIconPurple: '/assets/figma/lesson-1-fact-purple.png',
  lessonOneFactIconBlue: '/assets/figma/lesson-1-fact-blue.png',
  lessonOneFactIconGreen: '/assets/figma/lesson-1-fact-green.png',
  lessonTwoAnimals: '/assets/figma/lesson-2-register.png',
} as const;
