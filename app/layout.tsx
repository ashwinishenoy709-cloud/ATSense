import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Resume Pulse AI — ATS Simulator & Resume Analyzer',
  description:
    'Analyze your resume against ATS systems with AI-powered scoring, keyword matching, grammar suggestions, and actionable fixes.',
  openGraph: {
    title: 'Resume Pulse AI — ATS Simulator & Resume Analyzer',
    description:
      'Analyze your resume against ATS systems with AI-powered scoring, keyword matching, grammar suggestions, and actionable fixes.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
