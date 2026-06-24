import type { GenerationPlan, StyleGuide } from "@/lib/schemas";
import type { ProviderConfig, ProvidersUsed } from "@/db/schema";

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
  providersUsed: ProvidersUsed | null;
  error: string | null;
};

export type BatchView = {
  id: string;
  status: BatchStatus;
  referenceUrls: string[];
  styleGuide: StyleGuide | null;
  providers: ProviderConfig | null;
};

export type HistoryItem = {
  id: string;
  status: BatchStatus;
  createdAt: string;
  total: number;
  done: number;
  failed: number;
  thumbs: string[];
};

export const TERMINAL: JobStatus[] = ["done", "failed"];
