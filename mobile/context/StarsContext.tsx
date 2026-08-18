import * as SecureStore from 'expo-secure-store';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

type LessonStarScore = 2 | 3;
type ScoreMap = Record<string, LessonStarScore>;

type StarsContextValue = {
  totalStars: number;
  getLessonStars: (lessonNumber: number | null | undefined) => number;
  awardLessonStars: (lessonNumber: number, stars: LessonStarScore) => void;
};

const StarsContext = createContext<StarsContextValue | null>(null);

function storageKeyFor(userId: string) {
  return `d_solfedjio_stars_${userId.replace(/[^A-Za-z0-9._-]/g, '_')}`;
}

export function StarsProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [scores, setScores] = useState<ScoreMap>({});
  const storageKey = userId ? storageKeyFor(userId) : null;

  useEffect(() => {
    let active = true;

    if (!storageKey) {
      setScores({});
      return () => {
        active = false;
      };
    }

    void SecureStore.getItemAsync(storageKey)
      .then((raw) => {
        if (!active) return;
        if (!raw) {
          setScores({});
          return;
        }
        try {
          const parsed = JSON.parse(raw) as Record<string, number>;
          const safe: ScoreMap = {};
          for (const [lesson, stars] of Object.entries(parsed)) {
            if (stars === 2 || stars === 3) safe[lesson] = stars;
          }
          setScores(safe);
        } catch {
          setScores({});
        }
      })
      .catch(() => {
        if (active) setScores({});
      });

    return () => {
      active = false;
    };
  }, [storageKey]);

  const awardLessonStars = useCallback((lessonNumber: number, stars: LessonStarScore) => {
    if (!storageKey) return;

    setScores((current) => {
      const key = String(lessonNumber);
      const previous = current[key] ?? 0;
      if (previous >= stars) return current;

      const next: ScoreMap = { ...current, [key]: stars };
      void SecureStore.setItemAsync(storageKey, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, [storageKey]);

  const getLessonStars = useCallback(
    (lessonNumber: number | null | undefined) => {
      if (!lessonNumber) return 0;
      return scores[String(lessonNumber)] ?? 0;
    },
    [scores],
  );

  const totalStars = useMemo(
    () => Object.values(scores).reduce((sum, stars) => sum + stars, 0),
    [scores],
  );

  const value = useMemo(
    () => ({ totalStars, getLessonStars, awardLessonStars }),
    [awardLessonStars, getLessonStars, totalStars],
  );

  return <StarsContext.Provider value={value}>{children}</StarsContext.Provider>;
}

export function useStars() {
  const value = useContext(StarsContext);
  if (!value) throw new Error('useStars must be used inside StarsProvider');
  return value;
}
