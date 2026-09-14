'use client';

import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import styles from './lesson-six.module.css';

const WHITE_NOTES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'] as const;
const BLACK_AFTER = new Set([0, 1, 3, 4, 5]);
const STAFF_NOTES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'Lya', 'Si'] as const;

function Keyboard() {
  const keys = Array.from({ length: 21 }, (_, index) => ({
    label: WHITE_NOTES[index % WHITE_NOTES.length],
    pitchClass: index % WHITE_NOTES.length,
  }));

  return (
    <div className={styles.keyboard} aria-label="Uch oktavali klaviatura">
      {keys.map((key, index) => (
        <div className={styles.whiteKey} key={`${key.label}-${index}`}>
          <span>{key.label}</span>
          {BLACK_AFTER.has(key.pitchClass) && index < keys.length - 1 ? (
            <div className={styles.blackKey} aria-hidden="true">
              {key.label === 'Mi' || key.label === 'Si' ? null : <small>{key.label}#</small>}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function StaffScale() {
  return (
    <div className={styles.staffPanel} aria-label="Tovushqator nota yo‘lida">
      <div className={styles.clef} aria-hidden="true">𝄞</div>
      <div className={styles.staffLines} aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => <i key={index} />)}
      </div>
      <div className={styles.ledger} aria-hidden="true" />
      {STAFF_NOTES.map((note, index) => (
        <div
          className={styles.staffNote}
          key={note}
          style={{ left: `${18 + index * 10.6}%`, bottom: `${16 + index * 5.7}%` }}
        >
          <span className={styles.noteHead} />
          <strong>{note}</strong>
        </div>
      ))}
    </div>
  );
}

export default function LessonSixPage() {
  return (
    <main className={styles.page}>
      <SiteHeader mode="lesson" activeLesson={6} />

      <section className={styles.stage}>
        <div className={styles.screen}>
          <header className={styles.heading}>
            <div className={styles.kicker}><span>♪</span> 6-DARS • MUSIQA NAZARIYASI</div>
            <h1>Tovushqator <em>♪</em></h1>
          </header>

          <div className={styles.definition}>
            Musiqaviy tovushqator — tovushlarning balandlik tartibi bo‘yicha joylashishi.
          </div>

          <section className={styles.learningCard}>
            <Keyboard />
            <StaffScale />
          </section>
        </div>
      </section>

      <Link className={`${styles.fab} ${styles.prev}`} href="/dars/5" aria-label="5-darsga qaytish">←</Link>
      <Link className={`${styles.fab} ${styles.next}`} href="/dars/7" aria-label="7-darsga o‘tish">→</Link>
    </main>
  );
}
