declare module 'pdf-parse' {
  const pdfParse: (data: Buffer | Uint8Array) => Promise<{
    text: string;
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }>;
  export default pdfParse;
}

declare module 'mammoth' {
  export function extractRawText(input: {
    buffer: Buffer | Uint8Array;
  }): Promise<{
    value: string;
    messages: Array<Record<string, unknown>>;
  }>;
}
