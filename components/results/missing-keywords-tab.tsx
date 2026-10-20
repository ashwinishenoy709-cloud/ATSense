'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  KeywordMatch,
  KeywordCategory,
} from '@/lib/analysis-types';

interface MissingKeywordsTabProps {
  keywordMatches: KeywordMatch[];
  jobDescriptionProvided: boolean;
}

const categoryConfig: Record<
  KeywordCategory,
  { label: string; color: string }
> = {
  technical: {
    label: 'Technical Skills',
    color: 'bg-accent/10 text-accent border-accent/20',
  },
  soft: {
    label: 'Soft Skills',
    color: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  },
  tools: {
    label: 'Tools & Platforms',
    color: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
  },
  domain: {
    label: 'Domain Knowledge',
    color: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  },
};

const statusConfig = {
  exact: {
    label: 'Exact Match',
    color: 'border-success/20 bg-success/10 text-success',
    order: 2,
  },
  related: {
    label: 'Related Skill',
    color: 'border-warning/20 bg-warning/10 text-warning',
    order: 1,
  },
  missing: {
    label: 'Missing',
    color: 'border-destructive/20 bg-destructive/10 text-destructive',
    order: 0,
  },
};

export function MissingKeywordsTab({
  keywordMatches,
  jobDescriptionProvided,
}: MissingKeywordsTabProps) {
  const counts = React.useMemo(
    () => ({
      exact: keywordMatches.filter(
        (item) => item.matchStatus === 'exact'
      ).length,
      related: keywordMatches.filter(
        (item) => item.matchStatus === 'related'
      ).length,
      missing: keywordMatches.filter(
        (item) => item.matchStatus === 'missing'
      ).length,
    }),
    [keywordMatches]
  );

  const categories = React.useMemo(() => {
    const grouped: Record<KeywordCategory, KeywordMatch[]> = {
      technical: [],
      soft: [],
      tools: [],
      domain: [],
    };

    keywordMatches.forEach((item) => {
      grouped[item.category].push(item);
    });

    for (const category of Object.keys(grouped) as KeywordCategory[]) {
      grouped[category].sort(
        (a, b) =>
          statusConfig[a.matchStatus].order -
          statusConfig[b.matchStatus].order
      );
    }

    return grouped;
  }, [keywordMatches]);

  if (keywordMatches.length === 0) {
    return (
      <div className="rounded-xl border p-4 text-sm text-muted-foreground">
        No keyword signals are available for this analysis.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">
          Keyword Match Analysis
        </h3>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {jobDescriptionProvided
            ? 'Keyword signals identified from the target job description.'
            : 'Keyword signals inferred from a general role benchmark.'}
        </p>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-xs font-semibold text-success">
            {counts.exact} Exact
          </span>

          <span className="rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">
            {counts.related} Related
          </span>

          <span className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
            {counts.missing} Missing
          </span>
        </div>
      </div>

      {counts.missing === 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-success/20 bg-success/5 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              No keyword gaps detected
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              All evaluated keywords were matched either exactly or
              through an approved related-skill match.
            </p>
          </div>
        </div>
      )}

      {(Object.keys(categories) as KeywordCategory[]).map((category) => {
        const items = categories[category];

        if (items.length === 0) return null;

        return (
          <section key={category}>
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              {categoryConfig[category].label}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({items.length})
              </span>
            </h4>

            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <div
                  key={item.keyword}
                  className={cn(
                    'flex flex-wrap items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium',
                    categoryConfig[category].color
                  )}
                >
                  <span>{item.keyword}</span>

                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                      statusConfig[item.matchStatus].color
                    )}
                  >
                    {statusConfig[item.matchStatus].label}
                  </span>

                  {jobDescriptionProvided && (
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                        item.requirementType === 'required'
                          ? 'border-destructive/20 bg-destructive/10 text-destructive'
                          : 'border-warning/20 bg-warning/10 text-warning'
                      )}
                    >
                      {item.requirementType === 'required'
                        ? 'Required'
                        : 'Preferred'}
                    </span>
                  )}

                  {item.importance === 'high' && (
                    <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                      HIGH
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <div className="space-y-2 rounded-xl border bg-muted/20 p-4">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Exact Match means the keyword appears in the extracted
            resume text. Related Skill means an approved technology
            alias was detected. Missing means neither was found.
          </p>
        </div>

        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Related skills count toward the estimated keyword score,
            but may not satisfy literal keyword searches in employer
            ATS systems. Only include skills you genuinely possess.
          </p>
        </div>
      </div>
    </div>
  );
}
