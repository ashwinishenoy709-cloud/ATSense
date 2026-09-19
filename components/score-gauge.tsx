'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { getScoreColor } from '@/lib/analysis-service';
import type { AnalysisResult } from '@/lib/analysis-types';

interface ScoreGaugeProps {
  result: AnalysisResult;
}

export function ScoreGauge({ result }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = React.useState(0);
  const color = getScoreColor(result.scoreTier);

  React.useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    let raf: number;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * result.atsScore));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [result.atsScore]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative h-[200px] w-[200px]">
        <svg
          className="h-full w-full -rotate-90"
          viewBox="0 0 200 200"
        >
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            strokeWidth="14"
            className="stroke-muted"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            strokeWidth="14"
            stroke={color}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-bold tabular-nums"
            style={{ color }}
          >
            {animatedScore}
          </span>
          <span className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            ATS Score
          </span>
        </div>
      </div>

      <div className="text-center">
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold',
            result.scoreTier === 'green' && 'bg-success/10 text-success',
            result.scoreTier === 'yellow' && 'bg-warning/10 text-warning',
            result.scoreTier === 'red' && 'bg-destructive/10 text-destructive'
          )}
        >
          {result.scoreLabel}
        </div>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {result.scoreSummary}
        </p>
      </div>
    </div>
  );
}
