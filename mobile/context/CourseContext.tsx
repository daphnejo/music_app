import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest, ApiError } from '@/services/api/client';
import type { CourseMapResponse } from '@/types/content';

type CourseContextValue = {
  data: CourseMapResponse | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const CourseContext = createContext<CourseContextValue | null>(null);

export function CourseProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [data, setData] = useState<CourseMapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      setData(await apiRequest<CourseMapResponse>('/api/course'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kursni yuklab bo‘lmadi');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // Never display course/progress cached in memory from a different account.
    setData(null);
    setError(null);
    void reload();
  }, [userId, reload]);

  const value = useMemo(() => ({ data, isLoading, error, reload }), [data, isLoading, error, reload]);
  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

export function useCourse() {
  const value = useContext(CourseContext);
  if (!value) throw new Error('useCourse must be used inside CourseProvider');
  return value;
}
