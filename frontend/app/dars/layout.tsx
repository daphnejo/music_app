import type { ReactNode } from 'react';
import styles from './lesson-viewport.module.css';

type LessonLayoutProps = {
  children: ReactNode;
};

export default function LessonLayout({ children }: LessonLayoutProps) {
  return <div className={styles.viewport}>{children}</div>;
}
