'use client';

import * as React from 'react';
import { Check, Copy, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GrammarIssue } from '@/lib/analysis-types';

interface GrammarToneTabProps {
  issues: GrammarIssue[];
}

const severityConfig = {
  critical: {
    label: 'Critical',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  moderate: {
    label: 'Moderate',
    color: 'bg-warning/10 text-warning border-warning/20',
    icon: <Info className="h-3.5 w-3.5" />,
  },
  minor: {
    label: 'Minor',
    color: 'bg-muted text-muted-foreground border-border',
    icon: <Info className="h-3.5 w-3.5" />,
  },
};

export function GrammarToneTab({ issues }: GrammarToneTabProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{issues.length} sections</span>
        flagged for grammar, tone, or clarity improvements.
      </div>

      {issues.map((issue) => {
        const sev = severityConfig[issue.severity];
        return (
          <div
            key={issue.id}
            className="overflow-hidden rounded-xl border border-border/60 bg-card animate-fade-in-up"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {issue.section}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                    sev.color
                  )}
                >
                  {sev.icon}
                  {sev.label}
                </span>
              </div>
            </div>

            {/* Original vs Suggested */}
            <div className="grid gap-px bg-border/60 sm:grid-cols-2">
              {/* Original */}
              <div className="bg-card p-4">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  Original
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground line-through decoration-muted-foreground/30">
                  {issue.original}
                </p>
              </div>

              {/* Suggested */}
              <div className="bg-success/5 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-success">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    Suggested AI Rewrite
                  </div>
                  <button
                    onClick={() => copyToClipboard(issue.suggestion, issue.id)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                <p className="text-sm leading-relaxed text-foreground">
                  {issue.suggestion}
                </p>
              </div>
            </div>

            {/* Explanation */}
            <div className="border-t border-border/60 bg-muted/20 px-4 py-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Why: </span>
                {issue.explanation}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
