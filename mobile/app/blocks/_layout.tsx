import { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router, Slot, useLocalSearchParams } from 'expo-router';
import { useCourse } from '@/context/CourseContext';
import { useTheme } from '@/context/ThemeContext';
import { kidLessonHref } from '@/utils/kid-lesson-navigation';

export default function BlocksLayout() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const { data, isLoading } = useCourse();
  const { colors } = useTheme();
  const blockId = Array.isArray(params.id) ? params.id[0] : params.id;

  const targetHref = useMemo(() => {
    if (!blockId || !data) return null;
    const lesson = data.lessons.find((item) => item.blocks.some((block) => block.id === blockId));
    return kidLessonHref(lesson?.declaredNumber, blockId);
  }, [blockId, data]);

  useEffect(() => {
    if (targetHref) router.replace(targetHref);
  }, [targetHref]);

  // While the course map is loading, do not flash the legacy block renderer.
  // If this block belongs to one of the redesigned lessons, keep showing the
  // lightweight loader until the redirect has completed.
  if ((!data && isLoading) || targetHref) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}> 
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
