'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import styles from './lesson-five.module.css';

const FIGMA = {
  step1: '/assets/figma/lesson-5-step-1.svg',
  step2: '/assets/figma/lesson-5-step-2.svg',
  step3: '/assets/figma/lesson-5-step-3.svg',
  step4: '/assets/figma/lesson-5-step-4.svg',
  step5: '/assets/figma/lesson-5-step-5.svg',
  step6: '/assets/figma/lesson-5-step-6.svg',
  traceGuide: '/assets/figma/lesson-5-trace-guide.svg',
} as const;

const STEPS = [
  { title: '1-qadam', text: 'Pastki dumaloq shaklning chap tomonini chizing.', image: FIGMA.step1, tone: 'purple' },
  { title: '2-qadam', text: 'Dumaloq shaklni davom ettiring.', image: FIGMA.step2, tone: 'blue' },
  { title: '3-qadam', text: 'Dumaloq shaklni tugating.', image: FIGMA.step3, tone: 'purple' },
  { title: '4-qadam', text: 'Yuqoriga qarab egri chiziq chizing.', image: FIGMA.step4, tone: 'blue' },
  { title: '5-qadam', text: 'Yuqori qismida ilmoq hosil qiling.', image: FIGMA.step5, tone: 'purple' },
  { title: '6-qadam', text: 'Pastga tushirib, uchini buking. Kalit tayyor!', image: FIGMA.step6, tone: 'blue' },
] as const;

type Point = { x: number; y: number };

export default function LessonFivePage() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [drawing, setDrawing] = useState(false);

  const path = useMemo(() => points.map((point) => `${point.x},${point.y}`).join(' '), [points]);

  const addPoint = (clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPoints((current) => [
      ...current,
      {
        x: ((clientX - rect.left) / rect.width) * 100,
        y: ((clientY - rect.top) / rect.height) * 100,
      },
    ]);
  };

  return (
    <main className={styles.page}>
      <SiteHeader mode="lesson" activeLesson={5} />

      <section className={styles.stage}>
        <div className={styles.screen}>
          <header className={styles.heading}>
            <div className={styles.kicker}><span>♪</span> 5-DARS • MUSIQA NAZARIYASI</div>
            <h1>Skripka kaliti <em>♪</em></h1>
          </header>

          <div className={styles.definition}>
            Skripka yoki “sol” kaliti nota yo‘lining ikkinchi chizig‘idan boshlab yoziladi.
          </div>

          <div className={styles.stepsRow}>
            {STEPS.map((step) => (
              <article
                className={`${styles.stepCard} ${step.tone === 'blue' ? styles.blueCard : styles.purpleCard}`}
                key={step.title}
              >
                <h2>{step.title}</h2>
                <div className={styles.stepImage}>
                  <img src={step.image} alt={`${step.title}: skripka kalitini chizish bosqichi`} />
                </div>
                <p>{step.text}</p>
              </article>
            ))}
          </div>

          <section className={styles.practiceCard}>
            <div className={styles.practiceText}>
              <h2>Endi o‘zingiz chizing</h2>
              <p>Pushti nuqtadan boshlang. Shtrixli yo‘l ustidan barmoq yoki stilus bilan yuring.</p>
            </div>

            <div
              className={styles.traceBoard}
              ref={boardRef}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setDrawing(true);
                addPoint(event.clientX, event.clientY);
              }}
              onPointerMove={(event) => {
                if (drawing) addPoint(event.clientX, event.clientY);
              }}
              onPointerUp={() => setDrawing(false)}
              onPointerCancel={() => setDrawing(false)}
            >
              <img src={FIGMA.traceGuide} alt="Ustidan chizish uchun to‘rtta shtrixli skripka kaliti" />
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {path ? <polyline points={path} className={styles.tracePath} /> : null}
              </svg>
            </div>
          </section>
        </div>
      </section>

      <Link className={`${styles.fab} ${styles.prev}`} href="/dars/4" aria-label="4-darsga qaytish">←</Link>
      <Link className={`${styles.fab} ${styles.next}`} href="/dars/6" aria-label="6-darsga o‘tish">→</Link>
    </main>
  );
}
