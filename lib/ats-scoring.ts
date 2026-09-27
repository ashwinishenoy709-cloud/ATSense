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

/* -------------------------------------------------------------------------- */
/* KEYWORD MATCH                                                              */
/* -------------------------------------------------------------------------- */

export function isKeywordPresent(resumeText: string, keyword: string): boolean {
  const haystack = ` ${normalize(resumeText)} `;
  const needle = normalize(keyword);

  if (!needle) return false;

  if (haystack.includes(` ${needle} `)) return true;

  const compactNeedle = needle.replace(/\s+/g, '');
  const compactHaystack = haystack.replace(/\s+/g, '');

  if (
    compactNeedle.length >= 4 &&
    compactHaystack.includes(compactNeedle)
  ) {
    return true;
  }

  const words = needle
    .split(' ')
    .filter((word) => word.length > 2);

  return (
    words.length > 1 &&
    words.every((word) => haystack.includes(` ${word} `))
  );
}

export function calculateKeywordCoverage(
  resumeText: string,
  keywords: ATSKeyword[]
): { score: number; missing: MissingKeyword[] } {
  if (keywords.length === 0) {
    return {
      score: 0,
      missing: [],
    };
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
    score:
      possible === 0
        ? 0
        : clamp((earned / possible) * 100),

    missing,
  };
}

/* -------------------------------------------------------------------------- */
/* READABILITY                                                                */
/* -------------------------------------------------------------------------- */

function estimateSyllables(word: string): number {
  const cleaned = word
    .toLowerCase()
    .replace(/[^a-z]/g, '');

  if (!cleaned) return 0;
  if (cleaned.length <= 3) return 1;

  const stripped = cleaned
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/i, '')
    .replace(/^y/i, '');

  const groups = stripped.match(/[aeiouy]{1,2}/g);

  return Math.max(1, groups?.length ?? 1);
}

export function calculateReadability(resumeText: string): number {
  const words =
    resumeText.match(/\b[A-Za-z][A-Za-z'-]*\b/g) ?? [];

  if (words.length === 0) return 0;

  const punctuationSentences =
    (resumeText.match(/[.!?]+(?:\s|$)/g) ?? []).length;

  const lineSentences = resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 20).length;

  const sentences = Math.max(
    1,
    punctuationSentences,
    Math.round(lineSentences * 0.7)
  );

  const syllables = words.reduce(
    (sum, word) => sum + estimateSyllables(word),
    0
  );

  const raw =
    206.835 -
    1.015 * (words.length / sentences) -
    84.6 * (syllables / words.length);

  /*
   * Extremely high Flesch scores are not necessarily ideal for resumes.
   * Bring the score into a practical ATS-oriented range.
   */
  if (raw >= 60 && raw <= 85) {
    return clamp(90 + (raw - 60) * 0.4);
  }

  if (raw > 85) {
    return clamp(100 - (raw - 85) * 0.5);
  }

  return clamp(raw * 1.25);
}

/* -------------------------------------------------------------------------- */
/* SECTION COMPLETENESS                                                       */
/* -------------------------------------------------------------------------- */

const SECTION_PATTERNS: Array<RegExp> = [
  /\b(summary|profile|objective|about me)\b/i,

  /\b(experience|employment|work history|professional experience|internship)\b/i,

  /\b(education|academic background|qualification)\b/i,

  /\b(skills|technical skills|core competencies|technologies)\b/i,

  /\b(projects|project experience|selected projects)\b/i,
];

export function calculateSectionCompleteness(
  resumeText: string
): number {
  const found = SECTION_PATTERNS.filter((pattern) =>
    pattern.test(resumeText)
  ).length;

  return clamp(
    (found / SECTION_PATTERNS.length) * 100
  );
}

/* -------------------------------------------------------------------------- */
/* FORMATTING QUALITY                                                         */
/* -------------------------------------------------------------------------- */

export function calculateFormattingQuality(
  resumeText: string
): number {
  let score = 40;

  const text = resumeText.trim();
  const length = text.length;

  /*
   * Resume length sanity check.
   */
  if (length >= 1200 && length <= 12000) {
    score += 15;
  } else if (length >= 600) {
    score += 8;
  }

  /*
   * Detect excessive unusual characters.
   */
  const nonWhitespace = text.replace(/\s/g, '');

  const unusual = nonWhitespace.replace(
    /[A-Za-z0-9.,:;()@%+/#&'"!?\-]/g,
    ''
  ).length;

  const unusualRatio = nonWhitespace.length
    ? unusual / nonWhitespace.length
    : 1;

  if (unusualRatio < 0.015) {
    score += 15;
  } else if (unusualRatio < 0.04) {
    score += 8;
  }

  /*
   * Enough separate text lines usually means
   * the document is not one giant paragraph.
   */
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length >= 15) {
    score += 10;
  } else if (lines.length >= 8) {
    score += 5;
  }

  /*
   * Detect bullet-like formatting.
   */
  const bulletLines = lines.filter((line) =>
    /^[-•▪◦*]\s+/.test(line)
  ).length;

  if (bulletLines >= 3) {
    score += 10;
  } else if (bulletLines >= 1) {
    score += 5;
  }

  /*
   * Very long lines may indicate dense paragraphs.
   */
  const extremelyLongLines = lines.filter(
    (line) => line.length > 250
  ).length;

  if (extremelyLongLines === 0) {
    score += 10;
  } else if (extremelyLongLines <= 2) {
    score += 5;
  }

  return clamp(score);
}

/* -------------------------------------------------------------------------- */
/* EXPERIENCE RELEVANCE                                                       */
/* -------------------------------------------------------------------------- */

function extractExperienceContent(resumeText: string): string {
  const lines = resumeText.split(/\r?\n/);

  const relevantLines: string[] = [];

  let insideRelevantSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (
      /\b(experience|professional experience|work experience|internship|projects|project experience)\b/i.test(
        trimmed
      )
    ) {
      insideRelevantSection = true;
      continue;
    }

    if (
      insideRelevantSection &&
      /\b(education|skills|certifications|achievements|summary|profile)\b/i.test(
        trimmed
      )
    ) {
      insideRelevantSection = false;
    }

    if (insideRelevantSection && trimmed) {
      relevantLines.push(trimmed);
    }
  }

  /*
   * Some resumes may not have detectable headings.
   * In that case fall back to the entire resume,
   * but reduce the score slightly later.
   */
  return relevantLines.join('\n');
}

