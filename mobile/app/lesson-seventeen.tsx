import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { LessonSeventeenPage } from '@/components/lessons/LessonSeventeenPage';
import { ErrorState, LoadingState } from '@/components/ui/DataState';
import { Screen } from '@/components/ui/Screen';
import { useCourse } from '@/context/CourseContext';
import { API_BASE_URL, ApiError, apiRequest } from '@/services/api/client';
import { kidLessonHref } from '@/utils/kid-lesson-navigation';
import type { BlockDetailResponse, CourseBlockSummary } from '@/types/content';

function absoluteUrl(path: string | null | undefined) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export default function LessonSeventeenScreen() {
  const { blockId } = useLocalSearchParams<{ blockId: string }>();
  const { data: courseData, reload: reloadCourse } = useCourse();
  const [details, setDetails] = useState<BlockDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lesson = useMemo(() => {
    const lessons = courseData?.lessons ?? [];
    return lessons.find((item) => item.declaredNumber === 17)
      ?? lessons.find((item) => item.blocks.some((block) => block.id === blockId));
  }, [blockId, courseData]);

  const sourceBlockIds = useMemo(() => {
    if (lesson?.blocks.length) return lesson.blocks.slice(0, 1).map((block) => block.id);
    return blockId ? [blockId] : [];
  }, [blockId, lesson?.blocks]);

  const sourceKey = sourceBlockIds.join('|');

  const load = useCallback(async () => {
    if (!sourceBlockIds.length) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await Promise.all(sourceBlockIds.map((id) => apiRequest<BlockDetailResponse>(`/api/blocks/${id}`)));
      setDetails(response);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '17-darsni yuklab bo‘lmadi');
    } finally {
      setIsLoading(false);
    }
  }, [sourceKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const images = useMemo(
    () => details.flatMap((detail) => detail.assets.filter((asset) => asset.kind === 'image')),
    [details],
  );

  const serverCompleted = !!lesson?.blockCount && lesson.completed === lesson.blockCount;
  const completed = localCompleted || serverCompleted;

  const nextLesson = useMemo(() => {
    if (!courseData) return null;
    return courseData.lessons
      .filter((item) => (item.declaredNumber ?? Number.MAX_SAFE_INTEGER) > 17)
      .sort((a, b) => (a.declaredNumber ?? a.order) - (b.declaredNumber ?? b.order))[0] ?? null;
  }, [courseData]);

  const completeBlock = async (block: CourseBlockSummary) => {
    if (block.state === 'completed') return;
    if (block.type === 'practice_acknowledgement') {
      await apiRequest(`/api/blocks/${block.id}/submit`, {
        method: 'POST',
        headers: { 'Idempotency-Key': `lesson-seventeen-${block.id}-${Date.now().toString(36)}` },
        body: { acknowledged: true },
      });
      return;
    }
    await apiRequest(`/api/blocks/${block.id}/complete`, { method: 'POST' });
  };

  const completeLesson = async () => {
    if (!lesson || completed) return;
    setIsSaving(true);
    setError(null);
    try {
      for (const block of lesson.blocks) await completeBlock(block);
      setLocalCompleted(true);
      await reloadCourse();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '17-dars natijasini saqlab bo‘lmadi');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !details.length) return <Screen><LoadingState text="17-dars yuklanmoqda…" /></Screen>;
  if (error && !details.length) return <Screen><ErrorState message={error} onRetry={() => void load()} /></Screen>;
  if (!lesson) return <Screen><ErrorState message="17-dars materiali topilmadi." /></Screen>;

  return (
    <Screen>
      <LessonSeventeenPage
        images={images}
        completed={completed}
        saving={isSaving}
        onBack={() => router.back()}
        onComplete={() => void completeLesson()}
        onNext={() => {
          const nextBlock = nextLesson?.blocks[0];
          if (!nextBlock) {
            router.replace('/(tabs)/lessons');
            return;
          }
          const href = kidLessonHref(nextLesson?.declaredNumber, nextBlock.id);
          if (href) {
            router.replace(href);
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
