'use client';

import * as React from 'react';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import type { ActionableFix } from '@/lib/analysis-types';

interface ActionableFixesTabProps {
  fixes: ActionableFix[];
  currentScore: number;
  onToggle: (id: string) => void;
}

const priorityConfig = {
  high: {
    label: 'High',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    border: 'border-l-destructive',
  },
  medium: {
    label: 'Medium',
    color: 'bg-warning/10 text-warning border-warning/20',
    border: 'border-l-warning',
  },
  low: {
    label: 'Low',
    color: 'bg-muted text-muted-foreground border-border',
    border: 'border-l-muted-foreground',
  },
};

export function ActionableFixesTab({
  fixes,
  currentScore,
  onToggle,
}: ActionableFixesTabProps) {
  const completedCount = fixes.filter((f) => f.completed).length;
  const rawImpact = fixes
    .filter((f) => !f.completed)
    .reduce((sum, f) => sum + f.impact, 0);
  const totalImpact = Math.min(Math.max(0, 100 - currentScore), rawImpact);

  const sorted = [...fixes].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
            <TrendingUp className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="text-sm font-semibold text-foreground">
              {completedCount} / {fixes.length} fixes completed
            </p>
          </div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="text-xs text-muted-foreground">Estimated Score Upside</p>
          <p className="text-sm font-semibold text-success">
            +{totalImpact} points remaining*
          </p>
        </div>
      </div>

      <p className="-mt-2 text-[11px] text-muted-foreground">*Directional estimate; actual ATS behavior varies by employer and system.</p>

      <div className="space-y-2">
        {sorted.map((fix) => {
          const cfg = priorityConfig[fix.priority];
          return (
            <div
              key={fix.id}
              className={cn(
                'group flex items-start gap-3 rounded-xl border border-l-4 p-4 transition-all',
                fix.completed
                  ? 'bg-muted/20 border-border opacity-60'
                  : cn('bg-card hover:shadow-sm'),
                !fix.completed && cfg.border
              )}
            >
              <Checkbox
                checked={fix.completed}
                onCheckedChange={() => onToggle(fix.id)}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4
                    className={cn(
                      'text-sm font-semibold',
                      fix.completed && 'line-through'
                    )}
                  >
                    {fix.title}
                  </h4>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                      cfg.color
                    )}
                  >
                    {cfg.label}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {fix.description}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2.5 py-1">
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="text-xs font-semibold text-success">
                  +{fix.impact}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