export function calculateExperienceRelevance(
  resumeText: string,
  keywords: ATSKeyword[]
): number {
  if (keywords.length === 0) return 0;

  const experienceContent =
    extractExperienceContent(resumeText);

  if (!experienceContent.trim()) {
    const generalCoverage =
      calculateKeywordCoverage(
        resumeText,
        keywords
      ).score;

    return clamp(generalCoverage * 0.6);
  }

  let earned = 0;
  let possible = 0;

  for (const keyword of keywords) {
    const weight =
      importanceWeight[keyword.importance];

    possible += weight;

    if (
      isKeywordPresent(
        experienceContent,
        keyword.keyword
      )
    ) {
      earned += weight;
    }
  }

  if (possible === 0) return 0;

  return clamp(
    (earned / possible) * 100
  );
}

/* -------------------------------------------------------------------------- */
/* QUANTIFIED ACHIEVEMENTS                                                    */
/* -------------------------------------------------------------------------- */

export function calculateQuantifiedAchievements(
  resumeText: string
): number {
  const lines = resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 20);

  if (lines.length === 0) return 0;

  const achievementPatterns = [
    /\b\d+%/i,
    /\b\d+\+?\s+(users?|clients?|customers?|projects?|teams?|members?|requests?|records?)\b/i,
    /\b(increased|improved|reduced|decreased|optimized|boosted|saved|grew)\b.*\d+/i,
    /\b\d+\s*(ms|seconds?|minutes?|hours?|days?)\b/i,
    /₹\s?\d+/i,
    /\$\s?\d+/i,
  ];

  const quantifiedLines = lines.filter(
    (line) =>
      achievementPatterns.some((pattern) =>
        pattern.test(line)
      )
  );

  const count = quantifiedLines.length;

  if (count >= 5) return 100;
  if (count === 4) return 90;
  if (count === 3) return 80;
  if (count === 2) return 65;
  if (count === 1) return 45;

  return 20;
}

/* -------------------------------------------------------------------------- */
/* ACTION VERB QUALITY                                                        */
/* -------------------------------------------------------------------------- */

const STRONG_ACTION_VERBS = [
  'achieved',
  'automated',
  'built',
  'created',
  'delivered',
  'designed',
  'developed',
  'engineered',
  'implemented',
  'improved',
  'increased',
  'integrated',
  'launched',
  'led',
  'managed',
  'optimized',
  'reduced',
  'resolved',
  'streamlined',
  'tested',
  'deployed',
  'configured',
  'collaborated',
  'analyzed',
  'maintained',
];

