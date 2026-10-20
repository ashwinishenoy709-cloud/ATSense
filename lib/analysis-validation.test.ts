import { describe, expect, it } from 'vitest';
import {
  isGroundedResumeExcerpt,
  isSupportedGrammarExplanation,
  classifyKeywordRequirement,
  getKeywordMatchStatus,
} from './analysis-validation';

describe('Grammar Excerpt Validation', () => {
  it('accepts an exact resume excerpt', () => {
    expect(
      isGroundedResumeExcerpt(
        'Developed a React application.',
        'Developed a React application.'
      )
    ).toBe(true);
  });

  it('allows line breaks and spacing differences', () => {
    expect(
      isGroundedResumeExcerpt(
        'Developed a React\napplication.',
        'Developed a React application.'
      )
    ).toBe(true);
  });

  it('rejects text that is not in the resume', () => {
    expect(
      isGroundedResumeExcerpt(
        'Developed a React application.',
        'Managed a team of developers.'
      )
    ).toBe(false);
  });

  it('does not ignore changed punctuation', () => {
    expect(
      isGroundedResumeExcerpt(
        'Improved performance by 20%.',
        'Improved performance by 20'
      )
    ).toBe(false);
  });

  it('rejects empty excerpts', () => {
    expect(
      isGroundedResumeExcerpt(
        'Developed a React application.',
        ''
      )
    ).toBe(false);
  });
});

describe('Grammar Explanation Validation', () => {
  it('accepts a meaningful rewrite', () => {
    expect(
      isSupportedGrammarExplanation({
        original: 'Responsible for developing websites.',
        suggestion: 'Developed websites.',
        explanation: 'Uses a stronger action verb.',
      })
    ).toBe(true);
  });

  it('rejects unchanged suggestions', () => {
    expect(
      isSupportedGrammarExplanation({
        original: 'Developed websites.',
        suggestion: 'Developed websites.',
        explanation: 'Improves clarity.',
      })
    ).toBe(false);
  });

  it('rejects false pronoun removal claims', () => {
    expect(
      isSupportedGrammarExplanation({
        original: 'Developed a React application.',
        suggestion: 'Built a React application.',
        explanation: 'Removed first-person pronouns.',
      })
    ).toBe(false);
  });

  it('accepts actual first-person pronoun removal', () => {
    expect(
      isSupportedGrammarExplanation({
        original: 'I developed a React application.',
        suggestion: 'Developed a React application.',
        explanation: 'Removed first-person pronouns.',
      })
    ).toBe(true);
  });

  it('rejects incomplete pronoun removal', () => {
    expect(
      isSupportedGrammarExplanation({
        original: 'I developed my application.',
        suggestion: 'I built the application.',
        explanation: 'Removed first-person pronouns.',
      })
    ).toBe(false);
  });
});

describe('Keyword Requirement Classification', () => {
  const jd = `
Requirements:
- Python
- SQL
- Git

Preferred Qualifications:
- Docker
- AWS
`;

  it('classifies required skills correctly', () => {
    expect(classifyKeywordRequirement(jd, 'Python')).toBe('required');
    expect(classifyKeywordRequirement(jd, 'SQL')).toBe('required');
    expect(classifyKeywordRequirement(jd, 'Git')).toBe('required');
  });

  it('classifies preferred skills correctly', () => {
    expect(classifyKeywordRequirement(jd, 'Docker')).toBe('preferred');
    expect(classifyKeywordRequirement(jd, 'AWS')).toBe('preferred');
  });

  it('defaults ambiguous skills to preferred', () => {
    expect(
      classifyKeywordRequirement('We use Python and Git.', 'Python')
    ).toBe('preferred');
  });

  it('handles inline required wording', () => {
    expect(
      classifyKeywordRequirement('Python is required.', 'Python')
    ).toBe('required');
  });

  it('does not confuse Java with JavaScript', () => {
    expect(
      classifyKeywordRequirement(
        'Requirements:\n- JavaScript',
        'Java'
      )
    ).toBe('preferred');
  });
});

describe('Keyword Match Status', () => {
  it('detects an exact match', () => {
    expect(
      getKeywordMatchStatus('Skills: Python, React', 'Python')
    ).toBe('exact');
  });

  it('detects SQL as a related skill from MySQL', () => {
    expect(
      getKeywordMatchStatus('Skills: MySQL', 'SQL')
    ).toBe('related');
  });

  it('does not confuse Java with JavaScript', () => {
    expect(
      getKeywordMatchStatus('Skills: JavaScript', 'Java')
    ).toBe('missing');
  });

  it('detects missing skills', () => {
    expect(
      getKeywordMatchStatus('Skills: Python', 'Docker')
    ).toBe('missing');
  });

  it('rejects an empty keyword', () => {
    expect(
      getKeywordMatchStatus('Skills: Python', '')
    ).toBe('missing');
  });
});
