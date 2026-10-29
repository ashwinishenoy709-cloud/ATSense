import type {
  AnalysisRequest,
  AnalysisResult,
  ScoreTier,
} from './analysis-types';

export class AnalysisServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'AnalysisServiceError';
  }
}

const knownErrorMessages: Record<string, string> = {
  GEMINI_QUOTA_EXCEEDED:
    'Gemini API quota has been reached. Please wait for the quota to reset or use a project with available quota.',

  GEMINI_RATE_LIMITED:
    'Gemini is receiving too many requests. Please wait a moment and try again.',

  GEMINI_UNAVAILABLE:
    'Gemini is temporarily unavailable. Please try again later.',

  GEMINI_MODEL_UNAVAILABLE:
    'The configured Gemini model is unavailable. Please check the model configuration.',

  GEMINI_NETWORK_ERROR:
    'Could not connect to Gemini. Please check the connection and try again.',
};

function getFallbackErrorMessage(status: number): string {
  if (status === 413) {
    return 'The uploaded resume is too large.';
  }

  if (status === 429) {
    return 'The analysis service is busy or has reached a usage limit. Please try again later.';
  }

  if (status === 502 || status === 503 || status === 504) {
    return 'The analysis service is temporarily unavailable. Please try again later.';
  }

  if (status >= 500) {
    return 'The analysis service encountered an error. Please try again.';
  }

  return 'Resume analysis failed. Please check your input and try again.';
}

function isValidAnalysisResult(
  data: unknown
): data is AnalysisResult {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const result = data as Partial<AnalysisResult>;

  return (
    typeof result.atsScore === 'number' &&
    Number.isFinite(result.atsScore) &&
    typeof result.scoreSummary === 'string' &&
    !!result.metrics &&
    typeof result.metrics === 'object' &&
    !!result.analysisMeta &&
    typeof result.analysisMeta === 'object' &&
    Array.isArray(result.keywordMatches) &&
    Array.isArray(result.missingKeywords) &&
    Array.isArray(result.grammarIssues) &&
    Array.isArray(result.actionableFixes)
  );
}

export async function analyzeResume(
  request: AnalysisRequest
): Promise<AnalysisResult> {
  const formData = new FormData();

  formData.append('file', request.file);

  if (request.jobDescription?.trim()) {
    formData.append(
      'jobDescription',
      request.jobDescription.trim()
    );
  }

  let response: Response;

  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new AnalysisServiceError(
      'Unable to connect to the analysis server. Check your internet connection and try again.',
      'NETWORK_ERROR'
    );
  }

  // Consume the response body only once.
  const data: unknown = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    const payload =
      data && typeof data === 'object'
        ? (data as Record<string, unknown>)
        : null;

    const code =
      typeof payload?.code === 'string'
        ? payload.code
        : `HTTP_${response.status}`;

    const serverMessage =
      typeof payload?.error === 'string'
        ? payload.error.trim()
        : '';

    const message =
      knownErrorMessages[code] ||
      (serverMessage.length > 0 &&
      serverMessage.length <= 300
        ? serverMessage
        : getFallbackErrorMessage(response.status));

    throw new AnalysisServiceError(
      message,
      code,
      response.status
    );
  }

  if (!isValidAnalysisResult(data)) {
    throw new AnalysisServiceError(
      'The analysis server returned incomplete or invalid results. Please try again.',
      'INVALID_RESPONSE',
      response.status
    );
  }

  return data;
}

export function getAnalysisErrorMessage(
  error: unknown
): string {
  if (error instanceof AnalysisServiceError) {
    return error.message;
  }

  return 'An unexpected error occurred during resume analysis. Please try again.';
}

export function getScoreColor(tier: ScoreTier): string {
  switch (tier) {
    case 'green':
      return 'hsl(var(--success))';

    case 'yellow':
      return 'hsl(var(--warning))';

    case 'red':
      return 'hsl(var(--destructive))';
  }
}
