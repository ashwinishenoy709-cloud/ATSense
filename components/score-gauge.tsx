'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { getScoreColor } from '@/lib/analysis-service';
import type { AnalysisResult } from '@/lib/analysis-types';

interface ScoreGaugeProps {
  result: AnalysisResult;
}

export function ScoreGauge({ result }: ScoreGaugeProps) {
  const score = Math.max(0, Math.min(100, result.atsScore));
  const [displayScore, setDisplayScore] = React.useState(0);
  const color = getScoreColor(result.scoreTier);

  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayScore(score);
      return;
    }

    const duration = 1000;
    const start = performance.now();
    let frame = 0;

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayScore(Math.round(score * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - displayScore / 100);

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div
        role="meter"
        aria-label="Estimated ATS compatibility score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        className="relative h-[200px] w-[200px]"
      >
        <svg
          viewBox="0 0 200 200"
          className="h-full w-full -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            strokeWidth="13"
            className="stroke-muted"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>

        <div
          aria-hidden="true"
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <div className="flex items-baseline gap-1">
            <span
              className="text-5xl font-bold tabular-nums"
              style={{ color }}
            >
              {displayScore}
            </span>
            <span className="text-lg text-muted-foreground">
              /100
            </span>
          </div>

          <span className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            ATS Compatibility
          </span>
        </div>
      </div>

      <div className="w-full space-y-3 text-center">
        <span
          className={cn(
            'inline-flex rounded-full px-4 py-1.5 text-xs font-semibold',
            result.scoreTier === 'green' &&
              'bg-success/10 text-success',
            result.scoreTier === 'yellow' &&
              'bg-warning/10 text-warning',
            result.scoreTier === 'red' &&
              'bg-destructive/10 text-destructive'
          )}
        >
          {result.scoreLabel}
        </span>

        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
          {result.scoreSummary}
        </p>

        <p className="mx-auto max-w-sm border-t border-border/60 pt-3 text-xs leading-relaxed text-muted-foreground">
          This score is an estimated compatibility measure,
          not a guarantee of passing an employer&apos;s ATS.
        </p>
      </div>
    </div>
  );
}
