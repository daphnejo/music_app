import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SourceAudioSection } from '@/components/media/SourceAudioSection';
import { SourceImageGallery } from '@/components/media/SourceImageGallery';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { ErrorState, LoadingState } from '@/components/ui/DataState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { useCourse } from '@/context/CourseContext';
import { useTheme } from '@/context/ThemeContext';
import { API_BASE_URL, ApiError, apiRequest } from '@/services/api/client';
import type { BlockDetailResponse } from '@/types/content';

type SubmitResponse = {
  attemptId: string;
  correct: boolean;
  score: number;
  maxScore: number;
  explanation?: string | null;
  correctOptionIds?: string[];
  replayed: boolean;
};

function absoluteUrl(path: string | null | undefined) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function createIdempotencyKey(blockId: string) {
  return `${blockId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function bodyLines(body: unknown): string[] {
  if (typeof body === 'string') return body.trim() ? [body.trim()] : [];
  if (!Array.isArray(body)) return [];
  return body.map((item) => String(item ?? '').trim()).filter(Boolean);
}

function normalizeHeading(value: string) {
  return value
    .toLocaleLowerCase('uz-UZ')
    .replace(/[’‘`ʻʼ']/g, '')
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function isRepeatedSourceHeading(line: string, blockTitle: string, lessonTitle: string) {
  const normalizedLine = normalizeHeading(line);
  const normalizedBlock = normalizeHeading(blockTitle);
  const normalizedLesson = normalizeHeading(lessonTitle);

  if (!normalizedLine) return true;
  if (normalizedLine === normalizedBlock || normalizedLine === normalizedLesson) return true;

  const withoutLessonNumber = line.replace(/^\s*\d+\s*[-.]?\s*dars\s*[.:'’\-–—]*\s*/i, '');
  const normalizedWithoutNumber = normalizeHeading(withoutLessonNumber);
  return normalizedWithoutNumber === normalizedBlock || normalizedWithoutNumber === normalizedLesson;
}

function optionTextForDisplay(value: string) {
  const trimmed = value.trim();
  const prefixPattern = /^\s*[a-z]\s*[).:\-]\s*/i;
  if (!prefixPattern.test(trimmed)) return trimmed;
  return trimmed.replace(prefixPattern, '').trim();
}

function sourceFileName(value: string | null | undefined) {
  if (!value) return null;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // Keep the original path if decoding fails.
  }
  const clean = decoded.split('?')[0] ?? decoded;
  return clean.split('/').filter(Boolean).pop()?.toLocaleLowerCase('uz-UZ') ?? null;
}

export default function BlockDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { reload: reloadCourse } = useCourse();
  const { colors } = useTheme();
  const [data, setData] = useState<BlockDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    setSubmitResult(null);
    try {
      const next = await apiRequest<BlockDetailResponse>(`/api/blocks/${id}`);
      setData(next);
      const draft = next.draftPayload as { optionId?: string } | null;
      setSelectedOptionId(draft?.optionId ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Dars qismini yuklab bo‘lmadi');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const lines = useMemo(() => {
    const rawLines = bodyLines(data?.block.body);
    if (!data) return rawLines;
    return rawLines.filter((line) => !isRepeatedSourceHeading(line, data.block.title, data.block.lesson.title));
  }, [data]);
  const images = data?.assets.filter((asset) => asset.kind === 'image') ?? [];
  const audios = data?.assets.filter((asset) => asset.kind === 'audio') ?? [];
  const videos = data?.assets.filter((asset) => asset.kind === 'video') ?? [];
  const optionImageNames = new Set(
    (data?.question?.options ?? [])
      .map((option) => sourceFileName(option.imageUrl))
      .filter((name): name is string => !!name),
  );
  const contentImages = images.filter((asset) => !optionImageNames.has(sourceFileName(asset.file) ?? ''));

  const saveDraft = async (optionId: string) => {
    if (!id) return;
    setSelectedOptionId(optionId);
    try {
      await apiRequest(`/api/blocks/${id}/draft`, { method: 'POST', body: { optionId } });
    } catch {
      // Tanlov local UI'da qoladi; yuborish vaqtida server yana tekshiradi.
    }
  };

  const submitQuestion = async () => {
    if (!id || !selectedOptionId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await apiRequest<SubmitResponse>(`/api/blocks/${id}/submit`, {
        method: 'POST',
        headers: { 'Idempotency-Key': createIdempotencyKey(id) },
        body: { optionId: selectedOptionId },
      });
      setSubmitResult(result);
      await reloadCourse();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Javobni yuborib bo‘lmadi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeBlock = async () => {
    if (!id || !data) return;
    setIsSubmitting(true);
    setError(null);
    try {
      if (data.block.type === 'practice_acknowledgement') {
        await apiRequest<SubmitResponse>(`/api/blocks/${id}/submit`, {
          method: 'POST',
          headers: { 'Idempotency-Key': createIdempotencyKey(id) },
          body: { acknowledged: true },
        });
      } else {
        await apiRequest(`/api/blocks/${id}/complete`, { method: 'POST' });
      }
      await reloadCourse();
      setData((current) => current ? { ...current, progress: { ...current.progress, state: 'completed' } } : current);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Bajarilganini saqlab bo‘lmadi');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !data) return <Screen><LoadingState text="Material yuklanmoqda…" /></Screen>;
  if (error && !data) return <Screen><ErrorState message={error} onRetry={() => void load()} /></Screen>;
  if (!data) return <Screen><ErrorState message="Material topilmadi." /></Screen>;

  const progressPercent = data.navigation.total ? Math.round((data.navigation.position / data.navigation.total) * 100) : 0;
  const cardStyle = { backgroundColor: colors.surface, borderColor: colors.border };
  const completionLabel = data.progress.state === 'completed'
    ? 'Bajarildi'
    : isSubmitting
      ? 'Saqlanmoqda…'
      : data.block.type === 'practice_acknowledgement'
        ? 'Mashqni bajardim'
        : 'O‘rgandim / Bajarildi';

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.back, cardStyle]}>
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{data.block.lesson.title}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{data.block.title}</Text>
        </View>
      </View>

      <View style={[styles.positionCard, cardStyle]}>
        <View style={styles.positionTop}>
          <Text style={[styles.positionText, { color: colors.text }]}>Qism {data.navigation.position} / {data.navigation.total}</Text>
          <Text style={[styles.positionPercent, { color: colors.primary }]}>{progressPercent}%</Text>
        </View>
        <ProgressBar value={progressPercent} />
      </View>

      {lines.length ? (
        <View style={[styles.theoryCard, cardStyle]}>
          {lines.map((line, index) => <Text key={`${line}-${index}`} style={[styles.bodyText, { color: colors.text }]}>{line}</Text>)}
        </View>
      ) : null}

      <SourceImageGallery images={contentImages} resolveUrl={absoluteUrl} />

      <SourceAudioSection audios={audios} resolveUrl={absoluteUrl} />

      {videos.length ? <Text style={[styles.sectionLabel, { color: colors.primary }]}>VIDEO</Text> : null}
      {videos.map((asset) => <VideoPlayer key={asset.id} url={absoluteUrl(asset.url)} title={asset.caption} />)}

      {data.question ? (
        <View style={[styles.questionCard, cardStyle]}>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>TOPSHIRIQ</Text>
          <Text style={[styles.question, { color: colors.text }]}>{data.question.prompt}</Text>
          <View style={styles.options} accessibilityRole="radiogroup">
            {data.question.options.map((option, optionIndex) => {
              const selected = selectedOptionId === option.id;
              const isCorrect = submitResult?.correctOptionIds?.includes(option.id) ?? false;
              const isWrongSelected = !!submitResult && selected && !isCorrect;
              const displayOptionText = optionTextForDisplay(option.text);
              const optionSurface = isCorrect
                ? { borderColor: colors.success, backgroundColor: colors.successSurface }
                : isWrongSelected
                  ? { borderColor: colors.warning, backgroundColor: colors.warningSurface }
                  : selected
                    ? { borderColor: colors.primary, backgroundColor: colors.primarySoft }
                    : { borderColor: colors.border, backgroundColor: colors.surface };
              const markerSurface = isCorrect
                ? colors.success
                : isWrongSelected
                  ? colors.warning
                  : selected
                    ? colors.primary
                    : colors.surfaceAlt;
              const markerTextColor = isCorrect || isWrongSelected || selected ? '#fff' : colors.text;
              const optionLetter = String.fromCharCode(65 + optionIndex);

              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled: !!submitResult }}
                  disabled={!!submitResult}
                  onPress={() => void saveDraft(option.id)}
                  style={[styles.option, optionSurface]}
                >
                  <View style={[styles.optionMarker, { backgroundColor: markerSurface }]}>
                    {isCorrect ? (
                      <Ionicons name="checkmark" size={17} color="#fff" />
                    ) : isWrongSelected ? (
                      <Ionicons name="close" size={17} color="#fff" />
                    ) : (
                      <Text style={[styles.optionLetter, { color: markerTextColor }]}>{optionLetter}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 8 }}>
                    {displayOptionText ? <Text style={[styles.optionText, { color: colors.text }]}>{displayOptionText}</Text> : null}
                    {option.imageUrl ? <Image source={{ uri: absoluteUrl(option.imageUrl) }} style={styles.optionImage} resizeMode="contain" /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {submitResult ? (
            <View style={[styles.feedback, { backgroundColor: submitResult.correct ? colors.successSurface : colors.warningSurface }]}>
              <Ionicons
                name={submitResult.correct ? 'checkmark-circle' : 'information-circle'}
                size={22}
                color={submitResult.correct ? colors.success : colors.warning}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.feedbackTitle, { color: colors.text }]}>{submitResult.correct ? 'To‘g‘ri!' : 'Javobni qayta ko‘rib chiqing'}</Text>
                <Text style={[styles.feedbackText, { color: colors.muted }]}>Natija: {submitResult.score} / {submitResult.maxScore}</Text>
                {submitResult.explanation ? <Text style={[styles.feedbackText, { color: colors.muted }]}>{submitResult.explanation}</Text> : null}
              </View>
            </View>
          ) : null}

          {!submitResult ? (
            <Pressable
              disabled={!selectedOptionId || isSubmitting}
              onPress={() => void submitQuestion()}
              style={[styles.primaryButton, { backgroundColor: colors.primary }, (!selectedOptionId || isSubmitting) && styles.buttonDisabled]}
            >
              <Text style={styles.primaryButtonText}>{isSubmitting ? 'Tekshirilmoqda…' : 'Javobni tekshirish'}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Pressable
          disabled={data.progress.state === 'completed' || isSubmitting}
          onPress={() => void completeBlock()}
          style={[
            styles.primaryButton,
            { backgroundColor: data.progress.state === 'completed' ? colors.success : colors.primary },
          ]}
        >
          <Ionicons name={data.progress.state === 'completed' ? 'checkmark-circle' : 'checkmark'} size={19} color="#fff" />
          <Text style={styles.primaryButtonText}>{completionLabel}</Text>
        </Pressable>
      )}

      {error ? <ErrorState message={error} /> : null}

      <View style={styles.navRow}>
        <Pressable
          disabled={!data.navigation.prevBlockId}
          onPress={() => data.navigation.prevBlockId && router.replace({ pathname: '/blocks/[id]', params: { id: data.navigation.prevBlockId } })}
          style={[styles.navButton, cardStyle, !data.navigation.prevBlockId && styles.buttonDisabled]}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
          <Text style={[styles.navText, { color: colors.text }]}>Oldingi</Text>
        </Pressable>
        <Pressable
          disabled={!data.navigation.nextBlockId}
          onPress={() => data.navigation.nextBlockId && router.replace({ pathname: '/blocks/[id]', params: { id: data.navigation.nextBlockId } })}
          style={[styles.navButton, cardStyle, !data.navigation.nextBlockId && styles.buttonDisabled]}
        >
          <Text style={[styles.navText, { color: colors.text }]}>Keyingi</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.text} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  back: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 11, fontWeight: '900', marginBottom: 3 },
  title: { fontSize: 23, lineHeight: 29, fontWeight: '900' },
  positionCard: { gap: 8, borderRadius: 18, padding: 14, borderWidth: 1 },
  positionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  positionText: { fontSize: 12, fontWeight: '800' },
  positionPercent: { fontSize: 12, fontWeight: '900' },
  theoryCard: { gap: 12, borderRadius: 22, padding: 18, borderWidth: 1 },
  bodyText: { fontSize: 16, lineHeight: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '900', letterSpacing: .8 },
  questionCard: { borderRadius: 22, padding: 16, gap: 14, borderWidth: 1 },
  question: { fontSize: 18, lineHeight: 25, fontWeight: '900' },
  options: { gap: 10 },
  option: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderWidth: 1.5, borderRadius: 18 },
  optionMarker: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  optionLetter: { fontSize: 13, fontWeight: '900' },
  optionText: { fontSize: 15, lineHeight: 21, fontWeight: '700' },
  optionImage: { width: '100%', height: 130 },
  primaryButton: { minHeight: 54, paddingHorizontal: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  buttonDisabled: { opacity: .42 },
  primaryButtonText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  feedback: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16 },
  feedbackTitle: { fontWeight: '900' },
  feedbackText: { marginTop: 2, lineHeight: 18 },
  navRow: { flexDirection: 'row', gap: 10 },
  navButton: { flex: 1, minHeight: 50, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  navText: { fontWeight: '800' },
});
