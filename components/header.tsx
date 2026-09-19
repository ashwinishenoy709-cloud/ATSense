'use client';

import { Activity, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { Button } from '@/components/ui/button';

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-sm">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Resume Pulse{' '}
              <span className="bg-gradient-to-r from-accent to-chart-5 bg-clip-text text-transparent">
                AI
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1">
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-accent" />
            <span className="text-xs font-semibold text-accent">
              ATS Simulator v1.0
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-9 w-9 rounded-full"
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            ) : (
              <div className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
