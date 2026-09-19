# Resume Pulse AI / ATSense

A Next.js single-page AI resume analyzer and ATS compatibility simulator. The app parses an uploaded PDF or DOCX resume, optionally compares it with a target job description, calculates ATS-style metrics from the actual extracted text, and uses Google Gemini for grounded keyword extraction, grammar/tone review, and actionable suggestions.

## What changed in this version

- Removed all preset analysis fixtures and hard-coded result sources.
- Removed generator-specific project metadata.
- Migrated Gemini calls from the legacy `@google/generative-ai` package to `@google/genai`.
- Uses the Gemini Interactions API with structured JSON output.
- Sets `store: false` for the Gemini interaction so the app does not request server-side interaction storage.
- PDF text is parsed with `pdf-parse`; DOCX text is parsed with `mammoth`.
- ATS score is calculated by the server from the uploaded resume rather than being generated as a preset number.
- Missing keywords are verified against the extracted resume text before they are displayed.
- AI rewrites are instructed not to invent metrics, experience, employers, skills, certifications, or achievements.
- Added live-analysis metadata in the UI so you can see the uploaded filename, analysis mode, and Gemini model that actually ran.

## How the score works

When a job description is supplied, the overall ATS compatibility score uses:

- 50% weighted keyword coverage
- 25% ATS parsing/formatting quality
- 15% section completeness
- 10% readability

Without a job description, the app uses a conservative role benchmark inferred from the resume and weights:

- 25% benchmark keyword coverage
- 35% ATS parsing/formatting quality
- 25% section completeness
- 15% readability

This is an ATS compatibility estimate, not a score from a specific employer's Applicant Tracking System.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in the project root. You can copy `.env.example` and then insert your private Gemini API key:

```env
GEMINI_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-3.6-flash
```

`GEMINI_MODEL` is optional. The server also includes fallback Flash models if the configured model is unavailable.

3. Run the app:

```bash
npm run dev
```

4. Open `http://localhost:3000`, upload a text-based PDF or DOCX resume, optionally paste a target job description, and choose **Analyze Resume**.

## Verification

Useful checks before committing or deploying:

```bash
npm run typecheck
npm run lint
```

To verify that results are live rather than preset, analyze two substantially different resumes or use the same resume against two very different job descriptions. The keyword coverage, missing terms, suggestions, and overall score should change because they are derived from the uploaded content.

## Privacy and API key safety

- Keep `.env.local` private; it is ignored by Git.
- Never prefix the Gemini key with `NEXT_PUBLIC_` because that would expose it to browser JavaScript.
- The API call is made from `app/api/analyze/route.ts`, not directly from the client.
- The Gemini Interactions request is configured with `store: false`.

## Current file support

- PDF: text-based PDF files
- DOCX: Microsoft Word `.docx`

Scanned/image-only PDFs need OCR before this app can analyze them accurately.
