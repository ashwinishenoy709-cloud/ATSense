import { describe, expect, it } from 'vitest';

import {
  calculateATSScore,
  calculateKeywordCoverage,
  calculateExperienceRelevance,
  calculateFormattingQuality,
  calculateSectionCompleteness,
  calculateReadability,
  calculateQuantifiedAchievements,
  calculateActionVerbQuality,
  calculateContactParsing,
  getScoreTier,
  isKeywordPresent,
} from './ats-scoring';

import {
  classifyKeywordRequirement,
  getKeywordMatchStatus,
  isGroundedResumeExcerpt,
} from './analysis-validation';

import type { ATSKeyword } from './analysis-types';

const makeMetrics = (value: number) => ({
  keywordMatch: value,
  experienceRelevance: value,
  formattingQuality: value,
  sectionCompleteness: value,
  readabilityIndex: value,
  quantifiedAchievements: value,
  actionVerbQuality: value,
  contactParsing: value,
});

const keywords: ATSKeyword[] = [
  {
    keyword: 'Python',
    category: 'technical',
    importance: 'high',
    requirementType: 'required',
  },
  {
    keyword: 'React',
    category: 'technical',
    importance: 'medium',
    requirementType: 'preferred',
  },
];

describe('ATS Score Boundaries', () => {
  it('keeps valid input scores between 0 and 100', () => {
    for (const value of [0, 1, 25, 50, 75, 99, 100]) {
      const score = calculateATSScore(makeMetrics(value));

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it('increases when all metrics improve', () => {
    expect(calculateATSScore(makeMetrics(80)))
      .toBeGreaterThan(calculateATSScore(makeMetrics(40)));
  });

  it('returns the same score for identical inputs', () => {
    const metrics = makeMetrics(67);

    expect(calculateATSScore(metrics))
      .toBe(calculateATSScore(metrics));
  });

  it('assigns the correct score tiers at boundaries', () => {
    expect(getScoreTier(59)).toBe('red');
    expect(getScoreTier(60)).toBe('yellow');
    expect(getScoreTier(79)).toBe('yellow');
    expect(getScoreTier(80)).toBe('green');
  });
});

describe('Missing and Incomplete Resumes', () => {
  it('does not reward an empty resume', () => {
    expect(calculateFormattingQuality('')).toBe(0);
    expect(calculateSectionCompleteness('')).toBe(0);
    expect(calculateReadability('')).toBe(0);
    expect(calculateQuantifiedAchievements('')).toBe(0);
    expect(calculateActionVerbQuality('')).toBe(0);
    expect(calculateContactParsing('')).toBe(0);
  });

  it('does not award full section completeness to a partial resume', () => {
    const resume = `
Skills
Python, React, HTML
Education
Bachelor of Engineering
`;

    expect(calculateSectionCompleteness(resume))
      .toBeLessThan(100);
  });

  it('does not award experience relevance without projects or experience', () => {
    const resume = `
Skills
Python, React
Education
Bachelor of Engineering
`;

    expect(calculateExperienceRelevance(resume, keywords))
      .toBe(0);
  });
});

describe('Keyword Matching Edge Cases', () => {
  it('returns zero coverage when no keywords are supplied', () => {
    const result = calculateKeywordCoverage(
      'Experienced Python developer',
      []
    );

    expect(result.score).toBe(0);
    expect(result.missing).toEqual([]);
  });

  it('detects completely missing skills', () => {
    const result = calculateKeywordCoverage(
      'Experience with HTML and CSS',
      keywords
    );

    expect(result.score).toBe(0);
    expect(result.missing).toHaveLength(2);
  });

  it('does not count repeated occurrences as additional coverage', () => {
    const once = calculateKeywordCoverage(
      'Python',
      [keywords[0]]
    );

    const repeated = calculateKeywordCoverage(
      'Python Python Python Python',
      [keywords[0]]
    );

    expect(repeated.score).toBe(once.score);
  });

  it('does not confuse Java and JavaScript', () => {
    expect(isKeywordPresent('JavaScript', 'Java'))
      .toBe(false);
  });

  it('does not confuse C and C++', () => {
    expect(isKeywordPresent('C++', 'C'))
      .toBe(false);
  });

  it('identifies an exact keyword match', () => {
    expect(
      getKeywordMatchStatus(
        'Built applications using React.',
        'React'
      )
    ).toBe('exact');
  });

  it('identifies a missing keyword', () => {
    expect(
      getKeywordMatchStatus(
        'Built applications using React.',
        'Kubernetes'
      )
    ).toBe('missing');
  });
});

describe('Job Description and Grammar Validation', () => {
  it('defaults to preferred when no JD is provided', () => {
    expect(
      classifyKeywordRequirement('', 'Python')
    ).toBe('preferred');
  });

  it('separates required and preferred JD sections', () => {
    const jd = `
Requirements:
- Python
- SQL

Preferred Qualifications:
- Docker
`;

    expect(
      classifyKeywordRequirement(jd, 'Python')
    ).toBe('required');

    expect(
      classifyKeywordRequirement(jd, 'Docker')
    ).toBe('preferred');
  });

  it('rejects grammar excerpts invented by AI', () => {
    expect(
      isGroundedResumeExcerpt(
        'Developed a React application.',
        'Managed a team of 20 engineers.'
      )
    ).toBe(false);
  });

  it('accepts a genuine resume excerpt', () => {
    expect(
      isGroundedResumeExcerpt(
        'Developed a React application.',
        'Developed a React application.'
      )
    ).toBe(true);
  });
});
