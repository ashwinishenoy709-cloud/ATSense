'use client';

import * as React from 'react';
import { CheckCircle2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import type { ActionableFix } from '@/lib/analysis-types';

interface ActionableFixesTabProps {
  fixes: ActionableFix[];
  currentScore: number;
  onToggle: (id: string) => void;
}

type FixFilter = 'all' | 'open' | 'completed';

const priorityConfig = {
  high: {
    label: 'High Priority',
    style: 'border-destructive/20 bg-destructive/10 text-destructive',
    border: 'border-l-destructive',
    order: 0,
  },
  medium: {
    label: 'Medium Priority',
    style: 'border-warning/20 bg-warning/10 text-warning',
    border: 'border-l-warning',
    order: 1,
  },
  low: {
    label: 'Low Priority',
    style: 'border-border bg-muted text-muted-foreground',
    border: 'border-l-muted-foreground',
    order: 2,
  },
};

export function ActionableFixesTab({
  fixes,
  currentScore,
  onToggle,
}: ActionableFixesTabProps) {
  const [filter, setFilter] = React.useState<FixFilter>('all');

  const completedCount = fixes.filter(
    (fix) => fix.completed
  ).length;

  const openCount = fixes.length - completedCount;

  const progress =
    fixes.length > 0
      ? Math.round((completedCount / fixes.length) * 100)
      : 0;

  const remainingImpact = fixes
    .filter((fix) => !fix.completed)
    .reduce((total, fix) => total + fix.impact, 0);

  const estimatedUpside = Math.min(
    Math.max(0, 100 - currentScore),
    remainingImpact
  );

  const filtered = [...fixes]
    .filter((fix) => {
      if (filter === 'open') return !fix.completed;
      if (filter === 'completed') return fix.completed;
      return true;
    })
    .sort(
      (a, b) =>
        priorityConfig[a.priority].order -
        priorityConfig[b.priority].order
    );

  const filters: FixFilter[] = [
    'all',
    'open',
    'completed',
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Improvement Checklist
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {completedCount} of {fixes.length} suggestions marked complete
            </p>
          </div>

          <span className="text-lg font-bold tabular-nums text-foreground">
            {progress}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-label="Improvement checklist completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-success"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp
            className="h-4 w-4 text-accent"
            aria-hidden="true"
          />
          <span>
            Estimated remaining improvement potential:{' '}
            <strong className="text-foreground">
              up to +{estimatedUpside} points
            </strong>
          </span>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          This is a directional estimate, not a guaranteed score
          increase. Marking an item complete does not edit the
          resume or recalculate its ATS score.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => {
          const count =
            item === 'all'
              ? fixes.length
              : item === 'open'
                ? openCount
                : completedCount;

          return (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
              className={cn(
                'rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                filter === item
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              )}
            >
              {item === 'all'
                ? 'All'
                : item === 'open'
                  ? 'To Do'
                  : 'Completed'}{' '}
              ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <CheckCircle2
            className="mx-auto h-8 w-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-foreground">
            No suggestions to show
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try selecting another filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fix) => {
            const priority = priorityConfig[fix.priority];

            return (
              <article
                key={fix.id}
                className={cn(
                  'rounded-xl border border-l-4 p-4 transition-colors',
                  fix.completed
                    ? 'border-border bg-muted/20'
                    : cn(
                        'border-border/60 bg-card',
                        priority.border
                      )
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={fix.completed}
                    onCheckedChange={() => onToggle(fix.id)}
                    aria-label={`Mark ${fix.title} as ${
                      fix.completed ? 'not completed' : 'completed'
                    }`}
                    className="mt-1 shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className={cn(
                          'text-sm font-semibold text-foreground',
                          fix.completed &&
                            'text-muted-foreground line-through'
                        )}
                      >
                        {fix.title}
                      </h4>

                      <span
                        className={cn(
                          'rounded-full border px-2 py-1 text-[10px] font-semibold',
                          priority.style
                        )}
                      >
                        {priority.label}
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {fix.description}
                    </p>

                    {fix.completed && (
                      <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Marked complete
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 rounded-lg border border-border bg-muted px-2 py-1 text-xs font-semibold text-foreground">
                    +{fix.impact}*
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        *Individual impact values are estimates supplied by the
        analysis. They are not guaranteed improvements and may overlap.
      </p>
    </div>
  );
}
