'use client';

import * as React from 'react';
import {
  BarChart3,
  BookOpen,
  Briefcase,
  KeyRound,
  LayoutTemplate,
  ListChecks,
  Mail,
  Zap,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { AnalysisMetrics } from '@/lib/analysis-types';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  weight: number;
  note: string;
  colorClass: string;
}

function MetricCard({
  icon,
  label,
  value,
  weight,
  note,
  colorClass,
}: MetricCardProps) {
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

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(raf);
  }, [value]);

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-warning';

    return 'bg-destructive';
  };

  const weightedPoints = ((value / 100) * weight).toFixed(1);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 transition-all hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              colorClass
            )}
          >
            {icon}
          </div>

          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
        </div>

        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {weight}% weight
        </span>
      </div>

      <div className="mb-2 flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {animatedValue}
          </span>

          <span className="text-sm text-muted-foreground">%</span>
        </div>

        <span className="text-[11px] font-medium text-muted-foreground">
          {weightedPoints} / {weight} pts
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            getBarColor(value)
          )}
          style={{ width: `${animatedValue}%` }}
        />
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {note}
      </p>
    </div>
  );
}

interface MetricsGridProps {
  metrics: AnalysisMetrics;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <MetricCard
        icon={<KeyRound className="h-4 w-4 text-accent" />}
        label="Keyword / Skill Match"
        value={metrics.keywordMatch}
        weight={30}
        note={
          metrics.keywordMatch >= 80
            ? 'Strong coverage of the weighted ATS skills and keyword signals.'
            : metrics.keywordMatch >= 60
              ? 'Moderate keyword coverage with some relevant gaps.'
              : 'Important target-role keywords are missing from the resume.'
        }
        colorClass="bg-accent/10"
      />

      <MetricCard
        icon={<Briefcase className="h-4 w-4 text-chart-5" />}
        label="Experience Relevance"
        value={metrics.experienceRelevance}
        weight={20}
        note={
          metrics.experienceRelevance >= 80
            ? 'Relevant skills are well demonstrated in projects or experience.'
            : metrics.experienceRelevance >= 60
              ? 'Some target skills are supported by project or experience evidence.'
              : 'More target-role skills should be demonstrated through real experience or projects.'
        }
        colorClass="bg-chart-5/10"
      />

      <MetricCard
        icon={<LayoutTemplate className="h-4 w-4 text-chart-2" />}
        label="ATS Formatting & Parsing"
        value={metrics.formattingQuality}
        weight={15}
        note={
          metrics.formattingQuality >= 80
            ? 'Strong text structure and section organization for ATS parsing.'
            : metrics.formattingQuality >= 60
              ? 'Mostly parseable structure with some ATS formatting improvements available.'
              : 'Text structure may make automated parsing less reliable.'
        }
        colorClass="bg-chart-2/10"
      />

      <MetricCard
        icon={<ListChecks className="h-4 w-4 text-chart-3" />}
        label="Section Completeness"
        value={metrics.sectionCompleteness}
        weight={10}
        note={
          metrics.sectionCompleteness >= 80
            ? 'Core resume sections are present.'
            : metrics.sectionCompleteness >= 60
              ? 'Most important sections are present.'
              : 'One or more important resume sections appear to be missing.'
        }
        colorClass="bg-chart-3/10"
      />

      <MetricCard
        icon={<BookOpen className="h-4 w-4 text-accent" />}
        label="Readability"
        value={metrics.readabilityIndex}
        weight={10}
        note={
          metrics.readabilityIndex >= 80
            ? 'Resume content is easy to scan and read.'
            : metrics.readabilityIndex >= 60
              ? 'Generally readable, although some wording may be dense.'
              : 'Dense wording may reduce recruiter scanability.'
        }
        colorClass="bg-accent/10"
      />

      <MetricCard
        icon={<BarChart3 className="h-4 w-4 text-chart-2" />}
        label="Quantified Achievements"
        value={metrics.quantifiedAchievements}
        weight={5}
        note={
          metrics.quantifiedAchievements >= 80
            ? 'Several achievements contain measurable evidence.'
            : metrics.quantifiedAchievements >= 60
              ? 'Some measurable achievements are present.'
              : 'Add verified numbers or outcomes where they genuinely exist.'
        }
        colorClass="bg-chart-2/10"
      />

      <MetricCard
        icon={<Zap className="h-4 w-4 text-chart-3" />}
        label="Action Verb Quality"
        value={metrics.actionVerbQuality}
        weight={5}
        note={
          metrics.actionVerbQuality >= 80
            ? 'Strong action-oriented language is used throughout the resume.'
            : metrics.actionVerbQuality >= 60
              ? 'Several bullets use effective action verbs.'
              : 'More bullets could begin with clear, strong action verbs.'
        }
        colorClass="bg-chart-3/10"
      />

      <MetricCard
        icon={<Mail className="h-4 w-4 text-chart-5" />}
        label="Contact / ATS Parsing"
        value={metrics.contactParsing}
        weight={5}
        note={
          metrics.contactParsing >= 80
            ? 'Important contact and profile information is readily detectable.'
            : metrics.contactParsing >= 60
              ? 'Most basic contact information is detectable.'
              : 'Check email, phone, LinkedIn, and GitHub visibility.'
        }
        colorClass="bg-chart-5/10"
      />
    </div>
  );
}