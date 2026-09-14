import type { Metadata } from 'next';
import { Baloo_2, Inter } from 'next/font/google';
import './globals.css';

const baloo = Baloo_2({
  subsets: ['latin'],
  variable: '--font-baloo',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Solfedjio',
    template: '%s · Solfedjio',
  },
  description: "Bolalar musiqa va san'at maktablari uchun interaktiv solfedjio platformasi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz">
      <body className={`${baloo.variable} ${inter.variable}`}>{children}</body>
    </html>
  );
}
