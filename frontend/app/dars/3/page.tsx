'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { AppIcon } from '@/components/app-icon';
import { SiteHeader } from '@/components/site-header';
import { SourceAudioButton } from '@/components/source-audio-button';
import { sourceMediaUrl } from '@/lib/source-media';
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
const SAMPLE_AUDIO = ['audio11.wav', 'audio12.wav', 'audio13.wav'] as const;
const WAVEFORM = [8, 14, 20, 16, 10, 22, 18, 12, 20, 8, 16, 22, 14, 10, 18, 6, 20, 12, 16, 22, 9, 17, 13, 19] as const;
const OCTAVE_BLACK_KEYS = Array.from({ length: 8 }, (_, octave) =>
  [0, 1, 3, 4, 5].map((position) => octave * 7 + position)
).flat();

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

function InteractiveNotePiano() {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const sampleBankRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const voicesRef = useRef<Set<HTMLAudioElement>>(new Set());
  const activeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blackAfter = [0, 1, 3, 4, 5];

  useEffect(() => {
    const sampleBank = new Map<string, HTMLAudioElement>();

    NOTE_AUDIO.forEach(([note, source]) => {
      const audio = new Audio(sourceMediaUrl(source));
      audio.preload = 'auto';
      audio.load();
      sampleBank.set(note, audio);
    });

    sampleBankRef.current = sampleBank;

    return () => {
      if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
      sampleBank.forEach((audio) => {
        audio.pause();
        audio.removeAttribute('src');
      });
      voicesRef.current.forEach((voice) => {
        voice.pause();
        voice.removeAttribute('src');
      });
      voicesRef.current.clear();
      sampleBankRef.current.clear();
    };
  }, []);

  const playNote = (note: string, source: string) => {
    const template = sampleBankRef.current.get(note);
    const voice = template
      ? (template.cloneNode(true) as HTMLAudioElement)
      : new Audio(sourceMediaUrl(source));

    voice.preload = 'auto';
    voice.currentTime = 0;
    voice.volume = 1;

    if (voicesRef.current.size >= 12) {
      const oldest = voicesRef.current.values().next().value as HTMLAudioElement | undefined;
      if (oldest) {
        oldest.pause();
        oldest.removeAttribute('src');
        voicesRef.current.delete(oldest);
      }
    }

    const cleanup = () => {
      voicesRef.current.delete(voice);
      voice.removeEventListener('ended', cleanup);
      voice.removeEventListener('error', cleanup);
    };

    voicesRef.current.add(voice);
    voice.addEventListener('ended', cleanup, { once: true });
    voice.addEventListener('error', cleanup, { once: true });
    void voice.play().catch(cleanup);

    setActiveNote(note);
    if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
    activeTimerRef.current = setTimeout(() => {
      setActiveNote((current) => current === note ? null : current);
    }, 720);
  };

  return (
    <div className={styles.notePianoStage}>
      <div className={styles.notePianoTopline}>
        <span className={styles.notePianoHint}><AppIcon name="sparkle" size={15} /> Oq klavishlarni bosing va tinglang</span>
        <span className={styles.notePianoStatus}>{activeNote ? `${activeNote} notasi yangradi` : 'Pianinoda nota tanlang'}</span>
      </div>

      <div className={styles.pianoInstrument}>
        <div className={styles.pianoLid} aria-hidden="true">
          <span className={styles.pianoBrand}>SOLFEDJIO</span>
          <span className={styles.pianoBrandMark}><AppIcon name="music" size={16} /></span>
        </div>
        <div className={styles.pianoFelt} aria-hidden="true" />
        <div className={styles.notePiano} aria-label="Do dan Si gacha interaktiv pianino">
          <div className={styles.noteWhiteKeys}>
          {NOTE_AUDIO.map(([note, source]) => {
            const isActive = activeNote === note;

            return (
              <button
                className={styles.notePianoKey}
                data-active={isActive ? 'true' : 'false'}
                key={note}
                type="button"
                title={`${note} notasini tinglash`}
                aria-label={`${note} notasini chalish`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  playNote(note, source);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    playNote(note, source);
                  }
                }}
              >
                <span className={styles.floatingNote} aria-hidden="true"><AppIcon name="note" size={23} /></span>
                <span className={styles.keyGlow} aria-hidden="true" />
                <strong>{note}</strong>
              </button>
            );
          })}
          </div>

          {blackAfter.map((afterWhite) => (
            <span
              className={styles.noteBlackKey}
              key={afterWhite}
              style={{ left: `${((afterWhite + 1) / 7) * 100}%` }}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className={styles.pianoBase} aria-hidden="true" />
      </div>

      <div className={styles.noteSequence} aria-label="Notalar ketma-ketligi">
        {NOTE_AUDIO.map(([note], index) => (
          <span className={activeNote === note ? styles.noteSequenceActive : ''} key={note}>
            {note}
            {index < NOTE_AUDIO.length - 1 ? <AppIcon name="arrow-right" size={14} /> : null}
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
            <SourceAudioButton className={styles.listenButton} key={source} source={source}>
              <span className={styles.playIcon}><AppIcon name="play" size={11} /></span>
              {quiz.audio.length > 1 ? `Tinglash ${audioIndex + 1}` : 'Tinglash'}
            </SourceAudioButton>
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
              <span aria-hidden="true">{isCorrect ? <AppIcon name="check" size={20} /> : isWrong ? <AppIcon name="x" size={20} /> : isSelected ? <AppIcon name="dot" size={18} /> : <AppIcon name="circle" size={18} />}</span>
            </button>
          );
        })}
      </div>

      <button className={styles.checkButton} disabled={!selected || checked} onClick={() => setChecked(true)} type="button">
        {checked ? 'Tekshirildi' : 'Javobni tekshirish'}
      </button>

      {checked ? (
        <div className={selectedOption?.correct ? styles.goodFeedback : styles.retryFeedback}>
          {selectedOption?.correct ? <><AppIcon name="star" size={17} /><span>Barakalla! To‘g‘ri javob.</span></> : `To‘g‘ri javob: ${correctOption?.label}.`}
        </div>
      ) : null}
    </section>
  );
}

