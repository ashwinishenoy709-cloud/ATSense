import { describe, expect, it } from 'vitest';
import {
  GEMINI_REQUEST_TIMEOUT_MS,
  GEMINI_TOTAL_TIMEOUT_MS,
  GeminiAnalysisTimeoutError,
  getGeminiRequestTimeoutMs,
  isGeminiTimeoutError,
} from './gemini-timeout';

describe('Gemini request timeout budget', () => {
  it('caps a request at the per-request limit', () => {
    expect(getGeminiRequestTimeoutMs(100_000, 0)).toBe(GEMINI_REQUEST_TIMEOUT_MS);
  });

  it('uses the remaining budget when less than the request cap', () => {
    expect(getGeminiRequestTimeoutMs(20_000, 0)).toBe(20_000);
  });

  it('rejects an exhausted deadline instead of starting another request', () => {
    expect(() => getGeminiRequestTimeoutMs(900, 0))
      .toThrow(GeminiAnalysisTimeoutError);
  });

  it('keeps the total budget below the server execution limit', () => {
    expect(GEMINI_TOTAL_TIMEOUT_MS).toBeLessThan(60_000);
  });

  it('recognizes SDK timeout errors', () => {
    const error = new Error('The request timed out.');
    error.name = 'RequestTimeoutError';
    expect(isGeminiTimeoutError(error)).toBe(true);
  });

  it('does not misclassify quota or model errors as timeouts', () => {
    expect(isGeminiTimeoutError(new Error('429 quota exceeded'))).toBe(false);
    expect(isGeminiTimeoutError(new Error('404 model not found'))).toBe(false);
  });
});
