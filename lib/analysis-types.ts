export type KeywordCategory = 'technical' | 'soft' | 'tools' | 'domain';

export type Importance = 'high' | 'medium' | 'low';

export type ScoreTier = 'green' | 'yellow' | 'red';

export interface ATSKeyword {
  keyword: string;
  category: KeywordCategory;
  importance: Importance;
}

export type MissingKeyword = ATSKeyword;

export interface GrammarIssue {
  id: string;
  section: string;
  severity: 'critical' | 'moderate' | 'minor';
  original: string;
  suggestion: string;
  explanation: string;
}

export interface ActionableFix {
  id: string;
  title: string;
  description: string;
  priority: Importance;
  impact: number;
  completed: boolean;
}

/*
 * Individual ATS scoring components.
 * Each value ranges from 0 to 100.
 */
export interface AnalysisMetrics {
  keywordMatch: number;

  experienceRelevance: number;

  formattingQuality: number;

  sectionCompleteness: number;

  readabilityIndex: number;

  quantifiedAchievements: number;

  actionVerbQuality: number;

  contactParsing: number;
}

export interface AnalysisMeta {
  provider: 'Google Gemini';

  model: string;

  mode: 'job-targeted' | 'general-benchmark';

  resumeCharacters: number;

  jobDescriptionProvided: boolean;

  /*
   * Kept here for compatibility with the existing UI.
   * The same value is also available in metrics.
   */
  sectionCompleteness: number;

  keywordSignalsEvaluated: number;
}

export interface AnalysisRequest {
  file: File;
  jobDescription?: string;
}

export interface AnalysisResult {
  atsScore: number;

  scoreTier: ScoreTier;

  scoreLabel: string;

  scoreSummary: string;

  metrics: AnalysisMetrics;

  missingKeywords: MissingKeyword[];

  grammarIssues: GrammarIssue[];

  actionableFixes: ActionableFix[];

  analyzedAt: string;

  fileName: string;

  analysisMeta: AnalysisMeta;
}