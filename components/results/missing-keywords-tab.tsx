'use client';

import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MissingKeyword, KeywordCategory } from '@/lib/analysis-types';

interface MissingKeywordsTabProps {
  keywords: MissingKeyword[];
  jobDescriptionProvided: boolean;
}

const categoryConfig: Record<KeywordCategory, { label: string; color: string }> = {
  technical: { label: 'Technical Skills', color: 'bg-accent/10 text-accent border-accent/20' },
  soft: { label: 'Soft Skills', color: 'bg-chart-2/10 text-chart-2 border-chart-2/20' },
  tools: { label: 'Tools & Platforms', color: 'bg-chart-5/10 text-chart-5 border-chart-5/20' },
  domain: { label: 'Domain Knowledge', color: 'bg-chart-3/10 text-chart-3 border-chart-3/20' },
};

const importanceConfig = {
  high: 'border-l-destructive',
  medium: 'border-l-warning',
  low: 'border-l-muted-foreground',
};

export function MissingKeywordsTab({
  keywords,
  jobDescriptionProvided,
}: MissingKeywordsTabProps) {
  const categories = React.useMemo(() => {
    const grouped: Record<KeywordCategory, MissingKeyword[]> = {
      technical: [],
      soft: [],
      tools: [],
      domain: [],
    };
    keywords.forEach((kw) => grouped[kw.category].push(kw));
    return grouped;
  }, [keywords]);

  if (keywords.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-success/20 bg-success/5 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
        <div>
          <p className="text-sm font-semibold text-foreground">No priority keyword gaps detected</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            The analyzer found the weighted keyword signals it evaluated in your resume. Keep the wording natural and accurate rather than adding keywords only for scoring.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{keywords.length} keyword gaps</span>{' '}
        {jobDescriptionProvided
          ? 'were verified as absent from your resume after evaluating the target job description.'
          : 'were identified against a conservative ATS benchmark inferred from your resume.'}
      </div>

      {(Object.keys(categories) as KeywordCategory[]).map((cat) => {
        const items = categories[cat];
        if (items.length === 0) return null;

        return (
          <div key={cat}>
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              {categoryConfig[cat].label}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({items.length})
              </span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {items.map((kw) => (
                <div
                  key={kw.keyword}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border border-l-2 py-1 pl-2.5 pr-3 text-xs font-medium',
                    categoryConfig[cat].color,
                    importanceConfig[kw.importance]
                  )}
                >
                  {kw.keyword}
                  {kw.importance === 'high' && (
                    <span className="ml-0.5 rounded bg-destructive/15 px-1 py-0.5 text-[10px] font-semibold text-destructive">
                      HIGH
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
