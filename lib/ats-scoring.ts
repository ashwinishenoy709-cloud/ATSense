import type { ATSKeyword, MissingKeyword, ScoreTier } from './analysis-types';

const clamp = (value: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Math.round(value)));

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/[._/-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const importanceWeight = {
  high: 3,
  medium: 2,
  low: 1,
} as const;

export function isKeywordPresent(resumeText: string, keyword: string): boolean {
  const haystack = ` ${normalize(resumeText)} `;
  const needle = normalize(keyword);

  if (!needle) return false;

  // Exact normalized phrase match first.
  if (haystack.includes(` ${needle} `)) return true;

  // Handle punctuation variants such as Node.js -> NodeJS and Next.js -> NextJS.
  const compactNeedle = needle.replace(/\s+/g, '');
  const compactHaystack = haystack.replace(/\s+/g, '');
  if (compactNeedle.length >= 4 && compactHaystack.includes(compactNeedle)) return true;

  // For multi-word phrases, allow all meaningful words to be present even when
  // punctuation or ATS extraction changes their spacing.
  const words = needle.split(' ').filter((word) => word.length > 2);
  return words.length > 1 && words.every((word) => haystack.includes(` ${word} `));
}

export function calculateKeywordCoverage(
  resumeText: string,
  keywords: ATSKeyword[]
): { score: number; missing: MissingKeyword[] } {
  if (keywords.length === 0) {
    return { score: 0, missing: [] };
  }

  let earned = 0;
  let possible = 0;
  const missing: MissingKeyword[] = [];

  for (const signal of keywords) {
    const weight = importanceWeight[signal.importance];
    possible += weight;

    if (isKeywordPresent(resumeText, signal.keyword)) {
      earned += weight;
    } else {
      missing.push(signal);
    }
  }

  return {
    score: possible === 0 ? 0 : clamp((earned / possible) * 100),
    missing,
  };
}

function estimateSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return 0;
  if (cleaned.length <= 3) return 1;

  const stripped = cleaned
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/i, '')
    .replace(/^y/i, '');
  const groups = stripped.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 1);
}

export function calculateReadability(resumeText: string): number {
  const words = resumeText.match(/\b[A-Za-z][A-Za-z'-]*\b/g) ?? [];
  if (words.length === 0) return 0;

  const punctuationSentences = (resumeText.match(/[.!?]+(?:\s|$)/g) ?? []).length;
  const lineSentences = resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 20).length;
  const sentences = Math.max(1, punctuationSentences, Math.round(lineSentences * 0.7));
  const syllables = words.reduce((sum, word) => sum + estimateSyllables(word), 0);

  const raw =
    206.835 -
    1.015 * (words.length / sentences) -
    84.6 * (syllables / words.length);

  return clamp(raw);
}

const SECTION_PATTERNS: Array<RegExp> = [
  /\b(summary|profile|objective|about me)\b/i,
  /\b(experience|employment|work history|professional experience)\b/i,
  /\b(education|academic background|qualification)\b/i,
  /\b(skills|technical skills|core competencies|technologies)\b/i,
  /\b(projects|project experience|selected projects)\b/i,
];

export function calculateSectionCompleteness(resumeText: string): number {
  const found = SECTION_PATTERNS.filter((pattern) => pattern.test(resumeText)).length;
  return clamp((found / SECTION_PATTERNS.length) * 100);
}

export function calculateFormattingQuality(resumeText: string): number {
  let score = 20;

  const length = resumeText.trim().length;
  if (length >= 1200 && length <= 12000) score += 12;
  else if (length >= 600) score += 7;

  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(resumeText)) score += 8;
  if (/(?:\+?\d[\d\s().-]{7,}\d)/.test(resumeText)) score += 6;

  const sectionScore = calculateSectionCompleteness(resumeText);
  score += sectionScore * 0.38;

  const nonWhitespace = resumeText.replace(/\s/g, '');
  const unusual = nonWhitespace.replace(/[A-Za-z0-9.,:;()@%+/#&'"!?\-]/g, '').length;
  const unusualRatio = nonWhitespace.length ? unusual / nonWhitespace.length : 1;
  if (unusualRatio < 0.015) score += 10;
  else if (unusualRatio < 0.04) score += 5;

  const lines = resumeText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length >= 12) score += 6;

  return clamp(score);
}

export function calculateATSScore(params: {
  keywordMatch: number;
  readabilityIndex: number;
  formattingQuality: number;
  sectionCompleteness: number;
  jobDescriptionProvided: boolean;
}): number {
  const {
    keywordMatch,
    readabilityIndex,
    formattingQuality,
    sectionCompleteness,
    jobDescriptionProvided,
  } = params;

  const weighted = jobDescriptionProvided
    ? keywordMatch * 0.5 +
      formattingQuality * 0.25 +
      readabilityIndex * 0.1 +
      sectionCompleteness * 0.15
    : keywordMatch * 0.25 +
      formattingQuality * 0.35 +
      readabilityIndex * 0.15 +
      sectionCompleteness * 0.25;

  return clamp(weighted);
}

export function getScoreTier(score: number): ScoreTier {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  return 'red';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Strong Match';
  if (score >= 60) return 'Moderate Match';
  return 'Needs Improvement';
}

export function buildScoreSummary(params: {
  atsScore: number;
  keywordMatch: number;
  formattingQuality: number;
  readabilityIndex: number;
  jobDescriptionProvided: boolean;
}): string {
  const {
    atsScore,
    keywordMatch,
    formattingQuality,
    readabilityIndex,
    jobDescriptionProvided,
  } = params;

  const context = jobDescriptionProvided
    ? `The resume matches ${keywordMatch}% of the weighted ATS keywords identified in the target job description.`
    : `The resume covers ${keywordMatch}% of the weighted ATS keyword benchmark inferred for its likely software role.`;

  if (atsScore >= 80) {
    return `${context} Parsing quality is ${formattingQuality}% and readability is ${readabilityIndex}%, indicating a strong ATS-compatible foundation.`;
  }

  if (atsScore >= 60) {
    return `${context} Formatting scores ${formattingQuality}% and readability scores ${readabilityIndex}%; addressing the missing high-priority terms and targeted fixes should strengthen compatibility.`;
  }

  return `${context} Formatting scores ${formattingQuality}% and readability scores ${readabilityIndex}%; several structural or keyword gaps should be addressed before relying on this resume for the target role.`;
}
