import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { LessonTwoPage } from '@/components/lessons/LessonTwoPage';
import { ErrorState, LoadingState } from '@/components/ui/DataState';
import { Screen } from '@/components/ui/Screen';
import { useCourse } from '@/context/CourseContext';
import { API_BASE_URL, ApiError, apiRequest } from '@/services/api/client';
import type { BlockDetailResponse } from '@/types/content';

function absoluteUrl(path: string | null | undefined) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export default function LessonTwoScreen() {
  const { blockId } = useLocalSearchParams<{ blockId: string }>();
  const { data: courseData, reload: reloadCourse } = useCourse();
  const [data, setData] = useState<BlockDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!blockId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRequest<BlockDetailResponse>(`/api/blocks/${blockId}`);
      setData(response);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '2-darsni yuklab bo‘lmadi');
    } finally {
      setIsLoading(false);
    }
  }, [blockId]);

  useEffect(() => {
    void load();
  }, [load]);

  const audios = useMemo(
    () => data?.assets.filter((asset) => asset.kind === 'audio') ?? [],
    [data],
  );

  const nextLessonBlockId = useMemo(() => {
    if (!courseData) return null;
    const currentNumber = data?.block.lesson.declaredNumber ?? 2;
    const nextLesson = courseData.lessons
      .filter((lesson) => (lesson.declaredNumber ?? Number.MAX_SAFE_INTEGER) > currentNumber)
      .sort((a, b) => (a.declaredNumber ?? a.order) - (b.declaredNumber ?? b.order))[0];
    return nextLesson?.blocks[0]?.id ?? null;
  }, [courseData, data?.block.lesson.declaredNumber]);

  const complete = async () => {
    if (!blockId || !data || data.progress.state === 'completed') return;
    setIsSaving(true);
    setError(null);
    try {
      await apiRequest(`/api/blocks/${blockId}/complete`, { method: 'POST' });
      await reloadCourse();
      setData((current) => current
        ? { ...current, progress: { ...current.progress, state: 'completed' } }
        : current);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Natijani saqlab bo‘lmadi');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !data) {
    return <Screen><LoadingState text="2-dars yuklanmoqda…" /></Screen>;
  }

  if (error && !data) {
    return <Screen><ErrorState message={error} onRetry={() => void load()} /></Screen>;
  }

  if (!data) {
    return <Screen><ErrorState message="2-dars materiali topilmadi." /></Screen>;
  }

  return (
    <Screen>
      <LessonTwoPage
        audios={audios}
        completed={data.progress.state === 'completed'}
        saving={isSaving}
        onBack={() => router.back()}
        onComplete={() => void complete()}
        onNext={() => {
          if (nextLessonBlockId) {
            router.replace({ pathname: '/blocks/[id]', params: { id: nextLessonBlockId } });
            return;
          }
          router.replace('/(tabs)/lessons');
        }}
        resolveUrl={absoluteUrl}
      />
      {error ? <ErrorState message={error} /> : null}
    </Screen>
  );
}
