'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import styles from './lesson-three.module.css';

const NOTES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'Lya', 'Si'] as const;
const NOTE_AUDIO = [
  ['Do', 'audio10.wav'],
  ['Re', 'audio4.wav'],
  ['Mi', 'audio5.wav'],
  ['Fa', 'audio6.wav'],
  ['Sol', 'audio7.wav'],
  ['Lya', 'audio8.wav'],
  ['Si', 'audio9.wav'],
] as const;
const OCTAVES = ['Sub kontr', 'Kontr oktava', 'Katta oktava', 'Kichik oktava', 'Birinchi oktava', 'Ikkinchi oktava', 'Uchinchi oktava', 'To‘rtinchi oktava'] as const;

const QUIZZES = [
  {
    prompt: '1 oktava notalari qaysi registrga kiradi?',
    options: [
      { id: 'middle', label: 'O‘rta registr', correct: true },
      { id: 'high', label: 'Yuqori registr', correct: false },
      { id: 'low', label: 'Pastki registr', correct: false },
    ],
  },
  {
    prompt: 'Solfedjio bu — ?',
    options: [
      { id: 'keys', label: 'Oq va qora klavishlar ketma-ketligi', correct: false },
      { id: 'sing', label: 'Notadan kuylash', correct: true },
      { id: 'memory', label: 'Kuyni yoddan aytish', correct: false },
    ],
  },
  {
    prompt: 'Kuy qaysi registrda yangradi?',
    audio: ['audio12.wav'],
    options: [
      { id: 'low', label: 'Pastki registr', correct: false },
      { id: 'high', label: 'Yuqori registr', correct: false },
      { id: 'middle', label: 'O‘rta registr', correct: true },
    ],
  },
  {
    prompt: 'Qushlar sayrashini qaysi registrda ifoda etsa bo‘ladi?',
    options: [
      { id: 'middle', label: 'O‘rta registr', correct: false },
      { id: 'high', label: 'Yuqori registr', correct: true },
      { id: 'low', label: 'Pastki registr', correct: false },
    ],
  },
  {
    prompt: 'Kuy qaysi registrda ijro etildi?',
    audio: ['audio11.wav', 'audio14.wav'],
    options: [
      { id: 'middle', label: 'O‘rta registr', correct: false },
      { id: 'high', label: 'Yuqori registr', correct: false },
      { id: 'low', label: 'Pastki registr', correct: true },
    ],
  },
] as const;

const TOTAL_STEPS = 8;