export function calculateActionVerbQuality(
  resumeText: string
): number {
  const lines = resumeText
    .split(/\r?\n/)
    .map((line) =>
      line
        .trim()
        .replace(/^[-•▪◦*]\s*/, '')
    )
    .filter((line) => line.length > 15);

  if (lines.length === 0) return 0;

  const actionLines = lines.filter((line) => {
    const firstWord =
      line.split(/\s+/)[0]
        ?.toLowerCase()
        .replace(/[^a-z]/g, '');

    return STRONG_ACTION_VERBS.includes(
      firstWord
    );
  });

  /*
   * Most resumes also contain headings,
   * dates and technologies, so we shouldn't
   * expect every line to begin with an action verb.
   */
  const ratio =
    actionLines.length /
    Math.max(1, Math.min(lines.length, 15));

  return clamp(ratio * 250);
}

/* -------------------------------------------------------------------------- */
/* CONTACT / BASIC ATS PARSING                                                */
/* -------------------------------------------------------------------------- */

export function calculateContactParsing(
  resumeText: string
): number {
  let score = 0;

  const hasEmail =
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(
      resumeText
    );

  const hasPhone =
    /(?:\+?\d[\d\s().-]{7,}\d)/.test(
      resumeText
    );

  const hasLinkedIn =
    /linkedin(?:\.com)?/i.test(
      resumeText
    );

  const hasGitHub =
    /github(?:\.com)?/i.test(
      resumeText
    );

  if (hasEmail) score += 35;
  if (hasPhone) score += 30;
  if (hasLinkedIn) score += 20;
  if (hasGitHub) score += 15;

  return clamp(score);
}

/* -------------------------------------------------------------------------- */
/* FINAL ATS SCORE                                                            */
/* -------------------------------------------------------------------------- */

export function calculateATSScore(params: {
  keywordMatch: number;
  experienceRelevance: number;
  formattingQuality: number;
  sectionCompleteness: number;
  readabilityIndex: number;
  quantifiedAchievements: number;
  actionVerbQuality: number;
  contactParsing: number;
}): number {
  const {
    keywordMatch,
    experienceRelevance,
    formattingQuality,
    sectionCompleteness,
    readabilityIndex,
    quantifiedAchievements,
    actionVerbQuality,
    contactParsing,
  } = params;

  const weighted =
    keywordMatch * 0.30 +
    experienceRelevance * 0.20 +
    formattingQuality * 0.15 +
    sectionCompleteness * 0.10 +
    readabilityIndex * 0.10 +
    quantifiedAchievements * 0.05 +
    actionVerbQuality * 0.05 +
    contactParsing * 0.05;

  return clamp(weighted);
}

/* -------------------------------------------------------------------------- */
/* SCORE LABEL                                                                */
/* -------------------------------------------------------------------------- */

export function getScoreTier(
  score: number
): ScoreTier {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';

  return 'red';
}

export function getScoreLabel(
  score: number
): string {
  if (score >= 80) {
    return 'Strong Match';
  }

  if (score >= 60) {
    return 'Moderate Match';
  }

  return 'Needs Improvement';
}

/* -------------------------------------------------------------------------- */
/* SCORE SUMMARY                                                              */
/* -------------------------------------------------------------------------- */

export function buildScoreSummary(params: {
  atsScore: number;
  keywordMatch: number;
  experienceRelevance: number;
  formattingQuality: number;
  readabilityIndex: number;
  jobDescriptionProvided: boolean;
}): string {
  const {
    atsScore,
    keywordMatch,
    experienceRelevance,
    formattingQuality,
    readabilityIndex,
    jobDescriptionProvided,
  } = params;

  const context = jobDescriptionProvided
    ? `The resume matches ${keywordMatch}% of the weighted ATS signals identified in the target job description.`
    : `The resume covers ${keywordMatch}% of the ATS benchmark inferred for its likely role.`;

  const relevance =
    ` Relevant skills appear within experience or project content at ${experienceRelevance}%.`;

  if (atsScore >= 80) {
    return `${context}${relevance} Formatting quality is ${formattingQuality}% and readability is ${readabilityIndex}%, indicating a strong ATS-compatible foundation.`;
  }

  if (atsScore >= 60) {
    return `${context}${relevance} Formatting quality is ${formattingQuality}% and readability is ${readabilityIndex}%. Addressing missing high-priority skills and weaker resume sections should improve compatibility.`;
  }

  return `${context}${relevance} Formatting quality is ${formattingQuality}% and readability is ${readabilityIndex}%. Several keyword, experience or structural gaps should be addressed before targeting this role.`;
}