export default function LessonThreePage() {
  const [step, setStep] = useState(0);
  const [activeOctave, setActiveOctave] = useState<number | null>(null);
  const [hoveredOctave, setHoveredOctave] = useState<number | null>(null);
  const visibleOctave = hoveredOctave ?? activeOctave;

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
                <span className={styles.kicker}><AppIcon name="note" size={14} /> 3-DARS • MUSIQA NAZARIYASI</span>
                <h1>Klaviatura <span><AppIcon name="note" size={30} /></span></h1>
              </div>
              <div className={styles.musicDecor} aria-hidden="true"><AppIcon name="note" size={34} /><AppIcon name="music" size={42} /><AppIcon name="note" size={30} /></div>
            </div>

            <div className={styles.definition}>
              <strong>Klaviatura</strong> — musiqa cholg‘u sozlarida ma’lum tartibda joylashgan oq va qora klavishlar majmui.
            </div>

            <KeyboardVisual />

            <div className={styles.rememberBar}>
              <span className={styles.bulb}><AppIcon name="bulb" size={21} /></span>
              <p><strong>Eslab qoling:</strong> oq klavishlarda Do, Re, Mi, Fa, Sol, Lya va Si notalari ketma-ket joylashadi.</p>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <section className={styles.notesScreen}>
            <div className={styles.screenHeading}>
              <span className={styles.kicker}><AppIcon name="music" size={15} /> NOTALARNI ESHITAMIZ</span>
              <h1>Notalarni tinglang</h1>
              <p>Pianino klavishlarini bosing, tovushlarni tinglang va nota nomlarini eslab qoling.</p>
            </div>
            <InteractiveNotePiano />
          </section>
        ) : null}

        {step === 2 ? (
          <section className={styles.octaveScreen}>
            <div className={styles.octaveHero}>
              <div className={styles.octaveCopy}>
                <div className={styles.octaveLabelRow}>
                  <span className={styles.octaveLabelIcon} aria-hidden="true"><AppIcon name="music" size={22} /></span>
                  <span>3-DARS • DAVOMI</span>
                </div>
                <h1>Kuy va oktavalar</h1>
                <p><strong>Kuy</strong> - bu turli balandlikdagi tovushlarning ma&apos;lum bir ritm va lad bilan uyg&apos;unlashgan holati.</p>
              </div>
              <img className={styles.octaveDecor} src="/assets/figma/lesson-3-octave-decor.svg" alt="" />
            </div>

            <div className={styles.audioSamples}>
              {SAMPLE_AUDIO.map((source, index) => (
                <SourceAudioButton
                  className={`${styles.audioSampleCard} ${index === 0 ? styles.audioSamplePurple : index === 1 ? styles.audioSampleBlue : styles.audioSampleGreen}`}
                  key={source}
                  source={source}
                >
                  <span className={styles.audioSampleIcon} aria-hidden="true">
                    <span className={styles.audioPulseRing} />
                    <AppIcon name="speaker" size={22} />
                  </span>
                  <span className={styles.audioSampleBody}>
                    <strong>{index + 1}-namuna</strong>
                    <span className={styles.waveformWrap} aria-hidden="true">
                      <span className={styles.waveform}>
                        {WAVEFORM.map((height, barIndex) => (
                          <i
                            key={barIndex}
                            style={{
                              height: `${height}px`,
                              animationDelay: `${(barIndex % 7) * 55}ms`,
                            }}
                          />
                        ))}
                      </span>
                      <span className={styles.waveformPlayhead} />
                    </span>
                    <span className={styles.audioSampleStatus} aria-hidden="true">
                      <small className={styles.audioIdleLabel}>Tinglash</small>
                      <small className={styles.audioPlayingLabel}>Chalinyapti</small>
                    </span>
                  </span>
                </SourceAudioButton>
              ))}
            </div>

            <section className={styles.octaveKeyboardPanel} aria-label="Oktavalar klaviaturasi">
              <h2>Oktavalar</h2>
              <div className={styles.octaveKeyboard}>
                <div className={styles.octaveWhiteKeys}>
                  {Array.from({ length: 56 }, (_, index) => {
                    const octaveIndex = Math.floor(index / 7);
                    return (
                      <span
                        data-active={visibleOctave === octaveIndex ? 'true' : 'false'}
                        data-range={octaveIndex + 1}
                        key={index}
                      />
                    );
                  })}
                </div>
                {OCTAVE_BLACK_KEYS.map((keyIndex) => {
                  const octaveIndex = Math.floor(keyIndex / 7);
                  return (
                    <span
                      className={styles.octaveBlackKey}
                      data-active={visibleOctave === octaveIndex ? 'true' : 'false'}
                      key={keyIndex}
                      style={{ left: `${((keyIndex + 1) / 56) * 100}%` }}
                      aria-hidden="true"
                    />
                  );
                })}
              </div>
              <div className={styles.octaveRanges}>
                {OCTAVES.map((octave, index) => (
                  <button
                    className={styles.octaveRange}
                    data-active={activeOctave === index ? 'true' : 'false'}
                    data-range={index + 1}
                    key={octave}
                    type="button"
                    aria-pressed={activeOctave === index}
                    onClick={() => setActiveOctave((current) => current === index ? null : index)}
                    onPointerEnter={() => setHoveredOctave(index)}
                    onPointerLeave={() => setHoveredOctave(null)}
                    onFocus={() => setHoveredOctave(index)}
                    onBlur={() => setHoveredOctave(null)}
                  >
                    <span aria-hidden="true" />
                    <small>{octave}</small>
                  </button>
                ))}
              </div>
              <div className={styles.octaveKeyboardHint}>
                <AppIcon name="bulb" size={14} />
                <span>{visibleOctave === null ? 'Oktava nomini bosing — shu qism klaviaturada ajralib ko‘rinadi.' : `${OCTAVES[visibleOctave]} klaviaturada ajratildi`}</span>
              </div>
            </section>

            <div
              className={styles.pitchScale}
              data-selected={visibleOctave === null ? 'false' : 'true'}
              style={{ '--pitch-position': `${visibleOctave === null ? 50 : ((visibleOctave + 0.5) / OCTAVES.length) * 100}%` } as CSSProperties}
            >
              <span className={`${styles.pitchLabel} ${styles.pitchLow}`}>
                <AppIcon name="note" size={15} />
                <strong>Past tovushlar</strong>
              </span>
              <span className={styles.pitchLine} aria-hidden="true">
                <span className={styles.pitchGlow} />
                <span className={styles.pitchMarker}><AppIcon name="music" size={13} /></span>
              </span>
              <span className={`${styles.pitchLabel} ${styles.pitchHigh}`}>
                <strong>Baland tovushlar</strong>
                <AppIcon name="note" size={15} />
              </span>
            </div>

            <aside className={styles.octaveFact}>
              <span className={styles.octaveFactIcon} aria-hidden="true"><AppIcon name="bulb" size={22} /></span>
              <div className={styles.octaveFactCopy}>
                <strong>Qiziqarli fakt</strong>
                <p>Bilasizmi? Fil ham musiqa tinglashni yaxshi ko&apos;radi! Fillar past tovushlarni oyoqlari orqali his qiladi. Pianinodagi eng past tovush ham xuddi shunday — uni quloq bilan eshitish qiyin, lekin his qilsa bo&apos;ladi!</p>
              </div>
            </aside>
          </section>
        ) : null}

        {step >= 3 ? <QuizScreen key={step} quiz={QUIZZES[step - 3]} index={step - 3} /> : null}
      </section>

      <div className={styles.stepCounter}>{step + 1} / {TOTAL_STEPS}</div>

      {step === 0 ? (
        <Link className={`${styles.fab} ${styles.prev}`} href="/dars/2" aria-label="2-darsga qaytish"><AppIcon name="arrow-left" size={23} /></Link>
      ) : (
        <button className={`${styles.fab} ${styles.prev}`} onClick={goBack} type="button" aria-label="Oldingi bosqich"><AppIcon name="arrow-left" size={23} /></button>
      )}

      {step < TOTAL_STEPS - 1 ? (
        <button className={`${styles.fab} ${styles.next}`} onClick={goNext} type="button" aria-label="Keyingi bosqich"><AppIcon name="arrow-right" size={23} /></button>
      ) : (
        <Link className={`${styles.fab} ${styles.next}`} href="/dars/4" aria-label="4-darsga o‘tish"><AppIcon name="arrow-right" size={23} /></Link>
      )}
    </main>
  );
}
