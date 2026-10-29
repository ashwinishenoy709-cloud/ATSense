export type KeywordCategory = 'technical' | 'soft' | 'tools' | 'domain';

export type Importance = 'high' | 'medium' | 'low';

export type ScoreTier = 'green' | 'yellow' | 'red';

export interface ATSKeyword {
  keyword: string;
  category: KeywordCategory;
  importance: Importance;
  requirementType: 'required' | 'preferred';
}

export type MissingKeyword = ATSKeyword;
export type KeywordMatchStatus = 'exact' | 'related' | 'missing';

export interface KeywordMatch extends ATSKeyword {
  matchStatus: KeywordMatchStatus;
}

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

export interface AnalysisMetrics {
  keywordMatch: number;

  experienceRelevance: number;

  /**
   * Text-based ATS formatting estimate (0–100).
   *
   * Evaluates extracted text structure, including section headings,
   * bullet consistency, content density, and unusual characters.
   *
   * Does not verify visual formatting such as fonts, margins,
   * tables, columns, or text boxes.
   */
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

  keywordMatches: KeywordMatch[];
  missingKeywords: MissingKeyword[];

  grammarIssues: GrammarIssue[];

  actionableFixes: ActionableFix[];

  analyzedAt: string;

  fileName: string;

  analysisMeta: AnalysisMeta;
}