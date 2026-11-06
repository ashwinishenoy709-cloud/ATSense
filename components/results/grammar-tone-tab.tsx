'use client';

import * as React from 'react';
import { Check, Copy, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GrammarIssue } from '@/lib/analysis-types';

interface GrammarToneTabProps {
  issues: GrammarIssue[];
}

type SeverityFilter = 'all' | GrammarIssue['severity'];

const severityConfig = {
  critical: {
    label: 'Critical',
    style: 'border-destructive/20 bg-destructive/10 text-destructive',
  },
  moderate: {
    label: 'Moderate',
    style: 'border-warning/20 bg-warning/10 text-warning',
  },
  minor: {
    label: 'Minor',
    style: 'border-border bg-muted text-muted-foreground',
  },
};

const severityOrder = {
  critical: 0,
  moderate: 1,
  minor: 2,
};

export function GrammarToneTab({ issues }: GrammarToneTabProps) {
  const [filter, setFilter] = React.useState<SeverityFilter>('all');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [copyError, setCopyError] = React.useState<string | null>(null);

  const filtered = [...issues]
    .filter((issue) => filter === 'all' || issue.severity === filter)
    .sort(
      (a, b) =>
        severityOrder[a.severity] - severityOrder[b.severity]
    );

  const copySuggestion = async (issue: GrammarIssue) => {
    try {
      await navigator.clipboard.writeText(issue.suggestion);
      setCopiedId(issue.id);
      setCopyError(null);
    } catch {
      setCopyError(issue.id);
      setCopiedId(null);
    }
  };

  const filters: SeverityFilter[] = [
    'all',
    'critical',
    'moderate',
    'minor',
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Grammar, Tone & Clarity
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {issues.length} suggested{' '}
          {issues.length === 1 ? 'improvement' : 'improvements'}{' '}
          identified for review.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => {
          const count =
            item === 'all'
              ? issues.length
              : issues.filter((issue) => issue.severity === item).length;

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
                : severityConfig[item].label}{' '}
              ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm font-medium text-foreground">
            No suggestions in this category
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This does not guarantee the resume is free of writing errors.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((issue) => {
            const severity = severityConfig[issue.severity];

            return (
              <article
                key={issue.id}
                className="overflow-hidden rounded-xl border border-border/60 bg-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/20 px-4 py-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    {issue.section}
                  </h4>

                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold',
                      severity.style
                    )}
                  >
                    {issue.severity === 'critical' ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <Info className="h-3 w-3" />
                    )}
                    {severity.label}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2">
                  <div className="min-w-0 border-b border-border/60 p-4 sm:border-b-0 sm:border-r">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">
                      Original Excerpt
                    </p>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                      {issue.original}
                    </p>
                  </div>

                  <div className="min-w-0 bg-success/5 p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-success">
                        Suggested Rewrite
                      </p>

                      <button
                        type="button"
                        onClick={() => copySuggestion(issue)}
                        aria-label={`Copy suggestion for ${issue.section}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {copiedId === issue.id ? (
                          <>
                            <Check className="h-3 w-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                      {issue.suggestion}
                    </p>
                    {copyError === issue.id && (
                      <p role="alert" className="mt-2 text-xs text-destructive">
                        Could not copy. Please select the text manually.
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-border/60 bg-muted/20 px-4 py-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <strong className="text-foreground">
                      Why this is suggested:{' '}
                    </strong>
                    {issue.explanation}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        These are AI-assisted suggestions. Review each rewrite for
        accuracy before applying it to your resume.
      </p>
    </div>
  );
}
