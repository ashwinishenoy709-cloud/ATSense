'use client';

import * as React from 'react';
import {
  UploadCloud,
  FileText,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onAnalyze: (file: File, jobDescription: string) => void;
  isAnalyzing: boolean;
}

export function UploadZone({ onAnalyze, isAnalyzing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [jobDescription, setJobDescription] = React.useState('');
  const { toast } = useToast();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validateFile = (f: File): boolean => {
    if (f.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a resume smaller than 10 MB.',
        variant: 'destructive',
      });
      return false;
    }

    const isPdf = f.type === 'application/pdf';
    const isDocx =
      f.name.toLowerCase().endsWith('.docx') ||
      f.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (!isPdf && !isDocx) {
      toast({
        title: 'Invalid file format',
        description: 'Please upload a PDF or DOCX file.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleFileSelect = (f: File) => {
    if (validateFile(f)) {
      setFile(f);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = () => {
    if (!file) return;
    onAnalyze(file, jobDescription);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !file && fileInputRef.current?.click()}
        className={cn(
          'relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200',
          isDragging
            ? 'border-accent bg-accent/5 scale-[1.01]'
            : 'border-border hover:border-accent/40 hover:bg-accent/5',
          file && 'cursor-default border-solid'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {!file ? (
          <>
            <div
              className={cn(
                'mb-4 flex h-14 w-14 items-center justify-center rounded-full transition-colors',
                isDragging ? 'bg-accent/15' : 'bg-muted'
              )}
            >
              <UploadCloud
                className={cn(
                  'h-7 w-7 transition-colors',
                  isDragging ? 'text-accent' : 'text-muted-foreground'
                )}
              />
            </div>
            <p className="text-sm font-medium text-foreground">
              Drag & drop your resume here
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              or click to browse — PDF or DOCX only
            </p>
          </>
        ) : (
          <div className="flex w-full items-center gap-3 rounded-lg bg-muted/50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-foreground">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Job description textarea */}
      <div className="space-y-2">
        <label
          htmlFor="job-description"
          className="text-sm font-medium text-foreground"
        >
          Target Job Description{' '}
          <span className="text-muted-foreground">(Optional)</span>
        </label>
        <Textarea
          id="job-description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value.slice(0, 30000))}
          maxLength={30000}
          placeholder="Paste the job description here for a more targeted ATS analysis. e.g., We are seeking a Senior Full-Stack Developer with expertise in React, Node.js, Kubernetes, and microservices architecture..."
          className="min-h-[120px] resize-none"
        />
        <div className="flex justify-end">
          <span className="text-xs text-muted-foreground">
            {jobDescription.length.toLocaleString()} / 30,000 characters
          </span>
        </div>
      </div>

      {/* Analyze button */}
      <div className="space-y-2">
        <Button
          onClick={handleAnalyze}
          disabled={!file || isAnalyzing}
          className="h-12 w-full bg-gradient-to-r from-primary to-accent text-sm font-semibold shadow-md transition-all hover:shadow-lg disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Resume...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Resume
            </>
          )}
        </Button>
        {!file ? (
          <p className="text-center text-xs text-muted-foreground">
            Upload a resume file to enable analysis
          </p>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Your file is parsed on the server and analyzed live. Results are not loaded from preset sample scores.
          </p>
        )}
      </div>
    </div>
  );
}
