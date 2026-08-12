import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AudioPlayer } from '@/components/media/AudioPlayer';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { ErrorState, LoadingState } from '@/components/ui/DataState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { useCourse } from '@/context/CourseContext';
import { API_BASE_URL, ApiError, apiRequest } from '@/services/api/client';
import type { BlockDetailResponse } from '@/types/content';
import { colors } from '@/theme/colors';

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

export default function BlockDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { reload: reloadCourse } = useCourse();
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

  const lines = useMemo(() => bodyLines(data?.block.body), [data?.block.body]);
  const images = data?.assets.filter((asset) => asset.kind === 'image') ?? [];
  const audios = data?.assets.filter((asset) => asset.kind === 'audio') ?? [];
  const videos = data?.assets.filter((asset) => asset.kind === 'video') ?? [];

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

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>{data.block.lesson.title}</Text>
          <Text style={styles.title}>{data.block.title}</Text>
        </View>
      </View>

      <View style={styles.positionCard}>
        <View style={styles.positionTop}>
          <Text style={styles.positionText}>{data.navigation.position} / {data.navigation.total}</Text>
          {data.block.sourceSlide ? <Text style={styles.source}>Manba: {data.block.sourceSlide}-slayd</Text> : null}
        </View>
        <ProgressBar value={progressPercent} />
      </View>

      {lines.length ? (
        <View style={styles.theoryCard}>
          {lines.map((line, index) => <Text key={`${line}-${index}`} style={styles.bodyText}>{line}</Text>)}
        </View>
      ) : null}

      {images.map((asset) => (
        <View key={asset.id} style={styles.imageCard}>
          {asset.caption ? <Text style={styles.mediaTitle}>{asset.caption}</Text> : null}
          <Image source={{ uri: absoluteUrl(asset.url) }} style={styles.image} resizeMode="contain" />
        </View>
      ))}

      {audios.length ? <Text style={styles.sectionLabel}>TINGLASH</Text> : null}
      {audios.map((asset) => <AudioPlayer key={asset.id} url={absoluteUrl(asset.url)} title={asset.caption} />)}

      {videos.length ? <Text style={styles.sectionLabel}>VIDEO</Text> : null}
      {videos.map((asset) => <VideoPlayer key={asset.id} url={absoluteUrl(asset.url)} title={asset.caption} />)}

      {data.question ? (
        <View style={styles.questionCard}>
          <Text style={styles.sectionLabel}>TOPSHIRIQ</Text>
          <Text style={styles.question}>{data.question.prompt}</Text>
          <View style={styles.options}>
            {data.question.options.map((option) => {
              const selected = selectedOptionId === option.id;
              const isCorrect = submitResult?.correctOptionIds?.includes(option.id) ?? false;
              const isWrongSelected = !!submitResult && selected && !isCorrect;
              return (
                <Pressable
                  key={option.id}
                  disabled={!!submitResult}
                  onPress={() => void saveDraft(option.id)}
                  style={[
                    styles.option,
                    selected && styles.optionSelected,
                    isCorrect && styles.optionCorrect,
                    isWrongSelected && styles.optionWrong,
                  ]}
                >
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>
                  <View style={{ flex: 1, gap: 8 }}>
                    <Text style={styles.optionText}>{option.text}</Text>
                    {option.imageUrl ? <Image source={{ uri: absoluteUrl(option.imageUrl) }} style={styles.optionImage} resizeMode="contain" /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {submitResult ? (
            <View style={[styles.feedback, submitResult.correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
              <Ionicons name={submitResult.correct ? 'checkmark-circle' : 'information-circle'} size={22} color={submitResult.correct ? '#16794C' : '#9A5A16'} />
              <View style={{ flex: 1 }}>
                <Text style={styles.feedbackTitle}>{submitResult.correct ? 'To‘g‘ri!' : 'Yana bir bor ko‘rib chiqing'}</Text>
                <Text style={styles.feedbackText}>Natija: {submitResult.score} / {submitResult.maxScore}</Text>
                {submitResult.explanation ? <Text style={styles.feedbackText}>{submitResult.explanation}</Text> : null}
              </View>
            </View>
          ) : null}

          {!submitResult ? (
            <Pressable
              disabled={!selectedOptionId || isSubmitting}
              onPress={() => void submitQuestion()}
              style={[styles.primaryButton, (!selectedOptionId || isSubmitting) && styles.buttonDisabled]}
            >
              <Text style={styles.primaryButtonText}>{isSubmitting ? 'Tekshirilmoqda…' : 'Javobni tekshirish'}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Pressable
          disabled={data.progress.state === 'completed' || isSubmitting}
          onPress={() => void completeBlock()}
          style={[styles.primaryButton, data.progress.state === 'completed' && styles.completedButton]}
        >
          <Ionicons name={data.progress.state === 'completed' ? 'checkmark-circle' : 'checkmark'} size={19} color="#fff" />
          <Text style={styles.primaryButtonText}>
            {data.progress.state === 'completed' ? 'Bajarildi' : isSubmitting ? 'Saqlanmoqda…' : 'O‘rgandim / Bajarildi'}
          </Text>
        </Pressable>
      )}

      {error ? <ErrorState message={error} /> : null}

      <View style={styles.navRow}>
        <Pressable
          disabled={!data.navigation.prevBlockId}
          onPress={() => data.navigation.prevBlockId && router.replace({ pathname: '/blocks/[id]', params: { id: data.navigation.prevBlockId } })}
          style={[styles.navButton, !data.navigation.prevBlockId && styles.buttonDisabled]}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
          <Text style={styles.navText}>Oldingi</Text>
        </Pressable>
        <Pressable
          disabled={!data.navigation.nextBlockId}
          onPress={() => data.navigation.nextBlockId && router.replace({ pathname: '/blocks/[id]', params: { id: data.navigation.nextBlockId } })}
          style={[styles.navButton, !data.navigation.nextBlockId && styles.buttonDisabled]}
        >
          <Text style={styles.navText}>Keyingi</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.text} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', marginBottom: 3 },
  title: { fontSize: 23, lineHeight: 29, fontWeight: '900', color: colors.text },
  positionCard: { gap: 8, backgroundColor: colors.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.border },
  positionTop: { flexDirection: 'row', justifyContent: 'space-between' },
  positionText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  source: { color: colors.muted, fontSize: 11 },
  theoryCard: { gap: 12, backgroundColor: colors.surface, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: colors.border },
  bodyText: { color: colors.text, fontSize: 16, lineHeight: 24 },
  imageCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 10, gap: 8, borderWidth: 1, borderColor: colors.border },
  image: { width: '100%', height: 240, borderRadius: 14 },
  mediaTitle: { color: colors.text, fontWeight: '800', paddingHorizontal: 4 },
  sectionLabel: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: .8 },
  questionCard: { backgroundColor: colors.surface, borderRadius: 22, padding: 16, gap: 14, borderWidth: 1, borderColor: colors.border },
  question: { color: colors.text, fontSize: 18, lineHeight: 25, fontWeight: '900' },
  options: { gap: 10 },
  option: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderWidth: 1.5, borderColor: colors.border, borderRadius: 18, backgroundColor: '#fff' },
  optionSelected: { borderColor: colors.primary, backgroundColor: '#F5F7FF' },
  optionCorrect: { borderColor: '#2DAA74', backgroundColor: '#ECFAF3' },
  optionWrong: { borderColor: '#D99A44', backgroundColor: '#FFF8EC' },
  radio: { width: 22, height: 22, borderRadius: 999, borderWidth: 2, borderColor: '#B9BDCE', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: colors.primary },
  optionText: { color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  optionImage: { width: '100%', height: 130 },
  primaryButton: { minHeight: 54, paddingHorizontal: 16, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  completedButton: { backgroundColor: '#2DAA74' },
  buttonDisabled: { opacity: .42 },
  primaryButtonText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  feedback: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16 },
  feedbackCorrect: { backgroundColor: '#ECFAF3' },
  feedbackWrong: { backgroundColor: '#FFF8EC' },
  feedbackTitle: { color: colors.text, fontWeight: '900' },
  feedbackText: { color: colors.muted, marginTop: 2, lineHeight: 18 },
  navRow: { flexDirection: 'row', gap: 10 },
  navButton: { flex: 1, minHeight: 50, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  navText: { color: colors.text, fontWeight: '800' },
});
