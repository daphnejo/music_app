import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { LessonThreePage } from '@/components/lessons/LessonThreePage';
import { ErrorState, LoadingState } from '@/components/ui/DataState';
import { Screen } from '@/components/ui/Screen';
import { useCourse } from '@/context/CourseContext';
import { API_BASE_URL, ApiError, apiRequest } from '@/services/api/client';
import type { BlockDetailResponse, CourseBlockSummary } from '@/types/content';

function absoluteUrl(path: string | null | undefined) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function idempotencyKey(blockId: string) {
  return `lesson-three-${blockId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function LessonThreeScreen() {
  const { blockId } = useLocalSearchParams<{ blockId: string }>();
  const { data: courseData, reload: reloadCourse } = useCourse();
  const [details, setDetails] = useState<BlockDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lesson = useMemo(() => {
    const lessons = courseData?.lessons ?? [];
    return lessons.find((item) => item.declaredNumber === 3)
      ?? lessons.find((item) => item.blocks.some((block) => block.id === blockId));
  }, [blockId, courseData]);

  const sourceBlockIds = useMemo(() => {
    if (lesson?.blocks.length) return lesson.blocks.slice(0, 2).map((block) => block.id);
    return blockId ? [blockId] : [];
  }, [blockId, lesson?.blocks]);

  const sourceKey = sourceBlockIds.join('|');

  const load = useCallback(async () => {
    if (!sourceBlockIds.length) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await Promise.all(
        sourceBlockIds.map((id) => apiRequest<BlockDetailResponse>(`/api/blocks/${id}`)),
      );
      setDetails(response);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '3-darsni yuklab bo‘lmadi');
    } finally {
      setIsLoading(false);
    }
  }, [sourceKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const noteAudios = useMemo(
    () => details[0]?.assets.filter((asset) => asset.kind === 'audio') ?? [],
    [details],
  );

  const melodyAudios = useMemo(
    () => details[1]?.assets.filter((asset) => asset.kind === 'audio') ?? [],
    [details],
  );

  const serverCompleted = !!lesson?.blockCount && lesson.completed === lesson.blockCount;
  const completed = localCompleted || serverCompleted;

  const nextLessonBlockId = useMemo(() => {
    if (!courseData) return null;
    const nextLesson = courseData.lessons
      .filter((item) => (item.declaredNumber ?? Number.MAX_SAFE_INTEGER) > 3)
      .sort((a, b) => (a.declaredNumber ?? a.order) - (b.declaredNumber ?? b.order))[0];
    return nextLesson?.blocks[0]?.id ?? null;
  }, [courseData]);

  const completeBlock = async (block: CourseBlockSummary) => {
    if (block.state === 'completed') return;
    if (block.type === 'practice_acknowledgement') {
      await apiRequest(`/api/blocks/${block.id}/submit`, {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey(block.id) },
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
      for (const block of lesson.blocks) {
        await completeBlock(block);
      }
      setLocalCompleted(true);
      await reloadCourse();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '3-dars natijasini saqlab bo‘lmadi');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !details.length) {
    return <Screen><LoadingState text="3-dars yuklanmoqda…" /></Screen>;
  }

  if (error && !details.length) {
    return <Screen><ErrorState message={error} onRetry={() => void load()} /></Screen>;
  }

  if (!lesson) {
    return <Screen><ErrorState message="3-dars materiali topilmadi." /></Screen>;
  }

  return (
    <Screen>
      <LessonThreePage
        noteAudios={noteAudios}
        melodyAudios={melodyAudios}
        completed={completed}
        saving={isSaving}
        onBack={() => router.back()}
        onComplete={() => void completeLesson()}
        onOpenPiano={() => router.push('/piano')}
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
