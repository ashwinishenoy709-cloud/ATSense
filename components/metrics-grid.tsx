'use client';

import * as React from 'react';
import { KeyRound, BookOpen, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisMetrics } from '@/lib/analysis-types';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  note: string;
  colorClass: string;
}

function MetricCard({ icon, label, value, suffix, note, colorClass }: MetricCardProps) {
  const [animatedValue, setAnimatedValue] = React.useState(0);

  React.useEffect(() => {
    const duration = 1000;
    const start = performance.now();
    let raf: number;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const getBarColor = (v: number) => {
    if (v >= 80) return 'bg-success';
    if (v >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 transition-all hover:shadow-md">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', colorClass)}>
          {icon}
        </div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {animatedValue}
        </span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-1000', getBarColor(value))}
          style={{ width: `${animatedValue}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

interface MetricsGridProps {
  metrics: AnalysisMetrics;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const keywordNote =
    metrics.keywordMatch >= 80
      ? 'Strong coverage of the weighted ATS keyword signals.'
      : metrics.keywordMatch >= 60
        ? 'Moderate keyword coverage with some relevant gaps.'
        : 'Low keyword coverage; review the highest-priority gaps.';

  const readabilityNote =
    metrics.readabilityIndex >= 80
      ? 'Very easy for recruiters and parsers to scan.'
      : metrics.readabilityIndex >= 60
        ? 'Generally readable, with some dense wording.'
        : 'Dense wording may reduce quick scanability.';

  const formattingNote =
    metrics.formattingQuality >= 80
      ? 'Strong text structure for ATS parsing.'
      : metrics.formattingQuality >= 60
        ? 'Mostly parseable, with structural improvements available.'
        : 'Parsing structure needs attention.';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <MetricCard
        icon={<KeyRound className="h-4 w-4 text-accent" />}
        label="Keyword Match"
        value={metrics.keywordMatch}
        suffix="%"
        note={keywordNote}
        colorClass="bg-accent/10"
      />
      <MetricCard
        icon={<BookOpen className="h-4 w-4 text-chart-5" />}
        label="Readability Index"
        value={metrics.readabilityIndex}
        suffix="/100"
        note={readabilityNote}
        colorClass="bg-chart-5/10"
      />
      <MetricCard
        icon={<LayoutTemplate className="h-4 w-4 text-chart-2" />}
        label="Formatting Quality"
        value={metrics.formattingQuality}
        suffix="%"
        note={formattingNote}
        colorClass="bg-chart-2/10"
      />
    </div>
  );
}
