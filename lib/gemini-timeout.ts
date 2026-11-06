/**
 * Keep Gemini calls inside the server's 60-second execution budget.
 * These are per-analysis and per-request limits, not browser timers.
 */
export const GEMINI_TOTAL_TIMEOUT_MS = 45_000;
export const GEMINI_REQUEST_TIMEOUT_MS = 35_000;
export const GEMINI_MIN_REQUEST_TIMEOUT_MS = 1_000;

export class GeminiAnalysisTimeoutError extends Error {
  constructor() {
    super('Gemini analysis timed out.');
    this.name = 'GeminiAnalysisTimeoutError';
  }
}

/**
 * Limit each SDK request without extending the overall analysis deadline.
 * Call this again on each retry or model fallback.
 */
export function getGeminiRequestTimeoutMs(
  deadlineMs: number,
  nowMs: number = Date.now()
): number {
  const remainingMs = Math.floor(deadlineMs - nowMs);
  if (remainingMs < GEMINI_MIN_REQUEST_TIMEOUT_MS) {
    throw new GeminiAnalysisTimeoutError();
  }

  return Math.min(GEMINI_REQUEST_TIMEOUT_MS, remainingMs);
}

/**
 * The @google/genai interactions client uses RequestTimeoutError when its
 * timeout_ms option expires. Treat upstream gateway timeouts similarly.
 */
export function isGeminiTimeoutError(error: unknown): boolean {
  if (error instanceof GeminiAnalysisTimeoutError) return true;
  if (!(error instanceof Error)) return false;

  return (
    error.name === 'RequestTimeoutError' ||
    error.name === 'TimeoutError' ||
    /\b(?:timed out|timeout)\b/i.test(error.message)
  );
}
