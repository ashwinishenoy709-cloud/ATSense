import { describe, expect, it } from 'vitest';
import {
  hasValidFileSignature,
  MAX_DECLARED_REQUEST_BYTES,
  MAX_RESUME_FILE_BYTES,
  validateDeclaredContentLength,
  validateJobDescription,
  validateResumeFile,
} from './upload-validation';

const pdf = { name: 'resume.pdf', type: 'application/pdf', size: 500 };
const docx = {
  name: 'resume.docx',
  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  size: 500,
};

describe('Resume upload metadata', () => {
  it('accepts a valid PDF', () => {
    expect(validateResumeFile(pdf)).toEqual({ kind: 'pdf' });
  });

  it('accepts a valid DOCX', () => {
    expect(validateResumeFile(docx)).toEqual({ kind: 'docx' });
  });

  it('allows missing browser MIME metadata', () => {
    expect(validateResumeFile({ ...pdf, type: '' })).toEqual({ kind: 'pdf' });
  });

  it('rejects unsupported extensions', () => {
    expect(validateResumeFile({ ...pdf, name: 'resume.txt' })).toMatchObject({
      error: { code: 'UNSUPPORTED_FILE_TYPE' },
    });
  });

  it('rejects mismatched MIME metadata', () => {
    expect(validateResumeFile({ ...pdf, type: docx.type })).toMatchObject({
      error: { code: 'FILE_TYPE_MISMATCH' },
    });
  });

  it('rejects empty resumes', () => {
    expect(validateResumeFile({ ...pdf, size: 0 })).toMatchObject({
      error: { code: 'EMPTY_RESUME' },
    });
  });

  it('rejects oversized resumes', () => {
    expect(validateResumeFile({ ...pdf, size: MAX_RESUME_FILE_BYTES + 1 })).toMatchObject({
      error: { status: 413, code: 'FILE_TOO_LARGE' },
    });
  });

  it('rejects excessively long filenames', () => {
    expect(validateResumeFile({ ...pdf, name: `${'a'.repeat(256)}.pdf` })).toMatchObject({
      error: { code: 'INVALID_FILENAME' },
    });
  });
});

describe('File signature checks', () => {
  it('recognizes a PDF header', () => {
    expect(hasValidFileSignature(new Uint8Array([37, 80, 68, 70, 45, 49]), 'pdf')).toBe(true);
  });

  it('recognizes a DOCX ZIP container header', () => {
    expect(hasValidFileSignature(new Uint8Array([80, 75, 3, 4, 20, 0]), 'docx')).toBe(true);
  });

  it('rejects text pretending to be a PDF', () => {
    expect(hasValidFileSignature(new TextEncoder().encode('not a pdf'), 'pdf')).toBe(false);
  });

  it('rejects a ZIP pretending to be a PDF', () => {
    expect(hasValidFileSignature(new Uint8Array([80, 75, 3, 4]), 'pdf')).toBe(false);
  });

  it('rejects a PDF pretending to be a DOCX', () => {
    expect(hasValidFileSignature(new Uint8Array([37, 80, 68, 70, 45]), 'docx')).toBe(false);
  });
});

describe('Request size and job description checks', () => {
  it('allows missing Content-Length for chunked requests', () => {
    expect(validateDeclaredContentLength(null)).toBeNull();
  });

  it('accepts a request within the declared size limit', () => {
    expect(validateDeclaredContentLength('2048')).toBeNull();
  });

  it('rejects oversized declared request bodies', () => {
    expect(validateDeclaredContentLength(String(MAX_DECLARED_REQUEST_BYTES + 1)))
      .toMatchObject({ status: 413, code: 'REQUEST_TOO_LARGE' });
  });

  it('rejects invalid declared Content-Length', () => {
    expect(validateDeclaredContentLength('not-a-number'))
      .toMatchObject({ code: 'INVALID_CONTENT_LENGTH' });
  });

  it('accepts an omitted job description', () => {
    expect(validateJobDescription(null)).toEqual({ value: '' });
  });

  it('trims a valid job description', () => {
    expect(validateJobDescription('  Python required  ')).toEqual({ value: 'Python required' });
  });

  it('rejects non-text job descriptions', () => {
    expect(validateJobDescription({ value: 'not text' }))
      .toMatchObject({ error: { code: 'INVALID_JOB_DESCRIPTION' } });
  });

  it('rejects oversized job descriptions without silently truncating', () => {
    expect(validateJobDescription('a'.repeat(30_001)))
      .toMatchObject({ error: { code: 'JOB_DESCRIPTION_TOO_LONG' } });
  });
});
