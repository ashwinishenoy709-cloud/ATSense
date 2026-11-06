/**
 * Read a multipart request with an actual byte limit, including when a client
 * omits or misstates Content-Length. This is not a replacement for the
 * hosting platform's own request-size limits.
 */
export class RequestBodyTooLargeError extends Error {
  constructor() {
    super('Upload request is too large.');
    this.name = 'RequestBodyTooLargeError';
  }
}

export async function parseBoundedFormData(
  request: Request,
  maxBytes: number
): Promise<FormData> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new RangeError('A positive maximum request size is required.');
  }

  if (!request.body) {
    throw new TypeError('Upload request has no body.');
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // The request is already rejected; cancellation is best-effort.
        }
        throw new RequestBodyTooLargeError();
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  // Preserve the original multipart boundary, but not untrusted metadata such
  // as Content-Length. The new Request owns only the already-bounded bytes.
  const parserRequest = new Request(request.url, {
    method: 'POST',
    headers: {
      'content-type': request.headers.get('content-type') ?? '',
    },
    body: bytes,
  });

  return parserRequest.formData();
}
