'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import styles from './lesson-five.module.css';

const GUIDE_STEPS = [
  '2-chiziq atrofidan boshlang',
  'Yuqoriga yumaloq harakat qiling',
  'Pastga katta aylana tushiring',
  'Markazdan yuqoriga qayting',
  'Pastga uzun chiziq tushiring',
  'Pastida kichik ilgak bilan tugating',
] as const;

const TRACE_POINTS = [
  [53, 7], [49, 10], [46, 15], [45, 21], [47, 27], [52, 31], [57, 35], [61, 40],
  [63, 46], [62, 52], [59, 57], [54, 61], [48, 64], [42, 64], [36, 61], [31, 57],
  [27, 52], [25, 46], [26, 40], [29, 35], [34, 31], [40, 28], [47, 27], [54, 28],
  [60, 31], [65, 36], [68, 42], [69, 49], [68, 56], [65, 63], [61, 69], [56, 74],
  [51, 77], [46, 79], [41, 79], [37, 77], [34, 73], [33, 68], [34, 63], [38, 59],
  [43, 57], [49, 57], [54, 59], [58, 63], [60, 68], [59, 73], [56, 77], [52, 80],
  [50, 84], [50, 88], [52, 92], [56, 94], [60, 94], [63, 92], [65, 88], [65, 84],
] as const;

type Point = { x: number; y: number };

function StaffLines({ children }: { children?: React.ReactNode }) {
  return (
    <div className={styles.staff}>
      {Array.from({ length: 5 }, (_, index) => <i key={index} style={{ top: `${18 + index * 16}%` }} />)}
      {children}
    </div>
  );
}

function TheoryScreen() {
  return (
    <section className={styles.screen}>
      <div className={styles.heading}>
        <div className={styles.kicker}><span>♪</span> 5-DARS • MUSIQA NAZARIYASI</div>
        <h1>Skripka kaliti <em>𝄞</em></h1>
      </div>

      <div className={styles.definition}>
        Nota yo‘liga notalarni yozishdan avval musiqa kaliti qo‘yiladi. Musiqada ular bir nechta. Ulardan biri — skripka kaliti.
      </div>

      <div className={styles.theoryGrid}>
        <article className={styles.clefCard}>
          <div className={styles.clefBadge}>𝄞</div>
          <div>
            <span className={styles.cardEyebrow}>MUSIQA KALITI</span>
            <h2>Skripka kaliti</h2>
            <p>Kalit nota yo‘lining boshida yoziladi va notalarni o‘qishga yordam beradi.</p>
          </div>
        </article>

        <article className={styles.staffCard}>
          <span className={styles.cardEyebrow}>NOTA YO‘LIDA</span>
          <h2>Kalit notalardan oldin keladi</h2>
          <StaffLines>
            <span className={styles.staffClef}>𝄞</span>
            <span className={styles.staffNote} style={{ left: '38%', top: '43%' }}>●</span>
            <span className={styles.staffNote} style={{ left: '53%', top: '35%' }}>●</span>
            <span className={styles.staffNote} style={{ left: '68%', top: '27%' }}>●</span>
          </StaffLines>
        </article>
      </div>

      <div className={styles.rememberBar}>
        <span>💡</span>
        <p><strong>Eslab qoling:</strong> avval kalit, keyin notalar yoziladi.</p>
      </div>
    </section>
  );
}

function PracticeScreen() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [drawing, setDrawing] = useState(false);

  const path = useMemo(() => points.map((point) => `${point.x},${point.y}`).join(' '), [points]);

  const addPoint = (clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setPoints((current) => [...current, { x, y }]);
  };

  return (
    <section className={styles.screen}>
      <div className={styles.headingCompact}>
        <div>
          <div className={styles.kicker}><span>✎</span> 5-DARS • MASHQ</div>
          <h1>Skripka kalitini yozing</h1>
        </div>
        <button className={styles.clearButton} type="button" onClick={() => setPoints([])}>Tozalash</button>
      </div>

      <div className={styles.practiceLayout}>
        <div className={styles.stepsCard}>
          <span className={styles.cardEyebrow}>6 QADAM</span>
          <h2>Chizish tartibi</h2>
          <div className={styles.stepsGrid}>
            {GUIDE_STEPS.map((step, index) => (
              <div className={styles.stepItem} key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.traceCard}>
          <div className={styles.traceHead}>
            <div>
              <span className={styles.cardEyebrow}>SMART MONITOR MASHQI</span>
              <h2>Nuqtalar ustidan chizing</h2>
            </div>
            <span className={styles.stylusHint}>✎ Stilus / sichqoncha</span>
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
            <StaffLines />
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {TRACE_POINTS.map(([x, y], index) => <circle key={index} cx={x} cy={y} r="0.85" className={styles.traceDot} />)}
              {path ? <polyline points={path} className={styles.tracePath} /> : null}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LessonFivePage() {
  const [step, setStep] = useState(0);

  return (
    <main className={styles.page}>
      <SiteHeader mode="lesson" activeLesson={5} showLessonHome />
      <div className={styles.stage}>{step === 0 ? <TheoryScreen /> : <PracticeScreen />}</div>

      {step === 0 ? (
        <Link className={`${styles.fab} ${styles.prev}`} href="/dars/4" aria-label="4-darsga qaytish">←</Link>
      ) : (
        <button className={`${styles.fab} ${styles.prev}`} type="button" onClick={() => setStep(0)} aria-label="Oldingi bosqich">←</button>
      )}

      {step === 0 ? (
        <button className={`${styles.fab} ${styles.next}`} type="button" onClick={() => setStep(1)} aria-label="Mashqqa o‘tish">→</button>
      ) : (
        <span className={`${styles.fab} ${styles.next} ${styles.nextPending}`} aria-label="5-dars yakunlandi">→</span>
      )}
    </main>
  );
}
