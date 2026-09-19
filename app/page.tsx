'use client';

import * as React from 'react';
import { CheckCircle2, Cpu, FileText } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Header } from '@/components/header';
import { UploadZone } from '@/components/upload-zone';
import { ScoreGauge } from '@/components/score-gauge';
import { MetricsGrid } from '@/components/metrics-grid';
import { MissingKeywordsTab } from '@/components/results/missing-keywords-tab';
import { GrammarToneTab } from '@/components/results/grammar-tone-tab';
import { ActionableFixesTab } from '@/components/results/actionable-fixes-tab';
import { analyzeResume } from '@/lib/analysis-service';
import type { AnalysisResult } from '@/lib/analysis-types';

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [result, setResult] = React.useState<AnalysisResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleAnalyze = async (
    file: File,
    jobDescription: string
  ) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeResume({ file, jobDescription });
      setResult(analysis);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong during analysis.';
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleFix = (id: string) => {
    if (!result) return;
    setResult({
      ...result,
      actionableFixes: result.actionableFixes.map((f) =>
        f.id === id ? { ...f, completed: !f.completed } : f
      ),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Upload Section */}
        <section className="mb-8">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Upload Your Resume</CardTitle>
              <CardDescription>
                Drop your resume below and optionally paste a job description for
                a targeted ATS analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadZone onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
            </CardContent>
          </Card>
        </section>

        {/* Error state */}
        {error && (
          <div className="mb-8 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {isAnalyzing && !result && (
          <section className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-5">
              <Card className="lg:col-span-2 border-border/60">
                <CardContent className="flex items-center justify-center py-16">
                  <div className="h-[200px] w-[200px] animate-pulse rounded-full bg-muted" />
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-border/60">
                    <CardContent className="p-4">
                      <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
                      <div className="mt-3 h-7 w-16 animate-pulse rounded bg-muted" />
                      <div className="mt-2 h-1.5 w-full animate-pulse rounded-full bg-muted" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
                <div className="mt-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-muted" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Results Dashboard */}
        {result && !isAnalyzing && (
          <section className="space-y-6 animate-fade-in-up">
            <Card className="border-accent/20 bg-accent/5 shadow-sm">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Live analysis completed</p>
                    <p className="text-xs text-muted-foreground">
                      This result was generated from the extracted contents of your uploaded resume.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1">
                    <FileText className="h-3 w-3" />
                    {result.fileName}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1">
                    <Cpu className="h-3 w-3" />
                    {result.analysisMeta.model}
                  </span>
                  <span className="rounded-full border border-border bg-background px-2.5 py-1">
                    {result.analysisMeta.mode === 'job-targeted' ? 'Job-targeted' : 'General benchmark'}
                  </span>
                  <span className="rounded-full border border-border bg-background px-2.5 py-1">
                    {result.analysisMeta.keywordSignalsEvaluated} ATS signals
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Score + Metrics */}
            <div className="grid gap-6 lg:grid-cols-5">
              <Card className="lg:col-span-2 border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">ATS Match Score</CardTitle>
                  <CardDescription>
                    Hybrid compatibility score calculated from the parsed resume and weighted ATS signals
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center pb-8">
                  <ScoreGauge result={result} />
                </CardContent>
              </Card>

              <div className="flex flex-col gap-4 lg:col-span-3">
                <Card className="border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Key Metrics</CardTitle>
                    <CardDescription>
                      Breakdown of your resume’s ATS readiness
                    </CardDescription>
                  </CardHeader>
                </Card>
                <MetricsGrid metrics={result.metrics} />
              </div>
            </div>

            {/* Tabbed Results */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Detailed Analysis</CardTitle>
                <CardDescription>
                  Explore specific areas of improvement to boost your ATS passing
                  rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="keywords" className="w-full">
                  <TabsList className="mb-6 grid h-auto w-full grid-cols-3 gap-1">
                    <TabsTrigger value="keywords" className="text-xs sm:text-sm">
                      Missing Keywords
                    </TabsTrigger>
                    <TabsTrigger value="grammar" className="text-xs sm:text-sm">
                      Grammar & Tone
                    </TabsTrigger>
                    <TabsTrigger value="fixes" className="text-xs sm:text-sm">
                      Actionable Fixes
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="keywords">
                    <MissingKeywordsTab
                      keywords={result.missingKeywords}
                      jobDescriptionProvided={result.analysisMeta.jobDescriptionProvided}
                    />
                  </TabsContent>

                  <TabsContent value="grammar">
                    <GrammarToneTab issues={result.grammarIssues} />
                  </TabsContent>

                  <TabsContent value="fixes">
                    <ActionableFixesTab
                      fixes={result.actionableFixes}
                      currentScore={result.atsScore}
                      onToggle={handleToggleFix}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Empty state */}
        {!result && !isAnalyzing && !error && (
          <section>
            <Card className="border-dashed border-border/60 bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                  <svg
                    className="h-8 w-8 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  No analysis yet
                </h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Upload your resume and click Analyze Resume to parse the actual file, evaluate ATS compatibility, and generate resume-specific feedback.
                </p>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      <footer className="border-t border-border/60 py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground sm:px-6">
          Resume Pulse AI — AI-assisted ATS compatibility estimate · Powered by Google Gemini
        </div>
      </footer>
    </div>
  );
}
