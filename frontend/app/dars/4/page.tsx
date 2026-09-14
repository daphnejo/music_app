'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import styles from './lesson-four.module.css';

const FIGMA = {
  staffLine: 'https://www.figma.com/api/mcp/asset/682b81ed-c35a-4c72-984c-66761011b173/58d87.svg',
  notesOnLines: 'https://www.figma.com/api/mcp/asset/682b81ed-c35a-4c72-984c-66761011b173/d7f8c.svg',
  notesInSpaces: 'https://www.figma.com/api/mcp/asset/682b81ed-c35a-4c72-984c-66761011b173/c8225.svg',
  audioBlue: 'https://www.figma.com/api/mcp/asset/682b81ed-c35a-4c72-984c-66761011b173/64e34.svg',
  audioGreen: 'https://www.figma.com/api/mcp/asset/682b81ed-c35a-4c72-984c-66761011b173/10f62.svg',
  lightbulb: 'https://www.figma.com/api/mcp/asset/682b81ed-c35a-4c72-984c-66761011b173/5d531.svg',
  ledgerLines: 'https://www.figma.com/api/mcp/asset/73105071-3932-419c-92f0-094184f9087f/1c5d6.svg',
  lightbulbLedger: 'https://www.figma.com/api/mcp/asset/73105071-3932-419c-92f0-094184f9087f/5d531.svg',
} as const;

function Waveform({ tone }: { tone: 'blue' | 'green' }) {
  return (
    <span className={`${styles.waveform} ${tone === 'green' ? styles.greenWave : styles.blueWave}`} aria-hidden="true">
      <i /><i /><i /><i /><i />
    </span>
  );
}

function AudioButton({ tone, source }: { tone: 'blue' | 'green'; source: string }) {
  const icon = tone === 'green' ? FIGMA.audioGreen : FIGMA.audioBlue;
  return (
    <button
      className={`${styles.audioButton} ${tone === 'green' ? styles.greenAudio : styles.blueAudio}`}
      type="button"
      data-source-audio={source}
      title="Manba audiosi media integratsiyasi bilan ulanadi"
    >
      <img src={icon} alt="" aria-hidden="true" />
      <Waveform tone={tone} />
      <strong>Tinglash</strong>
    </button>
  );
}

function StaffNumberingCard() {
  const positions = [30, 54, 78, 102, 126];
  return (
    <article className={`${styles.learningCard} ${styles.numberingCard}`}>
      <div className={styles.cardTop}>
        <span className={styles.purpleBadge}>5 ta chiziq</span>
        <h2>Chiziqlar tartibi</h2>
      </div>
      <div className={styles.numberingStaff} aria-label="Nota yo‘lining besh chizig‘i pastdan yuqoriga 1 dan 5 gacha sanaladi">
        {positions.map((top, index) => (
          <img className={styles.staffLine} key={top} src={FIGMA.staffLine} alt="" aria-hidden="true" style={{ top }} />
        ))}
        <strong style={{ left: '4%', top: '69%' }}>1</strong>
        <strong style={{ left: '23%', top: '54%' }}>2</strong>
        <strong style={{ left: '43%', top: '39%' }}>3</strong>
        <strong style={{ left: '63%', top: '24%' }}>4</strong>
        <strong style={{ left: '84%', top: '9%' }}>5</strong>
      </div>
      <p className={styles.cardHint}>Pastdan yuqoriga sanaladi.</p>
    </article>
  );
}

function StaffAudioCard({ kind }: { kind: 'lines' | 'spaces' }) {
  const onLines = kind === 'lines';
  return (
    <article className={`${styles.learningCard} ${onLines ? styles.linesCard : styles.spacesCard}`}>
      <div className={styles.cardTop}>
        <span className={styles.badgeSpacer} aria-hidden="true" />
        <h2>{onLines ? 'Chiziqlarda' : 'Chiziqlar orasida'}</h2>
      </div>
      <div className={styles.staffGraphic}>
        <img
          src={onLines ? FIGMA.notesOnLines : FIGMA.notesInSpaces}
          alt={onLines ? 'Notalarning nota yo‘li chiziqlarida joylashishi' : 'Notalarning nota yo‘li chiziqlari orasida joylashishi'}
        />
      </div>
      <div className={styles.audioSlot}>
        <AudioButton tone={onLines ? 'blue' : 'green'} source={onLines ? 'audio15.wav' : 'audio16.wav'} />
      </div>
    </article>
  );
}

function MainStaffScreen() {
  return (
    <section className={styles.screen}>
      <div className={styles.heading}>
        <div className={styles.kicker}><span>♪</span> 4-DARS • MUSIQA NAZARIYASI</div>
        <h1>Nota yo‘li <em>♪</em></h1>
      </div>

      <div className={styles.definition}>Notalar musiqa yozuvida 5 ta chiziqdan iborat nota yo‘liga yoziladi.</div>

      <div className={styles.whitePanel}>
        <div className={styles.cardsRow}>
          <StaffNumberingCard />
          <StaffAudioCard kind="lines" />
          <StaffAudioCard kind="spaces" />
        </div>
        <div className={styles.rememberBar}>
          <img src={FIGMA.lightbulb} alt="" aria-hidden="true" />
          <p><strong>Eslab qoling:</strong> nota yo‘li 5 ta chiziqdan iborat.</p>
        </div>
      </div>
    </section>
  );
}

function LedgerLinesScreen() {
  return (
    <section className={styles.screen}>
      <div className={styles.heading}>
        <div className={styles.kicker}><span>♪</span> 4-DARS • DAVOMI</div>
        <h1>Qo‘shimcha chiziqlar <em>♪</em></h1>
      </div>

      <div className={styles.definition}>Shuningdek, notalar qo‘shimcha chiziqlarda ham yoziladi.</div>

      <div className={`${styles.whitePanel} ${styles.ledgerPanel}`}>
        <div className={styles.ledgerGraphic}>
          <img src={FIGMA.ledgerLines} alt="Asosiy besh nota chizig‘i hamda yuqori va pastki qo‘shimcha chiziqlar" />
        </div>
        <div className={styles.rememberBar}>
          <img src={FIGMA.lightbulbLedger} alt="" aria-hidden="true" />
          <p>Eslab qoling: qo‘shimcha chiziqlar nota yo‘liga eng yaqin chiziqdan boshlab sanaladi.</p>
        </div>
      </div>
    </section>
  );
}

export default function LessonFourPage() {
  const [step, setStep] = useState(0);

  return (
    <main className={styles.page}>
      <SiteHeader mode="lesson" activeLesson={4} showLessonHome />

      <div className={styles.stage}>
        {step === 0 ? <MainStaffScreen /> : <LedgerLinesScreen />}
      </div>

      {step === 0 ? (
        <Link className={`${styles.fab} ${styles.prev}`} href="/dars/3" aria-label="3-darsga qaytish">←</Link>
      ) : (
        <button className={`${styles.fab} ${styles.prev}`} type="button" onClick={() => setStep(0)} aria-label="Oldingi bosqich">←</button>
      )}

      {step === 0 ? (
        <button className={`${styles.fab} ${styles.next}`} type="button" onClick={() => setStep(1)} aria-label="Qo‘shimcha chiziqlarga o‘tish">→</button>
      ) : (
        <Link className={`${styles.fab} ${styles.next}`} href="/dars/5" aria-label="5-darsga o‘tish">→</Link>
      )}
    </main>
  );
}
