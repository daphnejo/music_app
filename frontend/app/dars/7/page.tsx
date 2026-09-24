'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SourceAudioButton } from '@/components/source-audio-button';
import styles from './lesson-seven.module.css';

const WHITE_NOTES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'] as const;
const BLACK_AFTER = new Set([0, 1, 3, 4, 5]);
const STAFF_NOTES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'Lya', 'Si', 'Do'] as const;
const RHYTHM_ASSET = '/assets/figma/lesson-7-ayiq-rhythm.svg';
const AUDIO_ICON_ASSET = '/assets/figma/lesson-7-audio-icon.svg';
const SYLLABLES = [
  { text: 'A –', left: 13.07 },
  { text: 'yiq', left: 21.57 },
  { text: 'pol', left: 30.07 },
  { text: 'von', left: 38.56 },
  { text: 'ter', left: 47.39 },
  { text: 'moq –', left: 53.43 },
  { text: 'da', left: 62.09 },
  { text: 'may –', left: 71.08 },
  { text: 'mun –', left: 77.12 },
  { text: 'jon.', left: 85.78 },
] as const;

function Keyboard() {
  const keys = Array.from({ length: 21 }, (_, index) => ({
    label: WHITE_NOTES[index % WHITE_NOTES.length],
    pitchClass: index % WHITE_NOTES.length,
  }));

  return (
    <div className={styles.keyboard} aria-label="Oktavani ko‘rsatadigan uch oktavali klaviatura">
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

      <div className={styles.octaveBracket} aria-hidden="true">
        <span className={styles.bracketLabel}>1 oktava</span>
        <span className={styles.bracketLine} />
        <span className={`${styles.bracketCap} ${styles.bracketCapLeft}`} />
        <span className={`${styles.bracketCap} ${styles.bracketCapRight}`} />
      </div>
    </div>
  );
}

function StaffOctave() {
  const lefts = [18.68, 27.60, 36.53, 45.45, 54.38, 63.31, 72.24, 81.17];
  const tops = [67.84, 62.31, 56.78, 51.26, 45.73, 40.20, 34.67, 29.15];

  return (
    <div className={styles.staffPanel} aria-label="Do dan Do gacha oktava nota yo‘lida">
      <div className={styles.staffLines} aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => <i key={index} />)}
      </div>
      <div className={styles.clef} aria-hidden="true">𝄞</div>
      <div className={styles.ledger} aria-hidden="true" />

      {STAFF_NOTES.map((note, index) => (
        <span
          className={`${styles.staffNote} ${index === 0 || index === 7 ? styles.edgeNote : ''}`}
          key={`${note}-${index}`}
          style={{ left: `${lefts[index]}%`, top: `${tops[index]}%` }}
          aria-hidden="true"
        />
      ))}

      <div className={styles.noteLabels}>
        {STAFF_NOTES.map((note, index) => (
          <strong className={index === 0 || index === 7 ? styles.edgeLabel : ''} key={`${note}-label-${index}`}>
            {note}
          </strong>
        ))}
      </div>
    </div>
  );
}

function AudioButton({ source, label }: { source: string; label: string }) {
  return (
    <SourceAudioButton
      className={styles.audioButton}
      source={source}
      title={label}
    >
      <img src={AUDIO_ICON_ASSET} alt="" aria-hidden="true" />
      <span className={styles.waveform} aria-hidden="true">
        <i /><i /><i /><i /><i />
      </span>
      <strong>{label}</strong>
    </SourceAudioButton>
  );
}

function AyiqExercise() {
  return (
    <section className={styles.exerciseCard}>
      <div className={styles.songHeader}>
        <h2>1. Ayiq</h2>
        <span>Bolalar qo‘shig‘i</span>
        <div className={styles.audioChoices} aria-label="Ayiq mashqi audiolari">
          <AudioButton source="audio30.wav" label="Tinglash 1" />
          <AudioButton source="audio31.wav" label="Tinglash 2" />
        </div>
      </div>

      <div className={styles.rhythmBoard}>
        <img src={RHYTHM_ASSET} alt="Ayiq qo‘shig‘ining nota yo‘li va ritmik yozuvi" />
        {SYLLABLES.map((item) => (
          <span className={styles.syllable} key={item.text} style={{ left: `${item.left}%` }}>
            {item.text}
          </span>
        ))}
      </div>

      <div className={styles.singingHint}>
        Avval <em>“Do”</em> deb kuylang, so‘ng shu ritmda qo‘shiq so‘zlarini ayting.
      </div>
    </section>
  );
}

export default function LessonSevenPage() {
  const [screen, setScreen] = useState<0 | 1>(0);

  return (
    <main className={styles.page}>
      <SiteHeader mode="lesson" activeLesson={7} />

      <section className={styles.stage}>
        <div className={styles.screen}>
          {screen === 0 ? (
            <>
              <header className={styles.heading}>
                <div className={styles.kicker}><span>♪</span> 7-DARS • MUSIQA NAZARIYASI</div>
                <h1>Oktava <em>♪</em></h1>
                <div className={styles.definitionTall}>
                  <span>Bir xil nomdagi eng yaqin ikki tovush orasidagi masofa oktava deyiladi.</span>
                  <span>Do, Re, Mi, Fa, Sol, Lya, Si dan keyin Do yuqoriroq registrda takrorlanadi.</span>
                </div>
              </header>

              <section className={styles.learningCard} aria-label="Oktava klaviatura va nota yo‘lida">
                <Keyboard />
                <StaffOctave />
              </section>
            </>
          ) : (
            <>
              <header className={`${styles.heading} ${styles.continuationHeading}`}>
                <div className={styles.kicker}><span>♪</span> 7-DARS • DAVOMI</div>
                <h1>Kuylash uchun mashqlar <em>♪</em></h1>
                <div className={styles.definitionShort}>
                  Do, Re, Mi notalari. Kuyni tinglang, so‘ng nota nomlari va so‘zlari bilan kuylang.
                </div>
              </header>

              <AyiqExercise />
            </>
          )}
        </div>
      </section>

      {screen === 0 ? (
        <Link className={`${styles.fab} ${styles.prev}`} href="/dars/6" aria-label="6-darsga qaytish">←</Link>
      ) : (
        <button className={`${styles.fab} ${styles.prev}`} type="button" onClick={() => setScreen(0)} aria-label="Oktava ekraniga qaytish">←</button>
      )}

      {screen === 0 ? (
        <button className={`${styles.fab} ${styles.next}`} type="button" onClick={() => setScreen(1)} aria-label="Ayiq mashqiga o‘tish">→</button>
      ) : (
        <button className={`${styles.fab} ${styles.next} ${styles.pendingFab}`} type="button" disabled aria-label="Keyingi ekran hali tayyor emas" title="Keyingi ekran tayyorlanmoqda">→</button>
      )}
    </main>
  );
}
