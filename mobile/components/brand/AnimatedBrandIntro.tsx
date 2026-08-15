import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BrandWordmark } from '@/components/brand/BrandWordmark';

const markSource = require('../../.generated/mark.png');

type Props = {
  onFinish: () => void;
};

export function AnimatedBrandIntro({ onFinish }: Props) {
  const { width } = useWindowDimensions();
  const markSize = useMemo(() => Math.min(330, Math.max(230, width * 0.66)), [width]);

  const screenOpacity = useRef(new Animated.Value(1)).current;
  const markOpacity = useRef(new Animated.Value(0)).current;
  const markScale = useRef(new Animated.Value(0.76)).current;
  const markY = useRef(new Animated.Value(22)).current;
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const wordY = useRef(new Animated.Value(18)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.72)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(markOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(markScale, {
          toValue: 1,
          speed: 12,
          bounciness: 7,
          useNativeDriver: true,
        }),
        Animated.timing(markY, {
          toValue: 0,
          duration: 560,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(120),
          Animated.parallel([
            Animated.timing(glowOpacity, {
              toValue: 0.16,
              duration: 430,
              useNativeDriver: true,
            }),
            Animated.timing(glowScale, {
              toValue: 1.14,
              duration: 650,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
      Animated.parallel([
        Animated.timing(wordOpacity, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wordY, {
          toValue: 0,
          duration: 430,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.07,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.13,
            duration: 360,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.delay(520),
      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(markScale, {
          toValue: 1.04,
          duration: 300,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished) onFinish();
    });

    return () => animation.stop();
  }, [glowOpacity, glowScale, markOpacity, markScale, markY, onFinish, screenOpacity, wordOpacity, wordY]);

  return (
    <Animated.View style={[styles.screen, { opacity: screenOpacity }]}>
      <View style={[styles.markStage, { width: markSize, height: markSize }]}>
        <Animated.View
          style={[
            styles.glow,
            {
              width: markSize * 0.58,
              height: markSize * 0.58,
              borderRadius: markSize,
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />
        <Animated.Image
          source={markSource}
          resizeMode="contain"
          style={[
            styles.mark,
            {
              width: markSize,
              height: markSize,
              opacity: markOpacity,
              transform: [{ translateY: markY }, { scale: markScale }],
            },
          ]}
        />
      </View>

      <Animated.View style={{ opacity: wordOpacity, transform: [{ translateY: wordY }] }}>
        <BrandWordmark size={Math.min(58, Math.max(42, width * 0.12))} style={styles.wordmark} />
      </Animated.View>
      <Animated.Text style={[styles.caption, { opacity: wordOpacity }]}>Musiqani tingla. O‘rgan. His qil.</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  markStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -20,
  },
  glow: {
    position: 'absolute',
    backgroundColor: '#3B82F6',
  },
  mark: {
    position: 'absolute',
  },
  wordmark: {
    textAlign: 'center',
  },
  caption: {
    marginTop: 10,
    color: '#7B7D95',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.15,
  },
});
