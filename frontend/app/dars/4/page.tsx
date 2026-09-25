'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AppIcon } from '@/components/app-icon';
import { SiteHeader } from '@/components/site-header';
import { SourceAudioButton } from '@/components/source-audio-button';
import styles from './lesson-four.module.css';

const FIGMA = {
  notesOnLines: '/assets/figma/lesson-4-on-lines.svg',
  notesInSpaces: '/assets/figma/lesson-4-in-spaces.svg',
  ledgerLines: '/assets/figma/lesson-4-ledger.svg',
} as const;

function Waveform({ tone }: { tone: 'blue' | 'green' }) {
  return (
    <span className={`${styles.waveform} ${tone === 'green' ? styles.greenWave : styles.blueWave}`} aria-hidden="true">
      <i /><i /><i /><i /><i />
    </span>
  );
}

function AudioButton({ tone, source }: { tone: 'blue' | 'green'; source: string }) {
  return (
    <SourceAudioButton className={`${styles.audioButton} ${tone === 'green' ? styles.greenAudio : styles.blueAudio}`} source={source} title="Manba audiosini tinglash">
      <span className={styles.audioIcon} aria-hidden="true"><AppIcon name="speaker" size={30} /></span>
      <Waveform tone={tone} />
      <strong>Tinglash</strong>
    </SourceAudioButton>
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
        {positions.map((top) => <span className={styles.staffLine} key={top} aria-hidden="true" style={{ top }} />)}
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
        <img src={onLines ? FIGMA.notesOnLines : FIGMA.notesInSpaces} alt={onLines ? 'Notalarning nota yo‘li chiziqlarida joylashishi' : 'Notalarning nota yo‘li chiziqlari orasida joylashishi'} />
      </div>
      <div className={styles.audioSlot}><AudioButton tone={onLines ? 'blue' : 'green'} source={onLines ? 'audio15.wav' : 'audio16.wav'} /></div>
    </article>
  );
}

function MainStaffScreen() {
  return (
    <section className={styles.screen}>
      <div className={styles.heading}>
        <div className={styles.kicker}><span><AppIcon name="note" size={18} /></span> 4-DARS • MUSIQA NAZARIYASI</div>
        <h1>Nota yo‘li <em><AppIcon name="note" size={34} /></em></h1>
      </div>
      <div className={styles.definition}>Notalar musiqa yozuvida 5 ta chiziqdan iborat nota yo‘liga yoziladi.</div>
      <div className={styles.whitePanel}>
        <div className={styles.cardsRow}>
          <StaffNumberingCard />
          <StaffAudioCard kind="lines" />
          <StaffAudioCard kind="spaces" />
        </div>
        <div className={styles.rememberBar}>
          <span className={styles.rememberIcon} aria-hidden="true"><AppIcon name="bulb" size={30} /></span>
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
        <div className={styles.kicker}><span><AppIcon name="note" size={18} /></span> 4-DARS • DAVOMI</div>
        <h1>Qo‘shimcha chiziqlar <em><AppIcon name="note" size={34} /></em></h1>
      </div>
      <div className={styles.definition}>Shuningdek, notalar qo‘shimcha chiziqlarda ham yoziladi.</div>

      <div className={`${styles.whitePanel} ${styles.ledgerPanel}`}>
        <div className={styles.ledgerGraphic}>
          <img className={styles.ledgerBase} src={FIGMA.ledgerLines} alt="Asosiy besh nota chizig‘i hamda yuqori va pastki qo‘shimcha chiziqlar" />

          <div className={`${styles.ledgerZone} ${styles.ledgerTopZone}`}>
            <strong>Yuqoridagi qo‘shimcha chiziqlar</strong>
            <span>Nota yo‘lidan yuqoriga sanaladi.</span>
          </div>
          <div className={`${styles.ledgerZone} ${styles.ledgerBottomZone}`}>
            <strong>Pastdagi qo‘shimcha chiziqlar</strong>
            <span>Nota yo‘lidan pastga sanaladi.</span>
          </div>

          <div className={`${styles.ledgerNumbers} ${styles.topLedgerNumbers}`} aria-label="Yuqoridagi qo‘shimcha chiziqlar 1 dan 3 gacha sanaladi">
            <span>3</span><span>2</span><span>1</span>
          </div>
          <div className={`${styles.ledgerNumbers} ${styles.bottomLedgerNumbers}`} aria-label="Pastdagi qo‘shimcha chiziqlar 1 dan 3 gacha sanaladi">
            <span>1</span><span>2</span><span>3</span>
          </div>
          <div className={styles.mainStaffNumbers} aria-label="Asosiy nota yo‘li 1 dan 5 gacha">
            <span>5</span><span>4</span><span>3</span><span>2</span><span>1</span>
          </div>
          <div className={styles.staffCaption}>Nota yo‘li · 5 ta asosiy chiziq</div>
        </div>

        <div className={`${styles.rememberBar} ${styles.ledgerReminder}`}>
          <span className={styles.rememberIcon} aria-hidden="true"><AppIcon name="bulb" size={30} /></span>
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
      <div className={styles.stage}>{step === 0 ? <MainStaffScreen /> : <LedgerLinesScreen />}</div>
      {step === 0 ? <Link className={`${styles.fab} ${styles.prev}`} href="/dars/3" aria-label="3-darsga qaytish"><AppIcon name="arrow-left" size={23} /></Link> : <button className={`${styles.fab} ${styles.prev}`} type="button" onClick={() => setStep(0)} aria-label="Oldingi bosqich"><AppIcon name="arrow-left" size={23} /></button>}
      {step === 0 ? <button className={`${styles.fab} ${styles.next}`} type="button" onClick={() => setStep(1)} aria-label="Qo‘shimcha chiziqlarga o‘tish"><AppIcon name="arrow-right" size={23} /></button> : <Link className={`${styles.fab} ${styles.next}`} href="/dars/5" aria-label="5-darsga o‘tish"><AppIcon name="arrow-right" size={23} /></Link>}
    </main>
  );
}
