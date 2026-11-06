'use client';

import * as React from 'react';
import { Search, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

import type {
  KeywordMatch,
  KeywordCategory,
  KeywordMatchStatus,
} from '@/lib/analysis-types';

interface MissingKeywordsTabProps {
  keywordMatches: KeywordMatch[];
  jobDescriptionProvided: boolean;
}

type StatusFilter = 'all' | KeywordMatchStatus;
type CategoryFilter = 'all' | KeywordCategory;

const categories: Record<KeywordCategory, string> = {
  technical: 'Technical Skills',
  soft: 'Soft Skills',
  tools: 'Tools & Platforms',
  domain: 'Domain Knowledge',
};

const statusStyles = {
  exact: 'border-success/20 bg-success/10 text-success',
  related: 'border-warning/20 bg-warning/10 text-warning',
  missing: 'border-destructive/20 bg-destructive/10 text-destructive',
};

const statusLabels = {
  exact: 'Exact Match',
  related: 'Related Skill',
  missing: 'Missing',
};

const statusOrder = {
  missing: 0,
  related: 1,
  exact: 2,
};

export function MissingKeywordsTab({
  keywordMatches,
  jobDescriptionProvided,
}: MissingKeywordsTabProps) {
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<StatusFilter>('all');
  const [category, setCategory] =
    React.useState<CategoryFilter>('all');

  const counts = {
    all: keywordMatches.length,
    exact: keywordMatches.filter(
      (item) => item.matchStatus === 'exact'
    ).length,
    related: keywordMatches.filter(
      (item) => item.matchStatus === 'related'
    ).length,
    missing: keywordMatches.filter(
      (item) => item.matchStatus === 'missing'
    ).length,
  };

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return keywordMatches
      .filter((item) => {
        const matchesSearch = item.keyword
          .toLowerCase()
          .includes(query);

        const matchesStatus =
          status === 'all' || item.matchStatus === status;

        const matchesCategory =
          category === 'all' || item.category === category;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesCategory
        );
      })
      .sort((a, b) => {
        const difference =
          statusOrder[a.matchStatus] -
          statusOrder[b.matchStatus];

        return difference || a.keyword.localeCompare(b.keyword);
      });
  }, [keywordMatches, search, status, category]);

  const filters: StatusFilter[] = [
    'all',
    'missing',
    'related',
    'exact',
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Keyword Match Analysis
        </h3>

        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {jobDescriptionProvided
            ? 'Keywords evaluated against your target job description.'
            : 'Keywords evaluated against a general role benchmark.'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(['exact', 'related', 'missing'] as const).map(
          (item) => (
            <div
              key={item}
              className={cn(
                'rounded-xl border p-3 text-center',
                statusStyles[item]
              )}
            >
              <p className="text-xl font-bold tabular-nums">
                {counts[item]}
              </p>
              <p className="mt-1 text-[11px] font-medium">
                {statusLabels[item]}
              </p>
            </div>
          )
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search keywords..."
            aria-label="Search evaluated keywords"
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              aria-pressed={status === item}
              className={cn(
                'rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                status === item
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              )}
            >
              {item === 'all'
                ? 'All'
                : statusLabels[item]}{' '}
              ({counts[item]})
            </button>
          ))}
        </div>

        <label className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          Category
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as CategoryFilter)
            }
            className="h-9 min-w-0 max-w-[220px] flex-1 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Categories</option>
            {(Object.keys(categories) as KeywordCategory[]).map(
              (item) => (
                <option key={item} value={item}>
                  {categories[item]}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        Showing {filtered.length} of {keywordMatches.length} keywords
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm font-medium text-foreground">
            No matching keywords found
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try changing your search or filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatus('all');
              setCategory('all');
            }}
            className="mt-3 text-xs font-semibold text-accent underline underline-offset-4"
          >
            Clear filters
          </button>
        </div>
      ) : (
        (Object.keys(categories) as KeywordCategory[]).map(
          (group) => {
            const items = filtered.filter(
              (item) => item.category === group
            );

            if (items.length === 0) return null;

            return (
              <section key={group} className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">
                  {categories[group]}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({items.length})
                  </span>
                </h4>

                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map((item, index) => (
                    <div
                      key={`${group}-${item.keyword}-${index}`}
                      className="rounded-xl border border-border/60 bg-card p-3"
                    >
                      <p className="break-words text-sm font-semibold text-foreground">
                        {item.keyword}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span
                          className={cn(
                            'rounded-full border px-2 py-1 text-[10px] font-medium',
                            statusStyles[item.matchStatus]
                          )}
                        >
                          {statusLabels[item.matchStatus]}
                        </span>

                        {jobDescriptionProvided && (
                          <span className="rounded-full border border-border bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                            {item.requirementType === 'required'
                              ? 'Required'
                              : 'Preferred'}
                          </span>
                        )}

                        {item.importance === 'high' && (
                          <span className="rounded-full border border-destructive/20 bg-destructive/10 px-2 py-1 text-[10px] font-medium text-destructive">
                            High Importance
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          }
        )
      )}

      <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/20 p-4">
        <Info
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">Exact:</strong>{' '}
            The keyword was detected in the resume text.
          </p>
          <p>
            <strong className="text-foreground">Related:</strong>{' '}
            An approved related technology or alias was detected.
          </p>
          <p>
            <strong className="text-foreground">Missing:</strong>{' '}
            Neither an exact nor an approved related match was found.
          </p>
          <p>
            Only add keywords for skills or experience you genuinely have.
            Related matches may not satisfy literal ATS searches.
          </p>
        </div>
      </div>
    </div>
  );
}
