import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { AppIcon } from '@/components/app-icon';
import { figmaAssets } from '@/lib/figma-assets';
import styles from './lesson-one.module.css';

const lessonFacts = [
  {
    className: styles.factPurple,
    icon: figmaAssets.lessonOneFactIconPurple,
    text: 'Solfedjio atamasi “sol” va “fa” nota nomlari bilan bog‘liq.',
  },
  {
    className: styles.factBlue,
    icon: figmaAssets.lessonOneFactIconBlue,
    text: 'Solfedjio notaga qarab kuylash ma’nosini anglatadi.',
  },
  {
    className: styles.factGreen,
    icon: figmaAssets.lessonOneFactIconGreen,
    text: 'Gvido de Aresso nota tizimini shakllantirish va notalarni nomlash bilan bog‘liq tarixiy shaxsdir.',
  },
] as const;

export default function LessonOnePage() {
  return (
    <main className={styles.page}>
      <SiteHeader mode="lesson" activeLesson={1} lessonChrome="auth" />

      <section className={styles.hero}>
        <div className={styles.layout}>
          <div className={styles.left}>
            <div className={styles.titleRow}>
              <span className={styles.titleIcon} aria-hidden="true">
                <img src="/assets/lesson-1/dars-icon.svg" alt="" />
              </span>
              <div className={styles.titleText}>
                <p className={styles.kicker}>1-DARS. SOLFEDJIO.</p>
                <h1>Solfedjio - musiqaning asosiy tili</h1>
              </div>
            </div>

            <article className={styles.definitionCard}>
              <div className={styles.definitionLabel}>
                <span className={styles.definitionDot} aria-hidden="true" />
                <span>Solfedjio nima?</span>
              </div>
              <p>
                Solfedjio - bu musiqada qo&apos;llaniladigan atama bo&apos;lib, italyancha &quot;Solfeggio&quot; ya&apos;ni
                &quot;sol&quot; va &quot;fa&quot; notalari nomidan kelib chiqadi. U notaga qarab kuylash ma&apos;nosini anglatadi.
              </p>
            </article>

            <article className={styles.funCard}>
              <span className={styles.funChip}><AppIcon name="star" size={16} /> Bu qiziq!</span>
              <p className={styles.funText}>
                Solfedjioning fan sifatida shakllanishi 9 asrda yashab ijod qilgan italiyalik musiqashunos Gvido de Aresso
                nomi bilan bog&apos;liq. Aynan u nota tizimini yaratib notalarni nomlaydi.
              </p>
              <div className={styles.funFooter}>
                <span className={styles.funFooterIcon} aria-hidden="true"><AppIcon name="note" size={18} /></span>
                <span>Solfedjio - musiqa bilimining boshlang&apos;ich darvozasi.</span>
              </div>
            </article>

            <div className={styles.facts} aria-label="Darsning asosiy eslatmalari">
              {lessonFacts.map((fact) => (
                <div className={`${styles.fact} ${fact.className}`} key={fact.text}>
                  <span className={styles.factIcon} aria-hidden="true"><img src={fact.icon} alt="" /></span>
                  <span>{fact.text}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className={styles.right}>
            <figure className={styles.illustrationCard}>
              <div className={styles.historyBand}>
                <span><AppIcon name="history" size={17} /> Tarix sahifasi</span>
                <span>IX asr • Italiya</span>
              </div>
              <img
                className={styles.illustration}
                src={figmaAssets.lessonOneCurrentIllustration}
                alt="Gvido de Aresso musiqa va nota yozuvini tushuntirayotgan tarixiy tasvir"
              />
              <figcaption className={styles.captionCard}>
                <strong>Gvido de Aresso</strong>
                <span className={styles.captionMeta}>991 - 1033 • Italiya musiqashunosi</span>
                <span className={styles.captionSub}>Nota tizimi va nota nomlari tarixiga bog&apos;liq musiqashunos</span>
              </figcaption>
            </figure>
          </aside>
        </div>
      </section>

      <Link className={`${styles.fab} ${styles.prev}`} href="/kurs/1" aria-label="Kurs boshiga qaytish"><AppIcon name="arrow-left" size={23} /></Link>
      <Link className={`${styles.fab} ${styles.next}`} href="/dars/2" aria-label="2-darsga o‘tish"><AppIcon name="arrow-right" size={23} /></Link>
    </main>
  );
}
