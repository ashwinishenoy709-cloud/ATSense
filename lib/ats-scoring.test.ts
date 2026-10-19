
import { describe, expect, it } from 'vitest';

import {
  calculateATSScore,
  calculateReadability,
  calculateKeywordCoverage,
  calculateExperienceRelevance,
  isKeywordPresent,
  getScoreTier,
  calculateFormattingQuality,
  calculateSectionCompleteness,
  calculateQuantifiedAchievements,
  calculateActionVerbQuality,
  calculateContactParsing,
} from './ats-scoring';
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

describe('ATS Score Calculation', () => {
  it('returns 100 when all metrics are 100', () => {
    expect(calculateATSScore(makeMetrics(100))).toBe(100);
  });

  it('returns 0 when all metrics are 0', () => {
    expect(calculateATSScore(makeMetrics(0))).toBe(0);
  });

  it('gives more weight to keyword matching', () => {
    const metrics = makeMetrics(0);
    metrics.keywordMatch = 100;

    expect(calculateATSScore(metrics)).toBe(30);
  });

  it('returns the same result for identical inputs', () => {
    const metrics = makeMetrics(75);

    expect(calculateATSScore(metrics)).toBe(
      calculateATSScore(metrics)
    );
  });
});

describe('Keyword Detection', () => {
  it('detects a keyword present in a resume', () => {
    expect(
      isKeywordPresent('Experienced in Python and React', 'Python')
    ).toBe(true);
  });

  it('ignores uppercase and lowercase differences', () => {
    expect(
      isKeywordPresent('Experience with REACT', 'react')
    ).toBe(true);
  });

  it('returns false for a missing keyword', () => {
    expect(
      isKeywordPresent('Experience with Python', 'Kubernetes')
    ).toBe(false);
  });


  it('does not confuse Java with JavaScript', () => {
    expect(
        isKeywordPresent(
        'Developed applications using JavaScript',
        'Java'
        )
    ).toBe(false);
  });


  it('does not confuse C with C++', () => {
    expect(isKeywordPresent('Experience in C++', 'C')).toBe(false);
  });

  it('recognizes C++ correctly', () => {
    expect(isKeywordPresent('Experience in C++', 'C++')).toBe(true);
  });

  it('recognizes Node.js correctly', () => {
    expect(
        isKeywordPresent('Built APIs using Node.js', 'Node.js')
    ).toBe(true);
  });

  it('recognizes MySQL as evidence of SQL', () => {
    expect(
        isKeywordPresent('Worked with MySQL databases', 'SQL')
    ).toBe(true);
  });

  it('does not assume SQL means MySQL', () => {
    expect(
        isKeywordPresent('Experience writing SQL queries', 'MySQL')
    ).toBe(false);
  });

  it('recognizes PostgreSQL as evidence of SQL', () => {
    expect(
        isKeywordPresent('Used PostgreSQL for data storage', 'SQL')
    ).toBe(true);
  });

  it('does not confuse Java with JavaScript', () => {
    expect(
        isKeywordPresent('Built applications using JavaScript', 'Java')
    ).toBe(false);
  });
});

describe('ATS Score Tiers', () => {
  it('classifies scores of 80 or higher as green', () => {
    expect(getScoreTier(85)).toBe('green');
  });

  it('classifies scores from 60 to 79 as yellow', () => {
    expect(getScoreTier(70)).toBe('yellow');
  });

  it('classifies scores below 60 as red', () => {
    expect(getScoreTier(45)).toBe('red');
  });
});


describe('Keyword Coverage', () => {
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
      importance: 'low',
      requirementType: 'preferred',
    },
  ];

  it('returns 100 when all keywords are present', () => {
    const result = calculateKeywordCoverage(
      'Experienced in Python and React',
      keywords
    );

    expect(result.score).toBe(100);
    expect(result.missing).toHaveLength(0);
  });

  it('returns 0 when all keywords are missing', () => {
    const result = calculateKeywordCoverage(
      'Experience with Java',
      keywords
    );

    expect(result.score).toBe(0);
    expect(result.missing).toHaveLength(2);
  });

  it('gives higher weight to required, high-importance keywords', () => {
    const result = calculateKeywordCoverage(
      'Experience with Python',
      keywords
    );

    // Python: 3 × 1.5 = 4.5
    // React: 1 × 1 = 1
    // Coverage: 4.5 / 5.5 × 100 ≈ 82
    expect(result.score).toBe(82);
  });

  it('identifies the correct missing keyword', () => {
    const result = calculateKeywordCoverage(
      'Experience with Python',
      keywords
    );

    expect(result.missing).toHaveLength(1);
    expect(result.missing[0].keyword).toBe('React');
  });

  it('handles an empty keyword list', () => {
    const result = calculateKeywordCoverage(
      'Experience with Python',
      []
    );

    expect(result.score).toBe(0);
    expect(result.missing).toEqual([]);
  });
});


