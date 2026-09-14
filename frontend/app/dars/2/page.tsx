import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { figmaAssets } from '@/lib/figma-assets';
import styles from './lesson-two.module.css';

const whiteKeys = Array.from({ length: 50 }, (_, index) => index);
const blackKeyPattern = [0, 1, 3, 4, 5];
const blackKeys = Array.from({ length: 7 }, (_, octave) =>
  blackKeyPattern.map((offset) => octave * 7 + offset),
).flat();

const listenButtons = [
  { label: 'Past registr', source: 'audio1.wav', tone: styles.listenLow },
  { label: "O‘rta registr", source: 'audio2.wav', tone: styles.listenMiddle },
  { label: 'Yuqori registr', source: 'audio3.wav', tone: styles.listenHigh },
] as const;

export default function LessonTwoPage() {
  return (
    <main className={styles.page}>
      <SiteHeader mode="lesson" activeLesson={2} />

      <section className={styles.lessonShell}>
        <header className={styles.lessonHeader}>
          <div className={styles.titleBlock}>
            <span className={styles.lessonIcon} aria-hidden="true">♫</span>
            <div>
              <span className={styles.kicker}>2-DARS. REGISTR.</span>
              <h1>Registr - tovush balandligi</h1>
            </div>
          </div>

          <span className={styles.divider} aria-hidden="true" />

          <div className={styles.definitionCard}>
            <span className={styles.decoNotes} aria-hidden="true">♩ ♪ ♫</span>
            <p>
              Musiqiy tovushlar yangrashiga ko&apos;ra baland va past bo&apos;lishi mumkin. Balandligiga ko&apos;ra bir-biriga yaqin tovushlar past, o&apos;rta va yuqori registrni hosil qiladi.
            </p>
          </div>
        </header>

        <figure className={styles.registerVisual}>
          <img src={figmaAssets.lessonTwoAnimals} alt="Ayiq, mushuk va qush orqali past, o‘rta va yuqori registr tasviri" />
        </figure>

        <section className={styles.pianoCard} aria-label="Pianino klaviaturasi">
          <div className={styles.keyboard}>
            <div className={styles.whiteKeys}>
              {whiteKeys.map((key) => <span className={styles.whiteKey} key={key} />)}
            </div>
            {blackKeys.map((afterWhite) => (
              <span
                className={styles.blackKey}
                key={afterWhite}
                style={{ left: `${((afterWhite + 1) / 50) * 100}%` }}
              />
            ))}
          </div>
        </section>

        <div className={styles.listenRow} aria-label="Registrlarni tinglash">
          {listenButtons.map((item) => (
            <button
              type="button"
              className={`${styles.listenButton} ${item.tone}`}
              key={item.label}
              data-source-audio={item.source}
              title={`${item.source} manba audiosi`}
            >
              <span className={styles.speaker} aria-hidden="true">🔊</span>
              <span>Tinglash</span>
            </button>
          ))}
        </div>

        <aside className={styles.hintBar}>
          <span aria-hidden="true">💡</span>
          <strong>Eslab qoling:</strong>
          <span>chapdan o&apos;ngga tovushlar balandlashib boradi.</span>
        </aside>
      </section>

      <Link className={`${styles.fab} ${styles.prev}`} href="/dars/1" aria-label="1-darsga qaytish">←</Link>
      <Link className={`${styles.fab} ${styles.next}`} href="/dars/3" aria-label="3-darsga o‘tish">→</Link>
    </main>
  );
}
