export const MAX_RESUME_FILE_BYTES = 4 * 1024 * 1024;
export const MAX_JOB_DESCRIPTION_CHARS = 30_000;
// Allow multipart boundaries, metadata, and the optional job description.
export const MAX_DECLARED_REQUEST_BYTES = MAX_RESUME_FILE_BYTES + 256 * 1024;

export type ResumeFileKind = 'pdf' | 'docx';

export interface UploadValidationError {
  status: number;
  code: string;
  message: string;
}

function error(
  status: number,
  code: string,
  message: string
): UploadValidationError {
  return { status, code, message };
}

export function validateDeclaredContentLength(
  header: string | null
): UploadValidationError | null {
  // Some clients use chunked transfer encoding and omit Content-Length.
  // Hosting/platform body-size limits are still required in production.
  if (header === null) return null;

  if (!/^\d+$/.test(header)) {
    return error(400, 'INVALID_CONTENT_LENGTH', 'Invalid upload size header.');
  }

  const size = Number(header);
  if (!Number.isSafeInteger(size)) {
    return error(400, 'INVALID_CONTENT_LENGTH', 'Invalid upload size header.');
  }

  if (size > MAX_DECLARED_REQUEST_BYTES) {
    return error(413, 'REQUEST_TOO_LARGE', 'Upload request is too large.');
  }

  return null;
}

export function validateJobDescription(
  input: unknown
): { value: string } | { error: UploadValidationError } {
  if (input === null || input === undefined) return { value: '' };
  if (typeof input !== 'string') {
    return {
      error: error(400, 'INVALID_JOB_DESCRIPTION', 'Job description must be text.'),
    };
  }

  const value = input.trim();
  if (value.length > MAX_JOB_DESCRIPTION_CHARS) {
    return {
      error: error(
        400,
        'JOB_DESCRIPTION_TOO_LONG',
        'Job description must be 30,000 characters or fewer.'
      ),
    };
  }

  return { value };
}

export function validateResumeFile(
  file: { name: string; type: string; size: number }
): { kind: ResumeFileKind } | { error: UploadValidationError } {
  const name = file.name.trim();
  if (!name || name.length > 255) {
    return {
      error: error(400, 'INVALID_FILENAME', 'Please use a valid resume filename.'),
    };
  }

  const lowerName = name.toLowerCase();
  const kind: ResumeFileKind | null = lowerName.endsWith('.pdf')
    ? 'pdf'
    : lowerName.endsWith('.docx')
      ? 'docx'
      : null;

  if (!kind) {
    return {
      error: error(400, 'UNSUPPORTED_FILE_TYPE', 'Only PDF and DOCX resumes are supported.'),
    };
  }

  if (!Number.isSafeInteger(file.size) || file.size <= 0) {
    return {
      error: error(400, 'EMPTY_RESUME', 'Please upload a non-empty resume.'),
    };
  }

  if (file.size > MAX_RESUME_FILE_BYTES) {
    return {
      error: error(413, 'FILE_TOO_LARGE', 'Resume file exceeds the 4 MB limit.'),
    };
  }

  const mime = file.type.trim().toLowerCase();
  const expectedMime = kind === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  // Browser MIME metadata can be empty or generic, but a conflicting
  // specific MIME type is rejected. The byte signature is checked separately.
  if (mime && mime !== 'application/octet-stream' && mime !== expectedMime) {
    return {
      error: error(400, 'FILE_TYPE_MISMATCH', 'File type does not match its extension.'),
    };
  }

  return { kind };
}

export function hasValidFileSignature(
  bytes: Uint8Array,
  kind: ResumeFileKind
): boolean {
  const expected = kind === 'pdf'
    ? [0x25, 0x50, 0x44, 0x46, 0x2d] // %PDF-
    : [0x50, 0x4b, 0x03, 0x04]; // ZIP local-file header (DOCX container)

  return bytes.length >= expected.length &&
    expected.every((byte, index) => bytes[index] === byte);
}
