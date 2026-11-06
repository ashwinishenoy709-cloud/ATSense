'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-lg bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-lg ring-2 ring-ring focus:translate-y-0"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-[64px] w-full max-w-6xl items-center justify-between gap-3 px-3 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Image
              src="/atsense-mark.svg"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-lg"
              priority
            />

            <span className="min-w-0 truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
              AT<span className="text-accent">Sense</span>
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground lg:inline-flex">
              AI-assisted resume analysis
            </span>

            <button
              type="button"
              onClick={toggleTheme}
              disabled={!mounted}
              aria-label={
                mounted
                  ? isDark
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
                  : 'Change theme'
              }
              title={
                mounted
                  ? isDark
                    ? 'Light mode'
                    : 'Dark mode'
                  : 'Change theme'
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {mounted ? (
                isDark ? (
                  <Sun className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Moon className="h-5 w-5" aria-hidden="true" />
                )
              ) : (
                <span className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