describe('Experience Relevance', () => {
  const keywords: ATSKeyword[] = [
    {
      keyword: 'Python',
      category: 'technical',
      importance: 'high',
      requirementType: 'required',
    },
  ];

  it('returns 0 when there is no experience or project section', () => {
    const resume = `
      Skills
      Python, JavaScript, HTML
      Education
      Bachelor of Engineering
    `;

    expect(calculateExperienceRelevance(resume, keywords)).toBe(0);
  });

  it('rewards skills demonstrated in project descriptions', () => {
    const resume = `
Projects
- Developed a Python application to analyze datasets.
- Built and deployed a dashboard for visualizing results.
Education
Bachelor of Engineering
`;

    expect(
      calculateExperienceRelevance(resume, keywords)
    ).toBeGreaterThan(0);
  });

  it('does not reward skills listed only in the skills section', () => {
    const resume = `
Skills
Python, JavaScript
Projects
- Developed a web application for student registration.
- Designed a dashboard for managing student records.
Education
Bachelor of Engineering
`;

    expect(calculateExperienceRelevance(resume, keywords)).toBe(0);
  });

  it('returns 0 when no target keywords are provided', () => {
    const resume = `
Projects
- Developed a Python application to analyze datasets.
`;

    expect(calculateExperienceRelevance(resume, [])).toBe(0);
  });
});


describe('Remaining ATS Metrics', () => {
  it('returns 0 for an empty resume', () => {
    expect(calculateFormattingQuality('')).toBe(0);
    expect(calculateSectionCompleteness('')).toBe(0);
    expect(calculateQuantifiedAchievements('')).toBe(0);
    expect(calculateActionVerbQuality('')).toBe(0);
    expect(calculateContactParsing('')).toBe(0);
  });

  it('recognizes all five main resume sections', () => {
    const resume = `
Summary
Software developer
Experience
Software development internship
Education
Bachelor of Engineering
Skills
Python and React
Projects
Web application
`;

    expect(calculateSectionCompleteness(resume)).toBe(100);
  });

  it('recognizes quantified achievements', () => {
    const resume = `
- Improved application performance by 30%.
- Reduced response time by 200 ms.
`;

    expect(calculateQuantifiedAchievements(resume)).toBe(65);
  });

  it('recognizes strong action verbs', () => {
    const resume = `
- Developed a web application using React.
- Implemented authentication and authorization.
`;

    expect(calculateActionVerbQuality(resume)).toBe(100);
  });

  it('recognizes contact details', () => {
    const resume = `
Email: candidate@example.com
Phone: +91 9876543210
LinkedIn: linkedin.com/in/candidate
GitHub: github.com/candidate
`;

    expect(calculateContactParsing(resume)).toBe(100);
  });

  it('keeps formatting scores within the valid range', () => {
    const resume = `
Summary
Software developer with experience building applications.
Experience
- Developed applications using Python.
Education
Bachelor of Engineering
Skills
Python, React, SQL
Projects
- Built a student management application.
`;

    const score = calculateFormattingQuality(resume);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('Readability Scoring', () => {
  it('returns 0 for empty content', () => {
    expect(calculateReadability('')).toBe(0);
  });

  it('does not unfairly penalize technical terminology', () => {
    const resume = `
Implemented authentication and authorization mechanisms.
Integrated asynchronous APIs and database queries.
Optimized application performance and scalability.
`;

    expect(calculateReadability(resume)).toBeGreaterThanOrEqual(70);
  });

  it('penalizes excessively long statements', () => {
    const clearResume = `
Developed a React dashboard.
Built APIs using Python.
Improved application performance.
`;

    const denseResume = `
Developed and maintained a complex application that involved multiple independent modules and several different integrations while coordinating numerous development tasks and implementing additional features across different services without clearly separating the responsibilities or explaining the outcomes of the work completed during the project.
`;

    expect(
      calculateReadability(clearResume)
    ).toBeGreaterThan(
      calculateReadability(denseResume)
    );
  });
});