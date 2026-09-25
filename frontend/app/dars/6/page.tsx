'use client';

import Link from 'next/link';
import { AppIcon } from '@/components/app-icon';
import { SiteHeader } from '@/components/site-header';
import { SourceAudioButton } from '@/components/source-audio-button';
import styles from './lesson-six.module.css';

const WHITE_NOTES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'] as const;
const BLACK_AFTER = new Set([0, 1, 3, 4, 5]);
const STAFF_NOTES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'Lya', 'Si'] as const;
const SOUND_SAMPLES = Array.from({ length: 12 }, (_, index) => `audio${index + 17}.wav`);

function Keyboard() {
  const keys = Array.from({ length: 21 }, (_, index) => ({
    label: WHITE_NOTES[index % WHITE_NOTES.length],
    pitchClass: index % WHITE_NOTES.length,
  }));

  return (
    <div className={styles.keyboard} aria-label="Uch oktavali klaviatura">
      {keys.map((key, index) => (
        <div className={styles.whiteKey} key={`${key.label}-${index}`}>
          <span className={styles.whiteLabel}>{key.label}</span>
          {BLACK_AFTER.has(key.pitchClass) && index < keys.length - 1 ? (
            <div className={styles.blackKey} aria-hidden="true">
              <small>{key.label}#</small>
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
      <div className={styles.staffLines} aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => <i key={index} />)}
      </div>
      <div className={styles.clef} aria-hidden="true">𝄞</div>
      <div className={styles.ledger} aria-hidden="true" />

      <div className={styles.noteLayer} aria-hidden="true">
        {STAFF_NOTES.map((note, index) => (
          <span
            className={styles.noteHead}
            key={`${note}-head`}
            style={{
              left: `${20.779 + index * 9.74}%`,
              top: `${68.42 - index * 5.263}%`,
            }}
          />
        ))}
      </div>

      <div className={styles.noteLabels}>
        {STAFF_NOTES.map((note) => <strong key={note}>{note}</strong>)}
      </div>
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
            <div className={styles.kicker}><span><AppIcon name="note" size={18} /></span> 6-DARS • MUSIQA NAZARIYASI</div>
            <h1>Tovushqator <em><AppIcon name="note" size={34} /></em></h1>
          </header>

          <div className={styles.definition}>
            Musiqaviy tovushqator — tovushlarning balandlik tartibi bo‘yicha joylashishi.
          </div>

          <section className={styles.learningCard} aria-label="Klaviatura va nota yozuvi">
            <Keyboard />
            <StaffScale />
          </section>

          <section className={styles.audioDock} aria-label="Tovushqator audio namunalari">
            <div className={styles.audioDockCopy}>
              <strong>Tovushlarni tinglang</strong>
              <span>Namunalarni ketma-ket eshiting.</span>
            </div>
            <div className={styles.audioSamples}>
              {SOUND_SAMPLES.map((source, index) => (
                <SourceAudioButton
                  className={styles.sampleButton}
                  key={source}
                  source={source}
                  title={`Namuna ${index + 1} ni tinglash`}
                >
                  <span aria-hidden="true">{index + 1}</span>
                </SourceAudioButton>
              ))}
            </div>
          </section>
        </div>
      </section>

      <Link className={`${styles.fab} ${styles.prev}`} href="/dars/5" aria-label="5-darsga qaytish"><AppIcon name="arrow-left" size={23} /></Link>
      <Link className={`${styles.fab} ${styles.next}`} href="/dars/7" aria-label="7-darsga o‘tish"><AppIcon name="arrow-right" size={23} /></Link>
    </main>
  );
}
