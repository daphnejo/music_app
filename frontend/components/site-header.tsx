'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './site-header.module.css';

type HeaderMode = 'landing' | 'course' | 'lesson';
type LessonChrome = 'account' | 'auth';
type LandingSection = 'home' | 'courses' | 'teachers' | 'pricing' | 'contact';
type LessonNumber = 1 | 2 | 3 | 4;

type SiteHeaderProps = {
  mode?: HeaderMode;
  activeLesson?: LessonNumber;
  lessonChrome?: LessonChrome;
  showLessonHome?: boolean;
};

const landingSections: Array<{ id: Exclude<LandingSection, 'home'>; href: string; label: string }> = [
  { id: 'courses', href: '/#courses', label: 'Darslar' },
  { id: 'teachers', href: '/#teachers', label: "O'qituvchilar" },
  { id: 'pricing', href: '/#pricing', label: 'Narxlar' },
  { id: 'contact', href: '/#contact', label: "Bog'lanish" },
];

const lessonLinks: Array<{ lesson: LessonNumber; href: string; label: string }> = [
  { lesson: 1, href: '/dars/1', label: '1-Dars' },
  { lesson: 2, href: '/dars/2', label: '2-Dars' },
  { lesson: 3, href: '/dars/3', label: '3-Dars' },
  { lesson: 4, href: '/dars/4', label: '4-Dars' },
];

export function SiteHeader({ mode = 'landing', activeLesson, lessonChrome = 'account', showLessonHome = false }: SiteHeaderProps) {
  const isLanding = mode === 'landing';
  const isLesson = mode === 'lesson';
  const [activeSection, setActiveSection] = useState<LandingSection>('home');

  useEffect(() => {
    if (!isLanding) return;

    let raf = 0;
    const updateActiveSection = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const marker = window.scrollY + 180;
        let next: LandingSection = 'home';
        for (const section of landingSections) {
          const element = document.getElementById(section.id);
          if (element && element.offsetTop <= marker) next = section.id;
        }
        const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;
        if (nearBottom && document.getElementById('contact')) next = 'contact';
        setActiveSection(next);
      });
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [isLanding]);

  const landingClass = (section: LandingSection) =>
    `${styles.navLink} ${activeSection === section ? styles.activeLanding : ''}`;
  const lessonClass = (lesson: LessonNumber) =>
    `${styles.navLink} ${activeLesson === lesson ? styles.activeLesson : ''}`;

  return (
    <header className={`site-header ${styles.stickyHeader}`}>
      <Link className={`brand ${styles.brandLink}`} href="/" aria-label="Solfedjio bosh sahifa">
        <span className="brand-mark" aria-hidden="true">♫</span>
        <span>Solfedjio</span>
      </Link>

      <nav className="main-nav" aria-label="Asosiy navigatsiya">
        {isLesson && lessonChrome === 'account' && !showLessonHome ? null : (
          <Link
            className={isLanding ? landingClass('home') : `${styles.navLink} ${!activeLesson ? styles.activeLanding : ''}`}
            href="/"
          >
            Bosh sahifa
          </Link>
        )}

        {isLanding ? (
          landingSections.map((section) => (
            <Link className={landingClass(section.id)} href={section.href} key={section.id}>
              {section.label}
            </Link>
          ))
        ) : (
          lessonLinks.map((item) => (
            <Link className={lessonClass(item.lesson)} href={item.href} key={item.lesson}>{item.label}</Link>
          ))
        )}
      </nav>

      {isLesson && lessonChrome === 'account' ? (
        <div className={styles.lessonUser} aria-label="Foydalanuvchi profili">
          <span className={styles.lessonUserName}>Abdulaziz<br />Khamidov</span>
          <span className={styles.lessonAvatar} aria-hidden="true">🐻</span>
        </div>
      ) : (
        <div className="header-actions">
          <Link className="text-link" href="/kurs/1">Kirish</Link>
          <Link className="gradient-button compact" href="/kurs/1">Ro&apos;yxatdan o&apos;tish</Link>
        </div>
      )}
    </header>
  );
}
