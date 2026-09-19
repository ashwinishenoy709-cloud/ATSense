import type { AnalysisRequest, AnalysisResult, ScoreTier } from './analysis-types';

export async function analyzeResume(
  request: AnalysisRequest
): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', request.file);

  if (request.jobDescription?.trim()) {
    formData.append('jobDescription', request.jobDescription.trim());
  }

  const response = await fetch('/api/analyze', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Analysis request failed.');
  }

  return data as AnalysisResult;
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
