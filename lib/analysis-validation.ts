import { isKeywordPresent } from './ats-scoring';
import type { KeywordMatchStatus } from './analysis-types';

export function isGroundedResumeExcerpt(
  resumeText: string,
  excerpt: string
): boolean {
  const normalizeWhitespace = (text: string) =>
    text.replace(/\s+/g, ' ').trim().toLowerCase();

  const normalizedResume = normalizeWhitespace(resumeText);
  const normalizedExcerpt = normalizeWhitespace(excerpt);

  if (normalizedExcerpt.length < 8) return false;

  let startIndex = normalizedResume.indexOf(normalizedExcerpt);

  while (startIndex !== -1) {
    const endIndex = startIndex + normalizedExcerpt.length;

    const before = normalizedResume[startIndex - 1] ?? '';
    const after = normalizedResume[endIndex] ?? '';

    const isWordCharacter = (char: string) =>
      /[a-z0-9]/.test(char);

    const validStart =
      !isWordCharacter(before) ||
      !isWordCharacter(normalizedExcerpt[0]);

    const validEnd =
      !isWordCharacter(after) ||
      !isWordCharacter(normalizedExcerpt.at(-1) ?? '');

    const cutsOffPercentage =
      after === '%' && /\d$/.test(normalizedExcerpt);

    if (validStart && validEnd && !cutsOffPercentage) return true;

    startIndex = normalizedResume.indexOf(
      normalizedExcerpt,
      startIndex + 1
    );
  }
  return false;
}

export function isSupportedGrammarExplanation(issue: {
  original: string;
  suggestion: string;
  explanation: string;
}): boolean {
  const original = issue.original.trim();
  const suggestion = issue.suggestion.trim();
  const explanation = issue.explanation.toLowerCase();

  // Reject suggestions that do not change anything.
  if (
    !original ||
    !suggestion ||
    original.replace(/\s+/g, ' ') ===
      suggestion.replace(/\s+/g, ' ')
  ) {
    return false;
  }

  // Detect explanations claiming to remove
  // first-person pronouns.
  const mentionsPronouns =
    /\b(first[- ]person|personal pronouns?)\b/i.test(
      explanation
    );

  const claimsRemoval =
    /\b(remov\w*|eliminat\w*|avoid\w*|replac\w*)\b/i.test(
      explanation
    );

  if (mentionsPronouns && claimsRemoval) {
    const firstPersonPronouns =
      /\b(i|me|my|mine|we|us|our|ours)\b/i;

    // The original must contain first-person pronouns.
    if (!firstPersonPronouns.test(original)) return false;
    // The suggested rewrite must remove them.
    if (firstPersonPronouns.test(suggestion)) return false;
  }

  return true;
}

export type KeywordRequirementType = 'required' | 'preferred';

export function classifyKeywordRequirement(
  jobDescription: string,
  keyword: string
): KeywordRequirementType {
  const trimmedKeyword = keyword.trim();

  if (!trimmedKeyword || !jobDescription.trim()) {
    return 'preferred';
  }

  const escapedKeyword = trimmedKeyword
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');

  const keywordPattern = new RegExp(
    `(^|[^a-z0-9+#.])${escapedKeyword}(?=$|[^a-z0-9+#.])`,
    'i'
  );

  const preferredHeading =
    /^(?:preferred(?:\s+(?:qualifications|skills|experience))?|nice[\s-]+to[\s-]+have(?:\s+skills)?|bonus(?:\s+skills)?|desirable(?:\s+skills)?)(?:\s*:\s*(.*))?$/i;

  const requiredHeading =
    /^(?:requirements?|required(?:\s+(?:qualifications|skills|experience))?|minimum(?:\s+qualifications)?|must[\s-]+have(?:\s+skills)?|qualifications|essential(?:\s+skills)?)(?:\s*:\s*(.*))?$/i;

  const otherHeading =
    /^(?:responsibilities|about(?:\s+us|\s+the\s+role)?|benefits|what\s+we\s+offer|company\s+overview)\s*:?\s*$/i;

  let currentSection: KeywordRequirementType | null = null;
  let foundRequired = false;

  for (const rawLine of jobDescription.split(/\r?\n/)) {
    let line = rawLine.trim();

    if (!line) continue;

    line = line.replace(/^#{1,6}\s*/, '');

    const preferredMatch = line.match(preferredHeading);
    const requiredMatch = line.match(requiredHeading);

    if (preferredMatch) {
      currentSection = 'preferred';
      line = preferredMatch[1] ?? '';
    } else if (requiredMatch) {
      currentSection = 'required';
      line = requiredMatch[1] ?? '';
    } else if (otherHeading.test(line)) {
      currentSection = null;
      continue;
    }

    if (!keywordPattern.test(line)) {
      continue;
    }

    const explicitlyPreferred =
      /\b(preferred|optional|desirable|bonus|nice[\s-]+to[\s-]+have)\b/i.test(
        line
      );

    const explicitlyRequired =
      /\b(required|mandatory|essential|must[\s-]+have|must\s+possess|should\s+have)\b/i.test(
        line
      );

    const classification = explicitlyPreferred
      ? 'preferred'
      : explicitlyRequired
        ? 'required'
        : currentSection ?? 'preferred';

    if (classification === 'required') {
      foundRequired = true;
    }
  }

  return foundRequired ? 'required' : 'preferred';
}

export function getKeywordMatchStatus(
  resumeText: string,
  keyword: string
): KeywordMatchStatus {
  const trimmedKeyword = keyword.trim();

  if (!trimmedKeyword) {
    return 'missing';
  }

  const escapedKeyword = trimmedKeyword
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');

  const exactPattern = new RegExp(
    `(^|[^a-z0-9+#.])${escapedKeyword}(?=$|\\.(?=\\s|$)|[^a-z0-9+#.])`,
    'i'
  );

  if (exactPattern.test(resumeText)) return 'exact';

  if (isKeywordPresent(resumeText, trimmedKeyword)) return 'related';
  return 'missing';
}
