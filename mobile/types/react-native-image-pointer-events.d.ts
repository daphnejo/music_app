import 'react-native';

declare module 'react-native' {
  interface ImageProps {
    /** Supported by the native Image view; missing from this React Native type version. */
    pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
  }
}
