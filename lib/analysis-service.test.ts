
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  analyzeResume,
  AnalysisServiceError,
  getAnalysisErrorMessage,
} from './analysis-service';

const file = new File(
  ['Sample resume content'],
  'resume.pdf',
  { type: 'application/pdf' }
);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Analysis API Error Handling', () => {
  it('preserves API error messages and codes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: 'Resume text could not be extracted.',
            code: 'EXTRACTION_FAILED',
          }),
          {
            status: 422,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      )
    );

    await expect(
      analyzeResume({ file })
    ).rejects.toMatchObject({
      message: 'Resume text could not be extracted.',
      code: 'EXTRACTION_FAILED',
      status: 422,
    });
  });

  it('handles Gemini quota errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: 'Quota exceeded',
            code: 'GEMINI_QUOTA_EXCEEDED',
          }),
          { status: 429 }
        )
      )
    );

    await expect(
      analyzeResume({ file })
    ).rejects.toMatchObject({
      code: 'GEMINI_QUOTA_EXCEEDED',
      status: 429,
    });
  });

  it('handles non-JSON server errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('Bad Gateway', {
          status: 502,
        })
      )
    );

    await expect(
      analyzeResume({ file })
    ).rejects.toMatchObject({
      code: 'HTTP_502',
      status: 502,
    });
  });

  it('handles network failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(
        new TypeError('Failed to fetch')
      )
    );

    await expect(
      analyzeResume({ file })
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('rejects invalid successful responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ success: true }),
          { status: 200 }
        )
      )
    );

    await expect(
      analyzeResume({ file })
    ).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('provides a safe message for unexpected errors', () => {
    const message = getAnalysisErrorMessage(
      new Error('Internal implementation details')
    );

    expect(message).toContain(
      'An unexpected error occurred'
    );

    const knownError = new AnalysisServiceError(
      'Please try again later.',
      'TEST_ERROR',
      503
    );

    expect(
      getAnalysisErrorMessage(knownError)
    ).toBe('Please try again later.');
  });
});
