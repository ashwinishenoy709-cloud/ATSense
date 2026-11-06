import { describe, expect, it } from 'vitest';
import {
  parseBoundedFormData,
  RequestBodyTooLargeError,
} from './request-body';

function createMultipartRequest(fileText = '%PDF-1.4\nSample PDF content') {
  const data = new FormData();
  data.append(
    'file',
    new Blob([fileText], { type: 'application/pdf' }),
    'resume.pdf'
  );
  data.append('jobDescription', 'React and TypeScript required');

  return new Request('http://localhost/api/analyze', {
    method: 'POST',
    body: data,
  });
}

describe('Bounded multipart request parsing', () => {
  it('reads a valid multipart upload and preserves its fields', async () => {
    const form = await parseBoundedFormData(createMultipartRequest(), 100_000);
    const file = form.get('file');

    expect(file).not.toBeNull();
    expect(typeof file).not.toBe('string');
    if (file && typeof file !== 'string') {
      expect(file.name).toBe('resume.pdf');
      expect(await file.text()).toContain('%PDF-1.4');
    }
    expect(form.get('jobDescription')).toBe('React and TypeScript required');
  });

  it('rejects an oversized body even without a Content-Length header', async () => {
    const request = createMultipartRequest('a'.repeat(2_000));
    expect(request.headers.get('content-length')).toBeNull();

    await expect(parseBoundedFormData(request, 500)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError
    );
  });

  it('rejects an invalid maximum size', async () => {
    await expect(parseBoundedFormData(createMultipartRequest(), 0))
      .rejects.toBeInstanceOf(RangeError);
  });

  it('does not accept malformed multipart content', async () => {
    const request = new Request('http://localhost/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data; boundary=missing' },
      body: 'not a multipart form',
    });

    await expect(parseBoundedFormData(request, 100_000)).rejects.toThrow();
  });
});
