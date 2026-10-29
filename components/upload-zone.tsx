'use client';

import * as React from 'react';
import {
  UploadCloud,
  FileText,
  X,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onAnalyze: (file: File, jobDescription: string) => void;
  isAnalyzing: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_JOB_DESCRIPTION = 30000;

const PDF_MIME = 'application/pdf';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileError(file: File): string | null {
  if (file.size === 0) {
    return 'This file is empty. Please select a valid resume.';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'Your resume exceeds the 10 MB limit. Please upload a smaller file.';
  }

  const extension = file.name.toLowerCase();

  const isPdf = extension.endsWith('.pdf');
  const isDocx = extension.endsWith('.docx');

  if (!isPdf && !isDocx) {
    return 'Unsupported file format. Please upload a PDF or DOCX resume.';
  }

  // Some browsers leave the MIME type empty.
  // Allow those files to proceed based on their extension.
  const allowedMime =
    file.type === '' ||
    file.type === 'application/octet-stream' ||
    (isPdf && file.type === PDF_MIME) ||
    (isDocx && file.type === DOCX_MIME);

  if (!allowedMime) {
    return 'The file format does not match its extension. Please select a valid PDF or DOCX.';
  }

  return null;
}

export function UploadZone({
  onAnalyze,
  isAnalyzing,
}: UploadZoneProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [jobDescription, setJobDescription] = React.useState('');
  const [isDragging, setIsDragging] = React.useState(false);
  const [fileError, setFileError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dragCounter = React.useRef(0);

  const { toast } = useToast();

  const openFilePicker = () => {
    if (isAnalyzing) return;

    fileInputRef.current?.click();
  };

  const handleFileSelect = (selectedFile: File) => {
    if (isAnalyzing) return;

    const error = getFileError(selectedFile);

    if (error) {
      setFileError(error);

      toast({
        title: 'Unable to upload resume',
        description: error,
        variant: 'destructive',
      });

      return;
    }

    setFile(selectedFile);
    setFileError(null);
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      handleFileSelect(selectedFile);
    }

    // Allows selecting the same file again.
    event.target.value = '';
  };

  const handleDragEnter = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    if (isAnalyzing) return;

    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    event.dataTransfer.dropEffect = isAnalyzing
      ? 'none'
      : 'copy';
  };

  const handleDragLeave = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    dragCounter.current = Math.max(
      0,
      dragCounter.current - 1
    );

    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    dragCounter.current = 0;
    setIsDragging(false);

    if (isAnalyzing) return;

    const selectedFile = event.dataTransfer.files?.[0];

    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const removeFile = () => {
    if (isAnalyzing) return;

    setFile(null);
    setFileError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = () => {
    if (!file || isAnalyzing) return;

    setFileError(null);
    onAnalyze(file, jobDescription);
  };

  const fileFormat = file
    ? file.name.toLowerCase().endsWith('.pdf')
      ? 'PDF Document'
      : 'Word Document'
    : '';

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileInputChange}
        disabled={isAnalyzing}
        className="sr-only"
        tabIndex={-1}
        aria-label="Select resume file"
      />

      {/* Upload area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-busy={isAnalyzing}
        className={cn(
          'relative overflow-hidden rounded-xl border-2 transition-all duration-200',
          isDragging && !isAnalyzing
            ? 'border-accent border-dashed bg-accent/10 ring-4 ring-accent/10'
            : file
              ? 'border-border bg-card'
              : 'border-dashed border-border bg-muted/20 hover:border-accent/50 hover:bg-accent/5',
          isAnalyzing && 'opacity-80'
        )}
      >
        {!file ? (
          <button
            type="button"
            onClick={openFilePicker}
            disabled={isAnalyzing}
            className={cn(
              'flex min-h-[210px] w-full flex-col items-center justify-center px-5 py-8 text-center',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent',
              'disabled:cursor-not-allowed',
              'sm:min-h-[230px]',
              isDragging && 'bg-accent/5'
            )}
          >
            <div
              className={cn(
                'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all',
                isDragging
                  ? 'scale-105 bg-accent/20'
                  : 'bg-accent/10'
              )}
            >
              <UploadCloud
                className={cn(
                  'h-8 w-8 text-accent transition-transform',
                  isDragging && 'scale-110'
                )}
                aria-hidden="true"
              />
            </div>

            <p className="text-sm font-semibold text-foreground sm:text-base">
              {isDragging
                ? 'Drop your resume here'
                : 'Upload your resume'}
            </p>

            <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Drag and drop your file here, or click to browse
              your device.
            </p>

            <span className="mt-5 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-foreground">
              Browse Files
            </span>

            <p className="mt-4 text-xs text-muted-foreground">
              PDF or DOCX · Maximum 10 MB
            </p>
          </button>
        ) : (
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* File icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <FileText
                  className="h-6 w-6 text-accent"
                  aria-hidden="true"
                />
              </div>

              {/* File details */}
              <div className="min-w-0 flex-1 space-y-1">
                <p
                  className="truncate text-sm font-semibold text-foreground"
                  title={file.name}
                >
                  {file.name}
                </p>

                <p className="text-xs text-muted-foreground">
                  {fileFormat} · {formatFileSize(file.size)}
                </p>

                <div className="flex items-center gap-1.5 pt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  <span>File selected</span>
                </div>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={removeFile}
                disabled={isAnalyzing}
                aria-label="Remove selected resume"
                title="Remove resume"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* Replace file */}
            <div className="mt-4 border-t border-border/60 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openFilePicker}
                disabled={isAnalyzing}
                className="w-full gap-2 sm:w-auto"
              >
                <RefreshCw
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
                Replace File
              </Button>
            </div>

            {isDragging && !isAnalyzing && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/90 text-sm font-semibold text-accent">
                Drop to replace resume
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inline upload errors */}
      {fileError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <p>{fileError}</p>
        </div>
      )}

      {/* Job description */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="job-description"
            className="text-sm font-medium text-foreground"
          >
            Target Job Description
            <span className="ml-1 font-normal text-muted-foreground">
              (Optional)
            </span>
          </label>

          <span className="text-xs text-muted-foreground">
            {jobDescription.length.toLocaleString()} / 30,000
          </span>
        </div>

        <Textarea
          id="job-description"
          value={jobDescription}
          onChange={(event) =>
            setJobDescription(
              event.target.value.slice(
                0,
                MAX_JOB_DESCRIPTION
              )
            )
          }
          maxLength={MAX_JOB_DESCRIPTION}
          disabled={isAnalyzing}
          placeholder="Paste the job description here to compare your resume against a specific role..."
          className="min-h-[140px] resize-y text-sm leading-relaxed"
          aria-describedby="job-description-help"
        />

        <p
          id="job-description-help"
          className="text-xs leading-relaxed text-muted-foreground"
        >
          Add a job description for targeted keyword matching,
          or leave this blank for a general resume analysis.
        </p>
      </div>

      {/* Analyze button */}
      <div className="space-y-3">
        <Button
          type="button"
          onClick={handleAnalyze}
          disabled={!file || isAnalyzing}
          aria-busy={isAnalyzing}
          className="h-12 w-full bg-gradient-to-r from-primary to-accent text-sm font-semibold shadow-md transition-all hover:shadow-lg disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Analyzing Resume...
            </>
          ) : (
            <>
              <Sparkles
                className="mr-2 h-4 w-4"
                aria-hidden="true"
              />
              Analyze Resume
            </>
          )}
        </Button>

        <p
          className="text-center text-xs leading-relaxed text-muted-foreground"
          aria-live="polite"
        >
          {!file
            ? 'Select a PDF or DOCX resume to begin.'
            : isAnalyzing
              ? 'Please wait while your resume is being analyzed.'
              : 'Your resume will be analyzed using live processing, not preset sample scores.'}
        </p>
      </div>
    </div>
  );
}
