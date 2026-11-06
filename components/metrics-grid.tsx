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

interface MetricsGridProps {
  metrics: AnalysisMetrics;
}

interface MetricDefinition {
  key: keyof AnalysisMetrics;
  label: string;
  weight: number;
  description: string;
  icon: React.ReactNode;
}

const metricDefinitions: MetricDefinition[] = [
  {
    key: 'keywordMatch',
    label: 'Keyword / Skill Match',
    weight: 30,
    description: 'Coverage of evaluated skills and keyword signals.',
    icon: <KeyRound className="h-4 w-4" />,
  },
  {
    key: 'experienceRelevance',
    label: 'Experience Relevance',
    weight: 20,
    description: 'Evidence of relevant skills in projects and experience.',
    icon: <Briefcase className="h-4 w-4" />,
  },
  {
    key: 'formattingQuality',
    label: 'ATS Text Structure',
    weight: 15,
    description: 'Readability and organization of extracted resume text.',
    icon: <LayoutTemplate className="h-4 w-4" />,
  },
  {
    key: 'sectionCompleteness',
    label: 'Section Completeness',
    weight: 10,
    description: 'Presence of important resume sections.',
    icon: <ListChecks className="h-4 w-4" />,
  },
  {
    key: 'readabilityIndex',
    label: 'Readability',
    weight: 10,
    description: 'Clarity and scanability of resume wording.',
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    key: 'quantifiedAchievements',
    label: 'Quantified Achievements',
    weight: 5,
    description: 'Use of measurable results and verified achievements.',
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    key: 'actionVerbQuality',
    label: 'Action Verb Quality',
    weight: 5,
    description: 'Use of clear, action-oriented language.',
    icon: <Zap className="h-4 w-4" />,
  },
  {
    key: 'contactParsing',
    label: 'Contact / ATS Parsing',
    weight: 5,
    description: 'Detectability of contact and profile information.',
    icon: <Mail className="h-4 w-4" />,
  },
];

function getScoreStyle(value: number) {
  if (value >= 80) {
    return {
      bar: 'bg-success',
      text: 'Strong signal',
      textColor: 'text-success',
    };
  }

  if (value >= 60) {
    return {
      bar: 'bg-warning',
      text: 'Can improve',
      textColor: 'text-warning',
    };
  }

  return {
    bar: 'bg-destructive',
    text: 'Needs attention',
    textColor: 'text-destructive',
  };
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {metricDefinitions.map((metric) => {
          const value = Math.max(
            0,
            Math.min(100, metrics[metric.key])
          );

          const style = getScoreStyle(value);
          const weightedPoints = (
            (value / 100) *
            metric.weight
          ).toFixed(1);

          return (
            <div
              key={metric.key}
              className="rounded-xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    {metric.icon}
                  </div>

                  <h3 className="text-xs font-semibold leading-relaxed text-foreground">
                    {metric.label}
                  </h3>
                </div>

                <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                  {metric.weight}% weight
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between gap-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tabular-nums text-foreground">
                    {value}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    /100
                  </span>
                </div>

                <span
                  className={cn(
                    'text-[11px] font-medium',
                    style.textColor
                  )}
                >
                  {style.text}
                </span>
              </div>

              <div
                role="progressbar"
                aria-label={`${metric.label} score`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={value}
                className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className={cn(
                    'h-full rounded-full',
                    style.bar
                  )}
                  style={{ width: `${value}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  Weighted contribution
                </span>
                <span className="text-xs font-semibold tabular-nums text-foreground">
                  {weightedPoints} / {metric.weight} pts
                </span>
              </div>

              <p className="mt-3 border-t border-border/50 pt-3 text-xs leading-relaxed text-muted-foreground">
                {metric.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">
            How scoring works:
          </span>{' '}
          Each metric contributes according to its assigned weight.
          The eight weights total 100%.
        </p>

        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">
            Formatting limitation:
          </span>{' '}
          ATS Text Structure evaluates extracted text, headings,
          bullets, and organization. It does not verify visual
          properties such as fonts, margins, columns, or text boxes.
        </p>
      </div>
    </div>
  );
}
