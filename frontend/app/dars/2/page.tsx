import Link from 'next/link';
import { AppIcon } from '@/components/app-icon';
import { SiteHeader } from '@/components/site-header';
import { SourceAudioButton } from '@/components/source-audio-button';
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
            <span className={styles.lessonIcon} aria-hidden="true"><AppIcon name="music" size={24} /></span>
            <div>
              <span className={styles.kicker}>2-DARS. REGISTR.</span>
              <h1>Registr - tovush balandligi</h1>
            </div>
          </div>

          <span className={styles.divider} aria-hidden="true" />

          <div className={styles.definitionCard}>
            <span className={styles.decoNotes} aria-hidden="true"><AppIcon name="note" size={15} /><AppIcon name="note" size={19} /><AppIcon name="music" size={20} /></span>
            <p>
              Musiqiy tovushlar yangrashiga ko&apos;ra baland va past bo&apos;lishi mumkin. Balandligiga ko&apos;ra bir-biriga yaqin tovushlar past, o&apos;rta va yuqori registrni hosil qiladi.
            </p>
          </div>
        </header>

        <div className={styles.registerStage}>
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
        </div>

        <div className={styles.listenRow} aria-label="Registrlarni tinglash">
          {listenButtons.map((item) => (
            <SourceAudioButton
              className={`${styles.listenButton} ${item.tone}`}
              key={item.label}
              source={item.source}
              title={`${item.label} audiosini tinglash`}
            >
              <span className={styles.speaker} aria-hidden="true"><AppIcon name="speaker" size={21} /></span>
              <span className={styles.listenCopy}>
                <span className={styles.listenName}>{item.label}</span>
                <span className={styles.listenAction}>Tinglash</span>
              </span>
            </SourceAudioButton>
          ))}
        </div>

        <aside className={styles.hintBar}>
          <span aria-hidden="true"><AppIcon name="bulb" size={21} /></span>
          <strong>Eslab qoling:</strong>
          <span>chapdan o&apos;ngga tovushlar balandlashib boradi.</span>
        </aside>
      </section>

      <Link className={`${styles.fab} ${styles.prev}`} href="/dars/1" aria-label="1-darsga qaytish"><AppIcon name="arrow-left" size={23} /></Link>
      <Link className={`${styles.fab} ${styles.next}`} href="/dars/3" aria-label="3-darsga o‘tish"><AppIcon name="arrow-right" size={23} /></Link>
    </main>
  );
}