function KeyboardVisual() {
  return (
    <div className={styles.keyboardShell}>
      <div className={styles.keyboard} aria-label="Do, Re, Mi, Fa, Sol, Lya, Si notalari ko‘rsatilgan klaviatura">
        {Array.from({ length: 21 }, (_, index) => {
          const note = NOTES[index % NOTES.length];
          return (
            <div className={styles.whiteKey} key={index}>
              <strong>{note}</strong>
            </div>
          );
        })}
        {[0, 1, 3, 4, 5, 7, 8, 10, 11, 12, 14, 15, 17, 18, 19].map((keyIndex) => (
          <span
            className={styles.blackKey}
            key={keyIndex}
            style={{ left: `${((keyIndex + 1) / 21) * 100}%` }}
          >
            <small>{['Do♯', 'Re♯', 'Fa♯', 'Sol♯', 'Lya♯'][keyIndex % 5]}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

function QuizScreen({ quiz, index }: { quiz: (typeof QUIZZES)[number]; index: number }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const selectedOption = quiz.options.find((option) => option.id === selected);
  const correctOption = quiz.options.find((option) => option.correct);

  return (
    <section className={styles.quizScreen}>
      <div className={styles.screenHeading}>
        <span className={styles.kicker}>MASHQ {index + 1}</span>
        <h1>{quiz.prompt}</h1>
        <p>To‘g‘ri javobni tanlang va keyin tekshiring.</p>
      </div>

      {'audio' in quiz && quiz.audio?.length ? (
        <div className={styles.listenRow}>
          {quiz.audio.map((source, audioIndex) => (
            <button className={styles.listenButton} data-source-audio={source} key={source} type="button">
              <span className={styles.playIcon}>▶</span>
              {quiz.audio.length > 1 ? `Tinglash ${audioIndex + 1}` : 'Tinglash'}
            </button>
          ))}
        </div>
      ) : null}

      <div className={styles.answerGrid}>
        {quiz.options.map((option) => {
          const isSelected = selected === option.id;
          const isCorrect = checked && option.correct;
          const isWrong = checked && isSelected && !option.correct;
          return (
            <button
              className={`${styles.answerOption} ${isSelected ? styles.selected : ''} ${isCorrect ? styles.correct : ''} ${isWrong ? styles.wrong : ''}`}
              disabled={checked}
              key={option.id}
              onClick={() => setSelected(option.id)}
              type="button"
            >
              <span>{option.label}</span>
              <span>{isCorrect ? '✓' : isWrong ? '×' : isSelected ? '●' : '○'}</span>
            </button>
          );
        })}
      </div>

      <button className={styles.checkButton} disabled={!selected || checked} onClick={() => setChecked(true)} type="button">
        {checked ? 'Tekshirildi' : 'Javobni tekshirish'}
      </button>

      {checked ? (
        <div className={selectedOption?.correct ? styles.goodFeedback : styles.retryFeedback}>
          {selectedOption?.correct ? 'Barakalla! To‘g‘ri javob. ⭐' : `To‘g‘ri javob: ${correctOption?.label}.`}
        </div>
      ) : null}
    </section>
  );
}

export default function LessonThreePage() {
  const [step, setStep] = useState(0);

  const goBack = () => setStep((current) => Math.max(0, current - 1));
  const goNext = () => setStep((current) => Math.min(TOTAL_STEPS - 1, current + 1));

  return (
    <main className={styles.page}>
      <SiteHeader mode="lesson" activeLesson={3} />

      <div className={styles.progressBar} aria-label={`3-dars, ${step + 1}-bosqich, jami ${TOTAL_STEPS} bosqich`}>
        <div className={styles.progressFill} style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} />
      </div>

      <section className={styles.stage}>
        {step === 0 ? (
          <div className={styles.keyboardScreen}>
            <div className={styles.heroRow}>
              <div>
                <span className={styles.kicker}>♪ 3-DARS • MUSIQA NAZARIYASI</span>
                <h1>Klaviatura <span>♪</span></h1>
              </div>
              <div className={styles.musicDecor} aria-hidden="true">♪ ♫ ♪</div>
            </div>

            <div className={styles.definition}>
              <strong>Klaviatura</strong> — musiqa cholg‘u sozlarida ma’lum tartibda joylashgan oq va qora klavishlar majmui.
            </div>

            <KeyboardVisual />

            <div className={styles.rememberBar}>
              <span className={styles.bulb}>💡</span>
              <p><strong>Eslab qoling:</strong> oq klavishlarda Do, Re, Mi, Fa, Sol, Lya va Si notalari ketma-ket joylashadi.</p>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <section className={styles.notesScreen}>
            <div className={styles.screenHeading}>
              <span className={styles.kicker}>NOTALARNI ESHITAMIZ</span>
              <h1>Notalarni tinglang</h1>
              <p>Har bir notani alohida tinglab, klaviaturadagi o‘rnini eslab qoling.</p>
            </div>
            <div className={styles.noteListenGrid}>
              {NOTE_AUDIO.map(([note, source]) => (
                <button className={styles.noteButton} data-source-audio={source} key={note} type="button">
                  <span>♪</span>
                  <strong>{note}</strong>
                  <small>Tinglash</small>
                </button>
              ))}
            </div>
            <div className={styles.noteSequence}>Do → Re → Mi → Fa → Sol → Lya → Si</div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className={styles.octaveScreen}>
            <div className={styles.octaveCopy}>
              <span className={styles.kicker}>KUY VA OKTAVALAR</span>
              <h1>Kuy va oktavalar</h1>
              <p>Kuy — bu turli balandlikdagi tovushlarning ma’lum bir ritm va lad bilan uyg‘unlashgan holati.</p>
              <div className={styles.listenRow}>
                {['audio11.wav', 'audio12.wav', 'audio13.wav'].map((source, index) => (
                  <button className={styles.listenButton} data-source-audio={source} key={source} type="button">
                    <span className={styles.playIcon}>▶</span> Namuna {index + 1}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.octaveGrid}>
              {OCTAVES.map((octave) => <div className={styles.octaveCard} key={octave}>{octave}</div>)}
            </div>
          </section>
        ) : null}

        {step >= 3 ? <QuizScreen key={step} quiz={QUIZZES[step - 3]} index={step - 3} /> : null}
      </section>

      <div className={styles.stepCounter}>{step + 1} / {TOTAL_STEPS}</div>

      {step === 0 ? (
        <Link className={`${styles.fab} ${styles.prev}`} href="/dars/2" aria-label="2-darsga qaytish">←</Link>
      ) : (
        <button className={`${styles.fab} ${styles.prev}`} onClick={goBack} type="button" aria-label="Oldingi bosqich">←</button>
      )}

      {step < TOTAL_STEPS - 1 ? (
        <button className={`${styles.fab} ${styles.next}`} onClick={goNext} type="button" aria-label="Keyingi bosqich">→</button>
      ) : (
        <Link className={`${styles.fab} ${styles.next}`} href="/dars/4" aria-label="4-darsga o‘tish">→</Link>
      )}
    </main>
  );
}
