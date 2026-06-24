import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "batch-creative-app" });

/** Event payloads. */
export type Events = {
  "batch/created": { data: { batchId: string } };
  "job/run": { data: { jobId: string } };
};
