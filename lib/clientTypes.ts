import type { GenerationPlan, StyleGuide } from "./schemas";

export type JobStatus = "queued" | "processing" | "retrying" | "done" | "failed";
export type BatchStatus = "queued" | "processing" | "done" | "failed";

export type JobView = {
  id: string;
  batchId: string;
  productUrl: string;
  status: JobStatus;
  attempts: number;
  plan: GenerationPlan | null;
  resultUrl: string | null;
  headline: string | null;
  caption: string | null;
  cta: string | null;
  error: string | null;
};

export type BatchView = {
  id: string;
  status: BatchStatus;
  referenceUrls: string[];
  styleGuide: StyleGuide | null;
};

export const TERMINAL: JobStatus[] = ["done", "failed"];
